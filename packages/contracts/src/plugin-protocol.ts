import { z } from "zod";

const PluginIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*){2,}$/u)
  .max(128);

const PluginCapabilityNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/u)
  .max(128);

const PluginVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/u)
  .max(32);

const PluginSchemaPathSchema = z
  .string()
  .regex(/^(?:schemas\/)?[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*\.json$/u)
  .max(160);

const forbiddenPluginActionPattern =
  /(?:trade|trading|order|checkout|payment|pay|purchase|sell|buy|交易|下单|付款|支付|购买|卖出|买入)/iu;

export const PluginRuntimeKindSchema = z.enum(["node-worker"]);
export type PluginRuntimeKind = z.infer<typeof PluginRuntimeKindSchema>;

export const PluginPermissionSchema = z.union([
  z.literal("storage.plugin"),
  z
    .string()
    .regex(/^network:https:[a-z0-9.-]{1,120}$/iu)
    .max(150),
]);
export type PluginPermission = z.infer<typeof PluginPermissionSchema>;

export const PluginCapabilityRiskSchema = z.enum([
  "read_only",
  "medium",
  "high",
  "critical",
]);
export type PluginCapabilityRisk = z.infer<typeof PluginCapabilityRiskSchema>;

export const PluginCapabilityDescriptorSchema = z
  .object({
    name: PluginCapabilityNameSchema,
    description: z.string().trim().min(1).max(500),
    inputSchema: PluginSchemaPathSchema,
    outputSchema: PluginSchemaPathSchema,
    risk: PluginCapabilityRiskSchema.default("read_only"),
    readOnly: z.boolean().default(true),
  })
  .strict()
  .superRefine((capability, ctx) => {
    if (
      forbiddenPluginActionPattern.test(capability.name) ||
      forbiddenPluginActionPattern.test(capability.description)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Plugin capabilities must not declare trading, ordering, checkout, or payment actions.",
      });
    }
    if (capability.risk !== "read_only" || !capability.readOnly) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Plugin SDK Alpha capabilities must be read-only.",
      });
    }
  });
export type PluginCapabilityDescriptor = z.infer<
  typeof PluginCapabilityDescriptorSchema
>;

export const PluginManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: PluginIdSchema,
    name: z.string().trim().min(1).max(120),
    version: PluginVersionSchema,
    apiVersion: z.literal("1"),
    entry: z.literal("dist/main.js"),
    runtime: PluginRuntimeKindSchema,
    capabilities: z
      .array(PluginCapabilityDescriptorSchema)
      .min(1)
      .max(16)
      .refine(
        (capabilities) =>
          new Set(capabilities.map((capability) => capability.name)).size ===
          capabilities.length,
        "Plugin capability names must be unique.",
      ),
    permissions: z
      .array(PluginPermissionSchema)
      .max(16)
      .default([])
      .refine(
        (permissions) => new Set(permissions).size === permissions.length,
        "Plugin permissions must be unique.",
      ),
  })
  .strict();
export type PluginManifest = z.infer<typeof PluginManifestSchema>;

const PluginSafeScalarSchema = z.union([
  z.string().trim().min(1).max(500),
  z.number().finite(),
  z.boolean(),
]);

export const PluginResultFieldSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    value: PluginSafeScalarSchema,
  })
  .strict();
export type PluginResultField = z.infer<typeof PluginResultFieldSchema>;

export const PluginResultItemSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    fields: z.array(PluginResultFieldSchema).min(1).max(16),
  })
  .strict();
export type PluginResultItem = z.infer<typeof PluginResultItemSchema>;

export const PluginInvocationOutputSchema = z
  .object({
    summary: z.string().trim().min(1).max(1_000),
    items: z.array(PluginResultItemSchema).max(12).default([]),
  })
  .strict();
export type PluginInvocationOutput = z.infer<
  typeof PluginInvocationOutputSchema
>;

const PluginInputValueSchema = z.union([
  z.string().trim().min(1).max(200),
  z.number().finite(),
  z.boolean(),
]);

export const PluginInvocationInputSchema = z
  .record(
    z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/u),
    PluginInputValueSchema,
  )
  .superRefine((input, ctx) => {
    if (Object.keys(input).length > 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Plugin invocation input must not exceed 16 fields.",
      });
    }
  });
export type PluginInvocationInput = z.infer<typeof PluginInvocationInputSchema>;

export const PluginInvocationRequestSchema = z
  .object({
    requestId: z.string().trim().min(1).max(128),
    pluginId: PluginIdSchema,
    capability: PluginCapabilityNameSchema,
    input: PluginInvocationInputSchema.default({}),
    dryRun: z.boolean().default(false),
  })
  .strict();
export type PluginInvocationRequest = z.infer<
  typeof PluginInvocationRequestSchema
>;

export const PluginInvocationStatusSchema = z.enum([
  "completed",
  "denied",
  "failed",
  "unavailable",
]);
export type PluginInvocationStatus = z.infer<
  typeof PluginInvocationStatusSchema
>;

export const PluginInvocationResultCodeSchema = z.enum([
  "PLUGIN_INVOKED",
  "PLUGIN_DRY_RUN",
  "PLUGIN_NOT_FOUND",
  "PLUGIN_CAPABILITY_NOT_FOUND",
  "PLUGIN_PERMISSION_DENIED",
  "PLUGIN_RUNTIME_UNAVAILABLE",
  "PLUGIN_INPUT_INVALID",
  "PLUGIN_OUTPUT_INVALID",
  "PLUGIN_EXECUTION_FAILED",
]);
export type PluginInvocationResultCode = z.infer<
  typeof PluginInvocationResultCodeSchema
>;

export const PluginInvocationResultSchema = z
  .object({
    requestId: z.string().trim().min(1).max(128),
    pluginId: PluginIdSchema,
    capability: PluginCapabilityNameSchema,
    status: PluginInvocationStatusSchema,
    resultCode: PluginInvocationResultCodeSchema,
    output: PluginInvocationOutputSchema.optional(),
    invokedAt: z.string().datetime(),
    completedAt: z.string().datetime(),
    directActionAttempted: z.literal(false),
    credentialExposed: z.literal(false),
    rawPluginOutputPersisted: z.literal(false),
  })
  .strict();
export type PluginInvocationResult = z.infer<
  typeof PluginInvocationResultSchema
>;

export const PluginListResultSchema = z
  .object({
    plugins: z.array(PluginManifestSchema).max(128),
    listedAt: z.string().datetime(),
  })
  .strict();
export type PluginListResult = z.infer<typeof PluginListResultSchema>;

export const PluginManagementSourceSchema = z.enum([
  "bundled",
  "local_manifest",
]);
export type PluginManagementSource = z.infer<
  typeof PluginManagementSourceSchema
>;

export const PluginManagementStateSchema = z.enum(["enabled", "disabled"]);
export type PluginManagementState = z.infer<typeof PluginManagementStateSchema>;

export const PluginManagementStateSourceSchema = z.enum([
  "bundled_runtime",
  "local_state_store",
  "policy_default",
]);
export type PluginManagementStateSource = z.infer<
  typeof PluginManagementStateSourceSchema
>;

export const PluginManagementExecutionModeSchema = z.enum([
  "bundled_runtime",
  "local_readonly_runtime",
  "list_only",
]);
export type PluginManagementExecutionMode = z.infer<
  typeof PluginManagementExecutionModeSchema
>;

export const PluginManagementRiskTierSchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);
export type PluginManagementRiskTier = z.infer<
  typeof PluginManagementRiskTierSchema
>;

export const PluginManagementConfirmationPolicySchema = z.enum([
  "none",
  "ui_confirmation",
  "strong_confirmation",
  "blocked",
]);
export type PluginManagementConfirmationPolicy = z.infer<
  typeof PluginManagementConfirmationPolicySchema
>;

export const PluginManagementPermissionCategorySchema = z.enum([
  "storage_plugin",
  "network_https",
]);
export type PluginManagementPermissionCategory = z.infer<
  typeof PluginManagementPermissionCategorySchema
>;

export const PluginManagementPermissionStateSchema = z.enum([
  "runtime_gated",
  "disabled_by_policy",
]);
export type PluginManagementPermissionState = z.infer<
  typeof PluginManagementPermissionStateSchema
>;

export const PluginManagementCapabilityRiskStatusSchema = z
  .object({
    capability: PluginCapabilityNameSchema,
    manifestRisk: PluginCapabilityRiskSchema,
    riskTier: PluginManagementRiskTierSchema,
    readOnly: z.boolean(),
    confirmationPolicy: PluginManagementConfirmationPolicySchema,
  })
  .strict();
export type PluginManagementCapabilityRiskStatus = z.infer<
  typeof PluginManagementCapabilityRiskStatusSchema
>;

export const PluginManagementPermissionStatusSchema = z
  .object({
    category: PluginManagementPermissionCategorySchema,
    riskTier: PluginManagementRiskTierSchema,
    permissionState: PluginManagementPermissionStateSchema,
    confirmationPolicy: PluginManagementConfirmationPolicySchema,
    reasonCodes: z
      .array(z.string().regex(/^[A-Z0-9_]{1,96}$/u))
      .max(8)
      .default([]),
  })
  .strict();
export type PluginManagementPermissionStatus = z.infer<
  typeof PluginManagementPermissionStatusSchema
>;

export const PluginManagementRiskAssessmentSchema = z
  .object({
    declaredRiskTier: PluginManagementRiskTierSchema,
    effectiveRiskTier: PluginManagementRiskTierSchema,
    confirmationPolicy: PluginManagementConfirmationPolicySchema,
    capabilityStatuses: z
      .array(PluginManagementCapabilityRiskStatusSchema)
      .max(16),
    permissionStatuses: z.array(PluginManagementPermissionStatusSchema).max(16),
    reasonCodes: z
      .array(z.string().regex(/^[A-Z0-9_]{1,96}$/u))
      .max(12)
      .default([]),
  })
  .strict();
export type PluginManagementRiskAssessment = z.infer<
  typeof PluginManagementRiskAssessmentSchema
>;

export const PluginManagementEntrySchema = z
  .object({
    manifest: PluginManifestSchema,
    source: PluginManagementSourceSchema,
    state: PluginManagementStateSchema,
    stateSource: PluginManagementStateSourceSchema.default("policy_default"),
    statePersisted: z.boolean().default(false),
    stateUpdatedAt: z.string().datetime().optional(),
    stateToggleAvailable: z.boolean().default(false),
    executionMode: PluginManagementExecutionModeSchema,
    executable: z.boolean(),
    routeSelectable: z.boolean(),
    riskAssessment: PluginManagementRiskAssessmentSchema,
    reasonCodes: z
      .array(z.string().regex(/^[A-Z0-9_]{1,96}$/u))
      .max(8)
      .default([]),
  })
  .strict();
export type PluginManagementEntry = z.infer<typeof PluginManagementEntrySchema>;

export const PluginMcpAdapterStatusSchema = z
  .object({
    status: z.literal("disabled"),
    mode: z.literal("compatibility_status_only"),
    defaultExecutionState: z.literal("disabled"),
    externalServerStartupAllowed: z.literal(false),
    externalToolExecutionAllowed: z.literal(false),
    toolCallForwardingAllowed: z.literal(false),
    permissionLayerRequired: z.literal(true),
    credentialExposed: z.literal(false),
    rawToolOutputPersisted: z.literal(false),
    marketplaceAccessed: z.literal(false),
    reasonCodes: z
      .array(z.string().regex(/^[A-Z0-9_]{1,96}$/u))
      .max(12)
      .default([]),
  })
  .strict();
export type PluginMcpAdapterStatus = z.infer<
  typeof PluginMcpAdapterStatusSchema
>;

export const PluginManagementStatusResultSchema = z
  .object({
    plugins: z.array(PluginManagementEntrySchema).max(128),
    listedAt: z.string().datetime(),
    defaultThirdPartyExecutionState: z.literal("disabled"),
    thirdPartyCodeExecuted: z.literal(false),
    marketplaceAccessed: z.literal(false),
    mcpAdapter: PluginMcpAdapterStatusSchema,
  })
  .strict();
export type PluginManagementStatusResult = z.infer<
  typeof PluginManagementStatusResultSchema
>;

export const LocalPluginEnabledStateSetRequestSchema = z
  .object({
    pluginId: PluginIdSchema,
    enabled: z.boolean(),
  })
  .strict();
export type LocalPluginEnabledStateSetRequest = z.infer<
  typeof LocalPluginEnabledStateSetRequestSchema
>;

export const LocalPluginEnabledStateSetStatusSchema = z.enum([
  "updated",
  "blocked",
  "not_found",
]);
export type LocalPluginEnabledStateSetStatus = z.infer<
  typeof LocalPluginEnabledStateSetStatusSchema
>;

export const LocalPluginEnabledStateSetResultSchema = z
  .object({
    pluginId: PluginIdSchema,
    requestedState: PluginManagementStateSchema,
    appliedState: PluginManagementStateSchema,
    status: LocalPluginEnabledStateSetStatusSchema,
    persisted: z.boolean(),
    executionMode: PluginManagementExecutionModeSchema,
    executable: z.boolean(),
    routeSelectable: z.boolean(),
    thirdPartyCodeExecuted: z.literal(false),
    installOrEnableActionExposed: z.literal(false),
    stateToggleActionExposed: z.literal(true),
    reasonCodes: z
      .array(z.string().regex(/^[A-Z0-9_]{1,96}$/u))
      .max(12)
      .default([]),
  })
  .strict();
export type LocalPluginEnabledStateSetResult = z.infer<
  typeof LocalPluginEnabledStateSetResultSchema
>;

export const LocalPluginManifestDiscoveryStatusSchema = z.enum([
  "disabled",
  "not_configured",
  "configured",
  "degraded",
]);
export type LocalPluginManifestDiscoveryStatus = z.infer<
  typeof LocalPluginManifestDiscoveryStatusSchema
>;

export const LocalPluginManifestDirectoryStateSchema = z.enum([
  "disabled",
  "discovered",
  "empty",
  "invalid",
  "unreadable",
]);
export type LocalPluginManifestDirectoryState = z.infer<
  typeof LocalPluginManifestDirectoryStateSchema
>;

export const LocalPluginManifestIssueCodeSchema = z
  .string()
  .regex(/^[A-Z0-9_]{1,96}$/u);

export const LocalPluginManifestDirectoryStatusSchema = z
  .object({
    directoryRef: z.string().regex(/^local-plugin-dir-\d{2}$/u),
    state: LocalPluginManifestDirectoryStateSchema,
    manifestPresent: z.boolean(),
    manifestValid: z.boolean(),
    schemaValid: z.boolean(),
    pluginId: PluginIdSchema.optional(),
    pluginName: z.string().trim().min(1).max(120).optional(),
    capabilityCount: z.number().int().min(0).max(16),
    permissionCount: z.number().int().min(0).max(16),
    issueCodes: z.array(LocalPluginManifestIssueCodeSchema).max(16).default([]),
  })
  .strict();
export type LocalPluginManifestDirectoryStatus = z.infer<
  typeof LocalPluginManifestDirectoryStatusSchema
>;

export const LocalPluginManifestDeveloperStatusResultSchema = z
  .object({
    discoveryStatus: LocalPluginManifestDiscoveryStatusSchema,
    enabled: z.boolean(),
    configuredDirectoryCount: z.number().int().min(0).max(16),
    scannedDirectoryCount: z.number().int().min(0).max(16),
    validManifestCount: z.number().int().min(0).max(128),
    invalidManifestCount: z.number().int().min(0).max(128),
    directories: z.array(LocalPluginManifestDirectoryStatusSchema).max(16),
    checkedAt: z.string().datetime(),
    rawPathsExposed: z.literal(false),
    thirdPartyCodeExecuted: z.literal(false),
    marketplaceAccessed: z.literal(false),
    installOrEnableActionExposed: z.literal(false),
    stateToggleActionExposed: z.boolean().default(false),
    reasonCodes: z
      .array(LocalPluginManifestIssueCodeSchema)
      .max(16)
      .default([]),
  })
  .strict();
export type LocalPluginManifestDeveloperStatusResult = z.infer<
  typeof LocalPluginManifestDeveloperStatusResultSchema
>;
