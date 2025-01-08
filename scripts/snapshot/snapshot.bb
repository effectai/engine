(ns snapshot
  (:require [babashka.http-client :as http]
            [clojure.string :as string]
            [cheshire.core :as json]
            [clojure.edn :as edn]
            [babashka.curl :as curl]
            [clojure.java.io :as io]
            [clojure.string :as str]
            [hiccup2.core :as h :refer [html]])
  (:import [java.time LocalDateTime ZoneId ZoneOffset]))

;; (def eos-api (or (System/getenv "EOS_API") "http://eos.greymass.com"))
(def eos-api (or (System/getenv "EOS_API") "127.0.0.1:8888"))
(def pinata-jwt (System/getenv "PINATA_JWT"))
(def pinata-url "https://api.pinata.cloud")
(def prop-contract "daoproposals")

(def nfx-conversion-rate 8)

(defn extract-quantity [quantity]
  (Float/parseFloat (->> quantity (re-seq #"(\d+\.\d+) (EFX|NFX)") first second)))

(defn get-table-rows
  ([table scope code] (get-table-rows table scope code {}))
  ([table scope code args]
   (->
    (curl/post (str eos-api "/v1/chain/get_table_rows")
               {:body (json/generate-string (merge {"table" table
                                                   "scope" scope
                                                   "code" code
                                                   "limit" 10
                                                    "json" true}
                                                   args))
                :content-type :json
                :accept :json})
    :body
    (json/decode true)
    :rows)))

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

(defn make-snapshot-names []
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
          (let [next-rows (->
                           (get-scopes "effecttokens"
                                       "accounts"
                                       {"lower_bound" last-key
                                        "limit" 1000})
                           rest
                           )]
            (recur next-rows)))))))

(defn get-unstakes
  "Get a map of EFX and NFX that are unstaking."
  []
  (let [scopes (->> (get-scopes "efxstakepool"
                                "unstake"
                                {"limit" 1000})
                    (map :scope)
                    (reduce
                     #(assoc %1
                             %2
                             (map :amount
                                  (get-table-rows "unstake" %2 "efxstakepool")))
                     {})
                    )]
    (->
     (reduce (fn [m [acc-name bals]]
               (let [acc (get-account acc-name)

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
                 (assoc m acc-name
                        (assoc acc :balances b))))
             {}
             scopes)
     add-tags)))

(defn get-vaccounts []
  (let [accs
        (loop [rows (get-table-rows
                     "account"
                     "vaccount.efx"
                     "vaccount.efx"
                     {"limit" 3000})
               res []]
          (if (and (:id (last rows)) (last rows) (seq rows))
            (let [last-key (:id (last rows))]
              (let [next-rows (->
                               (get-table-rows
                                "account"
                                "vaccount.efx"
                                "vaccount.efx"
                                {"lower_bound" last-key
                                 "limit" 3000})
                               rest)]
                (recur next-rows (concat res rows))))
            (concat res rows)))]

    (reduce #(assoc-in %1
                       [(get-in %2 [:address 0]) (get-in %2 [:address 1])]
                       (extract-quantity (get-in %2 [:balance :quantity]))) {} accs))
  )

(defn read-snapshot []
  ;; (edn/read-string (slurp "404732272_snapshot.edn"))
  (edn/read-string (slurp "20250101_snapshot.edn"))
  )

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

(defn get-active
  "Return the active permission from an account."
  [{:keys [permissions]}]
  (first (filter #(= (:perm_name %) "active") permissions)))

(defn get-owner
  "Return the owner permission from an account."
  [{:keys [permissions]}]
  (first (filter #(= (:perm_name %) "owner") permissions)))

(defn owned-by?
  [{:keys [permission] :as acc}  owner]
  (= (get-in (get-active acc) [:required_auth :accounts 0 :permission :actor]) owner))

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

(defn make-snapshot []
  (let [rdr (clojure.java.io/reader "eos_snapshot.csv")
        nams (line-seq rdr)
        accs (map get-account nams)]
    (add-balances (zipmap nams accs))))

(defn time-to-epoch [time-str]
  (.toEpochSecond
   (.atZone (java.time.LocalDateTime/parse time-str)
            (ZoneId/ofOffset "UTC" (ZoneOffset/ofHours 0))))  )

(defn add-stakes [accs]
  (reduce (fn [m [acc dat]]
            (let [stakes (->> (get-table-rows "stake" acc "efxstakepool"))
                  efx

                  (some->> stakes
                           (filter #(str/ends-with? (:amount %) "EFX"))
                           first)

                  nfx
                  (some->> stakes
                           (filter #(str/ends-with? (:amount %) "NFX"))
                           first)

                  b (cond-> {}
                      efx (assoc :efx
                                 (-> efx
                                     (update :amount extract-quantity)
                                     (update :last_claim_time time-to-epoch)))
                      nfx (assoc :nfx (-> nfx
                                          (update :amount extract-quantity)
                                          (update :last_claim_time time-to-epoch))))]
              (assoc m acc
                     (assoc dat
                            :stakes
                            b))))
          {}
          accs))

(def vaccounts (get-vaccounts))

(defn add-vaccounts [accs]
  (reduce (fn [m [acc dat]]
            (assoc m acc
                   (assoc dat :vaccount
                          (or (get-in vaccounts ["name" acc]) 0.0))))
          {}
          accs))

(defn balance-low? [acc]
  (and
   (every? #(< % 5.0) (vals (:balances acc)))
   (or (not (-> acc :stakes :efx :amount))
       (< (-> acc :stakes :efx :amount) 5.0))
   (or (not (-> acc :stakes :nfx :amount))
       (< (-> acc :stakes :nfx :amount) 5.0))))

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
                         "efxliquidity"     ;; 2+M
                         "efxstakepool"
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
            [true :therealforce]

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
            [false :mykeymanager]

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
    {:data (-> snap
               add-tags
               add-vaccounts)
     ;; :buckets (get-accounts-in-snapshot snap)
     :total-efx tot-efx
     :total-nfx tot-nfx}))

(def data (load-snapshot))


(def burn-buckets #{:low-balances
                    :exchange
                    })

(defn buckets []
  (->> data :data (map #(-> % second  :snapshot-tag)) set))

(defn bucket [b]
  (->> (:data data)
       (filter #(= (-> % second :snapshot-tag) b))
       (reduce #(assoc %1 (first %2) (second %2)) {})))

(defn count-bucket [b coin]
  (case b
    (+
     (reduce #(+ %1 (or (-> %2 second :balances coin) 0)) 0 (bucket b))
     (reduce #(+ %1 (or (-> %2 second :stakes coin :amount) 0)) 0 (bucket b))
     (reduce #(+ %1 (or (-> %2 second :vaccount) 0)) 0 (bucket b))
     )))

(defmulti grab-foreign-key :snapshot-tag)
(defmethod grab-foreign-key :ok [r]
  [:active
   (-> r get-active :required_auth
       :keys first :key)])
(defmethod grab-foreign-key :simple-msig [r]
  [:owner
   (-> r get-owner :required_auth
       :keys first :key)])
(defmethod grab-foreign-key :r1 [r]
  [:owner
   (-> r get-owner :required_auth
       :keys first :key)])

(def snapshot-time (time-to-epoch "2025-01-01T12:00:00"))

(defn make-csv-rows []
  (reduce
   concat
   (for [b [:ok :simple-msig :r1]]
     (for [[acc r] (bucket b)]
       [acc
        (second (grab-foreign-key r))
        (name (first (grab-foreign-key r)))
        (name (:snapshot-tag r))
        (or (-> r :stakes :efx :last_claim_time) 0)
        (or (-> r :stakes :efx :last_claim_age) 0)
        (max
         (-
          (or (-> r :stakes :efx :last_claim_time) snapshot-time)
          (or (-> r :stakes :efx :last_claim_age) 0))
         (- snapshot-time (* 1000 3600 24)))
        "eos"
        (+ (or (-> r :balances :efx) 0.0) (-> r :vaccount))
        (or (-> r :balances :nfx) 0.0)
        (or (-> r :stakes :efx :amount) 0.0)
        (or (-> r :stakes :nfx :amount) 0.0)
        (+
         (or (-> r :balances :efx) 0.0)
         (or (-> r :stakes :efx :amount) 0.0)
         (* (or (-> r :balances :nfx) 0.0) nfx-conversion-rate)
         (* (or (-> r :stakes :nfx :amount) 0.0) nfx-conversion-rate)
         (-> r :vaccount))]))))

(defn merge-csv-rows
  "Combine entries with the same foreign key.

  Account names are semicolon delimited. Total amounts are aggregated.
  The oldest stake age is kept."
  []
  (let [agg-rows (group-by second (make-csv-rows))]
    (for [[fkey dats] agg-rows]
      [(->> dats (map first) (string/join ";"))
       fkey
       (->> dats (map #(nth % 2)) (string/join ";"))
       (->> dats (map #(nth % 3)) (string/join ";"))
       (apply min (map #(nth % 6) dats))
       (reduce + (map last dats))])))

(defn print-snapshot [b]
  (println (string/join ", "
                        ["account"
                         "foreign_key"
                         "permission"
                         "tag"
                         "last_claim_time"
                         "last_claim_age"
                         "stake_age_timestamp"
                         "type"
                         "efx"
                         "nfx"
                         "staked_efx"
                         "staked_nfx"
                         "claim_amount"]))
  (dorun (for [[acc r] (bucket b)]
           (println (format "%s, %s, %s, %s, %d, %d, %d, %s, %.4f, %.4f, %.4f, %.4f, %.4f"
                            acc
                            (second (grab-foreign-key r))
                            (name (first (grab-foreign-key r)))
                            (name (:snapshot-tag r))
                            (or (-> r :stakes :efx :last_claim_time) 0)
                            (or (-> r :stakes :efx :last_claim_age) 0)
                            (max
                             (-
                              (or (-> r :stakes :efx :last_claim_time) snapshot-time)
                              (or (-> r :stakes :efx :last_claim_age) 0))
                             (- snapshot-time (* 1000 3600 24)))
                            "eos"
                            (+ (or (-> r :balances :efx) 0.0) (-> r :vaccount))
                            (or (-> r :balances :nfx) 0.0)
                            (or (-> r :stakes :efx :amount) 0.0)
                            (or (-> r :stakes :nfx :amount) 0.0)
                            (+
                             (or (-> r :balances :efx) 0.0)
                             (or (-> r :stakes :efx :amount) 0.0)
                             (* (or (-> r :balances :nfx) 0.0) nfx-conversion-rate)
                             (* (or (-> r :stakes :nfx :amount) 0.0) nfx-conversion-rate)
                             (-> r :vaccount)
                             ))))))

(defn print-csv []
  (println (string/join ", " ["acc" "efx" "nfx" "vefx" "sefx" "snfx" "tag" "include in snapshot"]))
  (dorun (for [[acc r] (:data data)]
           (println (format "%s, %.4f, %.4f, %.4f, %.4f, %.4f, %s, %s" acc
                            (or (-> r :balances :efx) 0.0)
                            (or (-> r :balances :nfx) 0.0)
                            (-> r :vaccount)
                            (or (-> r :stakes :efx :amount) 0.0)
                            (or (-> r :stakes :nfx :amount) 0.0)
                            (:snapshot-tag r) (:include r))))))

(def bsc-balance (count-bucket :bsc :efx))

(defn load-bsc-snapshot []
  (let [rows
        (with-open [rdr (io/reader "20250101_bsc_snapshot.csv")]
          (doall
           (clojure.data.csv/read-csv rdr)))]
    (->> rows
         (filter #(= (last %) "wallet"))
         (reduce #(assoc %1 (first %2) (BigDecimal. (second %2))) {})
         (filter #(> (second %) 5.0))
         (map #(vec ["bsc" (first %) "" "wallet" snapshot-time (second %)])))))

(def extra-bsc-rows
  [["bsc"
    "0xc94e55f616fc144087093ada3924b4af5ee4d5cf"
    ""
    "wallet"
    snapshot-time
    53697.4599]])

(def csv-header
  ["accounts"
   "key"
   "permissions"
   "tags"
   "stake_age_timestamp"
   "claim_amount"])

(defn write-merged-csv []
  (let [eos-rows (merge-csv-rows)
        bsc-rows (load-bsc-snapshot)
        header csv-header]
    (with-open [wrt (io/writer "SNAPshot.csv")]
      (clojure.data.csv/write-csv wrt (concat [header]
                                              eos-rows
                                              bsc-rows
                                              extra-bsc-rows)))))

(defn print-bsc-snapshot []
  (let [snap (load-bsc-snapshot)]
    (println (string/join ", "
                          ["account"
                           "foreign_key"
                           "permission"
                           "tag"
                           "last_claim_time"
                           "last_claim_age"
                           "stake_age_timestamp"
                           "type"
                           "efx"
                           "nfx"
                           "staked_efx"
                           "staked_nfx"
                           "claim_amount"]))
    (dorun
     (for [[acc bal] snap]
       (println (format "%s, %s, %s, %s, %d, %d, %d, %s, %.4f, %.4f, %.4f, %.4f, %.4f"
                        "bsc"
                        acc
                        ""
                        "wallet"
                        snapshot-time
                        0
                        snapshot-time
                        "bsc"
                        bal
                        0.0
                        0.0
                        0.0
                        bal))))))

(def extra-nfx-claims
  )

(defn make-unstake-csv
  "Create a CSV of entries that are unstaking"
  []

  (let [;; map of pending unstakes above threshold
        unstakes (->>
                  (get-unstakes)
                  (filter #(contains?
                            #{:r1 :simple-msig :ok}
                            (:snapshot-tag (second %))))
                  (into {}))

        ;; group by true/false wether they are already in snapshot
        groups (group-by #(contains? (merge
                                      (bucket :ok)
                                      (bucket :simple-msig)
                                      (bucket :r1)) (first %)) unstakes)

        existing-rows (map
                       (fn [[a dat]]
                         [a
                          (second (grab-foreign-key dat))
                          (first (grab-foreign-key dat))
                          (:snapshot-tag dat)
                          snapshot-time
                          (+ (or (:efx (:balances dat)) 0)
                             (* 8 (or (:nfx (:balances dat)) 0)))])
                       (groups true))

         new-rows (map
                  (fn [[a dat]]
                    [a
                     (second (grab-foreign-key dat))
                     (first (grab-foreign-key dat))
                     (:snapshot-tag dat)
                     snapshot-time
                     (+ (* 1 (or (:efx (:balances dat)) 0))
                        (* 8 (or (:nfx (:balances dat)) 0)))])
                  (groups false))]
    (with-open [wrt (io/writer "UNSTAKE_new.csv")]
      (clojure.data.csv/write-csv wrt (concat [csv-header]
                                              new-rows)))

    (with-open [wrt (io/writer "UNSTAKE_existing.csv")]
      (clojure.data.csv/write-csv wrt (concat [csv-header]
                                              existing-rows)))))
