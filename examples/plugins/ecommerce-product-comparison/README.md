# E-Commerce Product Comparison Sample Plugin

This developer-alpha sample is read-only. It demonstrates product comparison
cards and bargain-advice draft cards without cart, account, seller messaging, or
commerce mutation behavior.

It uses local sample data in the SDK runtime and requests no permissions.

Validate this manifest:

```bash
npm run build:contracts
node scripts/validate-plugin-manifest.mjs examples/plugins/ecommerce-product-comparison
```

Current routed UI smoke command:

```text
compare products mechanical keyboard
bargain advice mechanical keyboard
```

See `docs/plugin-sdk-authoring-alpha.md` for the authoring contract and safety
rules.
