import {
  PluginInvocationInputSchema,
  PluginInvocationOutputSchema,
  PluginInvocationRequestSchema,
  PluginInvocationResultSchema,
  PluginManifestSchema,
  type PluginInvocationOutput,
  type PluginInvocationInput,
  type PluginInvocationRequest,
  type PluginInvocationResult,
  type PluginManifest,
  type PluginPermission,
} from "@jarvis-k/contracts"
import type { PluginRegistry, PluginRuntime } from "@jarvis-k/capabilities"
import { validateJsonSchemaValue } from "./json-schema-validation"

export type PluginHandler = (
  input: Readonly<Record<string, string | number | boolean>>,
) => PluginInvocationOutput | Promise<PluginInvocationOutput>

export interface LocalPluginDefinition {
  manifest: PluginManifest
  handlers: Record<string, PluginHandler>
  schemaDocuments?: Record<string, unknown>
}

export interface PluginPermissionBroker {
  decide(input: {
    plugin: PluginManifest
    requestedPermissions: readonly PluginPermission[]
  }): PluginPermissionDecision
}

export interface PluginPermissionDecision {
  allowed: boolean
  deniedPermissions: PluginPermission[]
}

export class DefaultDenyPluginPermissionBroker implements PluginPermissionBroker {
  public constructor(
    private readonly allowedPermissions: readonly PluginPermission[] = [],
  ) {}

  public decide(input: {
    plugin: PluginManifest
    requestedPermissions: readonly PluginPermission[]
  }): PluginPermissionDecision {
    const allowed = new Set(this.allowedPermissions)
    const deniedPermissions = input.requestedPermissions.filter(
      (permission) => !allowed.has(permission),
    )
    return {
      allowed: deniedPermissions.length === 0,
      deniedPermissions,
    }
  }
}

export class InMemoryPluginRegistry implements PluginRegistry {
  private readonly plugins: PluginManifest[]

  public constructor(plugins: readonly PluginManifest[]) {
    this.plugins = plugins.map((plugin) => PluginManifestSchema.parse(plugin))
  }

  public async listPlugins(): Promise<PluginManifest[]> {
    return this.plugins.map((plugin) => cloneManifest(plugin))
  }

  public async getPlugin(
    pluginId: string,
  ): Promise<PluginManifest | undefined> {
    const plugin = this.plugins.find((candidate) => candidate.id === pluginId)
    return plugin ? cloneManifest(plugin) : undefined
  }
}

export class LocalReadOnlyPluginRuntime implements PluginRuntime {
  private readonly definitions: LocalPluginDefinition[]
  private readonly localReadOnlyPluginIds: Set<string>
  private readonly permissionBroker: PluginPermissionBroker

  public constructor(input: {
    definitions: readonly LocalPluginDefinition[]
    localReadOnlyPluginIds?: readonly string[]
    permissionBroker?: PluginPermissionBroker
    now?: () => Date
  }) {
    this.definitions = input.definitions.map((definition) => ({
      manifest: PluginManifestSchema.parse(definition.manifest),
      handlers: { ...definition.handlers },
      schemaDocuments: { ...(definition.schemaDocuments ?? {}) },
    }))
    this.localReadOnlyPluginIds = new Set(input.localReadOnlyPluginIds ?? [])
    this.permissionBroker =
      input.permissionBroker ?? new DefaultDenyPluginPermissionBroker()
    this.now = input.now ?? (() => new Date())
  }

  private readonly now: () => Date

  public async listExecutablePluginIds(): Promise<string[]> {
    return this.definitions.map((definition) => definition.manifest.id)
  }

  public async listLocalReadOnlyPluginIds(): Promise<string[]> {
    return this.definitions
      .map((definition) => definition.manifest.id)
      .filter((pluginId) => this.localReadOnlyPluginIds.has(pluginId))
  }

  public async invoke(
    request: PluginInvocationRequest,
  ): Promise<PluginInvocationResult> {
    const invokedAt = this.now().toISOString()
    const parsed = PluginInvocationRequestSchema.parse(request)
    const definition = this.definitions.find(
      (candidate) => candidate.manifest.id === parsed.pluginId,
    )
    if (!definition) {
      return this.result(parsed, "unavailable", "PLUGIN_NOT_FOUND", invokedAt)
    }

    const capability = definition.manifest.capabilities.find(
      (candidate) => candidate.name === parsed.capability,
    )
    if (!capability) {
      return this.result(
        parsed,
        "denied",
        "PLUGIN_CAPABILITY_NOT_FOUND",
        invokedAt,
      )
    }

    const permissionDecision = this.permissionBroker.decide({
      plugin: definition.manifest,
      requestedPermissions: definition.manifest.permissions,
    })
    if (!permissionDecision.allowed) {
      return this.result(
        parsed,
        "denied",
        "PLUGIN_PERMISSION_DENIED",
        invokedAt,
      )
    }

    const handler = definition.handlers[parsed.capability]
    if (!handler) {
      return this.result(
        parsed,
        "unavailable",
        "PLUGIN_RUNTIME_UNAVAILABLE",
        invokedAt,
      )
    }

    let input: PluginInvocationInput
    try {
      input = PluginInvocationInputSchema.parse(parsed.input)
    } catch {
      return this.result(parsed, "failed", "PLUGIN_INPUT_INVALID", invokedAt)
    }

    const inputSchema = definition.schemaDocuments?.[capability.inputSchema]
    const inputValidation = validateJsonSchemaValue(inputSchema, input)
    if (!inputValidation.valid) {
      return this.result(parsed, "failed", "PLUGIN_INPUT_INVALID", invokedAt)
    }

    let rawOutput: unknown
    try {
      rawOutput = parsed.dryRun
        ? {
            summary: `Dry run accepted for ${capability.name}.`,
            items: [],
          }
        : await handler(input)
    } catch {
      return this.result(parsed, "failed", "PLUGIN_EXECUTION_FAILED", invokedAt)
    }

    const outputSchema = definition.schemaDocuments?.[capability.outputSchema]
    const outputValidation = validateJsonSchemaValue(outputSchema, rawOutput)
    if (!outputValidation.valid) {
      return this.result(parsed, "failed", "PLUGIN_OUTPUT_INVALID", invokedAt)
    }

    try {
      const output = PluginInvocationOutputSchema.parse(rawOutput)
      return this.result(
        parsed,
        "completed",
        parsed.dryRun ? "PLUGIN_DRY_RUN" : "PLUGIN_INVOKED",
        invokedAt,
        output,
      )
    } catch {
      return this.result(parsed, "failed", "PLUGIN_OUTPUT_INVALID", invokedAt)
    }
  }

  private result(
    request: PluginInvocationRequest,
    status: PluginInvocationResult["status"],
    resultCode: PluginInvocationResult["resultCode"],
    invokedAt: string,
    output?: PluginInvocationOutput,
  ): PluginInvocationResult {
    const payload = {
      requestId: request.requestId,
      pluginId: request.pluginId,
      capability: request.capability,
      status,
      resultCode,
      invokedAt,
      completedAt: this.now().toISOString(),
      directActionAttempted: false,
      credentialExposed: false,
      rawPluginOutputPersisted: false,
      ...(output ? { output } : {}),
    }
    return PluginInvocationResultSchema.parse(payload)
  }
}

export function definePlugin(
  definition: LocalPluginDefinition,
): LocalPluginDefinition {
  return {
    manifest: PluginManifestSchema.parse(definition.manifest),
    handlers: { ...definition.handlers },
    schemaDocuments: { ...(definition.schemaDocuments ?? {}) },
  }
}

function cloneManifest(manifest: PluginManifest): PluginManifest {
  return PluginManifestSchema.parse({
    ...manifest,
    capabilities: manifest.capabilities.map((capability) => ({
      ...capability,
    })),
    permissions: [...manifest.permissions],
  })
}
