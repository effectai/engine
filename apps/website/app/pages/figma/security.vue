<template>
  <main class="font-inter">
    <section class="px-section-x py-20 border-b border-gray-100">
      <div class="max-w-7xl mx-auto">
        <p class="text-xs uppercase tracking-wider text-gray-400 mb-2">Effect AI · Figma Plugin</p>
        <h1 class="text-4xl md:text-5xl font-light text-gray-900 leading-tight">
          Security Policy
        </h1>
        <p class="mt-4 text-sm text-gray-400">Last updated: September 19, 2026</p>
      </div>
    </section>

    <section class="px-section-x py-section-y">
      <div class="max-w-3xl mx-auto prose lg:prose-lg prose-gray">
        <p>
          This Security Policy explains how to report a security vulnerability in the
          <strong>VibeCheck</strong> Figma plugin and the services that support it,
          how Effect AI ("we", "us", or "our") responds to such reports, and the security measures
          we apply. This is a companion to our
          <NuxtLink to="/figma/privacy">Privacy Policy</NuxtLink>.
        </p>

        <h2>1. Scope</h2>
        <p>
          This policy covers the VibeCheck Figma plugin, the Effect AI services that support it, and
          the storage we use to host design images submitted for review.
        </p>
        <p>The following fall outside the scope of this policy:</p>
        <ul>
          <li>
            vulnerabilities in the Figma platform itself, which should be reported through
            <a href="https://www.figma.com/security/" target="_blank" rel="noopener"
              >Figma's security vulnerability process</a
            >
          </li>
          <li>denial of service, volumetric, or load testing of any kind</li>
          <li>social engineering or phishing of Effect AI staff, contributors, or workers</li>
          <li>
            the public retrievability of content on decentralised storage networks, which is
            documented behaviour of those networks rather than a defect. See Section 6.
          </li>
        </ul>

        <h2>2. Reporting a Vulnerability</h2>
        <p>
          Email <a href="mailto:hello@effect.ai">hello@effect.ai</a> with the subject line
          <strong>"Security: VibeCheck"</strong>.
        </p>
        <p>Please include:</p>
        <ul>
          <li>a description of the issue and the impact you believe it has</li>
          <li>steps to reproduce, or a minimal proof of concept</li>
          <li>where in the Plugin or service the issue occurs</li>
          <li>the name or handle you would like to be credited under, if you want credit</li>
        </ul>
        <p>
          We do not operate a paid bug bounty program. We can publicly credit reporters who ask to
          be named.
        </p>

        <h2>3. How We Respond</h2>
        <p>When we receive a report, we:</p>
        <ul>
          <li>acknowledge it and confirm we are looking into it</li>
          <li>reproduce the issue and assess its severity and impact</li>
          <li>
            prioritise a fix or mitigation according to that severity. Issues that put user data at
            risk are treated as urgent and are addressed ahead of other work
          </li>
          <li>keep you informed while the report is open, and tell you when a fix has shipped.</li>
        </ul>

        <h2>4. Coordinated Disclosure</h2>
        <p>
          We ask that you give us a reasonable opportunity to resolve an issue before disclosing it
          publicly, and that you coordinate the timing of any public disclosure with us.
        </p>
        <p>
          Where a vulnerability affected user data, or where a fix changes how the Plugin behaves,
          we will publish a note on this page and notify affected users directly.
        </p>

        <h2>5. Security Measures</h2>
        <p>
          We apply technical and organisational measures appropriate to the nature of the service,
          including:
        </p>
        <ul>
          <li>
            <strong>Encryption in transit.</strong> All traffic between the Plugin and our services
            is encrypted over HTTPS.
          </li>
          <li>
            <strong>Minimal data collection.</strong> The Plugin transmits only the design you
            explicitly select for review, together with the review context you provide. It does not
            read or send the rest of your document, or any other file in your account.
          </li>
          <li>
            <strong>Restricted network access.</strong> The Plugin can communicate only with a
            small, declared set of Effect AI services, and with nothing else.
          </li>
          <li>
            <strong>Scoped records.</strong> Submissions are associated with the Figma account that
            created them, and are returned only to that account.
          </li>
          <li>
            <strong>Abuse controls.</strong> Requests are rate limited and uploads are size limited.
          </li>
          <li>
            <strong>Credential handling.</strong> Credentials for our internal services are held
            server side and are never distributed with the Plugin.
          </li>
          <li>
            <strong>No sensitive categories.</strong> We do not collect or store passwords, payment
            card data, or health data.
          </li>
          <li>
            <strong>User-initiated deletion.</strong> You can delete any submission from within the
            Plugin, which removes the stored record and requests removal of the associated images
            from storage.
          </li>
          <li>
            <strong>Dependency maintenance.</strong> We monitor security advisories for the
            third-party components we rely on and apply updates as part of our regular release
            process.
          </li>
        </ul>
        <p>
          No method of transmission or storage is completely secure, and we cannot guarantee
          absolute security.
        </p>

        <h2>6. Storage Limitations</h2>
        <p>
          Design images are hosted on IPFS, a public, content-addressed storage network, so that
          Effect AI workers can view them. This carries limitations you should be aware of before
          you submit a design:
        </p>
        <ul>
          <li>anyone who holds the content identifier for an image can retrieve it</li>
          <li>
            once content has been distributed across the network, it may persist beyond our ability
            to remove it, even after you delete the submission.
          </li>
        </ul>
        <p>
          <strong
            >We encourage you not to submit confidential, unreleased, or otherwise sensitive
            material to the Plugin.</strong
          >
          This limitation is also described in our
          <NuxtLink to="/figma/privacy">Privacy Policy</NuxtLink>.
        </p>

        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this Security Policy from time to time. We will notify you of material
          changes by updating the "Last updated" date at the top of this page. Changes to how we
          handle reports or user data will be noted here.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          Security reports: <a href="mailto:hello@effect.ai">hello@effect.ai</a>, subject "Security:
          VibeCheck"<br />
          General support: <a href="mailto:hello@effect.ai">hello@effect.ai</a><br />
          Community:
          <a href="https://discord.gg/effectnetwork" target="_blank" rel="noopener"
            >Effect Network Discord</a
          >
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
useSeoMeta({
  title: "Security Policy | VibeCheck Figma Plugin",
  description:
    "How to report a security vulnerability in the VibeCheck Figma plugin, how Effect AI responds, and the security measures we apply.",
});
</script>
