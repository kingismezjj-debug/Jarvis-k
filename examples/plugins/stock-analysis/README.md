# Stock Analysis Sample Plugin

This developer-alpha sample is read-only. It demonstrates a quote-style
capability shape without trading, account access, or portfolio mutation.

It uses local sample data in the SDK runtime and requests no permissions.

Validate this manifest:

```bash
npm run build:contracts
node scripts/validate-plugin-manifest.mjs examples/plugins/stock-analysis
```

Current routed UI smoke command:

```text
stock quote MSFT
```

See `docs/plugin-sdk-authoring-alpha.md` for the authoring contract and safety
rules.
