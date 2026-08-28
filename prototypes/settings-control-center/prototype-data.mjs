export const locales = ["en", "zh-CN"];

export const productCategoryOrder = [
  "general",
  "appearance_pet",
  "voice_audio",
  "models_intelligence",
  "tools_plugins",
  "memory_privacy",
  "notifications",
  "about_updates",
];

export const developerCategoryId = "developer_evaluation";

export const categoryOrder = [...productCategoryOrder, developerCategoryId];

export const prototypeCopy = {
  en: {
    appTitle: "Jarvis Control Center",
    appSubtitle: "Personal desktop settings",
    search: "Search settings",
    mobileCategory: "Settings category",
    searchResults: "Search results",
    resultCount: (count) => `${count} result${count === 1 ? "" : "s"}`,
    noResults: "No settings matched this search.",
    noResultsHint: "Try searching for language, model, voice, memory, plugin, or reset.",
    systemStatus: "System Status",
    diagnostics: "Diagnostics",
    developerDisabledTitle: "Developer tools are hidden",
    developerDisabledBody:
      "Turn on Developer Mode from Advanced options when you need diagnostics or evaluation tools.",
    developerEnabledTitle: "Developer tools",
    evaluationDisabled:
      "Evaluation tools stay hidden until the evaluation capability is enabled.",
    evaluationEnabled: "Evaluation tools are visible for this prototype view.",
    unavailable: "Not available yet",
    configured: "Configured",
    notConfigured: "Not configured",
    on: "On",
    off: "Off",
    openDetails: "Open details",
    choose: "Choose",
    restoreDefaultSettings: "Restore default settings",
    builtInOnly: "Built-in only",
    categories: {
      general: "General",
      appearance_pet: "Appearance & Pet",
      voice_audio: "Voice & Audio",
      models_intelligence: "Models & Intelligence",
      tools_plugins: "Tools & Plugins",
      memory_privacy: "Memory & Privacy",
      notifications: "Notifications",
      about_updates: "About & Updates",
      developer_evaluation: "Developer & Evaluation",
    },
  },
  "zh-CN": {
    appTitle: "Jarvis 控制中心",
    appSubtitle: "个人桌面设置",
    search: "搜索设置",
    mobileCategory: "设置分类",
    searchResults: "搜索结果",
    resultCount: (count) => `${count} 个结果`,
    noResults: "没有找到匹配的设置。",
    noResultsHint: "可以搜索语言、模型、语音、记忆、插件或恢复默认。",
    systemStatus: "系统状态",
    diagnostics: "诊断信息",
    developerDisabledTitle: "开发工具已隐藏",
    developerDisabledBody: "需要诊断或评测工具时，请先在高级选项中开启开发者模式。",
    developerEnabledTitle: "开发者工具",
    evaluationDisabled: "评测工具需要开启评测能力后才会显示。",
    evaluationEnabled: "当前原型视图已显示评测工具。",
    unavailable: "暂不可用",
    configured: "已配置",
    notConfigured: "未配置",
    on: "开启",
    off: "关闭",
    openDetails: "查看详情",
    choose: "选择",
    restoreDefaultSettings: "恢复默认设置",
    builtInOnly: "仅内置",
    categories: {
      general: "通用",
      appearance_pet: "外观与桌宠",
      voice_audio: "语音与音频",
      models_intelligence: "模型与智能",
      tools_plugins: "工具与插件",
      memory_privacy: "记忆与隐私",
      notifications: "通知",
      about_updates: "关于与更新",
      developer_evaluation: "开发者与评测",
    },
  },
};

export const prototypeFlags = {
  productHasStatusRail: false,
  productShowsDeveloperCategoryByDefault: false,
  productShowsInternalControlType: false,
  prototypeUsesRuntimeApis: false,
};

export const settingsCategories = [
  category("general", {
    summary: {
      en: "Language, startup, closing behavior, and recovery.",
      "zh-CN": "语言、启动、关闭行为和恢复。",
    },
    state: { en: "Ready to use", "zh-CN": "可直接使用" },
    keywords: ["language", "startup", "tray", "reset", "recovery", "默认", "语言"],
    sections: [
      section("general_basics", "Language and startup", "语言与启动", {
        en: "Everyday behavior that should be easy to understand.",
        "zh-CN": "日常使用中最常调整的行为。",
      }, [
        setting("language", {
          title: { en: "Display language", "zh-CN": "界面语言" },
          description: {
            en: "Choose the language Jarvis uses in the app.",
            "zh-CN": "选择 Jarvis 界面显示语言。",
          },
          value: { en: "English", "zh-CN": "中文（简体）" },
          kind: "value",
          keywords: ["language", "中文", "english"],
        }),
        setting("close_behavior", {
          title: { en: "When closing the main window", "zh-CN": "关闭主窗口时" },
          description: {
            en: "Choose what happens when you click the close button.",
            "zh-CN": "选择点击关闭按钮后的行为。",
          },
          value: { en: "Minimize to system tray", "zh-CN": "最小化到系统托盘" },
          kind: "value",
          keywords: ["close", "tray", "关闭", "托盘"],
        }),
        setting("launch_at_login", {
          title: { en: "Launch after Windows sign-in", "zh-CN": "登录后自动启动" },
          description: {
            en: "Start Jarvis after you sign in to Windows.",
            "zh-CN": "Windows 登录后启动 Jarvis。",
          },
          value: { en: "Off", "zh-CN": "关闭" },
          kind: "switch",
          enabled: false,
          keywords: ["startup", "login", "开机", "登录"],
        }),
      ]),
      section("reset_recovery", "Reset & Recovery", "重置与恢复", {
        en: "These actions are shown separately because they can change several settings at once.",
        "zh-CN": "这些操作会同时影响多项设置，因此单独展示。",
      }, [
        setting("restore_defaults", {
          title: { en: "Restore default settings", "zh-CN": "恢复默认设置" },
          description: {
            en: "Restores app preferences, layout, and non-sensitive defaults.",
            "zh-CN": "恢复应用偏好、布局和非敏感默认值。",
          },
          value: {
            en: "Does not delete conversations, memory, plugins, skins, or saved credentials.",
            "zh-CN": "不会删除对话、记忆、插件、皮肤或已保存凭据。",
          },
          kind: "danger",
          danger: {
            impact: {
              en: "Changes visible settings back to the recommended defaults.",
              "zh-CN": "将可见设置恢复为推荐默认值。",
            },
            credential: {
              en: "Saved credentials are not removed.",
              "zh-CN": "已保存凭据不会被移除。",
            },
            confirmation: {
              en: "Requires confirmation before anything changes.",
              "zh-CN": "执行前需要再次确认。",
            },
          },
          keywords: ["reset", "restore", "default", "恢复", "默认"],
        }),
      ]),
    ],
  }),
  category("appearance_pet", {
    summary: {
      en: "Theme, density, motion, and Desktop Pet.",
      "zh-CN": "主题、密度、动态效果和桌宠。",
    },
    state: { en: "Built-in robot active", "zh-CN": "内置机器人可用" },
    keywords: ["theme", "pet", "skin", "motion", "主题", "桌宠"],
    sections: [
      section("workspace_appearance", "Workspace appearance", "工作区外观", {
        en: "Keep the product workspace quiet and readable.",
        "zh-CN": "保持产品工作区克制、清晰、易读。",
      }, [
        setting("theme", {
          title: { en: "Theme", "zh-CN": "主题" },
          description: { en: "Choose the app color theme.", "zh-CN": "选择应用配色主题。" },
          value: { en: "Dark", "zh-CN": "深色" },
          kind: "segmented",
          options: {
            en: ["Dark", "Light", "System"],
            "zh-CN": ["深色", "浅色", "跟随系统"],
          },
          keywords: ["theme", "dark", "主题"],
        }),
        setting("density", {
          title: { en: "Interface density", "zh-CN": "界面密度" },
          description: { en: "Adjust spacing for daily work.", "zh-CN": "调整日常工作时的界面间距。" },
          value: { en: "Compact", "zh-CN": "紧凑" },
          kind: "value",
          keywords: ["density", "spacing", "密度"],
        }),
        setting("reduced_motion", {
          title: { en: "Reduced motion", "zh-CN": "减少动态效果" },
          description: {
            en: "Use calmer transitions and static state cues.",
            "zh-CN": "使用更平稳的过渡和静态状态提示。",
          },
          value: { en: "On", "zh-CN": "开启" },
          kind: "switch",
          enabled: true,
          keywords: ["motion", "reduced", "动态"],
        }),
      ]),
      section("desktop_pet", "Desktop Pet", "桌面助手", {
        en: "Desktop Pet stays separate from app settings and never runs commands by itself.",
        "zh-CN": "桌宠与应用设置分开管理，不会自行执行命令。",
      }, [
        setting("show_pet", {
          title: { en: "Show Desktop Pet", "zh-CN": "显示桌面助手" },
          description: { en: "Show the small companion window.", "zh-CN": "显示小型悬浮助手窗口。" },
          value: { en: "Off", "zh-CN": "关闭" },
          kind: "switch",
          enabled: false,
          keywords: ["pet", "桌宠"],
        }),
        setting("pet_skin", {
          title: { en: "Pet skin", "zh-CN": "桌宠皮肤" },
          description: {
            en: "Use the built-in robot until a local skin is installed.",
            "zh-CN": "未安装本地皮肤时使用内置机器人。",
          },
          value: { en: "Built-in robot", "zh-CN": "内置机器人" },
          kind: "value",
          keywords: ["skin", "robot", "皮肤"],
        }),
      ]),
    ],
  }),
  category("voice_audio", {
    summary: {
      en: "Speech recognition, microphone permission, and voice feedback.",
      "zh-CN": "语音识别、麦克风权限和语音反馈。",
    },
    state: { en: "Provider not configured", "zh-CN": "识别服务未配置" },
    keywords: ["voice", "microphone", "asr", "tts", "语音", "麦克风"],
    sections: [
      section("voice_provider", "Speech recognition", "语音识别", {
        en: "Provider setup is separate from microphone permission and regression collection.",
        "zh-CN": "识别服务、麦克风权限和回归采集分开管理。",
      }, [
        setting("recognition_provider", {
          title: { en: "Recognition provider", "zh-CN": "识别服务" },
          description: {
            en: "Connect a supported speech provider.",
            "zh-CN": "连接支持的语音识别服务。",
          },
          value: { en: "Not configured", "zh-CN": "未配置" },
          kind: "credential",
          sensitive: true,
          provider: "Volcengine / Xunfei",
          keywords: ["provider", "xunfei", "volcengine", "讯飞", "火山"],
        }),
        setting("push_to_talk", {
          title: { en: "Push to talk", "zh-CN": "按住说话" },
          description: { en: "Use voice only when you start capture.", "zh-CN": "仅在你主动开始录音时使用语音。" },
          value: { en: "Available after provider setup", "zh-CN": "配置服务后可用" },
          kind: "value",
          keywords: ["ptt", "voice", "按住说话"],
        }),
        setting("wake_word", {
          title: { en: "Wake word", "zh-CN": "唤醒词" },
          description: {
            en: "Background listening is not available in this alpha build.",
            "zh-CN": "当前 Alpha 版本暂不提供后台唤醒监听。",
          },
          value: { en: "Not available yet", "zh-CN": "暂不可用" },
          kind: "unavailable",
          keywords: ["wake", "唤醒"],
        }),
      ]),
      section("audio_feedback", "Audio feedback", "音频反馈", {
        en: "Control spoken responses without changing recognition privacy.",
        "zh-CN": "控制语音播报，不改变语音识别隐私设置。",
      }, [
        setting("tts", {
          title: { en: "Spoken responses", "zh-CN": "语音播报" },
          description: { en: "Let Jarvis read short replies aloud.", "zh-CN": "让 Jarvis 朗读简短回复。" },
          value: { en: "Off", "zh-CN": "关闭" },
          kind: "switch",
          enabled: false,
          keywords: ["tts", "audio", "播报"],
        }),
      ]),
    ],
  }),
  category("models_intelligence", {
    summary: {
      en: "Model choices, local routing, and provider connections.",
      "zh-CN": "模型选择、本地路由和服务连接。",
    },
    state: { en: "Local rules active", "zh-CN": "本地规则已启用" },
    keywords: ["models", "glm", "deepseek", "qwen", "cloud", "模型", "智能"],
    sections: [
      section("routing", "Routing and answers", "路由与回答", {
        en: "Daily model settings avoid evaluation internals.",
        "zh-CN": "日常模型设置不混入评测内部细节。",
      }, [
        setting("local_rules", {
          title: { en: "Fast command understanding", "zh-CN": "快速命令理解" },
          description: {
            en: "Deterministic local rules remain the default for safe commands.",
            "zh-CN": "安全命令默认使用本地确定性规则。",
          },
          value: { en: "Local rules", "zh-CN": "本地规则" },
          kind: "value",
          keywords: ["rules", "command", "命令"],
        }),
        setting("chat_model", {
          title: { en: "Answer provider", "zh-CN": "回答服务" },
          description: { en: "Choose a provider for general answers.", "zh-CN": "选择普通问答使用的模型服务。" },
          value: { en: "Not configured", "zh-CN": "未配置" },
          kind: "credential",
          sensitive: true,
          provider: "GLM / DeepSeek",
          keywords: ["glm", "deepseek", "provider"],
        }),
        setting("model_downloads", {
          title: { en: "Local model files", "zh-CN": "本地模型文件" },
          description: {
            en: "Downloadable models stay separate from cloud provider selection.",
            "zh-CN": "可下载模型与云端服务选择分开管理。",
          },
          value: { en: "No local model selected", "zh-CN": "尚未选择本地模型" },
          kind: "model",
          keywords: ["download", "model", "下载"],
        }),
      ]),
    ],
  }),
  category("tools_plugins", {
    summary: {
      en: "Approved actions, browser opening, file search, plugins, and MCP.",
      "zh-CN": "已批准动作、浏览器打开、文件搜索、插件和 MCP。",
    },
    state: { en: "Read-only tools available", "zh-CN": "只读工具可用" },
    keywords: ["tools", "plugins", "mcp", "browser", "filesystem", "插件", "工具"],
    sections: [
      section("tools", "Tools and automation", "工具与自动化", {
        en: "Execution approval stays separate from command recognition.",
        "zh-CN": "执行授权与命令识别保持分离。",
      }, [
        setting("approved_apps", {
          title: { en: "Approved app launches", "zh-CN": "已批准的应用打开" },
          description: {
            en: "Only known safe app targets can run without extra setup.",
            "zh-CN": "只有已知安全应用目标可以进入普通执行流程。",
          },
          value: { en: "3 apps approved", "zh-CN": "已批准 3 个应用" },
          kind: "value",
          keywords: ["apps", "windows", "应用"],
        }),
        setting("safe_urls", {
          title: { en: "Safe website opening", "zh-CN": "安全网站打开" },
          description: { en: "Known safe URLs use a separate approval boundary.", "zh-CN": "已知安全网址使用独立授权边界。" },
          value: { en: "Confirmation required for unknown sites", "zh-CN": "未知网站需要确认" },
          kind: "value",
          keywords: ["url", "browser", "网站"],
        }),
        setting("file_search", {
          title: { en: "File search", "zh-CN": "文件搜索" },
          description: { en: "Search local filenames without changing files.", "zh-CN": "搜索本地文件名，不修改文件。" },
          value: { en: "Read-only", "zh-CN": "只读" },
          kind: "value",
          keywords: ["file", "search", "文件"],
        }),
      ]),
      section("plugins", "Plugins and MCP", "插件与 MCP", {
        en: "Installed plugins and adapter status are shown without exposing internals.",
        "zh-CN": "展示已安装插件和适配状态，不暴露内部细节。",
      }, [
        setting("plugin_permissions", {
          title: { en: "Plugin permissions", "zh-CN": "插件权限" },
          description: { en: "Review what installed plugins are allowed to do.", "zh-CN": "查看已安装插件被允许执行的能力。" },
          value: { en: "2 enabled, read-only", "zh-CN": "2 个已启用，均为只读" },
          kind: "permission",
          keywords: ["plugin", "permissions", "插件", "权限"],
        }),
        setting("mcp_connections", {
          title: { en: "MCP connections", "zh-CN": "MCP 连接" },
          description: { en: "Connect compatible local adapters when available.", "zh-CN": "在可用时连接兼容的本地适配器。" },
          value: { en: "Not available yet", "zh-CN": "暂不可用" },
          kind: "unavailable",
          keywords: ["mcp", "adapter", "连接"],
        }),
      ]),
    ],
  }),
  category("memory_privacy", {
    summary: {
      en: "Local memory, retention, export, and deletion.",
      "zh-CN": "本地记忆、保留策略、导出和删除。",
    },
    state: { en: "Local only", "zh-CN": "仅本机" },
    keywords: ["memory", "privacy", "export", "delete", "retention", "记忆", "隐私"],
    sections: [
      section("memory", "Memory", "记忆", {
        en: "Memory controls are grouped with local privacy choices.",
        "zh-CN": "记忆控制与本地隐私选项放在一起。",
      }, [
        setting("memory_enabled", {
          title: { en: "User memory", "zh-CN": "用户记忆" },
          description: { en: "Let Jarvis remember approved local notes.", "zh-CN": "允许 Jarvis 记住你批准的本地信息。" },
          value: { en: "On", "zh-CN": "开启" },
          kind: "switch",
          enabled: true,
          keywords: ["memory", "记忆"],
        }),
        setting("memory_retention", {
          title: { en: "Retention policy", "zh-CN": "保留策略" },
          description: {
            en: "Choose how long local memory is kept.",
            "zh-CN": "选择本地记忆保留多久。",
          },
          value: { en: "Manual delete", "zh-CN": "手动删除" },
          kind: "value",
          keywords: ["retention", "保留"],
        }),
        setting("export_memory", {
          title: { en: "Export local memory", "zh-CN": "导出本地记忆" },
          description: { en: "Create a local export after review.", "zh-CN": "审核后创建本地导出文件。" },
          value: { en: "Requires confirmation", "zh-CN": "需要确认" },
          kind: "value",
          sensitive: true,
          keywords: ["export", "导出"],
        }),
      ]),
    ],
  }),
  category("notifications", {
    summary: {
      en: "Tray notices and quiet behavior.",
      "zh-CN": "托盘通知和安静模式。",
    },
    state: { en: "Quiet by default", "zh-CN": "默认安静" },
    keywords: ["notifications", "tray", "quiet", "通知"],
    sections: [
      section("notifications", "Notifications", "通知", {
        en: "Keep desktop interruptions predictable.",
        "zh-CN": "让桌面提醒保持可预期。",
      }, [
        setting("tray_notifications", {
          title: { en: "Tray notifications", "zh-CN": "托盘通知" },
          description: { en: "Show short local notices for important status changes.", "zh-CN": "重要状态变化时显示简短本地提醒。" },
          value: { en: "Off", "zh-CN": "关闭" },
          kind: "switch",
          enabled: false,
          keywords: ["tray", "notification", "托盘"],
        }),
        setting("quiet_hours", {
          title: { en: "Quiet hours", "zh-CN": "安静时段" },
          description: { en: "Schedule when Jarvis should avoid non-urgent notices.", "zh-CN": "设置 Jarvis 避免非紧急提醒的时间。" },
          value: { en: "Not available yet", "zh-CN": "暂不可用" },
          kind: "unavailable",
          keywords: ["quiet", "schedule", "安静"],
        }),
      ]),
    ],
  }),
  category("about_updates", {
    summary: {
      en: "Version, updates, release channel, and diagnostics.",
      "zh-CN": "版本、更新、发布通道和诊断。",
    },
    state: { en: "Alpha build", "zh-CN": "Alpha 版本" },
    keywords: ["about", "version", "update", "diagnostics", "status", "关于", "状态"],
    sections: [
      section("about", "About Jarvis-K", "关于 Jarvis-K", {
        en: "Product identity and update information.",
        "zh-CN": "产品身份和更新信息。",
      }, [
        setting("version", {
          title: { en: "Version", "zh-CN": "版本" },
          description: { en: "Current installed build.", "zh-CN": "当前安装版本。" },
          value: { en: "0.1.0 Alpha", "zh-CN": "0.1.0 Alpha" },
          kind: "value",
          keywords: ["version", "版本"],
        }),
        setting("release_channel", {
          title: { en: "Release channel", "zh-CN": "发布通道" },
          description: { en: "Updates stay separate across channels.", "zh-CN": "不同发布通道的更新相互隔离。" },
          value: { en: "Alpha", "zh-CN": "Alpha" },
          kind: "value",
          keywords: ["release", "channel", "发布"],
        }),
      ]),
      section("system_status", "System Status", "系统状态", {
        en: "Detailed status lives here instead of a permanent sidebar.",
        "zh-CN": "完整状态信息放在这里，不再常驻右侧栏。",
      }, [
        diagnostic("runtime", "Runtime", "运行状态", "Ready", "就绪"),
        diagnostic("storage", "Storage", "存储", "Local data separated", "本地数据已隔离"),
        diagnostic("cloud", "Cloud requests", "云端请求", "Off until configured", "配置前关闭"),
        diagnostic("credentials", "Credentials", "凭据", "Configured state only", "仅显示配置状态"),
      ]),
    ],
  }),
  category(developerCategoryId, {
    summary: {
      en: "Runtime diagnostics and evaluation tools.",
      "zh-CN": "运行期诊断和评测工具。",
    },
    state: { en: "Hidden until Developer Mode is on", "zh-CN": "开启开发者模式后显示" },
    developerOnly: true,
    keywords: ["developer", "evaluation", "fixture", "benchmark", "acceptance"],
    sections: [
      section("developer_tools", "Developer tools", "开发者工具", {
        en: "Internal IDs and capability states are allowed only in this view.",
        "zh-CN": "内部 ID 和能力状态只允许出现在此页面。",
      }, [
        developerSetting("runtime_inspector", "Runtime Inspector", "button", "available"),
        developerSetting("cloud_acceptance", "Cloud acceptance diagnostics", "button", "evaluation gated"),
        developerSetting("voice_regression", "Voice regression tools", "status", "evaluation gated"),
        developerSetting("fixture_harness", "Fixture harness", "status", "disabled in Product"),
      ]),
    ],
  }),
];

export const settingsRegistryDraft = {
  requiredFields: [
    "settingId",
    "categoryId",
    "sectionId",
    "labelKey",
    "descriptionKey",
    "searchKeywordKeys",
    "controlType",
    "settingBindingId",
    "validationContractId",
    "capabilityGate",
    "visibility",
    "sensitive",
    "restartRequired",
    "defaultValueProjection",
    "statusProjectionId",
    "dangerLevel",
    "order",
    "helpReferenceId",
  ],
};

function category(id, options) {
  return { id, ...options };
}

function section(id, en, zh, description, settings) {
  return {
    id,
    title: { en, "zh-CN": zh },
    description,
    settings,
  };
}

function setting(id, options) {
  return {
    id,
    type: "setting",
    enabled: undefined,
    sensitive: false,
    kind: "value",
    keywords: [],
    ...options,
  };
}

function diagnostic(id, en, zh, valueEn, valueZh) {
  return setting(id, {
    title: { en, "zh-CN": zh },
    description: {
      en: "Read-only product status.",
      "zh-CN": "只读产品状态。",
    },
    value: { en: valueEn, "zh-CN": valueZh },
    kind: "diagnostic",
    keywords: ["status", "diagnostics", "状态", "诊断"],
  });
}

function developerSetting(id, label, controlType, status) {
  return setting(id, {
    title: { en: label, "zh-CN": label },
    description: {
      en: `Internal setting ${id}.`,
      "zh-CN": `内部设置 ${id}。`,
    },
    value: { en: status, "zh-CN": status },
    kind: "developer",
    internal: {
      settingId: id,
      capabilityId: `developer.${id}`,
      controlType,
      status,
    },
    keywords: ["developer", "evaluation", id],
  });
}
