(ns effect.blueprint.render
  (:require [babashka.http-client :as http]
            [clojure.string :as string]
            [hiccup2.core :as h :refer [html]]
            [effect.snapshot :as snapshot :refer [data bucket count-bucket]]))

(def nfx-conversion-rate 8)

(def target-total-effect 600000000)

(def stake-time-str "7 + 40 days")

(defn total-to-migrate [coin]
  (+ (count-bucket :ok coin)
     (count-bucket :simple-msig coin)
     (count-bucket :r1 coin)
     (count-bucket :staked coin)
     (count-bucket :mykeymanager coin)
     (count-bucket :vaccount coin)
     (count-bucket :bsc coin)))

(def dao-allocation 124000000.0)

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
     [:style {:type "text/css"} (h/raw (slurp "blueprint/reset.css"))]
     [:style {:type "text/css"} (h/raw (slurp "blueprint/style.css"))]

     [:script {:src "https://cdn.jsdelivr.net/npm/vega@5.17.0"}]
     [:script {:src "https://cdn.jsdelivr.net/npm/vega-lite@4.17.0"}]
     [:script {:src "https://cdn.jsdelivr.net/npm/vega-embed@6.12.2"}]]

    [:body

     [:h1 {:style "margin-bottom: 0;"}
      "Effect Migration Blueprint"]
     [:p {:style "margin-top: 0; margin-bottom: calc(var(--line-height) * 2)"}
      "V0.1,  Status: DRAFT"]
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
     [:p "Effect AI will migrate to the Solana ecosystem. Step is is
     the movement of our token EFX to a new token EFFECT which is described
     in this document."]

     [:p "After the snapshot date, " "EFFECT" " is the official
     Effect Network token. "]
     [:ul
      [:li [:strong "Total Supply: "] "600,000,000 EFFECT"]
      [:li [:strong "Token Type: "] "Solana SPL"]      
      [:li [:strong "Decimals: "] "6"]]
     [:p
      "EFX token holders will receive EFFECT token in 1:1
      distribution. The total supply of tokens will be filled in
      according to the details below."]

     [:hr]

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
         [:li "PancakeSwap"]]]]]

     [:h2#stake "$EFFECT distribution"]
     [:p "The new token will use the following distribution, the rules
     for each are discussed further in the document:"]
     (let [allocs {"EFX Holders" [(total-to-migrate :efx) stake-time-str]

                   "NFX Reimbursement"
                   [(* (total-to-migrate :nfx) nfx-conversion-rate)
                    stake-time-str]

                   "Staking Incentives" [50000000.0 "TBD"]

                   [:span "DAO Treasury" (label " [1]")]
                   [(- dao-allocation dao-migration-reserve) "TBD"]

                   [:span "DAO Migration Reserve" (label " [2]")]
                   [dao-migration-reserve "2 + 0 years"]                   

                   "Liquidity & Partnerships" [68437032.0 "0"]

                   "Development Fund"         [100000000.0 "0 + 4 years"]}
           total-allocs (reduce + (map first (vals allocs)))
           remaining    (- target-total-effect total-allocs)
           allocs       (assoc allocs
                         [:span "Reserve" (label " [3]")] [remaining "0"]
                         ;; [:span "Future Fund" (label " [3]")] [50000000.0 "4 + 4 years"]
                         )]
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

        (label "[1] Vesting after start of DAO.")(label[:br])
        (label "[2] DAO to decide if these funds are used or burned after lock period.")(label[:br])
        (label "[3] Unforseen migration requirements, rounding of supply.")(label[:br])])

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

     [:p "The following rules are followed in the creation of the snapshot:"]
     [:em "1. Special accounts"]
     [:p "The following special accounts are not included:"]
     [:ul
      [:li "x.ptokens"]
      [:li "bitbnsglobal"]
      [:li "kucoinrise11"]
      [:li "stakepool.efx"]
      [:li "therealforce"]
      [:li "efx"]]

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
