# Campaign attribution

The shared site script captures whitelisted campaign tags on arrival, including pages without a form. The quote form carries them to the existing CRM intake after internal navigation. Brand routing, form validation and conversion callbacks are unchanged.

- Scope: this website and browser tab, using a brand-specific sessionStorage key. No cross-brand cookie or persistent localStorage.
- Lifetime: 30 minutes from the latest tagged arrival. Browsing untagged pages or submitting does not extend it; an already-open form also expires. A new explicitly tagged arrival starts a new window.
- Latest tagged arrival replaces every previous field. Google and Facebook data are never merged across visits. A bare fbclid replaces earlier Google data but does not claim paid Facebook traffic.
- Fields: UTM source/medium/campaign/term/content, gclid/gbraid/wbraid/fbclid, campaignid/adgroupid/adid/network/device/matchtype. Only nonempty strings up to 500 characters are used; no personal form values are stored here.
- If browser storage is blocked/full, the current tagged page still submits its attribution. Cross-page retention cannot be guaranteed when the browser refuses storage. Invalid, expired or future-dated storage is ignored.
- The CRM classifies Facebook only with a recognised Meta source and paid medium. Untagged traffic is not relabelled as paid. Historical enquiries are unchanged.

## Verification

Run from the repository root:

```sh
node tools/test-campaign-persistence.cjs
node build.js
node tools/test-form-attribution.cjs
```

Both test suites run offline. Form requests are mocked and no lead or advertising event is sent to a real service. The form test reads generated production configuration and verifies brand/endpoint, two forms, Facebook navigation, Google replacement and organic enquiries. Optionally set CRM_CLASSIFIER to the current CRM src/lib/lead-attribution.ts to check the real channel classifier too (Node 24 type stripping).
