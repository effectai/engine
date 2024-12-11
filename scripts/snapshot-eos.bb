(ns effect.snapshot
  (:require [babashka.http-client :as http]
            [clojure.string :as string]
            [cheshire.core :as json]
            [clojure.edn :as edn]
            [babashka.curl :as curl]
            [clojure.string :as str]
            [hiccup2.core :as h :refer [html]]))

;; (def eos-api (or (System/getenv "EOS_API") "http://eos.greymass.com"))
(def eos-api (or (System/getenv "EOS_API") "127.0.0.1:8888"))
(def pinata-jwt (System/getenv "PINATA_JWT"))
(def pinata-url "https://api.pinata.cloud")
(def prop-contract "daoproposals")

(def bsc-balance 72873496.438379)

(defn get-table-rows [table scope code]
  (->
   (curl/post (str eos-api "/v1/chain/get_table_rows")
              {:body (json/generate-string {"table" table
                                            "scope" scope
                                            "code" code
                                            "limit" 10
                                            "json" true})
               :content-type :json
               :accept :json})
   :body
   (json/decode true)
   :rows))

(defn get-scopes
  ([code table] (get-scopes code table {}))
  ([code table args]
   (->
    (curl/post (str eos-api "/v1/chain/get_table_by_scope")
               {:body (json/generate-string (merge
                                             {"table" table
                                              "code" code
                                              "limit" 10
                                              "json" true}
                                             args))
                :content-type :json
                :accept :json})
    :body
    (json/decode true)
    :rows)))

(defn get-account
  ([acc]
   (->
    (curl/post (str eos-api "/v1/chain/get_account")
               {:body (json/generate-string (merge
                                             {"account_name" acc
                                              "json" true}))
                :content-type :json
                :accept :json})
    :body
    (json/decode true))))

(defn make-snapshot []
  (loop [rows (get-scopes "effecttokens"
                          "accounts"
                          {"limit" 1000})]
    (when (seq rows)
      (let [names (->> rows
                       (map :scope)
                       doall
                       (into []))]
        (println "found " (count names) " balances")
        (doseq [n names]
          (spit "eos_snapshot.csv" (str n "\n") :append true))
        (let [last-key (:scope (last rows))]
          (println "LAST SCOPE! : = " last-key)

          (let [next-rows (->
                           (get-scopes "effecttokens"
                                       "accounts"
                                       {"lower_bound" last-key
                                        "limit" 1000})
                           rest
                           )]
            (recur next-rows)))))))

(defn read-snapshot []
  (edn/read-string (slurp "404732272_snapshot.edn")))

;; (read-snapshot)
;; (make-snapshot)

;; (let [rows (get-scopes "effecttokens" "accounts"
;;                        {"limit" 30000
;;                         "lower_bound" "d1gitalon3o5"})]
;;   (print ">>>>   " (count rows))
;;   (spit "4_zsnapzot.csv" rows))

;; https://github.com/Gimly-Blockchain/eosio-did-spec/issues/5#issuecomment-851450939

;; (pprint
;;  (first
;;   (filter
;;    #(= (:perm_name %) "active")
;;    (:permissions (get-account "hazdkmbxgene")))))

;; (make-snapshot)



(defn regular-account? [{:keys [permissions]}]
  (let [[active] (filter #(= (:perm_name %) "active") permissions)
        auth (:required_auth active)]
    (and active
         auth
         (= (:threshold auth) 1)
         (= (count (:keys auth)) 1))))

(defn no-active? [[_ {:keys [permissions]}]]
  (->> permissions
       (filter #(= (:perm_name %) "active"))
       seq))

(defn analyze-snapshot
  [data]
  (->> data
       (map get-account)
       (map :permissions)))



;; (def accs (read-snapshot))
;; (def accs-loaded (map get-account ))
;; (def accz (zipmap accs data))
;; (def acczz (add-balances accz))

;; (def smlz (into {} (take 20 accz)))

(defn get-active
  "Return the active permission from an account."
  [{:keys [permissions]}]
  (first (filter #(= (:perm_name %) "active") permissions)))

(defn owned-by?
  [{:keys [permission] :as acc}  owner]
  (= (get-in (get-active acc) [:required_auth :accounts 0 :permission :actor]) owner))

(defn extract-quantity [quantity]
  (Float/parseFloat (->> quantity (re-seq #"(\d+\.\d+) (EFX|NFX)") first second)))

(defn add-balances [accs]
  (reduce (fn [m [acc dat]]
            (let [bals (->> (get-table-rows "accounts" acc "effecttokens")
                            (map vals)
                            flatten)
                  efx (some->> bals
                               (filter #(str/ends-with? % "EFX"))
                               first
                               extract-quantity)
                  nfx  (some->> bals
                                (filter #(str/ends-with? % "NFX"))
                                first
                                extract-quantity)
                  
                  b (cond-> {}
                      efx (assoc :efx efx)
                      nfx (assoc :nfx nfx))]
              (assoc m acc
                     (assoc dat
                          :balances
                          b))))
          {}
          accs))

(defn balance-low? [acc]
  (every? #(< % 5.0) (vals (:balances acc))))

(defn is-simple-msig?
  "Active threshold is 1 and there is a key defined."
  [acc]
  (let [active (get-active acc)]
    (and (= (:threshold (:required_auth active)) 1)
         (string/starts-with? (get-in active [:required_auth :keys 0 :key]) "EOS"))))

(defn is-multi-key? [acc]
  (> (count (get-in (get-active acc) [:required_auth :keys])) 1))

(defn is-r1? [acc]
  (when-let [k (get-in (get-active acc) [:required_auth :keys 0 :key])]
    (string/includes? k "_R1_")))

(def excluded-buckets [:low-balances
                       :bsc
                       :effect
                       :staked
                       
                       ])

(defn add-tags [all-data]
  (loop [res {}
         [[acc dat] & rst] (into [] all-data)]
    (let [perms (:permissions dat)
          active (get-active dat)
          [include? tag]
          (cond
            ;; nodes with < 5 EFX and NFX
            (balance-low? dat)
            [false :low-balances]

            ;; nodes on the R1 curve, still OK!
            (is-r1? dat)
            [true :r1]

            ;; bsc
            (contains? #{"xbsc.ptokens"
                         "x.ptokens"}
                       acc)
            [false :bsc]

            ;; owned by effect
            (contains? #{"efx"              ;; 100M
                         "treasury.efx"     ;; 159M
                         "bsc.efx"          ;; 68M
                         "realeffectai"     ;;
                         "daoproposals"     ;; 760K
                         "feepool.efx"      ;; 450K
                         "efxrequester"     ;; 28K
                         "force.efx"        ;; 5K
                         "tasks.efx"        ;; 60
                         "verify.efx"       ;; 62
                         "efxliquidity"
                         }
                       acc)
            [false :effect]

            ;; staked tokens
            (= acc "efxstakepool")
            [true :staked]

            ;; vaccounts 
            (= acc "vaccount.efx")
            [true :vaccount]

            (or 
             (owned-by? dat "therealforce"))
            [false :therealforce]

            (or
             (owned-by? dat "signer1.efx")
             (owned-by? dat "x.efx"))
            [true :CHECKME]

            (contains? #{"kucoinrise11"
                         "bitbnsglobal"
                         "deposit.pro"
                         "withdraw.pro"}
                       acc)
            [false :exchange]

            ;; don't migrate
            (or
             (= acc "xeth.ptokens"))
            [false :skip]
            
            ;; special wallet
            (owned-by? dat "mykeymanager")
            [true :mykeymanager]              
            
            (regular-account? dat)
            [true :ok]              

            ;; multisigs that have threshold 1
            (and
             (is-multi-key? dat)
             (is-simple-msig? dat))
            [true :simple-msig]
            
            ;; complicated multisigs
            (is-multi-key? dat)
            [true :more-keys]

            :else
            [false :err])
          new-res (assoc res acc (assoc dat :include include? :snapshot-tag tag))]
      (if (seq rst)
        (recur new-res rst)
        new-res))))

;; (def accz
;;   (let [accs (read-snapshot)
;;         data (map get-account accs)]
;;     (zipmap accs data)))


(defn load-snapshot []
  (let [tot-nfx (-> (get-table-rows "stat" "NFX" "effecttokens")
                    first
                    :supply
                    extract-quantity)
        tot-efx (-> (get-table-rows "stat" "EFX" "effecttokens")
                    first
                    :supply
                    extract-quantity)
        snap (read-snapshot)]
    {:data (add-tags snap)
     ;; :buckets (get-accounts-in-snapshot snap)
     :total-efx tot-efx
     :total-nfx tot-nfx}))

(def data (load-snapshot))

(defn bucket [b]
  (->> (:data data)
       (filter #(= (-> % second :snapshot-tag) b))
       (reduce #(assoc %1 (first %2) (second %2)) {})))

(defn count-bucket [b coin]
  (case b
    :bsc (if (= coin :efx) bsc-balance 0)
    (reduce #(+ %1 (or (-> %2 second :balances coin) 0)) 0 (bucket b))))


(comment
  (dorun (for [[acc r] (:data data)] 
           (println (format "%s, %.4f, %.4f, %s, %s" acc
                            (or (-> r :balances :efx) 0.0)
                            (or (-> r :balances :nfx) 0.0)
                            (:snapshot-tag r) (:include r))))))
