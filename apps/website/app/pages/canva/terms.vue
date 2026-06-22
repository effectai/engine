<template>
  <main class="font-inter">
    <section class="px-section-x py-20 border-b border-gray-100">
      <div class="max-w-7xl mx-auto">
        <p class="text-xs uppercase tracking-wider text-gray-400 mb-2">Effect AI · Canva App</p>
        <h1 class="text-4xl md:text-5xl font-light text-gray-900 leading-tight">
          Terms and Conditions
        </h1>
        <p class="mt-4 text-sm text-gray-400">Last updated: June 16, 2026</p>
      </div>
    </section>

    <section class="px-section-x py-section-y">
      <div class="max-w-3xl mx-auto prose lg:prose-lg prose-gray">
        <p>
          These Terms and Conditions govern your use of the <strong>Effect AI Design Review</strong>
          Canva App (the "App"), developed and operated by Effect AI ("we", "us", or "our"). By
          installing or using the App, you agree to be bound by these terms.
        </p>

        <h2>1. What the App Does</h2>
        <p>
          The Effect AI Design Review App allows you to submit exported images of your Canva designs
          to a decentralised network of human reviewers ("workers") via the Effect AI platform.
          Workers assess your designs for qualities such as visual clarity, clickability, and
          comparative preference. Aggregated feedback is returned to you in the App.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 18 years old and have a valid Canva account to use the App. By using
          the App you represent that you meet these requirements.
        </p>

        <h2>3. Your Content</h2>
        <p>
          You retain all ownership rights to the designs you submit. By submitting a design you
          grant us a limited, non-exclusive licence to export, store, and distribute the design
          image to Effect AI workers solely for the purpose of providing the review service. You
          must not submit designs that:
        </p>
        <ul>
          <li>infringe any third-party intellectual property rights;</li>
          <li>contain illegal, harmful, or offensive content;</li>
          <li>
            include personal data of other individuals without appropriate consent.
          </li>
        </ul>

        <h2>4. Privacy and Data</h2>
        <p>
          Our collection and use of your information is described in our
          <NuxtLink to="/canva/privacy">Privacy Policy</NuxtLink>, which forms part of these
          Terms. Submitted design images are uploaded to a decentralised storage network (IPFS) and
          made available to workers in order to deliver the service.
        </p>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>attempt to reverse-engineer, decompile, or tamper with the App or its backend</li>
          <li>use automated means to submit tasks or abuse the review service</li>
          <li>circumvent any rate limits, authentication, or access controls</li>
        </ul>

        <h2>6. Availability</h2>
        <p>
          We aim to maintain high availability but do not guarantee uninterrupted access to the App
          or that review results will be delivered within any specific time. We may modify, suspend,
          or discontinue the App at any time with reasonable notice where possible.
        </p>

        <h2>7. Disclaimer of Warranties</h2>
        <p>
          The App is provided "as is" without warranty of any kind, express or implied. We do not
          warrant that the feedback provided by workers is accurate, complete, or fit for any
          particular purpose.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, Effect AI shall not be liable for any
          indirect, incidental, special, or consequential damages arising out of or in connection
          with your use of the App, even if we have been advised of the possibility of such
          damages. Our total liability for any claim related to the App shall not exceed the amount
          you paid us in the twelve months preceding the claim (if any).
        </p>

        <h2>9. Third-Party Services</h2>
        <p>
          The App operates within the Canva platform and is subject to
          <a href="https://www.canva.com/policies/terms-of-use/" target="_blank" rel="noopener">
            Canva's Terms of Use</a
          >. Your use of Canva is governed solely by Canva's policies.
        </p>

        <h2>10. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Material changes will be communicated via
          the App or on this page, with the "Last updated" date revised accordingly. Continued use
          of the App after changes constitutes acceptance of the updated Terms.
        </p>

        <h2>11. Contact</h2>
        <p>
          If you have questions about these Terms, please contact us at
          <a href="mailto:hello@effect.ai">hello@effect.ai</a>.
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
useSeoMeta({
  title: "Terms and Conditions | Effect AI Canva App",
  description:
    "Terms and conditions governing use of the Effect AI Design Review Canva App.",
});
</script>