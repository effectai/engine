---
title: "Effect AI: Snapshot Announcement"
description: "professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of e Finibus Bonorum et Malorum (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem."
image:
  src: "/img/news/ba5587c3d4e43367e2c61c63672fc1d3.png"
author: "Jesse"
head:
  meta:
    - name: "keywords"
      content: "AI, EFX, deepdive, technology, staking, snapshot, solana"
    - name: "author"
      content: "Jesse - Effect.AI"
    - name: "copyright"
      content: "© 2024 Effect.AI"
lastUpdated: "2024-12-05"
created: "2024-12-05"
published: true
---

## Effect AI: Migration Snapshot Announcement



## New architecture

Effect Force’s mission is to deliver high-quality annotated datasets. Requesters (clients) can submit their dataset to the platform along with an EFX payment and receive an annotated dataset in exchange.

Tasks and submissions are the two most essential components of Effect Force. A task is a single datapoint that a requester adds. A submission is a single annotation made by a worker. When initiating a task, requesters must place the needed EFX in escrow to ensure payment to workers. Additionally, workers must have relevant qualifications before starting to work on a task.

![](https://miro.medium.com/v2/resize:fit:720/format:webp/0*L5h3pmMuuVv_xzXN)

## The Task Merkle Tree

Effect Force uses a merkle tree to represent tasks in order to efficiently support large datasets from requesters. Merkle trees are a popular data structure in blockchain technology because they allow smart contracts to validate that a data point is part of a dataset by using a single hash (the merkle root) and a light proof (the merkle proof).

When requesters upload a dataset to Effect Force, they simply have to provide the merkle root to the blockchain. The actual task data can be sent via a separate media, such as IPFS. Effect Force will offer a variety of data distribution methods and will also be able to support private datasets. As a result, blockchain resources required to upload a dataset will remain minimal.

To submit an annotation to the blockchain, a worker must provide the task data hash (e.g. H1) to the smart contract, along with the merkle proof proving that it is part of the dataset.

![](https://miro.medium.com/v2/resize:fit:720/format:webp/0*KN7ukC8BGj7pcwKF)

## Qualifications

Microtasks, like any other task, need capable people to complete them. You must have access to qualified individuals in order to get the greatest quality results. Tasks may need the use of a single ability or a combination of skills. For example, in order to receive high-quality translations from English into Chinese, you must find people who are fluent in both languages.

Effect Force already offers numerous ‘basic’ requirements that measure a worker’s ability to label and classify data. These qualifications will now be listed and searchable on the blockchain. Clients can save time in workforce curation by selecting previously qualified workers when they publish their tasks to the platform. Clients can also create and assign their own qualifications, further customizing Effect Force to their specific needs.

## Validation and task quality

A worker can collect the EFX reward from the escrow after submitting a task. So, how can we ensure that workers put forth the greatest effort possible? In the past, Effect Force has always been optimistic about payouts, and workers are typically paid immediately. We’ve learned a lot from this model over the last three years, so we’ve chosen to provide an updated version in this update.

Campaigns will no longer offer an instant payment in the future. Instead, payment is sent once a client approves a submission or after a specific deadline has elapsed (by default 3 days). This will allow Effect Force to provide higher-quality data to its clients at the tradeoff of a minor inconvenience for workers. The smart contract will still guarantee the payments, and any rejected tasks will be investigated by a validation team.

Just like tasks and submissions, validations will be registered directly on the blockchain, making them completely transparent.

## Next up

This blog post explained some of the techniques that will be employed in the new Effect Force. Luckily for all of us, the majority of this occurs behind the scenes in the SDK, and end-users do not have to worry about it. This update also includes a user-friendly interface and a shiny new API for interacting with the system.

With so many possibilities of what can be completed using Effect Force, what tasks would you upload? Tell us in the comments section. Make sure you are subscribed to our blog, so you don’t miss the third article of this series about how the almighty DAO ties in with the operations of Effect Force.