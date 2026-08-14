import { z } from "zod";

export const CommandRouterQwenProductRoutingActivationStateSchema = z.enum([
  "disabled",
  "ready",
  "armed",
  "active",
  "fallback",
  "degraded",
  "blocked"
]);
export type CommandRouterQwenProductRoutingActivationState = z.infer<
  typeof CommandRouterQwenProductRoutingActivationStateSchema
>;

export const CommandRouterQwenProductRoutingActivationRollbackStateSchema =
  z.enum(["not_needed", "ready", "completed"]);
export type CommandRouterQwenProductRoutingActivationRollbackState = z.infer<
  typeof CommandRouterQwenProductRoutingActivationRollbackStateSchema
>;

export const CommandRouterQwenProductRoutingActivationStatusSchema = z
  .object({
    policyId: z.literal("qwen-product-routing.activation.default-off.v1"),
    status: CommandRouterQwenProductRoutingActivationStateSchema,
    supportedStates: z
      .array(CommandRouterQwenProductRoutingActivationStateSchema)
      .length(7),
    activeRouteSource: z.enum([
      "intent-router.deterministic.fixture",
      "intent-router.qwen3-0.6b"
    ]),
    fallbackRouteSource: z.literal("intent-router.deterministic.fixture"),
    productRoutingEnabled: z.boolean(),
    realRuntimeEnabled: z.boolean(),
    runtimeAccessed: z.boolean(),
    artifactAccessed: z.boolean(),
    helperStarted: z.boolean(),
    generationPortInvoked: z.boolean(),
    persistentCacheChanged: z.literal(false),
    defaultBehaviorChanged: z.literal(false),
    rollbackState:
      CommandRouterQwenProductRoutingActivationRollbackStateSchema,
    gates: z
      .object({
        preparedPolicyReviewed: z.boolean(),
        readinessEvidencePassed: z.boolean(),
        noRuntimeProductBindingPresent: z.boolean(),
        coreSelectionFallbackPreserved: z.boolean(),
        commandRouterSafetyGatesPreserved: z.boolean(),
        deterministicFixtureActive: z.boolean(),
        runtimeRetentionApproved: z.boolean(),
        manualAcceptanceApproved: z.boolean(),
        persistentEnablementApproved: z.boolean(),
        explicitOptInEnabled: z.boolean(),
        realQwenRuntimeEnabled: z.boolean(),
        productRoutingArmed: z.boolean(),
        productRoutingEnabled: z.boolean(),
        helperStartupAllowed: z.boolean(),
        artifactMaterializationAllowed: z.boolean(),
        dependencyEnvironmentRetentionAllowed: z.boolean(),
        generationPortInvocationAllowed: z.boolean(),
        deterministicFixtureRollbackReady: z.boolean(),
        uiIpcRuntimeControlAllowed: z.literal(false)
      })
      .strict(),
    reasonCodes: z.array(z.string().regex(/^[A-Z0-9_]+$/).max(128)).max(16)
  })
  .strict();
export type CommandRouterQwenProductRoutingActivationStatus = z.infer<
  typeof CommandRouterQwenProductRoutingActivationStatusSchema
>;

export interface CreateCommandRouterQwenProductRoutingActivationStatusInput {
  commandRouterProductModeEnabled?: boolean;
  preparedPolicyReviewed?: boolean;
  readinessEvidencePassed?: boolean;
  noRuntimeProductBindingPresent?: boolean;
  coreSelectionFallbackPreserved?: boolean;
  commandRouterSafetyGatesPreserved?: boolean;
  deterministicFixtureActive?: boolean;
  armingWindowApproved?: boolean;
  runtimeRetentionApproved?: boolean;
  manualAcceptanceApproved?: boolean;
  helperStartupAllowed?: boolean;
  artifactMaterializationAllowed?: boolean;
  dependencyEnvironmentRetentionAllowed?: boolean;
  generationPortInvocationAllowed?: boolean;
  productRoutingArmed?: boolean;
  persistentEnablementApproved?: boolean;
  explicitOptInEnabled?: boolean;
  productRoutingEnabled?: boolean;
  realQwenRuntimeEnabled?: boolean;
  runtimeAccessed?: boolean;
  artifactAccessed?: boolean;
  helperStarted?: boolean;
  generationPortInvoked?: boolean;
  deterministicFixtureRollbackReady?: boolean;
  rollbackRequested?: boolean;
  degraded?: boolean;
  blocked?: boolean;
}

export const COMMAND_ROUTER_QWEN_PRODUCT_ROUTING_ACTIVATION_SUPPORTED_STATES =
  CommandRouterQwenProductRoutingActivationStateSchema.options;

export function createCommandRouterQwenProductRoutingActivationStatus(
  input: CreateCommandRouterQwenProductRoutingActivationStatusInput = {}
): CommandRouterQwenProductRoutingActivationStatus {
  const armingGateRequested = input.armingWindowApproved === true;
  const persistentEnablementRequested =
    input.persistentEnablementApproved === true;
  const gates = {
    preparedPolicyReviewed: input.preparedPolicyReviewed === true,
    readinessEvidencePassed: input.readinessEvidencePassed === true,
    noRuntimeProductBindingPresent:
      input.noRuntimeProductBindingPresent === true,
    coreSelectionFallbackPreserved:
      input.coreSelectionFallbackPreserved !== false,
    commandRouterSafetyGatesPreserved:
      input.commandRouterSafetyGatesPreserved !== false,
    deterministicFixtureActive: input.deterministicFixtureActive !== false,
    runtimeRetentionApproved:
      (armingGateRequested || persistentEnablementRequested) &&
      input.runtimeRetentionApproved === true,
    manualAcceptanceApproved:
      (armingGateRequested || persistentEnablementRequested) &&
      input.manualAcceptanceApproved === true,
    persistentEnablementApproved: persistentEnablementRequested,
    explicitOptInEnabled:
      persistentEnablementRequested && input.explicitOptInEnabled === true,
    realQwenRuntimeEnabled:
      persistentEnablementRequested &&
      input.realQwenRuntimeEnabled === true,
    productRoutingArmed:
      (armingGateRequested || persistentEnablementRequested) &&
      input.productRoutingArmed === true,
    productRoutingEnabled:
      persistentEnablementRequested &&
      input.productRoutingEnabled === true,
    helperStartupAllowed:
      (armingGateRequested || persistentEnablementRequested) &&
      input.helperStartupAllowed === true,
    artifactMaterializationAllowed:
      (armingGateRequested || persistentEnablementRequested) &&
      input.artifactMaterializationAllowed === true,
    dependencyEnvironmentRetentionAllowed: false as const,
    generationPortInvocationAllowed:
      (armingGateRequested || persistentEnablementRequested) &&
      input.generationPortInvocationAllowed === true,
    deterministicFixtureRollbackReady:
      input.deterministicFixtureRollbackReady !== false,
    uiIpcRuntimeControlAllowed: false as const
  };
  const ready =
    input.commandRouterProductModeEnabled === true &&
    gates.preparedPolicyReviewed &&
    gates.readinessEvidencePassed &&
    gates.noRuntimeProductBindingPresent &&
    gates.coreSelectionFallbackPreserved &&
    gates.commandRouterSafetyGatesPreserved &&
    gates.deterministicFixtureActive;

  const armed =
    ready &&
    gates.runtimeRetentionApproved &&
    gates.manualAcceptanceApproved &&
    gates.productRoutingArmed &&
    gates.helperStartupAllowed &&
    gates.artifactMaterializationAllowed &&
    gates.generationPortInvocationAllowed;
  const active =
    armed &&
    gates.persistentEnablementApproved &&
    gates.explicitOptInEnabled &&
    gates.realQwenRuntimeEnabled &&
    gates.productRoutingEnabled &&
    gates.deterministicFixtureRollbackReady &&
    input.runtimeAccessed === true &&
    input.artifactAccessed === true &&
    input.helperStarted === true &&
    input.generationPortInvoked === true;
  const status = selectQwenActivationStatus(input, ready, armed, active);
  const rollbackState =
    status === "fallback"
      ? "completed"
      : status === "ready" ||
          status === "armed" ||
          status === "active" ||
          status === "degraded"
        ? "ready"
        : "not_needed";

  const routeActive = status === "active" && active;

  return CommandRouterQwenProductRoutingActivationStatusSchema.parse({
    policyId: "qwen-product-routing.activation.default-off.v1",
    status,
    supportedStates:
      COMMAND_ROUTER_QWEN_PRODUCT_ROUTING_ACTIVATION_SUPPORTED_STATES,
    activeRouteSource: routeActive
      ? "intent-router.qwen3-0.6b"
      : "intent-router.deterministic.fixture",
    fallbackRouteSource: "intent-router.deterministic.fixture",
    productRoutingEnabled: routeActive,
    realRuntimeEnabled: routeActive,
    runtimeAccessed: routeActive && input.runtimeAccessed === true,
    artifactAccessed: routeActive && input.artifactAccessed === true,
    helperStarted: routeActive && input.helperStarted === true,
    generationPortInvoked:
      routeActive && input.generationPortInvoked === true,
    persistentCacheChanged: false,
    defaultBehaviorChanged: false,
    rollbackState,
    gates,
    reasonCodes: qwenActivationReasonCodes(input, ready, status)
  });
}

function selectQwenActivationStatus(
  input: CreateCommandRouterQwenProductRoutingActivationStatusInput,
  ready: boolean,
  armed: boolean,
  active: boolean
): CommandRouterQwenProductRoutingActivationState {
  if (input.blocked === true) {
    return "blocked";
  }
  if (input.rollbackRequested === true) {
    return "fallback";
  }
  if (input.degraded === true) {
    return "degraded";
  }
  if (!ready) {
    return "disabled";
  }
  if (active) {
    return "active";
  }
  if (armed) {
    return "armed";
  }
  return "ready";
}

function qwenActivationReasonCodes(
  input: CreateCommandRouterQwenProductRoutingActivationStatusInput,
  ready: boolean,
  status: CommandRouterQwenProductRoutingActivationState
): string[] {
  const reasonCodes: string[] = [];
  if (status === "blocked") {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_ACTIVATION_BLOCKED");
  }
  if (status === "fallback") {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_ROLLBACK_TO_FIXTURE");
  }
  if (status === "degraded") {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_ACTIVATION_DEGRADED");
  }
  if (status === "armed") {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_ARMED_FOR_WINDOW");
  }
  if (status === "active") {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_ACTIVE_EXPLICIT_OPT_IN");
  }
  if (input.commandRouterProductModeEnabled !== true) {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_ACTIVATION_DISABLED");
  }
  if (input.preparedPolicyReviewed !== true) {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_POLICY_REVIEW_PENDING");
  }
  if (input.readinessEvidencePassed !== true) {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_READINESS_EVIDENCE_PENDING");
  }
  if (input.noRuntimeProductBindingPresent !== true) {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_NO_RUNTIME_BINDING_PENDING");
  }
  if (input.coreSelectionFallbackPreserved === false) {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_FALLBACK_NOT_PRESERVED");
  }
  if (input.commandRouterSafetyGatesPreserved === false) {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_SAFETY_GATES_NOT_PRESERVED");
  }
  if (input.deterministicFixtureActive === false) {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_FIXTURE_NOT_ACTIVE");
  }
  if (ready) {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_ACTIVATION_READY");
  }
  if (status !== "active") {
    reasonCodes.push("QWEN_PRODUCT_ROUTING_RUNTIME_DISABLED");
    reasonCodes.push("QWEN_PRODUCT_ROUTING_PRODUCT_ROUTE_DISABLED");
  }
  return reasonCodes.slice(0, 16);
}
