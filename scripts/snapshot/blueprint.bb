(ns blueprint
  (:require [babashka.http-client :as http]
            [clojure.string :as string]
            [hiccup2.core :as h :refer [html]]
            [snapshot :refer [data bucket count-bucket burn-buckets]]))

(def nfx-conversion-rate 8)

(def target-total-effect 530000000)

(def stake-time-str "7 + 30 days")

(defn total-to-migrate [coin]
  (+ (count-bucket :ok coin)
     (count-bucket :simple-msig coin)
     (count-bucket :r1 coin)
     ;; (count-bucket :more-keys coin)
     (count-bucket :vaccount coin)
     (count-bucket :bsc coin)))

(def staking-incentives 50000000.0)

(def dao-allocation
  (-
   (-> data :data (get "treasury.efx") :balances :efx)
   (* (total-to-migrate :nfx) nfx-conversion-rate)
   staking-incentives))

(def dao-migration-reserve
  (+ (-> data :data (get "kucoinrise11") :balances :efx)
     (-> data :data (get "bitbnsglobal") :balances :efx)))

(defn label [txt]
  [:span {:style "font-size: 12px; font-weight: 400;"} txt])

(spit
 "index.html"
 (str
  (html
   (h/raw "<!DOCTYPE html>")
   [:html
    [:head
     [:meta {:charset "utf-8"}]
     [:meta {:name    "viewport"
             :content "width=device-width, initial-scale=1.0, user-scalable=yes"}]
     [:meta {:name "author" :content "Effect AI"}]
     [:title "EFFECT Migration Blueprint"]
     [:style {:type "text/css"} (h/raw (slurp "reset.css"))]
     [:style {:type "text/css"} (h/raw (slurp "style.css"))]

     [:script {:src "https://cdn.jsdelivr.net/npm/vega@5.17.0"}]
     [:script {:src "https://cdn.jsdelivr.net/npm/vega-lite@4.17.0"}]
     [:script {:src "https://cdn.jsdelivr.net/npm/vega-embed@6.12.2"}]]

    [:body

     [:h1 {:style "margin-bottom: 0;"}
      "Effect Migration Blueprint"]
     [:p {:style "margin-top: 0; margin-bottom: calc(var(--line-height) * 2)"}
      "Data from: 2024-11-14 19:00, V0.1,  Status: DRAFT"]
     #_[:p ;;{:style "margin: var(--line-height)"}
      "Effect AI will migrate it's ecosystem to Solana, powered by the
       EFFECT token. The new token will be automatically distributed
       to EFX holders on EOS and BSC via a claim portal. The portal
       will be made available on the distribution date."]

     [:table
      [:tr
       [:th "Snapshot date"]
       [:td "2025-01-01 12:00:00 UTC"]]
      [:tr
       [:th "Distribution date"]
       [:td "2025-01-05"]]      
      [:tr
       [:th "EFX on EOS & BSC"]
       [:td "1:1 migration"]]
      [:tr
       [:th "Solana ticker"]
       [:td "EFFECT"]]
      [:tr
       [:th "Token address "]
       [:td "TBD"]]]

     [:nav
      [:h2 "Contents"]
      [:ul
       [:li [:a {:href "#data"} "Introduction"]]
       [:li [:a {:href "#data"} "Key Data"]]
       [:li [:a {:href "#intro"} "The " "EFFECT" " Token"]]
       [:li [:a {:href "#stake"} "Staking"]]
       [:li [:a {:href "#stake"} "NFG Migration"]]
       [:li [:a {:href "#migrate"} "Migration"]]
       [:li [:a {:href "#rewards"} "Staking Rewards"]]]]

     [:h2#data "Introduction"]
     [:p "Effect AI will migrate it's ecosystem to Solana, powered by the
       EFFECT token. The new token will be automatically distributed
       to EFX holders on EOS and BSC via a claim portal. The portal
       will be made available on the distribution date."]
     [:p "This document describes the rules that are applied for the
     creation of the Snapshot and the distribution of the $EFFECT
     token."]

     [:p "After the snapshot date, " "EFFECT" " is the official
     Effect Network token. "]
     [:ul
      [:li [:strong "Total Supply: "] (format "%,4d %s" target-total-effect "EFFECT")
       [:li [:strong "Token Type: "] "Solana SPL"]]      
      [:li [:strong "Decimals: "] "6"]]

     [:hr]

     (comment
       [:p "The EFX tokens are currently distributed as follows:"]
       [:ul {:class "tree"}
        [:p {:style "margin: 0"}
         [:strong "Total holders: "] ;;(count accs)
         ]
        [:ul {:class "incremental"}
         [:li "EOS"
          [:ul {:class "incremental"}
           [:li "Token Holders"]
           [:li "Staked"]
           [:li "DAO Treasury"]
           [:li "Effect Foundation"]]]
         [:li "BSC"
          [:ul {:class "incremental"}
           [:li "Token Holders"]
           [:li "PancakeSwap"]]]]])
     
     [:h2#stake "$EFFECT distribution"]
     [:p "The new token will use the following distribution, the rules
     for each are discussed further in the document:"]
     (let [allocs {"EFX Holders" [(total-to-migrate :efx) stake-time-str]

                   "NFX Reimbursement"
                   [(* (total-to-migrate :nfx) nfx-conversion-rate)
                    stake-time-str]

                   "Staking Incentives" [50000000.0 "TBD"]

                   [:span "DAO Treasury" (label " [1]")]
                   [dao-allocation "TBD"]

                   "Liquidity & Partnerships" [68437032.0 "0"]

                   "Development Fund"         [100000000.0 "0 + 4 years"]}
           total-allocs (reduce + (map first (vals allocs)))
           _ (println "xxxxxxxxxxx" total-allocs)
           remaining    (- target-total-effect
                           total-allocs
                           ;; (reduce #(+ %1 (count-bucket %2 :efx)) 0 burn-buckets)
                           )
           allocs       (assoc allocs
                         [:span "Reserve" (label " [2]")] [remaining "0"])]
       [:div
        [:table
         [:tr [:th "Allocation" [:br] (label "Designation of token allocation")]
          [:th "$EFFECT" [:br] (label "Tokens allocated")]
          [:th "Vesting" [:br] (label "Lock + linear")]]
         (doall
          (for [[label [value vest]] allocs]
            [:tr
             [:td label]
             [:td (format "%,12.0f" value)]
             [:td vest]]))]
        [:div
         [:strong "Total $EFFECT: "
          (format "%,12.0f" (reduce + (map first (vals allocs))))]]        

        (label "[1] Vesting dstarts after new DAO is instantiated.")(label[:br])
        (label "[2] Unforseen migration requirements, rounding of supply.")(label[:br])])

     [:div#vis {:style "width: 100%;"}]

     [:h2#stake "EFX Holders (EOS & BSC)"]
     [:p
      "EFFECT tokens are distributed 1:1 to EFX holders."]

     [:p
      "EOS has an advanced account system. A single EOS account can
      have multiple key pairs associated with it. In 97% of the cases,
      the EFFECT claim portal can reliably map the first key in the
      account's active permission to the claim. In the remaining
      cases claim portal will still accomodate a migration."]
     
     [:p
      "Binance Smart Chain maps every normal account to a single key
      pair. This means that all tokens on BSC can be easily claimed in
      the portal."]

     [:p "The following rules are followed in the creation of the
     snapshot. Some are migrated in an alternative way."]
     [:em "1. Special accounts"]
     [:p "The following special accounts are not included:"]
     [:div.grid
      [:ul
       [:li "x.ptokens"]
       [:li "bitbnsglobal"]
       [:li "kucoinrise11"]
       [:li "stakepool.efx"]
       [:li "therealforce"]
       [:li "efx"]
       [:li "efxliquidity"]]
      [:ul
       [:li "xeth.ptokens"]
       [:li "deposit.pro"]
       [:li "withdraw.pro"]
       [:li "efxstakepool"]
       [:li "treasury.efx"]
       [:li "bsc.efx"]
       [:li "daoproposals"]]
      [:ul
       [:li "realeffectai"]
       ]]

     [:em "2. Low balances"]
     [:p "Accounts with less than 5 EFX will
     not be included in the snapshot. This threshold avoids a lot of
     complicated account structures and experimental accounts that are
     hard to migrate. To include a low EFX balance in the migration it
     is necessary to acquire an EFX balance of 5 or higher."]

     [:em "3. Large balances"]
     [:p "The migrations is capped at 20M $EFFECT tokens per user. At
     the time of writing no accounts come close to this limit."]

     [:em "4. Exchanges"]
     [:p "EFX tokens stored on centralized exchanges are not included in the snapshot."]     

     [:em "5. Liquidity Pools"]
     [:p
      "Liquidity Providers have to remove their liquidity before the
      snapshot. Although the EFX balance of LP providers will be
      included in the snapshot at a best effort basis, EFX loses its
      main utility at the snapshot, which means the quote asset of the
      liquidity will get lost."]

     [:h2#burn "Unmigrated tokens"]
     [:p
      [:a {:href "https://dao.effect.network/proposals/211"} "Ref #211"]]
     [:p "Unmigrated tokens are burned"]
     

     [:h2#lsp "NFX MIGRATION"]
     [:p
      [:a {:href "https://dao.effect.network/proposals/186"} "Ref #186"]
      ", " 
      [:a {:href "https://dao.effect.network/proposals/179"} "Ref #179"]
      ". "]
     [:p
      "The NFX governance token will be discontinued after the
      snapshot. NFX token holders will be reimbursed with EFFECT
      tokens on Solana, which can also be retrieved through the claim
      portal."]

     [:h2#stake "Staking Rewards"]
     [:p
      [:a {:href "https://dao.effect.network/proposals/184"} "Ref #184"]
      ", "
      [:a {:href "https://dao.effect.network/proposals/195"} "Ref #195"]]
     [:p]

     [:h2#stake "DAO Treasury"]

     [:h2#stake "Development Fund"]

     [:h2#stake "Reserve"]
     ]
    ])))
