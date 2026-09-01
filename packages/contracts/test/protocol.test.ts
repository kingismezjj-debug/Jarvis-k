import { describe, expect, it } from "vitest";
import {
  AgentCommandSchema,
  AppEventSchema,
  BrainCommandResultSchema,
  BrainPlanSchema,
  BrainPlannerProviderConfigurationReportSchema,
  BrainPlannerResultSchema,
  ChatAnswerProductModeStatusSchema,
  CommandRouterLocalAppLaunchResultSchema,
  CommandRouterProductModeStatusSchema,
  QwenRuntimeControlSetResultSchema,
  QwenRuntimeControlStatusSchema,
  createCommandRouterQwenProductRoutingActivationStatus,
  CapabilitySnapshotSchema,
  CommandEnvelopeSchema,
  CoreSnapshotSchema,
  CoreInboundMessageSchema,
  EmbeddingGenerationResultSchema,
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  InferencePreflightReportSchema,
  IntentRoutingRequestSchema,
  IntentRoutingResultSchema,
  ModelInstallabilityReportSchema,
  ModelInventoryItemSchema,
  ModelRuntimeAdapterDescriptorSchema,
  ModelOperationSnapshotSchema,
  OcrBoundingBoxSchema,
  OcrRecognitionResultSchema,
  OcrRecognitionRequestSchema,
  ScreenCaptureRegionSchema,
  ScreenCaptureRequestSchema,
  ScreenCaptureResultSchema,
  VisionAnalysisRequestSchema,
  VisionAnalysisResultSchema,
  PROTOCOL_VERSION,
  RerankRequestSchema,
  RerankResultSchema,
  ResourceSchedulerDiagnosticsSchema,
  TaskStepSchema,
  CoreVoiceAudioMessageSchema,
  MemorySnapshotSchema,
  VoiceAudioFrameSchema,
  VoiceAudioFrameMetadataSchema,
  VoiceRegressionDualFeedbackSchema,
  VoiceRegressionRecordSchema,
  VoiceRegressionSampleSchema,
  VoiceTranscriptSchema,
  UserControlledMemoryRecordSchema,
  UserPreferenceMemoryRecordSchema,
  UiSurfaceCapabilityStatusSchema,
  createCommandEnvelope
} from "../src";

describe("protocol contracts", () => {
  it("does not expose Settings V2 internal fault controls in the product surface contract", () => {
    const base = {
      evaluationCapabilityAvailable: false,
      cloudProviderAcceptanceCapabilityAvailable: false,
      settingsV2CapabilityAvailable: true,
      settingsV2EnvRequested: false,
      settingsV2ReleaseAllowed: true,
      settingsV2Capability: true,
      settingsSurfaceRequested: "general_settings",
      settingsSurfaceMounted: "v2",
      settingsSurfaceHealth: "mounting",
      settingsV2SessionFallbackActive: false,
      settingsV2MountGeneration: 1,
      reasonCode: "alpha_default_enabled",
      source: "desktop-main",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    } as const;

    expect(UiSurfaceCapabilityStatusSchema.parse(base)).not.toHaveProperty(
      "settingsV2InternalFaultMode",
    );
    expect(
      UiSurfaceCapabilityStatusSchema.safeParse({
        ...base,
        settingsV2InternalFaultMode: "settings_v2_render_failure",
      }).success,
    ).toBe(false);
    expect(
      UiSurfaceCapabilityStatusSchema.safeParse({
        ...base,
        argv: [
          "--jarvis-internal-settings-v2-fault=settings_v2_render_failure",
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects private model installation paths from inventory DTOs", () => {
    const result = ModelInventoryItemSchema.safeParse({
      manifest: {
        id: "jarvis-fixture/local-embedding-smoke",
        capability: "embedding",
        source: "jarvis",
        revision: "fixture-revision",
        license: "Jarvis-K Fixture",
        runtime: "system",
        quantization: "fixture",
        sizeBytes: 1,
        sha256:
          "2222222222222222222222222222222222222222222222222222222222222222",
        licenseRisk: "green"
      },
      status: "available",
      installPath: "C:\\Users\\Administrator\\private-model.bin"
    });

    expect(result.success).toBe(false);
  });

  it("creates a valid command envelope", () => {
    const envelope = createCommandEnvelope({
      type: "agent.sendMessage",
      payload: {
        conversationId: "primary",
        text: "Status check"
      }
    });

    expect(CommandEnvelopeSchema.parse(envelope).protocolVersion).toBe(
      PROTOCOL_VERSION
    );
  });

  it("accepts bounded Task cancellation commands", () => {
    const command = AgentCommandSchema.parse({
      type: "agent.cancelTask",
      payload: {
        taskId: "task-planner-draft",
        reason: "User cancelled the pending task from the Tasks view."
      }
    });

    expect(command.type).toBe("agent.cancelTask");
  });

  it("accepts bounded Task approval commands and planner step metadata", () => {
    const command = AgentCommandSchema.parse({
      type: "agent.approveTask",
      payload: {
        taskId: "task-planner-draft",
        confirmation: "explicit_ui_confirmation"
      }
    });
    const step = TaskStepSchema.parse({
      id: "step-1",
      taskId: "task-planner-draft",
      title: "Search bounded user file locations",
      state: "pending",
      verificationStatus: "not_applicable",
      toolId: "filesystem.search",
      toolInput: {
        query: "project"
      }
    });

    expect(command.type).toBe("agent.approveTask");
    expect(step.toolId).toBe("filesystem.search");
    expect(step.toolInput).toEqual({ query: "project" });
  });

  it("accepts provider-neutral user-controlled memory contracts", () => {
    const listCommand = createCommandEnvelope({
      type: "agent.listUserControlledMemories",
      payload: {}
    });
    const deleteCommand = createCommandEnvelope({
      type: "agent.deleteUserControlledMemory",
      payload: {
        kind: "preference",
        sourceId: "preference_response_language"
      }
    });
    const record = UserControlledMemoryRecordSchema.parse({
      id: "preference:preference_response_language",
      sourceId: "preference_response_language",
      kind: "preference",
      label: "Response language",
      summary: "Prefer Chinese replies",
      preferenceKey: "response_language",
      preferenceValue: "zh",
      source: "user_confirmed_preference",
      risk: "low",
      deletable: true,
      rawContentExposed: false,
      createdAt: "2026-08-13T00:00:00.000Z",
      updatedAt: "2026-08-13T00:00:00.000Z"
    });
    const preference = UserPreferenceMemoryRecordSchema.parse({
      id: "preference_response_language",
      key: "response_language",
      label: "Response language",
      value: "zh",
      summary: "Prefer Chinese replies",
      source: "user_confirmed_preference",
      risk: "low",
      enabled: true,
      appliesTo: "ui_projection_only",
      createdAt: "2026-08-13T00:00:00.000Z",
      updatedAt: "2026-08-13T00:00:00.000Z"
    });

    expect(CommandEnvelopeSchema.parse(listCommand).command.type).toBe(
      "agent.listUserControlledMemories"
    );
    expect(CommandEnvelopeSchema.parse(deleteCommand).command).toMatchObject({
      type: "agent.deleteUserControlledMemory",
      payload: {
        kind: "preference",
        sourceId: "preference_response_language"
      }
    });
    expect(record.rawContentExposed).toBe(false);
    expect(record.preferenceKey).toBe("response_language");
    expect(record.preferenceValue).toBe("zh");
    expect(preference.appliesTo).toBe("ui_projection_only");
  });

  it("rejects an unsupported protocol version", () => {
    const envelope = createCommandEnvelope({
      type: "agent.getSnapshot",
      payload: {}
    });

    expect(() =>
      CommandEnvelopeSchema.parse({
        ...envelope,
        protocolVersion: 2
      })
    ).toThrow();
  });

  it("rejects invalid task states in snapshots", () => {
    expect(() =>
      CoreSnapshotSchema.parse({
        protocolVersion: PROTOCOL_VERSION,
        coreInstanceId: "core-test",
        sequenceId: 0,
        health: "ready",
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        voice: {
          state: "idle",
          mode: "disabled"
        },
        messages: [],
        tasks: [
          {
            id: "task-1",
            title: "Invalid task",
            state: "unknown",
            updatedAt: new Date().toISOString()
          }
        ]
      })
    ).toThrow();
  });

  it("accepts task runtime timeline snapshots with verification status", () => {
    const now = new Date().toISOString();
    const snapshot = CoreSnapshotSchema.parse({
      protocolVersion: PROTOCOL_VERSION,
      coreInstanceId: "core-test",
      sequenceId: 1,
      health: "ready",
      startedAt: now,
      updatedAt: now,
      voice: {
        state: "idle",
        mode: "disabled"
      },
      messages: [],
      tasks: [
        {
          id: "task-1",
          title: "Open Notepad",
          state: "completed",
          createdAt: now,
          updatedAt: now,
          completedAt: now,
          source: "text",
          intent: "localApp.open",
          routeSource: "intent-router.deterministic.rules",
          verificationSummary: "notepad process verification passed",
          steps: [
            {
              id: "step-1",
              taskId: "task-1",
              title: "Launch known local app: notepad",
              state: "completed",
              verificationStatus: "verified",
              completedAt: now
            }
          ],
          events: [
            {
              id: "event-1",
              taskId: "task-1",
              stepId: "step-1",
              type: "verification_completed",
              message: "Notepad launch verified.",
              createdAt: now
            }
          ]
        }
      ]
    });

    expect(snapshot.tasks[0]?.steps[0]?.verificationStatus).toBe("verified");
    expect(snapshot.tasks[0]?.routeSource).toBe(
      "intent-router.deterministic.rules"
    );
  });

  it("accepts plugin.invoke Brain results with sanitized plugin output", () => {
    const now = "2026-08-11T00:00:00.000Z";
    const result = BrainCommandResultSchema.parse({
      source: "text",
      text: "stock quote MSFT",
      routedAt: now,
      decision: {
        intent: "plugin.invoke",
        confidence: 0.89,
        requiresApproval: false,
        slots: {
          pluginId: "cn.jarvis-k.stock-analysis",
          capability: "stock.quote",
          input: {
            symbol: "MSFT"
          }
        },
        reason: "Matched a read-only plugin request."
      },
      plan: [
        { id: "intake", title: "Receive command", status: "completed" },
        {
          id: "route",
          title: "Route intent: plugin.invoke",
          status: "completed"
        },
        {
          id: "dispatch",
          title: "Dispatch bounded capability",
          status: "completed"
        }
      ],
      dispatchStatus: "completed",
      summary: "Plugin Runtime invoked stock.quote; sanitized output verified.",
      pluginResult: {
        requestId: "plugin-request-1",
        pluginId: "cn.jarvis-k.stock-analysis",
        capability: "stock.quote",
        status: "completed",
        resultCode: "PLUGIN_INVOKED",
        output: {
          summary: "Read-only sample quote returned for MSFT.",
          items: [
            {
              title: "MSFT",
              fields: [{ label: "Price", value: 128.42 }]
            }
          ]
        },
        invokedAt: now,
        completedAt: now,
        directActionAttempted: false,
        credentialExposed: false,
        rawPluginOutputPersisted: false
      }
    });

    expect(result.decision.intent).toBe("plugin.invoke");
    expect(result.pluginResult?.status).toBe("completed");
    expect(result.pluginResult?.directActionAttempted).toBe(false);
  });

  it("keeps phase one voice commands compatible", () => {
    const startPtt = createCommandEnvelope({
      type: "voice.startPtt",
      payload: {}
    });

    expect(CommandEnvelopeSchema.parse(startPtt).protocolVersion).toBe(
      PROTOCOL_VERSION
    );
    expect(CommandEnvelopeSchema.parse(startPtt).command.payload).toMatchObject({
      inputMode: "command",
      inputModeSource: "legacy_inferred"
    });
    expect(
      CommandEnvelopeSchema.parse(
        createCommandEnvelope({
          type: "voice.startPtt",
          payload: {
            inputMode: "conversation",
            inputModeSource: "explicit_ui"
          }
        })
      ).command.payload
    ).toMatchObject({
      inputMode: "conversation",
      inputModeSource: "explicit_ui"
    });
  });

  it("accepts default-off Chat Answer product mode status", () => {
    const status = ChatAnswerProductModeStatusSchema.parse({
      enabled: false,
      providerId: "chat-answer.openai-compatible.deepseek",
      profileId: "deepseek.v4-flash.compact_json_object_256",
      status: "disabled",
      secureStorageAvailable: true,
      credentialConfigured: false,
      credentialExposed: false,
      realProviderRuntimeEnabled: false,
      networkAccessApproved: false,
      defaultBehaviorChanged: false,
      fallbackPreserved: true,
      reasonCodes: ["CHAT_ANSWER_PRODUCT_MODE_DISABLED"]
    });

    expect(status.realProviderRuntimeEnabled).toBe(false);
    expect(status.networkAccessApproved).toBe(false);
    expect(status.fallbackPreserved).toBe(true);
  });

  it("accepts default-off Command Router product mode status", () => {
    const status = CommandRouterProductModeStatusSchema.parse({
      enabled: false,
      providerId: "intent-router.deterministic.rules",
      mode: "production_rules",
      status: "disabled",
      fixtureOnly: false,
      directActionEnabled: false,
      realQwenRuntimeEnabled: false,
      networkAccessApproved: false,
      defaultBehaviorChanged: false,
      chatAnswerFallbackPreserved: true,
      qwenFastRouterBinding: {
        providerId: "intent-router.qwen3-0.6b",
        modelId: "Qwen/Qwen3-0.6B",
        status: "disabled",
        mode: "no_runtime_status_only",
        productRoutingEnabled: false,
        realRuntimeEnabled: false,
        runtimeAccessed: false,
        artifactAccessed: false,
        persistentCacheChanged: false,
        directActionAttempted: false,
        activation: createCommandRouterQwenProductRoutingActivationStatus({
          commandRouterProductModeEnabled: false,
          preparedPolicyReviewed: true,
          readinessEvidencePassed: true,
          noRuntimeProductBindingPresent: true,
          coreSelectionFallbackPreserved: true,
          commandRouterSafetyGatesPreserved: true,
          deterministicRulesActive: true
        }),
        conversationSurfaceProductRoute: {
          policyId: "qwen-conversation-surface.product-route.default-off.v1",
          status: "disabled",
          explicitOptInRequired: true,
          explicitOptInEnabled: false,
          activeRouteSource: "intent-router.deterministic.rules",
          fallbackRouteSource: "intent-router.deterministic.rules",
          qwenRouteSelectable: false,
          productRouteExecutionEnabled: false,
          directActionEnabled: false,
          browserUrlOpeningEnabled: false,
          vsCodeBlocked: true,
          allowlistTargets: ["notepad", "calculator"],
          persistentOptIn: {
            policyId:
              "qwen-conversation-surface.persistent-opt-in.default-off.v1",
            status: "disabled",
            localDeveloperOptInRequired: true,
            localDeveloperOptInEnabled: false,
            qwenRouteSelectableByDefault: false,
            productRouteExecutionEnabledByDefault: false,
            limitedProductSessionOnly: true,
            routeRequestLimit: 3,
            retainedSessionRequired: true,
            helperStartupAllowedByPolicyState: false,
            generationPortInvocationAllowedByPolicyState: false,
            activeRouteSource: "intent-router.deterministic.rules",
            fallbackRouteSource: "intent-router.deterministic.rules",
            rollbackRouteSource: "intent-router.deterministic.rules",
            defaultBehaviorChanged: false,
            releaseBehaviorChanged: false,
            reasonCodes: ["QWEN_CONVERSATION_PERSISTENT_OPT_IN_DISABLED"]
          },
          rollbackState: "not_needed",
          implementationPrepared: true,
          defaultBehaviorChanged: false,
          releaseBehaviorChanged: false,
          reasonCodes: ["QWEN_CONVERSATION_PRODUCT_ROUTE_DISABLED"]
        },
        gates: {
          explicitEnablementRequired: true,
          artifactDigestApprovalRequired: true,
          modelLifecycleReadinessRequired: true,
          runtimeGenerationPortReadinessRequired: true,
          selectionPolicyReadinessRequired: true,
          defaultOffPreserved: true,
          deterministicFallbackPreserved: true,
          singleEnvVarSufficient: false,
          normalCoreHostStartupInstantiatesQwen: false
        },
        reasonCodes: [
          "QWEN_FAST_ROUTER_PRODUCT_BINDING_DISABLED",
          "QWEN_FAST_ROUTER_NO_RUNTIME_STATUS_ONLY"
        ]
      },
      reasonCodes: ["COMMAND_ROUTER_PRODUCT_MODE_DISABLED"]
    });

    expect(status.fixtureOnly).toBe(false);
    expect(status.directActionEnabled).toBe(false);
    expect(status.realQwenRuntimeEnabled).toBe(false);
    expect(status.qwenFastRouterBinding.productRoutingEnabled).toBe(false);
    expect(status.qwenFastRouterBinding.activation.status).toBe("disabled");
    expect(
      status.qwenFastRouterBinding.conversationSurfaceProductRoute.status
    ).toBe("disabled");
    expect(
      status.qwenFastRouterBinding.conversationSurfaceProductRoute
        .activeRouteSource
    ).toBe("intent-router.deterministic.rules");
    expect(
      status.qwenFastRouterBinding.conversationSurfaceProductRoute
        .qwenRouteSelectable
    ).toBe(false);
    expect(
      status.qwenFastRouterBinding.conversationSurfaceProductRoute
        .persistentOptIn.localDeveloperOptInRequired
    ).toBe(true);
    expect(
      status.qwenFastRouterBinding.conversationSurfaceProductRoute
        .persistentOptIn.qwenRouteSelectableByDefault
    ).toBe(false);
    expect(
      status.qwenFastRouterBinding.conversationSurfaceProductRoute
        .persistentOptIn.productRouteExecutionEnabledByDefault
    ).toBe(false);
    expect(
      status.qwenFastRouterBinding.conversationSurfaceProductRoute
        .persistentOptIn.limitedProductSessionOnly
    ).toBe(true);
    expect(
      status.qwenFastRouterBinding.conversationSurfaceProductRoute
        .persistentOptIn.activeRouteSource
    ).toBe("intent-router.deterministic.rules");
    expect(() =>
      CommandRouterProductModeStatusSchema.parse({
        ...status,
        providerId: "intent-router.deterministic.fixture"
      })
    ).toThrow();
    expect(() =>
      CommandRouterProductModeStatusSchema.parse({
        ...status,
        mode: "fixture_only"
      })
    ).toThrow();
    expect(() =>
      CommandRouterProductModeStatusSchema.parse({
        ...status,
        fixtureOnly: true
      })
    ).toThrow();
    expect(() =>
      CommandRouterProductModeStatusSchema.parse({
        ...status,
        qwenFastRouterBinding: {
          ...status.qwenFastRouterBinding,
          conversationSurfaceProductRoute: {
            ...status.qwenFastRouterBinding.conversationSurfaceProductRoute,
            persistentOptIn: {
              ...status.qwenFastRouterBinding.conversationSurfaceProductRoute
                .persistentOptIn,
              localDeveloperOptInEnabled: true
            }
          }
        }
      })
    ).toThrow();
    expect(() =>
      CommandRouterProductModeStatusSchema.parse({
        ...status,
        qwenFastRouterBinding: {
          ...status.qwenFastRouterBinding,
          conversationSurfaceProductRoute: {
            ...status.qwenFastRouterBinding.conversationSurfaceProductRoute,
            persistentOptIn: {
              ...status.qwenFastRouterBinding.conversationSurfaceProductRoute
                .persistentOptIn,
              helperStartupAllowedByPolicyState: true
            }
          }
        }
      })
    ).toThrow();
    expect(() =>
      CommandRouterProductModeStatusSchema.parse({
        ...status,
        qwenFastRouterBinding: {
          ...status.qwenFastRouterBinding,
          conversationSurfaceProductRoute: {
            ...status.qwenFastRouterBinding.conversationSurfaceProductRoute,
            persistentOptIn: {
              ...status.qwenFastRouterBinding.conversationSurfaceProductRoute
                .persistentOptIn,
              routeRequestLimit: 5
            }
          }
        }
      })
    ).toThrow();
    expect(
      status.qwenFastRouterBinding.activation.supportedStates
    ).toContain("active");
    expect(
      status.qwenFastRouterBinding.activation.gates.runtimeRetentionApproved
    ).toBe(false);
    expect(status.qwenFastRouterBinding.realRuntimeEnabled).toBe(false);
    expect(status.qwenFastRouterBinding.runtimeAccessed).toBe(false);
    expect(
      status.qwenFastRouterBinding.gates.normalCoreHostStartupInstantiatesQwen
    ).toBe(false);
    expect(status.chatAnswerFallbackPreserved).toBe(true);
  });

  it("evaluates Qwen product-routing activation states without runtime authority", () => {
    const ready = createCommandRouterQwenProductRoutingActivationStatus({
      commandRouterProductModeEnabled: true,
      preparedPolicyReviewed: true,
      readinessEvidencePassed: true,
      noRuntimeProductBindingPresent: true,
      coreSelectionFallbackPreserved: true,
      commandRouterSafetyGatesPreserved: true,
      deterministicRulesActive: true
    });
    const fallback = createCommandRouterQwenProductRoutingActivationStatus({
      ...ready.gates,
      commandRouterProductModeEnabled: true,
      rollbackRequested: true
    });
    const degraded = createCommandRouterQwenProductRoutingActivationStatus({
      ...ready.gates,
      commandRouterProductModeEnabled: true,
      degraded: true
    });
    const blocked = createCommandRouterQwenProductRoutingActivationStatus({
      ...ready.gates,
      commandRouterProductModeEnabled: true,
      blocked: true
    });
    const armed = createCommandRouterQwenProductRoutingActivationStatus({
      commandRouterProductModeEnabled: true,
      preparedPolicyReviewed: true,
      readinessEvidencePassed: true,
      noRuntimeProductBindingPresent: true,
      coreSelectionFallbackPreserved: true,
      commandRouterSafetyGatesPreserved: true,
      deterministicRulesActive: true,
      armingWindowApproved: true,
      runtimeRetentionApproved: true,
      manualAcceptanceApproved: true,
      helperStartupAllowed: true,
      artifactMaterializationAllowed: true,
      generationPortInvocationAllowed: true,
      productRoutingArmed: true
    });
    const active = createCommandRouterQwenProductRoutingActivationStatus({
      commandRouterProductModeEnabled: true,
      preparedPolicyReviewed: true,
      readinessEvidencePassed: true,
      noRuntimeProductBindingPresent: true,
      coreSelectionFallbackPreserved: true,
      commandRouterSafetyGatesPreserved: true,
      deterministicRulesActive: true,
      armingWindowApproved: true,
      runtimeRetentionApproved: true,
      manualAcceptanceApproved: true,
      helperStartupAllowed: true,
      artifactMaterializationAllowed: true,
      generationPortInvocationAllowed: true,
      productRoutingArmed: true,
      persistentEnablementApproved: true,
      explicitOptInEnabled: true,
      productRoutingEnabled: true,
      realQwenRuntimeEnabled: true,
      runtimeAccessed: true,
      artifactAccessed: true,
      helperStarted: true,
      generationPortInvoked: true,
      deterministicRulesRollbackReady: true
    });

    expect(ready.status).toBe("ready");
    expect(ready.supportedStates).toEqual([
      "disabled",
      "ready",
      "armed",
      "active",
      "fallback",
      "degraded",
      "blocked"
    ]);
    expect(fallback.status).toBe("fallback");
    expect(fallback.rollbackState).toBe("completed");
    expect(fallback.productRoutingEnabled).toBe(false);
    expect(fallback.realRuntimeEnabled).toBe(false);
    expect(fallback.activeRouteSource).toBe(
      "intent-router.deterministic.rules"
    );
    expect(degraded.status).toBe("degraded");
    expect(blocked.status).toBe("blocked");
    expect(armed.status).toBe("armed");
    expect(armed.productRoutingEnabled).toBe(false);
    expect(armed.activeRouteSource).toBe("intent-router.deterministic.rules");
    expect(armed.gates.productRoutingArmed).toBe(true);
    expect(armed.gates.uiIpcRuntimeControlAllowed).toBe(false);
    expect(active.status).toBe("active");
    expect(active.productRoutingEnabled).toBe(true);
    expect(active.realRuntimeEnabled).toBe(true);
    expect(active.activeRouteSource).toBe("intent-router.qwen3-0.6b");
    expect(active.fallbackRouteSource).toBe(
      "intent-router.deterministic.rules"
    );
    expect(active.gates.explicitOptInEnabled).toBe(true);
    expect(active.gates.deterministicRulesRollbackReady).toBe(true);
    expect(active.gates.uiIpcRuntimeControlAllowed).toBe(false);
    for (const status of [ready, fallback, degraded, blocked]) {
      expect(status.productRoutingEnabled).toBe(false);
      expect(status.realRuntimeEnabled).toBe(false);
      expect(status.helperStarted).toBe(false);
      expect(status.generationPortInvoked).toBe(false);
      expect(status.gates.runtimeRetentionApproved).toBe(false);
      expect(status.gates.manualAcceptanceApproved).toBe(false);
      expect(status.gates.productRoutingArmed).toBe(false);
    }
  });

  it("accepts default-off Qwen runtime control status without runtime authority", () => {
    const status = QwenRuntimeControlStatusSchema.parse({
      mode: "developer_alpha_local",
      status: "disabled",
      retainedSessionId: "qwen-retained-product-session-2026-08-10",
      retainedSessionAvailable: true,
      explicitOptInRequired: true,
      explicitOptInEnabled: false,
      activeRouteSource: "intent-router.deterministic.rules",
      fallbackRouteSource: "intent-router.deterministic.rules",
      helperLifecycle: "stopped",
      helperStartCount: 0,
      generationPortReadinessProbeCount: 0,
      routeRequestCount: 0,
      helperShutdownVerified: true,
      routeRequestLimit: 3,
      controls: {
        start: "available",
        stop: "blocked",
        rollback: "available"
      },
      directActionEnabled: false,
      browserUrlOpeningEnabled: false,
      vsCodeBlocked: true,
      allowlistTargets: ["notepad", "calculator"],
      defaultBehaviorChanged: false,
      releaseBehaviorChanged: false,
      telemetryChanged: false,
      activation: createCommandRouterQwenProductRoutingActivationStatus({
        commandRouterProductModeEnabled: true,
        preparedPolicyReviewed: true,
        readinessEvidencePassed: true,
        noRuntimeProductBindingPresent: true,
        coreSelectionFallbackPreserved: true,
        commandRouterSafetyGatesPreserved: true,
        deterministicRulesActive: true,
        persistentEnablementApproved: true,
        deterministicRulesRollbackReady: true
      }),
      reasonCodes: ["QWEN_RUNTIME_CONTROL_DEFAULT_OFF"]
    });

    const result = QwenRuntimeControlSetResultSchema.parse({
      ok: true,
      action: "start",
      status: {
        ...status,
        status: "prepared",
        explicitOptInEnabled: true,
        helperLifecycle: "start_prepared",
        helperStartCount: 1,
        generationPortReadinessProbeCount: 1,
        routeRequestCount: 3,
        helperShutdownVerified: false,
        controls: {
          start: "available",
          stop: "available",
          rollback: "available"
        },
        reasonCodes: ["QWEN_RUNTIME_CONTROL_START_PREPARED"]
      }
    });

    expect(result.status.activeRouteSource).toBe(
      "intent-router.deterministic.rules"
    );
    expect(result.status.directActionEnabled).toBe(false);
    expect(result.status.browserUrlOpeningEnabled).toBe(false);
    expect(result.status.vsCodeBlocked).toBe(true);
    expect(result.status.allowlistTargets).toEqual(["notepad", "calculator"]);
  });

  it("accepts the bounded extended Qwen runtime control route limit", () => {
    const status = QwenRuntimeControlStatusSchema.parse({
      mode: "developer_alpha_local",
      status: "active",
      retainedSessionId: "qwen-retained-product-session-2026-08-10",
      retainedSessionAvailable: true,
      explicitOptInRequired: true,
      explicitOptInEnabled: true,
      activeRouteSource: "intent-router.qwen3-0.6b",
      fallbackRouteSource: "intent-router.deterministic.rules",
      helperLifecycle: "running",
      helperStartCount: 1,
      generationPortReadinessProbeCount: 1,
      routeRequestCount: 10,
      helperShutdownVerified: false,
      routeRequestLimit: 10,
      controls: {
        start: "blocked",
        stop: "available",
        rollback: "available"
      },
      directActionEnabled: false,
      browserUrlOpeningEnabled: false,
      vsCodeBlocked: true,
      allowlistTargets: ["notepad", "calculator"],
      defaultBehaviorChanged: false,
      releaseBehaviorChanged: false,
      telemetryChanged: false,
      activation: createCommandRouterQwenProductRoutingActivationStatus({
        commandRouterProductModeEnabled: true,
        preparedPolicyReviewed: true,
        readinessEvidencePassed: true,
        noRuntimeProductBindingPresent: true,
        coreSelectionFallbackPreserved: true,
        commandRouterSafetyGatesPreserved: true,
        deterministicRulesActive: false,
        persistentEnablementApproved: true,
        deterministicRulesRollbackReady: true
      }),
      reasonCodes: ["QWEN_RUNTIME_CONTROL_ACCEPTANCE_ACTIVE"]
    });

    expect(status.routeRequestLimit).toBe(10);
    expect(status.routeRequestCount).toBe(10);
    expect(status.directActionEnabled).toBe(false);
    expect(status.browserUrlOpeningEnabled).toBe(false);
    expect(status.vsCodeBlocked).toBe(true);
  });

  it("rejects Qwen runtime control route limits above the bounded approval", () => {
    expect(() =>
      QwenRuntimeControlStatusSchema.parse({
        mode: "developer_alpha_local",
        status: "active",
        retainedSessionId: "qwen-retained-product-session-2026-08-10",
        retainedSessionAvailable: true,
        explicitOptInRequired: true,
        explicitOptInEnabled: true,
        activeRouteSource: "intent-router.qwen3-0.6b",
        fallbackRouteSource: "intent-router.deterministic.rules",
        helperLifecycle: "running",
        helperStartCount: 1,
        generationPortReadinessProbeCount: 1,
        routeRequestCount: 11,
        helperShutdownVerified: false,
        routeRequestLimit: 11,
        controls: {
          start: "blocked",
          stop: "available",
          rollback: "available"
        },
        directActionEnabled: false,
        browserUrlOpeningEnabled: false,
        vsCodeBlocked: true,
        allowlistTargets: ["notepad", "calculator"],
        defaultBehaviorChanged: false,
        releaseBehaviorChanged: false,
        telemetryChanged: false,
        activation: createCommandRouterQwenProductRoutingActivationStatus({
          commandRouterProductModeEnabled: true,
          preparedPolicyReviewed: true,
          readinessEvidencePassed: true,
          noRuntimeProductBindingPresent: true,
          coreSelectionFallbackPreserved: true,
          commandRouterSafetyGatesPreserved: true,
          deterministicRulesActive: false,
          persistentEnablementApproved: true,
          deterministicRulesRollbackReady: true
        }),
        reasonCodes: ["QWEN_RUNTIME_CONTROL_ACCEPTANCE_ACTIVE"]
      })
    ).toThrow();
  });

  it("accepts provider-neutral conversation commands", () => {
    const list = createCommandEnvelope({
      type: "agent.listConversations",
      payload: { limit: 50 }
    });
    const rename = createCommandEnvelope({
      type: "agent.renameConversation",
      payload: {
        conversationId: "primary",
        title: "Planning"
      }
    });
    const sendToActive = createCommandEnvelope({
      type: "agent.sendMessage",
      payload: {
        text: "Use the active conversation"
      }
    });

    expect(CommandEnvelopeSchema.parse(list).command.type).toBe(
      "agent.listConversations"
    );
    expect(CommandEnvelopeSchema.parse(rename).command.type).toBe(
      "agent.renameConversation"
    );
    expect(CommandEnvelopeSchema.parse(sendToActive).command.type).toBe(
      "agent.sendMessage"
    );
  });

  it("accepts Brain Alpha command routing contracts", () => {
    const command = createCommandEnvelope({
      type: "agent.runBrainCommand",
      payload: {
        source: "text",
        text: "打开 GitHub"
      }
    });
    const result = BrainCommandResultSchema.parse({
      source: "text",
      text: "打开 GitHub",
      routedAt: "2026-08-06T00:00:00.000Z",
      decision: {
        intent: "browser.open",
        confidence: 0.88,
        requiresApproval: true,
        slots: {
          target: "GitHub"
        },
        reason: "Matched a web-open request."
      },
      routerSelection: {
        selectedProviderId: "intent-router.qwen3-0.6b",
        fallbackProviderId: "brain.rules",
        status: "fallback",
        reasonCode: "CONFIDENCE_LOW",
        failureClass: "CONFIDENCE_LOW",
        confidenceBand: "low",
        usedRulesFallback: true,
        directActionAttempted: false
      },
      plan: [
        {
          id: "intake",
          title: "Receive command",
          status: "completed"
        },
        {
          id: "dispatch",
          title: "Dispatch bounded capability",
          status: "blocked"
        }
      ],
      plannerSelection: {
        providerId: "heavy-planner.fixture",
        fallbackProviderId: "brain.rules",
        status: "not_needed",
        reasonCode: "PLANNER_NOT_NEEDED",
        failureClass: "PLANNER_NOT_NEEDED",
        usedPlanner: false,
        usedRulesFallback: true,
        directActionAttempted: false
      },
      dispatchStatus: "needs_approval",
      summary: "Browser execution is approval-gated."
    });

    expect(CommandEnvelopeSchema.parse(command).command.type).toBe(
      "agent.runBrainCommand"
    );
    expect(result.decision.intent).toBe("browser.open");
    expect(result.decision.requiresApproval).toBe(true);
    expect(result.routerSelection?.directActionAttempted).toBe(false);
    expect(result.plannerSelection?.directActionAttempted).toBe(false);
    expect(
      BrainCommandResultSchema.parse({
        ...result,
        toolProductLoop: {
          mode: "fixture_replay",
          registryVersion: "1.0.0",
          descriptors: [
            {
              id: "browser.open",
              version: "1.0.0",
              label: "Browser",
              risk: "mutating",
              execution: "fixture",
              requiresConfirmation: true,
              permissionCount: 0
            }
          ],
          selectedToolId: "browser.open",
          routeReasonCode: "PROVIDER_ACCEPTED",
          safety: {
            requestId: "request-1",
            toolId: "browser.open",
            status: "needs_confirmation",
            allowed: false,
            confirmationRequired: true,
            reasonCode: "CONFIRMATION_REQUIRED",
            audit: {
              policyVersion: "1.0.0",
              requestId: "request-1",
              toolId: "browser.open",
              decision: "needs_confirmation",
              reasonCode: "CONFIRMATION_REQUIRED",
              confirmationRequired: true,
              confirmationGranted: false,
              evaluatedAt: "2026-08-07T00:00:00.000Z"
            }
          },
          execution: {
            status: "needs_confirmation",
            resultCode: "CONFIRMATION_REQUIRED",
            failureClasses: ["CONFIRMATION_MISSING"],
            rollbackState: "not_required",
            cleanupState: "not_required"
          },
          lifecycle: [
            {
              stage: "received",
              status: "completed",
              label: "BrainCommand received"
            },
            {
              stage: "safety_checked",
              status: "needs_confirmation",
              label: "Safety policy evaluated",
              reasonCode: "CONFIRMATION_REQUIRED"
            }
          ],
          retryState: "not_available",
          rollbackState: "not_required",
          summary:
            "Selected browser.open; safety CONFIRMATION_REQUIRED; fixture result CONFIRMATION_REQUIRED.",
          persisted: false,
          rawDiagnosticsExposed: false,
          directActionAttempted: false
        }
      }).toolProductLoop?.directActionAttempted
    ).toBe(false);
    expect(() =>
      BrainCommandResultSchema.parse({
        ...result,
        routerSelection: {
          ...result.routerSelection,
          directActionAttempted: true
        }
      })
    ).toThrow();
    expect(() =>
      BrainCommandResultSchema.parse({
        ...result,
        toolProductLoop: {
          mode: "fixture_replay",
          registryVersion: "1.0.0",
          descriptors: [],
          routeReasonCode: "PROVIDER_ACCEPTED",
          lifecycle: [
            {
              stage: "received",
              status: "completed",
              label: "BrainCommand received"
            }
          ],
          retryState: "not_available",
          rollbackState: "not_started",
          summary: "Invalid product loop.",
          persisted: false,
          rawDiagnosticsExposed: false,
          directActionAttempted: true
        }
      })
    ).toThrow();
  });

  it("carries voice ASR provider identity through safe command contracts", () => {
    const credentialLikeProviderId = [
      "https",
      "://asr.example.test/path?api_",
      "key=fake",
    ].join("");
    const command = CommandEnvelopeSchema.parse(
      createCommandEnvelope({
        type: "agent.runBrainCommand",
        payload: {
          source: "voice",
          text: "打开记事本",
          asrProviderId: "xunfei"
        }
      })
    );

    expect(command.command).toMatchObject({
      type: "agent.runBrainCommand",
      payload: {
        source: "voice",
        asrProviderId: "xunfei"
      }
    });
    expect(
      CommandEnvelopeSchema.safeParse({
        protocolVersion: PROTOCOL_VERSION,
        id: "command-invalid-provider",
        correlationId: "correlation-invalid-provider",
        issuedAt: "2026-08-16T00:00:00.000Z",
        command: {
          type: "agent.runBrainCommand",
          payload: {
            source: "voice",
            text: "打开记事本",
            asrProviderId: credentialLikeProviderId
          }
        }
      }).success
    ).toBe(false);
  });

  it("normalizes legacy voice transcripts to unknown provider identity", () => {
    expect(
      VoiceTranscriptSchema.parse({
        sessionId: "voice-session",
        text: "打开记事本",
        isFinal: true,
        updatedAt: "2026-08-16T00:00:00.000Z"
      })
    ).toMatchObject({
      providerId: "unknown"
    });
    expect(
      VoiceTranscriptSchema.parse({
        sessionId: "voice-session",
        text: "打开记事本",
        isFinal: true,
        providerId: "volcengine",
        updatedAt: "2026-08-16T00:00:00.000Z"
      })
    ).toMatchObject({
      providerId: "volcengine"
    });
    expect(
      VoiceTranscriptSchema.safeParse({
        sessionId: "voice-session",
        text: "打开记事本",
        isFinal: true,
        providerId: "bearer-secret",
        updatedAt: "2026-08-16T00:00:00.000Z"
      }).success
    ).toBe(false);
  });

  it("preserves explicit voice input mode provenance in contracts", () => {
    expect(
      VoiceTranscriptSchema.parse({
        sessionId: "voice-session",
        text: "open VS Code",
        isFinal: true,
        providerId: "xunfei",
        inputMode: "conversation",
        inputModeSource: "explicit_ui",
        updatedAt: "2026-08-16T00:00:00.000Z"
      })
    ).toMatchObject({
      providerId: "xunfei",
      inputMode: "conversation",
      inputModeSource: "explicit_ui"
    });
    expect(
      VoiceTranscriptSchema.parse({
        sessionId: "voice-session",
        text: "open VS Code",
        isFinal: true,
        updatedAt: "2026-08-16T00:00:00.000Z"
      })
    ).toMatchObject({
      inputMode: "command",
      inputModeSource: "legacy_inferred"
    });
    expect(
      CommandEnvelopeSchema.parse(
        createCommandEnvelope({
          type: "agent.runBrainCommand",
          payload: {
            source: "voice",
            text: "open VS Code",
            voiceInputMode: "command",
            voiceInputModeSource: "explicit_ui",
            asrProviderId: "xunfei"
          }
        })
      ).command.payload
    ).toMatchObject({
      voiceInputMode: "command",
      voiceInputModeSource: "explicit_ui"
    });
    expect(() =>
      createCommandEnvelope({
        type: "agent.runBrainCommand",
        payload: {
          source: "voice",
          text: "open VS Code",
          voiceInputMode: "command",
          voiceInputModeSource: "user-supplied-free-text",
          asrProviderId: "xunfei"
        }
      })
    ).toThrow();
  });

  it("keeps voice regression provider IDs fixed and non-sensitive", () => {
    const credentialLikeProviderId = [
      "xunfei:https",
      "://endpoint.example.test?key=",
      "fake",
    ].join("");
    const base = {
      id: "voice-regression-sample-1",
      schemaVersion: 1,
      createdAt: "2026-08-16T00:00:00.000Z",
      consentLevel: "local_text",
      locale: "zh-CN",
      mode: "command",
      asr: {
        rawTranscript: "打开记事本",
        isFinal: true
      },
      resolver: {
        version: "voice-command-resolver.deterministic.v1",
        normalizedText: "打开记事本",
        outcomeClass: "candidate",
        candidates: [],
        clarificationRequired: false,
        blocked: false,
        latencyMs: 1
      },
      context: {},
      privacy: {
        redactions: [],
        containsAudio: false,
        uploadAllowed: false
      }
    } as const;

    expect(VoiceRegressionSampleSchema.parse(base).asr.providerId).toBe(
      "unknown"
    );
    expect(VoiceRegressionSampleSchema.parse(base).modeSource).toBe(
      "legacy_inferred"
    );
    expect(
      VoiceRegressionSampleSchema.parse({
        ...base,
        modeSource: "explicit_ui"
      }).modeSource
    ).toBe("explicit_ui");
    expect(
      VoiceRegressionSampleSchema.parse({
        ...base,
        asr: { ...base.asr, providerId: "fixture-asr" }
      }).asr.providerId
    ).toBe("fixture-asr");
    expect(
      VoiceRegressionSampleSchema.safeParse({
        ...base,
        asr: {
          ...base.asr,
          providerId: credentialLikeProviderId
        }
      }).success
    ).toBe(false);
  });

  it("separates new voice regression transcript and resolution feedback from legacy combined feedback", () => {
    const dual = VoiceRegressionDualFeedbackSchema.parse({
      kind: "dual_layer",
      transcript: { status: "corrected", correctedText: "打开记事本" },
      resolution: {
        status: "wrong_intent",
        intendedIntent: "localApp.open",
      },
    });
    expect(dual).toMatchObject({
      kind: "dual_layer",
      transcript: { status: "corrected" },
      resolution: { status: "wrong_intent" },
    });
    expect(
      VoiceRegressionDualFeedbackSchema.safeParse({
        kind: "dual_layer",
        transcript: { status: "accepted" },
        resolution: { status: "unreviewed" },
      }).success
    ).toBe(false);
    expect(
      VoiceRegressionDualFeedbackSchema.safeParse({
        kind: "dual_layer",
        transcript: { status: "corrected" },
        resolution: { status: "accepted" },
      }).success
    ).toBe(false);

    const legacyRecord = VoiceRegressionRecordSchema.parse({
      ...voiceRegressionSampleFixture(),
      feedback: {
        status: "accepted",
        selectedCandidateIndex: 0,
      },
    });
    expect(legacyRecord.feedback).toMatchObject({
      kind: "legacy_combined",
      status: "accepted",
    });
    expect(legacyRecord.feedback).not.toHaveProperty("transcript");
  });

  it("requires dual voice regression feedback in new save and update commands", () => {
    expect(
      AgentCommandSchema.safeParse({
        type: "agent.saveVoiceRegressionPendingSample",
        payload: {
          sampleId: "sample-1",
          status: "accepted",
        },
      }).success
    ).toBe(false);
    expect(
      AgentCommandSchema.safeParse({
        type: "agent.saveVoiceRegressionPendingSample",
        payload: {
          sampleId: "sample-1",
          feedback: {
            kind: "dual_layer",
            transcript: { status: "accepted" },
            resolution: { status: "accepted", selectedCandidateIndex: 0 },
          },
        },
      }).success
    ).toBe(true);
    expect(
      AgentCommandSchema.safeParse({
        type: "agent.submitVoiceRegressionFeedback",
        payload: {
          recordId: "record-1",
          feedback: {
            kind: "dual_layer",
            transcript: { status: "rejected" },
            resolution: { status: "not_applicable" },
          },
        },
      }).success
    ).toBe(true);
  });

  it("accepts bounded Stage 5 session-hardening contracts", () => {
    const clearHistory = createCommandEnvelope({
      type: "agent.clearSessionHistory",
      payload: {}
    });
    const result = BrainCommandResultSchema.parse({
      source: "text",
      text: "Check the current status.",
      routedAt: "2026-08-08T00:00:00.000Z",
      decision: {
        intent: "observability.status",
        confidence: 0.9,
        requiresApproval: false,
        slots: {},
        reason: "Fixture status request."
      },
      plan: [
        {
          id: "intake",
          title: "Receive command",
          status: "completed"
        }
      ],
      dispatchStatus: "completed",
      summary: "Bounded status result.",
      alphaHardening: {
        schemaVersion: "1.0.0",
        sessionEntryId: "session-entry-1",
        memoryContext: {
          status: "not_requested",
          mode: "unknown",
          matchCount: 0,
          queryDimensions: 0,
          readOnly: true,
          rawContentExposed: false
        },
        retry: {
          status: "not_available",
          attemptCount: 0,
          safetyPathReentered: true,
          reasonCode: "RETRY_NOT_REQUIRED"
        },
        rollback: {
          status: "not_available",
          safetyPreserved: true,
          reasonCode: "ROLLBACK_NOT_REQUIRED"
        },
        tts: {
          status: "eligible",
          localOnly: true,
          defaultOff: true,
          boundedText: true,
          rawTextPersisted: false
        },
        persisted: false,
        rawDiagnosticsExposed: false,
        directActionAttempted: false,
        memoryWriteAttempted: false
      }
    });

    expect(CommandEnvelopeSchema.parse(clearHistory).command.type).toBe(
      "agent.clearSessionHistory"
    );
    expect(result.alphaHardening).toMatchObject({
      persisted: false,
      rawDiagnosticsExposed: false,
      directActionAttempted: false,
      memoryWriteAttempted: false
    });
    expect(() =>
      BrainCommandResultSchema.parse({
        ...result,
        alphaHardening: {
          ...result.alphaHardening!,
          memoryContext: {
            ...result.alphaHardening!.memoryContext,
            rawContentExposed: true
          }
        }
      })
    ).toThrow();
  });

  it("accepts bounded Heavy Planner fallback contracts", () => {
    const plan = BrainPlanSchema.parse({
      summary: "Prepare a fixture-only plan.",
      risk: "medium",
      requiresConfirmation: true,
      steps: [
        {
          id: "step-1",
          toolId: "memory.search",
          title: "Search bounded Memory context",
          args: {},
          risk: "medium",
          requiresConfirmation: true,
          directActionAttempted: false
        }
      ],
      directActionAttempted: false
    });
    const result = BrainPlannerResultSchema.parse({
      providerId: "heavy-planner.fixture",
      status: "planned",
      reasonCode: "COMPLEX_REQUEST",
      failureClass: "none",
      plan,
      directActionAttempted: false,
      plannedAt: "2026-08-07T00:00:00.000Z"
    });
    const configuration =
      BrainPlannerProviderConfigurationReportSchema.parse({
        providerId: "heavy-planner.fixture",
        status: "configured",
        credentialConfigured: false,
        credentialExposed: false,
        networkAccessApproved: false,
        reasons: ["Fixture-only planner; no real API."]
      });

    expect(result.plan?.requiresConfirmation).toBe(true);
    expect(result.directActionAttempted).toBe(false);
    expect(configuration.credentialExposed).toBe(false);
    expect(configuration.networkAccessApproved).toBe(false);
    expect(() =>
      BrainPlanSchema.parse({
        ...plan,
        steps: [
          {
            ...plan.steps[0],
            requiresConfirmation: false
          }
        ]
      })
    ).toThrow("require confirmation");
    expect(() =>
      BrainPlannerResultSchema.parse({
        ...result,
        directActionAttempted: true
      })
    ).toThrow();
  });

  it("accepts voice-sourced Brain Alpha commands", () => {
    const command = createCommandEnvelope({
      type: "agent.runBrainCommand",
      payload: {
        source: "voice",
        text: "检查当前状态"
      }
    });

    expect(CommandEnvelopeSchema.parse(command).command).toMatchObject({
      type: "agent.runBrainCommand",
      payload: {
        source: "voice"
      }
    });
  });

  it("accepts provider-neutral memory snapshot commands", () => {
    const exported = createCommandEnvelope({
      type: "agent.exportMemorySnapshot",
      payload: {}
    });
    const imported = createCommandEnvelope({
      type: "agent.importMemorySnapshot",
      payload: {
        snapshot: MemorySnapshotSchema.parse({
          messages: [],
          activeConversationId: "primary"
        })
      }
    });

    expect(CommandEnvelopeSchema.parse(exported).command.type).toBe(
      "agent.exportMemorySnapshot"
    );
    expect(CommandEnvelopeSchema.parse(imported).command.type).toBe(
      "agent.importMemorySnapshot"
    );
    expect(
      CommandEnvelopeSchema.parse(imported).command.payload.snapshot
    ).toMatchObject({
      messages: [],
      conversations: [],
      summaries: [],
      activeConversationId: "primary"
    });
  });

  it("accepts bounded Memory alpha product spine commands and snapshots", () => {
    const status = createCommandEnvelope({
      type: "agent.getMemoryAlphaStatus",
      payload: {}
    });
    const probe = createCommandEnvelope({
      type: "agent.probeMemoryAlphaRecall",
      payload: {
        text: "Probe only sanitized recall metadata."
      }
    });
    const disable = createCommandEnvelope({
      type: "agent.disableMemoryAlpha",
      payload: {}
    });
    const snapshot = CoreSnapshotSchema.parse({
      protocolVersion: 1,
      coreInstanceId: "core-test",
      sequenceId: 1,
      health: "ready",
      startedAt: "2026-08-06T00:00:00.000Z",
      updatedAt: "2026-08-06T00:00:01.000Z",
      voice: {
        state: "idle",
        mode: "disabled"
      },
      messages: [],
      conversations: [],
      memoryAlpha: {
        state: "disabled",
        enabled: false,
        retentionScope: "new_accepted_user_messages",
        maxMessageCount: 5,
        trackedMessageCount: 0,
        rollbackStatus: "not_started",
        rollbackDeletedCount: 0,
        reasonCodes: ["memory_alpha_opt_in_missing"]
      },
      tasks: []
    });

    expect(CommandEnvelopeSchema.parse(status).command.type).toBe(
      "agent.getMemoryAlphaStatus"
    );
    expect(CommandEnvelopeSchema.parse(probe).command.type).toBe(
      "agent.probeMemoryAlphaRecall"
    );
    expect(CommandEnvelopeSchema.parse(disable).command.type).toBe(
      "agent.disableMemoryAlpha"
    );
    expect(snapshot.memoryAlpha).toMatchObject({
      state: "disabled",
      enabled: false,
      reasonCodes: ["memory_alpha_opt_in_missing"]
    });
  });

  it("accepts provider-neutral capability commands and snapshots", () => {
    const command = createCommandEnvelope({
      type: "agent.getCapabilities",
      payload: {}
    });
    const snapshot = CapabilitySnapshotSchema.parse({
      checkedAt: "2026-07-31T00:00:00.000Z",
      runtimeMode: "standard",
      device: {
        checkedAt: "2026-07-31T00:00:00.000Z",
        platform: "win32",
        arch: "x64",
        cpuLogicalCores: 16,
        totalMemoryBytes: 16 * 1024 * 1024 * 1024,
        availableMemoryBytes: 8 * 1024 * 1024 * 1024,
        gpus: [],
        accelerationBackends: ["cpu", "directml"],
        recommendedMode: "standard",
        reasons: ["Test capability snapshot."]
      },
      providerPlan: [
        {
          capability: "speech_to_text",
          provider: "local_whisper",
          execution: "local",
          loadPolicy: "on_demand",
          reason: "Test provider selection."
        }
      ]
    });

    expect(CommandEnvelopeSchema.parse(command).command.type).toBe(
      "agent.getCapabilities"
    );
    expect(snapshot.modelInventory).toEqual([]);
  });

  it("accepts provider-neutral model governance commands", () => {
    const manifests = createCommandEnvelope({
      type: "agent.listModelManifests",
      payload: {
        capability: "speech_to_text"
      }
    });
    const inventory = createCommandEnvelope({
      type: "agent.listModelInventory",
      payload: {}
    });
    const runtimeAdapters = createCommandEnvelope({
      type: "agent.listModelRuntimeAdapters",
      payload: {}
    });
    const inferenceProviders = createCommandEnvelope({
      type: "agent.listInferenceProviders",
      payload: {
        capability: "embedding"
      }
    });
    const inferenceProviderRequirements = createCommandEnvelope({
      type: "agent.listInferenceProviderRequirements",
      payload: {
        capability: "embedding"
      }
    });
    const inferencePreflight = createCommandEnvelope({
      type: "agent.previewInferenceExecution",
      payload: {
        capability: "embedding",
        modelId: "jarvis-fixture/local-embedding-smoke"
      }
    });
    const embeddingGeneration = createCommandEnvelope({
      type: "agent.generateEmbeddings",
      payload: {
        modelId: "jarvis-fixture/local-embedding-smoke",
        inputs: [{ id: "input-1", text: "phase five fixture" }],
        dimensions: 8
      }
    });
    const intentRouting = createCommandEnvelope({
      type: "agent.routeIntent",
      payload: {
        modelId: "jarvis-fixture/local-intent-router-smoke",
        utterance: "search memory",
        context: {
          locale: "en",
          allowedIntents: ["memory.search"]
        }
      }
    });
    const ocrRecognition = createCommandEnvelope({
      type: "agent.recognizeOcr",
      payload: {
        modelId: "jarvis-fixture/local-ocr-smoke",
        image: {
          id: "fixture-image",
          mimeType: "image/png",
          bytes: new Uint8Array([137, 80, 78, 71]),
          width: 1,
          height: 1
        }
      }
    });
    const rerank = createCommandEnvelope({
      type: "agent.rerank",
      payload: {
        modelId: "jarvis-fixture/local-reranker-smoke",
        query: "model ports",
        documents: [
          {
            id: "doc-1",
            text: "Core uses injected model ports."
          }
        ],
        topK: 1
      }
    });
    const operations = createCommandEnvelope({
      type: "agent.listModelOperations",
      payload: {
        activeOnly: true,
        limit: 25
      }
    });
    const resources = createCommandEnvelope({
      type: "agent.getResourceDiagnostics",
      payload: {}
    });
    const candidates = createCommandEnvelope({
      type: "agent.listModelCandidates",
      payload: {
        capability: "ocr"
      }
    });
    const preview = createCommandEnvelope({
      type: "agent.previewModelInstallability",
      payload: {
        modelId: "vendor/local-stt-small",
        allowYellowRisk: true
      }
    });
    const prepareInstall = createCommandEnvelope({
      type: "agent.prepareModelInstall",
      payload: {
        modelId: "vendor/local-stt-small",
        exclusiveGpu: false
      }
    });
    const report = ModelInstallabilityReportSchema.parse({
      modelId: "vendor/local-stt-small",
      allowed: false,
      reasons: ["Model artifact must have a SHA-256 digest."],
      runtimeMode: "standard"
    });

    expect(CommandEnvelopeSchema.parse(manifests).command.type).toBe(
      "agent.listModelManifests"
    );
    expect(CommandEnvelopeSchema.parse(candidates).command.type).toBe(
      "agent.listModelCandidates"
    );
    expect(CommandEnvelopeSchema.parse(inventory).command.type).toBe(
      "agent.listModelInventory"
    );
    expect(CommandEnvelopeSchema.parse(runtimeAdapters).command.type).toBe(
      "agent.listModelRuntimeAdapters"
    );
    expect(CommandEnvelopeSchema.parse(inferenceProviders).command.type).toBe(
      "agent.listInferenceProviders"
    );
    expect(
      CommandEnvelopeSchema.parse(inferenceProviderRequirements).command.type
    ).toBe("agent.listInferenceProviderRequirements");
    expect(CommandEnvelopeSchema.parse(inferencePreflight).command.type).toBe(
      "agent.previewInferenceExecution"
    );
    expect(
      CommandEnvelopeSchema.parse(embeddingGeneration).command.type
    ).toBe("agent.generateEmbeddings");
    expect(CommandEnvelopeSchema.parse(intentRouting).command.type).toBe(
      "agent.routeIntent"
    );
    expect(CommandEnvelopeSchema.parse(ocrRecognition).command.type).toBe(
      "agent.recognizeOcr"
    );
    expect(CommandEnvelopeSchema.parse(rerank).command.type).toBe(
      "agent.rerank"
    );
    expect(CommandEnvelopeSchema.parse(operations).command.type).toBe(
      "agent.listModelOperations"
    );
    expect(CommandEnvelopeSchema.parse(resources).command.type).toBe(
      "agent.getResourceDiagnostics"
    );
    expect(CommandEnvelopeSchema.parse(preview).command.type).toBe(
      "agent.previewModelInstallability"
    );
    expect(CommandEnvelopeSchema.parse(prepareInstall).command.type).toBe(
      "agent.prepareModelInstall"
    );
    expect(report.allowed).toBe(false);
  });

  it("accepts provider-neutral model runtime adapter descriptors", () => {
    expect(
      ModelRuntimeAdapterDescriptorSchema.parse({
        runtime: "onnxruntime",
        capabilities: ["embedding"],
        accelerationBackends: ["cpu", "directml"],
        notes: ["Descriptor only; no provider details."]
      })
    ).toMatchObject({
      runtime: "onnxruntime",
      capabilities: ["embedding"]
    });
  });

  it("accepts provider-neutral inference provider descriptors", () => {
    expect(
      InferenceProviderDescriptorSchema.parse({
        capability: "embedding",
        provider: "embedding.unconfigured",
        status: "unconfigured",
        execution: "disabled",
        reasons: ["No embedding provider has been composed."]
      })
    ).toMatchObject({
      capability: "embedding",
      status: "unconfigured",
      modelIds: []
    });
  });

  it("accepts provider-neutral inference provider requirements", () => {
    expect(
      InferenceProviderConfigurationReportSchema.parse({
        capability: "embedding",
        provider: "embedding.unconfigured",
        status: "unconfigured",
        requirements: [
          {
            key: "runtime_adapter",
            source: "runtime",
            required: true,
            configured: false,
            description: "Embedding runtime adapter must be composed.",
            reasons: ["No embedding provider has been composed."]
          }
        ],
        reasons: ["Provider is not configured."]
      })
    ).toMatchObject({
      capability: "embedding",
      requirements: [
        {
          key: "runtime_adapter",
          configured: false
        }
      ]
    });
  });

  it("accepts provider-neutral inference preflight reports", () => {
    expect(
      InferencePreflightReportSchema.parse({
        capability: "embedding",
        modelId: "jarvis-fixture/local-embedding-smoke",
        allowed: false,
        providers: [
          {
            capability: "embedding",
            provider: "embedding.unconfigured",
            status: "unconfigured",
            execution: "disabled",
            modelIds: [],
            reasons: ["No embedding provider has been composed."]
          }
        ],
        reasons: ["No available inference provider is configured."]
      })
    ).toMatchObject({
      capability: "embedding",
      allowed: false
    });
  });

  it("accepts provider-neutral embedding generation results", () => {
    expect(
      EmbeddingGenerationResultSchema.parse({
        modelId: "jarvis-fixture/local-embedding-smoke",
        dimensions: 3,
        vectors: [
          {
            inputId: "input-1",
            values: [0.1, 0.2, 0.3]
          }
        ],
        generatedAt: "2026-07-31T00:00:00.000Z"
      })
    ).toMatchObject({
      dimensions: 3
    });
    expect(() =>
      EmbeddingGenerationResultSchema.parse({
        modelId: "jarvis-fixture/local-embedding-smoke",
        dimensions: 2,
        vectors: [
          {
            values: [0.1, 0.2, 0.3]
          }
        ],
        generatedAt: "2026-07-31T00:00:00.000Z"
      })
    ).toThrow("Embedding vector length");
  });

  it("accepts provider-neutral OCR requests and results", () => {
    expect(
      OcrRecognitionRequestSchema.parse({
        modelId: "jarvis-fixture/local-ocr-smoke",
        image: {
          id: "image-1",
          mimeType: "image/png",
          bytes: new Uint8Array([137, 80, 78, 71]),
          width: 640,
          height: 480
        },
        languages: ["zh", "en"]
      })
    ).toMatchObject({
      modelId: "jarvis-fixture/local-ocr-smoke"
    });
    expect(
      OcrRecognitionResultSchema.parse({
        modelId: "jarvis-fixture/local-ocr-smoke",
        imageId: "image-1",
        text: "Jarvis-K",
        blocks: [
          {
            text: "Jarvis-K",
            confidence: 0.99,
            boundingBox: {
              x: 0.1,
              y: 0.2,
              width: 0.3,
              height: 0.1
            }
          }
        ],
        recognizedAt: "2026-07-31T00:00:00.000Z"
      })
    ).toMatchObject({
      text: "Jarvis-K"
    });
    expect(() =>
      OcrBoundingBoxSchema.parse({
        x: 0.9,
        y: 0,
        width: 0.2,
        height: 0.1
      })
    ).toThrow("normalized image width");
  });

  it("accepts provider-neutral screen capture and vision contracts", () => {
    const captureRequest = ScreenCaptureRequestSchema.parse({
      captureId: "capture-1",
      displayId: "display-1",
      region: {
        x: 10,
        y: 20,
        width: 640,
        height: 480
      }
    });
    const captureResult = ScreenCaptureResultSchema.parse({
      captureId: captureRequest.captureId,
      image: {
        id: "screen-image-1",
        mimeType: "image/png",
        bytes: new Uint8Array([137, 80, 78, 71]),
        width: 640,
        height: 480
      },
      capturedAt: "2026-08-01T00:00:00.000Z",
      source: "fixture"
    });
    const visionRequest = VisionAnalysisRequestSchema.parse({
      modelId: "jarvis-fixture/local-vision-smoke",
      image: captureResult.image,
      tasks: ["describe", "detect_objects"],
      prompt: "Describe the visible fixture."
    });
    const visionResult = VisionAnalysisResultSchema.parse({
      modelId: visionRequest.modelId,
      imageId: "screen-image-1",
      summary: "fixture vision result",
      labels: [
        {
          label: "fixture-object",
          confidence: 0.99,
          boundingBox: {
            x: 0.1,
            y: 0.1,
            width: 0.8,
            height: 0.8
          }
        }
      ],
      analyzedAt: "2026-08-01T00:00:00.000Z"
    });

    expect(captureResult.source).toBe("fixture");
    expect(visionResult.labels).toHaveLength(1);
    expect(() =>
      ScreenCaptureRegionSchema.parse({
        x: 0,
        y: 0,
        width: 0,
        height: 100
      })
    ).toThrow();
    expect(() =>
      VisionAnalysisRequestSchema.parse({
        modelId: "jarvis-fixture/local-vision-smoke",
        image: captureResult.image,
        tasks: []
      })
    ).toThrow();
  });

  it("accepts provider-neutral intent routing requests and results", () => {
    expect(
      IntentRoutingRequestSchema.parse({
        modelId: "jarvis-fixture/local-intent-smoke",
        utterance: "open settings",
        context: {
          locale: "en",
          activeConversationId: "primary",
          allowedIntents: ["settings.open"]
        }
      })
    ).toMatchObject({
      utterance: "open settings"
    });
    expect(
      IntentRoutingResultSchema.parse({
        modelId: "jarvis-fixture/local-intent-smoke",
        utterance: "open settings",
        candidates: [
          {
            intent: "settings.open",
            confidence: 0.95,
            slots: {
              panel: "voice"
            },
            reasons: ["Matched local command phrase."]
          }
        ],
        routedAt: "2026-07-31T00:00:00.000Z"
      })
    ).toMatchObject({
      candidates: [
        {
          intent: "settings.open"
        }
      ]
    });
    expect(() =>
      IntentRoutingResultSchema.parse({
        modelId: "jarvis-fixture/local-intent-smoke",
        utterance: "open settings",
        candidates: [
          {
            intent: "settings.open",
            confidence: 1.1
          }
        ],
        routedAt: "2026-07-31T00:00:00.000Z"
      })
    ).toThrow();
  });

  it("accepts provider-neutral rerank requests and results", () => {
    expect(
      RerankRequestSchema.parse({
        modelId: "jarvis-fixture/local-reranker-smoke",
        query: "memory governance",
        documents: [
          {
            id: "doc-1",
            text: "Core uses injected model ports.",
            metadata: {
              source: "phase-4"
            }
          }
        ],
        topK: 1
      })
    ).toMatchObject({
      topK: 1
    });
    expect(
      RerankResultSchema.parse({
        modelId: "jarvis-fixture/local-reranker-smoke",
        query: "memory governance",
        results: [
          {
            documentId: "doc-1",
            score: 4.2,
            rank: 1
          }
        ],
        rankedAt: "2026-07-31T00:00:00.000Z"
      })
    ).toMatchObject({
      results: [
        {
          documentId: "doc-1"
        }
      ]
    });
    expect(() =>
      RerankRequestSchema.parse({
        modelId: "jarvis-fixture/local-reranker-smoke",
        query: "memory governance",
        documents: []
      })
    ).toThrow();
  });

  it("accepts provider-neutral model operation events", () => {
    const operation = ModelOperationSnapshotSchema.parse({
      operationId: "model-op-1",
      modelId: "vendor/local-stt-small",
      capability: "speech_to_text",
      phase: "executing",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:01.000Z",
      progress: {
        downloadedBytes: 128,
        totalBytes: 512
      }
    });

    expect(
      AppEventSchema.parse({
        type: "model.operation.updated",
        payload: operation
      })
    ).toMatchObject({
      type: "model.operation.updated",
      payload: {
        phase: "executing",
        reasons: []
      }
    });

    expect(
      ModelOperationSnapshotSchema.parse({
        operationId: "model-op-2",
        modelId: "jarvis-fixture/local-embedding-smoke",
        capability: "embedding",
        phase: "completed",
        createdAt: "2026-07-31T00:00:00.000Z",
        updatedAt: "2026-07-31T00:00:02.000Z",
        reasons: ["Embedding inference completed."]
      })
    ).toMatchObject({
      phase: "completed"
    });
  });

  it("accepts provider-neutral resource diagnostics", () => {
    expect(
      ResourceSchedulerDiagnosticsSchema.parse({
        checkedAt: "2026-07-31T00:00:00.000Z",
        totalMemoryBytes: 16,
        availableMemoryBytes: 8,
        leasedMemoryBytes: 4,
        totalVramBytes: 12,
        availableVramBytes: 10,
        leasedVramBytes: 2,
        activeLeaseCount: 1,
        exclusiveGpuLeaseActive: false
      })
    ).toMatchObject({
      availableMemoryBytes: 8,
      activeLeaseCount: 1
    });
  });

  it("validates provider-neutral audio frame metadata", () => {
    expect(
      VoiceAudioFrameMetadataSchema.parse({
        captureId: "capture-1",
        sequenceId: 4,
        capturedAt: new Date().toISOString(),
        sampleRate: 16_000,
        channels: 1,
        encoding: "pcm_s16le",
        byteLength: 4096
      }).byteLength
    ).toBe(4096);
  });

  it("validates binary PCM frames for the dedicated audio transport", () => {
    const pcm = new Uint8Array(640);
    const message = CoreVoiceAudioMessageSchema.parse({
      kind: "voice-audio",
      frame: {
        metadata: {
          captureId: "capture-1",
          sequenceId: 0,
          capturedAt: new Date().toISOString(),
          sampleRate: 16_000,
          channels: 1,
          encoding: "pcm_s16le",
          byteLength: pcm.byteLength
        },
        pcm
      }
    });

    expect(message.frame.pcm).toBe(pcm);
    expect(CoreInboundMessageSchema.parse(message).kind).toBe(
      "voice-audio"
    );
  });

  it("accepts explicit Command Router local app launch confirmation contracts", () => {
    const command = createCommandEnvelope({
      type: "agent.confirmCommandRouterLocalAppLaunch",
      payload: {
        target: "notepad",
        confirmation: "explicit_ui_confirmation"
      }
    });
    const result = CommandRouterLocalAppLaunchResultSchema.parse({
      status: "completed",
      target: "notepad",
      label: "notepad",
      reasonCode: "ALLOWLISTED_TARGET_OPENED",
      confirmationRequired: true,
      confirmationGranted: true,
      directActionAttempted: true,
      persisted: false,
      rawDiagnosticsExposed: false
    });

    expect(CommandEnvelopeSchema.parse(command).command).toEqual({
      type: "agent.confirmCommandRouterLocalAppLaunch",
      payload: {
        target: "notepad",
        confirmation: "explicit_ui_confirmation"
      }
    });
    expect(result).toMatchObject({
      status: "completed",
      target: "notepad",
      rawDiagnosticsExposed: false
    });
  });

  it("rejects binary audio whose byte length does not match metadata", () => {
    expect(() =>
      VoiceAudioFrameSchema.parse({
        metadata: {
          captureId: "capture-1",
          sequenceId: 0,
          capturedAt: new Date().toISOString(),
          sampleRate: 16_000,
          channels: 1,
          encoding: "pcm_s16le",
          byteLength: 640
        },
        pcm: new Uint8Array(320)
      })
    ).toThrow("byte length");
  });

  it("rejects provider details in diagnostic events", () => {
    expect(() =>
      AppEventSchema.parse({
        type: "voice.diagnostic",
        payload: {
          level: "warning",
          code: "ASR_RECONNECT_WAIT",
          attempt: 1,
          url: "provider-url-must-not-cross-the-contract"
        }
      })
    ).toThrow();
  });

  it("accepts provider-neutral voice barge-in events", () => {
    expect(
      AppEventSchema.parse({
        type: "voice.playback.interrupted",
        payload: {
          playbackId: "playback-1",
          reason: "barge-in"
        }
      })
    ).toEqual({
      type: "voice.playback.interrupted",
      payload: {
        playbackId: "playback-1",
        reason: "barge-in"
      }
    });
  });
});

function voiceRegressionSampleFixture() {
  return {
    id: "voice-regression-sample-1",
    schemaVersion: 1,
    createdAt: "2026-08-16T00:00:00.000Z",
    consentLevel: "local_text",
    locale: "zh-CN",
    mode: "command",
    modeSource: "explicit_ui",
    asr: {
      providerId: "fixture-asr",
      rawTranscript: "打开记事本",
      isFinal: true,
    },
    resolver: {
      version: "voice-command-resolver.deterministic.v1",
      normalizedText: "打开记事本",
      outcomeClass: "candidate",
      candidates: [
        {
          intent: "localApp.open",
          safeSlots: { target: "notepad" },
          confidence: 0.95,
          source: "slot_grammar",
        },
      ],
      clarificationRequired: false,
      blocked: false,
      latencyMs: 1,
    },
    context: {},
    privacy: {
      redactions: [],
      containsAudio: false,
      uploadAllowed: false,
    },
  } as const;
}
