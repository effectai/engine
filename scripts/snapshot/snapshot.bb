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

(defn get-unstakes []
  (let [scopes (->> (get-scopes "efxstakepool"
                                "unstake"
                                {"limit" 1000})
                    (map :scope))]
    (for [scope scopes]
      (get-table-rows "unstake" scope "efxstakepool"))))

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

(defn write-merged-csv []
  (let [eos-rows (merge-csv-rows)
        bsc-rows (load-bsc-snapshot)
        header ["accounts"
                "key"
                "permissions"
                "tags"
                "stake_age_timestamp"
                "claim_amount"]]
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
