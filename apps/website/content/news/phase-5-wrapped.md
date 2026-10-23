---
title: "Phase 5 Wrapped: Growth, Challenges, and the Road to Phase 6"
description: "A deep look at the milestones, challenges, and progress made during Phase 5 of the Effect Alpha."
image:
  src: "/img/news/BlogBG-08.png"
author: "Miguel"
head:
  meta:
    - name: "keywords"
      content: "AI, alpha, testing, solana, effect, data, human AI collaboration, decentralized, effect alpha, datasets, image annotation, novela, capability tests, data quality"
    - name: "author"
      content: "Effect AI"
    - name: "copyright"
      content: "© 2026 Effect.AI"
lastUpdated: "2026-04-24"
created: "2026-04-24"
published: true
---

## Reflecting on Phase 5 of the Effect Alpha

Phase 5 was the longest alpha phase we have run to date, and that was by design. Rather than cycling through phases quickly, we wanted to stress test the longevity of our systems, observe how the platform behaved over months of continuous operation, and push our infrastructure in ways that shorter phases simply cannot reveal. What we learned in that time was invaluable.

This phase brought real growth in worker participation, the introduction of two brand new task types, important infrastructure challenges that forced us to build better solutions, and a sharper focus on data quality than any phase before it. It also pushed us to be more honest about what needs to improve before Effect AI is ready to scale further.

Below is a full look at what we accomplished, what we faced, and what it all means for the future of the Effect platform.

---

<center>

|                                  |   Phase 1   |   Phase 2   |    Phase 3     |            Phase 4             |    Phase 5    |
| -------------------------------- | :---------: | :---------: | :------------: | :----------------------------: | :-----------: |
| **Workers Onboarded**            |     20      |     35      |       48       |               77               |     100+      |
| **Task Types (Total)**        |      3      |      6      |        8       |               10               | 12 |
| **Datasets Worked On** |      1      |      4      |        2       | 5+ |       6+       |
| **Tasks Completed**              |   5,200+    |   42,000+   |    57,000+     |            90,000+             |    81,000+    |
| **EFFECT Paid Out**              | 15,000+ EFFECT | 80,000+ EFFECT | 185,000+ EFFECT |        250,000+ EFFECT         | 730,000+ EFFECT |

<div align="center" style="margin-top:16px; padding:12px; background:#E8F5E9; border-radius:8px;">
  <strong style="font-size:20px; color:#2E7D32;">Total EFFECT Paid Out Across All Phases: 1,260,000+</strong>
</div>

</center>

---

## Phase 5: New Task Types and Expanded Datasets

One of the headline achievements of Phase 5 was the introduction of two entirely new task types that significantly expanded what contributors can do on the platform.

#### Image Annotation with Bounding Boxes

Image annotation arrived in Phase 5 as a major addition to our template library. Workers draw precise bounding boxes around objects in images, label them accordingly, and the system captures both the spatial data and the labels. This task type opens the door to computer vision datasets and quality control workflows, areas that represent a significant and growing portion of AI training demand.

We also began development and testing of the corresponding image annotation validation task, giving the platform an end-to-end workflow for this data type. Validation tasks were actively tested toward the end of the phase, with worker feedback helping us refine the template, particularly on mobile devices.

#### Novela Dataset

We launched the Novela dataset during Phase 5 as a complementary addition to our existing Common Voice work. Novela tasks are built around creating recordings of human-read audio paired with sentences drawn from soap opera and novela scripts. This work directly supports the training of text-to-speech models and helps AI systems learn the natural rhythms, emotion, and variation of human conversational speech.

Unlike sentence creation tasks, Novela tasks do not require contributors to write anything themselves, which makes them more accessible and significantly reduces the risk of AI-generated submissions compromising the dataset. The Novela workflow includes both recording and validation steps, giving us a complete and quality-controlled pipeline.

---

## Platform and Worker Experience Improvements

Phase 5 saw a steady stream of improvements to the worker experience, many of them driven directly by feedback from alpha testers.

* A TaskPosterStatus component was added, giving workers real-time visibility into which tasks are active, queued, or coming up next. This removed a lot of the guesswork around when and what to work on.
* Task qualification requirements are now displayed directly in the Task Poster Status area, so workers know exactly what capabilities they need before they start.
* A scheduling system was introduced behind the scenes, allowing task requesters to queue tasks for specific times. Workers now see a predictable pipeline rather than tasks appearing without notice.
* Skipping or reporting a task now prompts workers to provide brief feedback on what went wrong, giving the team much more useful signal for debugging and improvement.
* A regular task posting schedule was introduced toward the end of the phase, with tasks going live on Mondays and Thursdays. Predictability matters to contributors, and this was a direct response to community feedback.

---

## New Capability Tests and the Alpha Support Portal

Phase 5 marked a significant shift in how we assess and match workers to tasks. The original language test that had been in place since the start of the Alpha was retired in favor of four new, purpose-built capability assessments.

* English Language 2.0
* Common Voice Contributor
* Common Voice Validator
* Music Transcription (with Music Transcription Validation available depending on results)

These tests are timed and attempt-limited, reflecting the fact that the data being created is destined for real-world applications. Unlike earlier assessments, there are no unlimited retries. This raises the bar for participation and helps ensure that the workers completing tasks are genuinely prepared for them.

Alongside the new tests, we launched the [Alpha Testing Support Portal](https://sites.google.com/effect.ai/guides), a dedicated resource hub where contributors can find task guides, capability documentation, and platform instructions all in one place. The portal has already proven useful in reducing support questions and helping workers understand what is expected of them before they begin.

---

## Challenges We Faced and How We Responded

Phase 5 was our most transparent phase yet when it came to confronting platform issues head on. Several significant challenges emerged, and we want to be open about what happened and how we addressed them.

#### Payment Pool and Security Vulnerability

Midway through the phase, we identified a critical issue with the payments and payment pool system that required us to temporarily pause tasks while we investigated. We discovered and patched a security vulnerability in the payment pipeline. Tasks resumed once the fix was confirmed, and all worker balances were preserved.

This incident surfaced a deeper architectural issue: the Manager Node was becoming a bottleneck, especially under high simultaneous claim loads. Our response was to begin developing AI payment provers, a solution that offloads payment verification from the Manager Node and distributes it as tasks that workers can run directly on their own systems. This is a meaningful step toward a more resilient and decentralized architecture.

#### Manager Node Instability

Related to the above, the Manager Node experienced more frequent downtime than in previous phases. This was caused by a combination of factors including attempts by bad actors to circumvent the payment pipeline and the sheer volume of simultaneous claims. We implemented safeguards and continued monitoring throughout the phase, and the work done here will directly inform the infrastructure improvements planned for Phase 6.

#### Data Quality and LLM Abuse

Phase 5 brought our most serious data quality challenge to date. During a review of Common Voice sentence creation submissions, we identified clear patterns of workers using large language models to generate sentences rather than writing them from their own knowledge and experience.

This is a fundamental violation of what these tasks are for. The entire purpose of human-generated sentence datasets is to capture authentic, natural human language. AI-generated sentences undermine that and reduce the value of the data for the organizations and researchers who depend on it.

Our response was firm. We paused affected tasks, conducted thorough reviews, revoked capabilities, and issued bans for confirmed violations. We also introduced the Novela dataset as a task type that does not involve sentence writing at all, which naturally reduces the opportunity for this kind of abuse. Moving forward, we are building additional safeguards to detect and prevent LLM usage in tasks where human authorship is required.

#### Multi-Device Account Fragmentation

We saw an increase in reports from workers experiencing what appeared to be account resets. The root cause was our lack of cross-device and cross-browser support. Workers switching between devices were effectively creating separate worker accounts with separate balances, leading to confusion and, in some cases, unclaimed rewards.

We communicated this clearly and added a notice directly to the worker homepage. The longer-term fix, **state syncing**, is already in development and will be one of the headline features of Phase 6.

---

## What We Learned From Phase 5

Across the full run of Phase 5, a number of clear themes emerged that will shape how we build and operate going forward.

* Running a longer phase was the right call. The issues we uncovered around infrastructure stability, payment bottlenecks, and data quality patterns would not have been visible in a shorter cycle.
* Data quality enforcement has to be proactive, not reactive. The LLM abuse we encountered was a wake-up call. We are investing in better detection, clearer instructions, and task designs that make abuse harder.
* Predictability improves contribution quality. The introduction of a regular posting schedule and better task visibility immediately had a positive effect on worker engagement and output consistency.
* Our architecture needs to distribute load better. The Manager Node bottleneck is a known limitation that we are actively solving. AI payment provers and state syncing are both steps in that direction.
* The community is resilient and committed. Despite the challenges of this phase, the majority of our workers showed up consistently, followed the rules, and helped us push the platform forward.

---

## Looking Ahead To Phase 6

Phase 6 will build directly on what Phase 5 revealed. Here is what you can expect:

* State syncing across devices and browsers, so workers can pick up where they left off without losing progress, capabilities, or rewards
* Manager Node task posting fixes and broader infrastructure improvements to reduce downtime and bottlenecks
* More exciting task types to expand the range of work available on the platform
* API access (tentative), which would allow developers and organizations to interface with the Effect network programmatically
* New capabilities and tests to match the task types coming in Phase 6, maintaining our commitment to quality and appropriate worker-task matching

The next phase will continue the steady, iterative approach that has defined the Alpha so far. Improving what works, fixing what does not, and expanding capability step by step.

---

## Closing Thoughts

Phase 5 pushed Effect forward in ways that were sometimes uncomfortable but always necessary. We uncovered real vulnerabilities, confronted difficult community situations head on, and came out of it with a clearer picture of what this platform needs to be.

Every worker who showed up, followed the instructions, and contributed honest work helped build something real. The datasets created during this phase are not test data. They are going into live applications. That is worth taking seriously, and most of our community does.

Thank you for being part of this. Phase 6 is coming, and we are more prepared for it than we have ever been.

---

## Get Involved

Want to join the next phase of Effect AI?

**Contributors:** [Sign Up](https://forms.gle/ovZXKQBvemXVn5Gy5) to join the **next alpha phase** and start earning $EFFECT for real tasks

**Developers & Researchers:** Collaborate with us to build or validate high-quality datasets for your AI models and research initiatives

**Organizations:** Partner with Effect AI on responsible, mission-aligned data initiatives across a wide range of domains, from AI development to social impact.

---