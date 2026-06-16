<template>
  <main class="font-inter">
    <section class="px-section-x py-20 border-b border-gray-100">
      <div class="max-w-7xl mx-auto">
        <p class="text-xs uppercase tracking-wider text-gray-400 mb-2">Effect AI · Canva App</p>
        <h1 class="text-4xl md:text-5xl font-light text-gray-900 leading-tight">
          Privacy Policy
        </h1>
        <p class="mt-4 text-sm text-gray-400">Last updated: June 16, 2026</p>
      </div>
    </section>

    <section class="px-section-x py-section-y">
      <div class="max-w-3xl mx-auto prose lg:prose-lg prose-gray">
        <p>
          This Privacy Policy explains how Effect AI ("we", "us", or "our") collects, uses, and
          protects information when you use the <strong>Effect AI Design Review</strong> Canva App
          (the "App"). We are committed to handling your data transparently and in accordance with
          applicable data protection law.
        </p>

        <h2>1. Who We Are</h2>
        <p>
          Effect AI is the data controller responsible for the processing described in this policy.
          You can reach us at <a href="mailto:hello@effect.ai">hello@effect.ai</a>.
        </p>

        <h2>2. Information We Collect</h2>
        <p>When you use the App we may collect and process the following:</p>
        <ul>
          <li>
            <strong>Canva user identifier.</strong> A unique, anonymised identifier derived from
            your Canva account (the <code>sub</code> field of the Canva-issued JWT). We use this
            to associate your submitted tasks with your account.
          </li>
          <li>
            <strong>Design images.</strong> When you submit a task, the App exports your Canva
            design as one or more PNG images. These images are uploaded to a decentralised storage
            network (IPFS) and distributed to Effect AI workers for review.
          </li>
          <li>
            <strong>Task configuration.</strong> Metadata you provide when configuring a task (e.g.
            context text, selected check type, worker count). This is stored alongside the task
            record.
          </li>
          <li>
            <strong>Task results.</strong> Aggregated feedback submitted by workers is stored and
            returned to you inside the App.
          </li>
          <li>
            <strong>Usage logs.</strong> Standard server logs (IP address, timestamp, HTTP status)
            are retained for security and debugging purposes.
          </li>
        </ul>
        <p>We do not collect your Canva username, email address, or any payment information.</p>

        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>operate and deliver the design review service;</li>
          <li>associate tasks with the correct Canva user and return results to you;</li>
          <li>detect and prevent abuse, fraud, or security incidents;</li>
          <li>improve the App and the underlying Effect AI platform.</li>
        </ul>

        <h2>4. Sharing Your Information</h2>
        <p>Your design images are shared with Effect AI workers, who are pseudonymous individuals
        participating in the decentralised network. Workers see the image(s) you submitted and the
        review context you provided, but not your name or Canva account email.</p>
        <p>We do not sell your personal data. We may share data with:</p>
        <ul>
          <li>
            <strong>Effect AI infrastructure providers</strong> (e.g. IPFS pinning and hosting
            services) strictly to deliver the service;
          </li>
          <li>
            <strong>Law enforcement or regulatory bodies</strong> if required by applicable law.
          </li>
        </ul>

        <h2>5. Data Retention</h2>
        <p>
          Task records (including your Canva user identifier, design image URLs, and results) are
          retained for as long as is necessary to provide the service and for a reasonable period
          thereafter for backup and audit purposes. You may request deletion of your task data at
          any time by contacting us (see Section 8).
        </p>
        <p>
          Design images uploaded to IPFS are content-addressed and may persist on the decentralised
          network beyond our ability to remove them. We encourage you not to submit designs
          containing sensitive personal information.
        </p>

        <h2>6. Security</h2>
        <p>
          We implement appropriate technical and organisational measures to protect your data,
          including JWT-based authentication for all API requests, HTTPS in transit, and
          access-controlled server storage. No method of transmission or storage is completely
          secure, however, and we cannot guarantee absolute security.
        </p>

        <h2>7. Your Rights</h2>
        <p>
          Depending on your jurisdiction you may have rights to access, correct, delete, or
          restrict processing of your personal data, or to lodge a complaint with a supervisory
          authority. To exercise any of these rights, contact us at
          <a href="mailto:hello@effect.ai">hello@effect.ai</a>.
        </p>

        <h2>8. Third-Party Services</h2>
        <p>
          The App runs within the Canva platform. Canva's collection and use of your data is
          governed by the
          <a href="https://www.canva.com/policies/privacy-policy/" target="_blank" rel="noopener">
            Canva Privacy Policy</a
          >, which applies independently of this policy.
        </p>

        <h2>9. Children</h2>
        <p>
          The App is not directed at children under 18. We do not knowingly collect personal data
          from minors. If you believe a child has provided us with personal data, please contact us
          and we will delete it promptly.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material
          changes by updating the "Last updated" date at the top of this page. We encourage you to
          review this policy periodically.
        </p>

        <h2>11. Contact Us</h2>
        <p>
          For any questions or requests regarding this Privacy Policy, please contact:
          <br />
          <strong>Effect AI</strong><br />
          <a href="mailto:hello@effect.ai">hello@effect.ai</a><br />
          <a href="https://effect.ai" target="_blank" rel="noopener">https://effect.ai</a>
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
useSeoMeta({
  title: "Privacy Policy | Effect AI Canva App",
  description:
    "How Effect AI collects, uses, and protects your data when you use the Effect AI Design Review Canva App.",
});
</script>
