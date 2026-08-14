import { PluginManifestSchema } from "@jarvis-k/contracts";
import {
  definePlugin,
  type LocalPluginDefinition,
} from "./local-plugin-runtime";

export const STOCK_ANALYSIS_PLUGIN_ID = "cn.jarvis-k.stock-analysis";
export const STOCK_QUOTE_CAPABILITY = "stock.quote";

export const ECOMMERCE_COMPARISON_PLUGIN_ID =
  "cn.jarvis-k.ecommerce-comparison";
export const PRODUCT_COMPARE_CAPABILITY = "product.compare";
export const PRODUCT_BARGAIN_ADVICE_CAPABILITY = "product.bargain.advice";
export const HELLO_READONLY_LOCAL_TEMPLATE_PLUGIN_ID =
  "cn.example.hello-readonly";
export const HELLO_LOOKUP_CAPABILITY = "hello.lookup";

export const stockAnalysisSamplePlugin: LocalPluginDefinition = definePlugin({
  manifest: PluginManifestSchema.parse({
    schemaVersion: 1,
    id: STOCK_ANALYSIS_PLUGIN_ID,
    name: "Stock Analysis Sample",
    version: "0.1.0",
    apiVersion: "1",
    entry: "dist/main.js",
    runtime: "node-worker",
    capabilities: [
      {
        name: STOCK_QUOTE_CAPABILITY,
        description: "Read-only stock quote and basic company facts sample.",
        inputSchema: "schemas/stock-quote-input.json",
        outputSchema: "schemas/stock-quote-output.json",
        risk: "read_only",
        readOnly: true,
      },
    ],
    permissions: [],
  }),
  schemaDocuments: {
    "schemas/stock-quote-input.json": {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      additionalProperties: false,
      properties: {
        symbol: {
          type: "string",
          minLength: 1,
          maxLength: 16,
        },
      },
      required: ["symbol"],
    },
    "schemas/stock-quote-output.json": {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      additionalProperties: false,
      properties: {
        summary: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        items: {
          type: "array",
          maxItems: 12,
        },
      },
      required: ["summary"],
    },
  },
  handlers: {
    [STOCK_QUOTE_CAPABILITY]: (input) => {
      const symbol =
        typeof input.symbol === "string" ? input.symbol.toUpperCase() : "JVS";
      return {
        summary: `Read-only sample quote returned for ${symbol}.`,
        items: [
          {
            title: symbol,
            fields: [
              { label: "Price", value: 128.42 },
              { label: "Currency", value: "USD" },
              { label: "Source", value: "local sample data" },
            ],
          },
        ],
      };
    },
  },
});

export const ecommerceComparisonSamplePlugin: LocalPluginDefinition =
  definePlugin({
    manifest: PluginManifestSchema.parse({
      schemaVersion: 1,
      id: ECOMMERCE_COMPARISON_PLUGIN_ID,
      name: "E-commerce Product Comparison Sample",
      version: "0.1.0",
      apiVersion: "1",
      entry: "dist/main.js",
      runtime: "node-worker",
      capabilities: [
        {
          name: PRODUCT_COMPARE_CAPABILITY,
          description: "Read-only product comparison sample.",
          inputSchema: "schemas/product-compare-input.json",
          outputSchema: "schemas/product-compare-output.json",
          risk: "read_only",
          readOnly: true,
        },
        {
          name: PRODUCT_BARGAIN_ADVICE_CAPABILITY,
          description: "Read-only bargain advice and message draft sample.",
          inputSchema: "schemas/product-bargain-advice-input.json",
          outputSchema: "schemas/product-bargain-advice-output.json",
          risk: "read_only",
          readOnly: true,
        },
      ],
      permissions: [],
    }),
    schemaDocuments: {
      "schemas/product-compare-input.json": {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        properties: {
          query: {
            type: "string",
            minLength: 1,
            maxLength: 120,
          },
        },
        required: ["query"],
      },
      "schemas/product-compare-output.json": {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        properties: {
          summary: {
            type: "string",
            minLength: 1,
            maxLength: 1000,
          },
          items: {
            type: "array",
            maxItems: 12,
          },
        },
        required: ["summary"],
      },
      "schemas/product-bargain-advice-input.json": {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        properties: {
          query: {
            type: "string",
            minLength: 1,
            maxLength: 120,
          },
        },
        required: ["query"],
      },
      "schemas/product-bargain-advice-output.json": {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        properties: {
          summary: {
            type: "string",
            minLength: 1,
            maxLength: 1000,
          },
          items: {
            type: "array",
            maxItems: 12,
          },
        },
        required: ["summary"],
      },
    },
    handlers: {
      [PRODUCT_COMPARE_CAPABILITY]: (input) => {
        const query =
          typeof input.query === "string" ? input.query : "sample product";
        return {
          summary: `Read-only sample comparison returned for ${query}.`,
          items: [
            {
              title: "Balanced Pick",
              fields: [
                { label: "Price", value: 219 },
                { label: "Rating", value: 4.6 },
                { label: "Action", value: "compare only" },
              ],
            },
            {
              title: "Budget Pick",
              fields: [
                { label: "Price", value: 149 },
                { label: "Rating", value: 4.2 },
                { label: "Action", value: "compare only" },
              ],
            },
          ],
        };
      },
      [PRODUCT_BARGAIN_ADVICE_CAPABILITY]: (input) => {
        const query =
          typeof input.query === "string" ? input.query : "sample product";
        const normalizedQuery = query.trim().slice(0, 80) || "sample product";
        return {
          summary: `Read-only bargain advice returned for ${normalizedQuery}. Draft only; no seller message, checkout, payment, or order action was performed.`,
          items: [
            {
              title: "Bargain Plan",
              fields: [
                { label: "Anchor", value: "ask for 8-12% lower" },
                { label: "Tone", value: "polite and specific" },
                { label: "Action", value: "draft only" },
              ],
            },
            {
              title: "Message Draft",
              fields: [
                {
                  label: "Line 1",
                  value: `Hi, I like this ${normalizedQuery}.`,
                },
                {
                  label: "Line 2",
                  value: "Could you offer a small discount today?",
                },
                { label: "Safety", value: "review before sending" },
              ],
            },
          ],
        };
      },
    },
  });

export const helloReadonlyLocalTemplatePlugin: LocalPluginDefinition =
  definePlugin({
    manifest: PluginManifestSchema.parse({
      schemaVersion: 1,
      id: HELLO_READONLY_LOCAL_TEMPLATE_PLUGIN_ID,
      name: "Hello Read-only Local Plugin",
      version: "0.1.0",
      apiVersion: "1",
      entry: "dist/main.js",
      runtime: "node-worker",
      capabilities: [
        {
          name: HELLO_LOOKUP_CAPABILITY,
          description:
            "Read-only hello lookup template for local plugin authoring.",
          inputSchema: "schemas/hello-lookup-input.json",
          outputSchema: "schemas/hello-lookup-output.json",
          risk: "read_only",
          readOnly: true,
        },
      ],
      permissions: [],
    }),
    schemaDocuments: {
      "schemas/hello-lookup-input.json": {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 80,
          },
        },
        required: ["name"],
      },
      "schemas/hello-lookup-output.json": {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        properties: {
          summary: {
            type: "string",
            minLength: 1,
            maxLength: 1000,
          },
          items: {
            type: "array",
            maxItems: 12,
          },
        },
        required: ["summary"],
      },
    },
    handlers: {
      [HELLO_LOOKUP_CAPABILITY]: (input) => {
        const rawName = typeof input.name === "string" ? input.name : "Jarvis";
        const name = rawName.trim().slice(0, 40) || "Jarvis";
        return {
          summary: `Hello ${name}. This read-only local plugin template returned a sanitized result.`,
          items: [
            {
              title: "Hello Template",
              fields: [
                { label: "Name", value: name },
                { label: "Mode", value: "read-only" },
                { label: "Source", value: "controlled local template" },
              ],
            },
          ],
        };
      },
    },
  });

export const samplePluginDefinitions = [
  stockAnalysisSamplePlugin,
  ecommerceComparisonSamplePlugin,
] as const;

export const localTemplatePluginDefinitions = [
  helloReadonlyLocalTemplatePlugin,
] as const;
