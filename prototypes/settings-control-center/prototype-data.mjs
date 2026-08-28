export const locales = ["en", "zh-CN"];

export const categoryOrder = [
  "general",
  "appearance_pet",
  "voice_audio",
  "models_intelligence",
  "tools_automation",
  "plugins_mcp",
  "memory_privacy",
  "notifications",
  "advanced",
  "developer_evaluation",
  "about_updates",
];

export const prototypeCopy = {
  en: {
    appTitle: "Jarvis Control Center",
    appSubtitle: "Settings prototype / static data / no runtime access",
    search: "Search settings",
    statusRail: "Status summary",
    productMode: "Product",
    developerMode: "Developer tools",
    danger: "Danger zone",
    unavailable: "Unavailable",
    configured: "Configured",
    missing: "Missing",
    localOnly: "Local only",
    restartRequired: "Restart required",
    readOnly: "Read only",
    noResults: "No settings matched this search.",
    fakeData: "Prototype data",
    sections: "Sections",
    categories: {
      general: "General",
      appearance_pet: "Appearance & Pet",
      voice_audio: "Voice & Audio",
      models_intelligence: "Models & Intelligence",
      tools_automation: "Tools & Automation",
      plugins_mcp: "Plugins & MCP",
      memory_privacy: "Memory & Privacy",
      notifications: "Notifications",
      advanced: "Advanced",
      developer_evaluation: "Developer & Evaluation",
      about_updates: "About & Updates",
    },
  },
  "zh-CN": {
    appTitle: "Jarvis 控制中心",
    appSubtitle: "设置原型 / 静态数据 / 不访问真实运行时",
    search: "搜索设置",
    statusRail: "状态摘要",
    productMode: "产品模式",
    developerMode: "开发工具",
    danger: "危险区域",
    unavailable: "不可用",
    configured: "已配置",
    missing: "缺失",
    localOnly: "仅本机",
    restartRequired: "需要重启",
    readOnly: "只读",
    noResults: "没有匹配的设置。",
    fakeData: "原型数据",
    sections: "分区",
    categories: {
      general: "通用",
      appearance_pet: "外观与桌宠",
      voice_audio: "语音与音频",
      models_intelligence: "模型与智能",
      tools_automation: "工具与自动化",
      plugins_mcp: "插件与 MCP",
      memory_privacy: "记忆与隐私",
      notifications: "通知",
      advanced: "高级",
      developer_evaluation: "开发者与评测",
      about_updates: "关于与更新",
    },
  },
};

export const settingsCategories = [
  {
    id: "general",
    audience: "Everyone",
    defaultVisible: true,
    status: "ready",
    keywords: ["language", "startup", "tray", "reset", "close"],
    sections: [
      {
        id: "general_basics",
        title: { en: "Language and startup", "zh-CN": "语言与启动" },
        description: {
          en: "Everyday app behavior without diagnostics.",
          "zh-CN": "不包含诊断细节的日常应用行为。",
        },
        settings: [
          setting("language", "UI language", "界面语言", "select", "Product"),
          setting("close_behavior", "Close button behavior", "关闭按钮行为", "segmented", "Product"),
          setting("launch_at_login", "Launch at Windows sign-in", "登录 Windows 时启动", "switch", "Product"),
          setting("reset_settings", "Restore default settings", "恢复默认设置", "button", "Danger", { danger: "medium" }),
        ],
      },
    ],
  },
  {
    id: "appearance_pet",
    audience: "Everyone",
    defaultVisible: true,
    status: "ready",
    keywords: ["theme", "pet", "skin", "reduced motion"],
    sections: [
      {
        id: "themes",
        title: { en: "Workspace appearance", "zh-CN": "工作区外观" },
        description: {
          en: "Themes, density, and reduced motion.",
          "zh-CN": "主题、密度和减少动态效果。",
        },
        settings: [
          setting("theme", "Theme", "主题", "swatches", "Product"),
          setting("density", "Interface density", "界面密度", "segmented", "Product"),
          setting("desktop_pet", "Show Desktop Pet", "显示桌宠", "switch", "Product"),
          setting("pet_skin", "Local Pet Skin", "本地桌宠皮肤", "status", "Developer", { status: "installed" }),
        ],
      },
    ],
  },
  {
    id: "voice_audio",
    audience: "Voice users",
    defaultVisible: true,
    status: "needs_setup",
    keywords: ["voice", "microphone", "asr", "tts"],
    sections: [
      {
        id: "voice_provider",
        title: { en: "Voice provider", "zh-CN": "语音服务" },
        description: {
          en: "Provider setup is separate from recording consent.",
          "zh-CN": "服务配置与录音/采集同意分开管理。",
        },
        settings: [
          setting("voice_provider", "Recognition provider", "识别服务", "credential", "Product", { sensitive: true, status: "missing" }),
          setting("ptt", "Push to talk", "按住说话", "switch", "Product"),
          setting("wake_word", "Wake word", "唤醒词", "switch", "Advanced", { status: "unavailable" }),
          setting("voice_regression", "Local text regression collection", "本地文本回归采集", "switch", "Evaluation", { sensitive: true }),
        ],
      },
    ],
  },
  {
    id: "models_intelligence",
    audience: "Everyone",
    defaultVisible: true,
    status: "degraded",
    keywords: ["models", "glm", "deepseek", "qwen", "cloud"],
    sections: [
      {
        id: "model_routes",
        title: { en: "Reasoning providers", "zh-CN": "推理服务" },
        description: {
          en: "Model choice, credential status, and cloud egress consent.",
          "zh-CN": "模型选择、凭据状态和云端请求同意。",
        },
        settings: [
          setting("local_rules", "Deterministic rules", "确定性规则", "status", "Product", { status: "active" }),
          setting("deepseek_key", "DeepSeek API key", "DeepSeek API Key", "credential", "Advanced", { sensitive: true, status: "configured" }),
          setting("glm_key", "GLM API key", "GLM API Key", "credential", "Advanced", { sensitive: true, status: "missing" }),
          setting("cloud_acceptance", "One-time cloud acceptance", "一次性云端验收", "button", "Evaluation"),
        ],
      },
    ],
  },
  {
    id: "tools_automation",
    audience: "Everyone",
    defaultVisible: true,
    status: "ready",
    keywords: ["windows", "browser", "filesystem", "approval"],
    sections: [
      {
        id: "automation_policy",
        title: { en: "Action safety", "zh-CN": "动作安全" },
        description: {
          en: "Execution remains separate from intent recognition.",
          "zh-CN": "执行权限与意图识别保持分离。",
        },
        settings: [
          setting("open_apps", "Approved app launches", "已批准的应用打开", "status", "Product"),
          setting("safe_urls", "Safe URL opening", "安全网址打开", "status", "Product"),
          setting("file_search", "File search", "文件搜索", "status", "Product"),
          setting("dangerous_actions", "Destructive actions", "破坏性动作", "danger", "Product", { danger: "high" }),
        ],
      },
    ],
  },
  {
    id: "plugins_mcp",
    audience: "Power users",
    defaultVisible: true,
    status: "ready",
    keywords: ["plugins", "mcp", "permissions"],
    sections: [
      {
        id: "plugins",
        title: { en: "Plugins and local adapters", "zh-CN": "插件与本地适配器" },
        description: {
          en: "Installed plugins, declared capabilities, and MCP status.",
          "zh-CN": "已安装插件、声明能力和 MCP 状态。",
        },
        settings: [
          setting("plugin_list", "Installed plugins", "已安装插件", "list", "Product"),
          setting("plugin_permissions", "Plugin permissions", "插件权限", "status", "Product"),
          setting("mcp_status", "MCP adapter status", "MCP 适配器状态", "status", "Advanced", { status: "unavailable" }),
        ],
      },
    ],
  },
  {
    id: "memory_privacy",
    audience: "Everyone",
    defaultVisible: true,
    status: "ready",
    keywords: ["memory", "privacy", "export", "delete", "retention"],
    sections: [
      {
        id: "memory_privacy",
        title: { en: "Memory and privacy", "zh-CN": "记忆与隐私" },
        description: {
          en: "Local memory controls, retention, export, and deletion.",
          "zh-CN": "本地记忆控制、保留策略、导出和删除。",
        },
        settings: [
          setting("memory_enabled", "User memory", "用户记忆", "switch", "Product"),
          setting("memory_retention", "Retention policy", "保留策略", "status", "Product"),
          setting("export_memory", "Export memory", "导出记忆", "button", "Product", { sensitive: true }),
          setting("delete_memory", "Delete local memory", "删除本地记忆", "danger", "Product", { danger: "high" }),
        ],
      },
    ],
  },
  {
    id: "notifications",
    audience: "Everyone",
    defaultVisible: true,
    status: "planned",
    keywords: ["toast", "notifications", "quiet"],
    sections: [
      {
        id: "notifications",
        title: { en: "Notifications", "zh-CN": "通知" },
        description: {
          en: "Tray notifications and quiet behavior.",
          "zh-CN": "托盘通知和安静模式。",
        },
        settings: [
          setting("tray_notifications", "Tray notifications", "托盘通知", "switch", "Product", { status: "unavailable" }),
          setting("quiet_hours", "Quiet hours", "安静时段", "schedule", "Product", { status: "unavailable" }),
        ],
      },
    ],
  },
  {
    id: "advanced",
    audience: "Power users",
    defaultVisible: true,
    status: "ready",
    keywords: ["resources", "diagnostics", "recovery"],
    sections: [
      {
        id: "advanced_recovery",
        title: { en: "Recovery tools", "zh-CN": "恢复工具" },
        description: {
          en: "Operational controls that should stay out of daily setup.",
          "zh-CN": "不应混入日常设置的运行维护控制。",
        },
        settings: [
          setting("resource_profile", "Resource profile", "资源配置", "select", "Advanced"),
          setting("diagnostic_export", "Diagnostic export", "诊断导出", "button", "Advanced", { sensitive: true }),
          setting("factory_reset", "Factory reset", "恢复出厂设置", "danger", "Advanced", { danger: "high" }),
        ],
      },
    ],
  },
  {
    id: "developer_evaluation",
    audience: "Maintainers",
    defaultVisible: false,
    status: "hidden",
    keywords: ["developer", "evaluation", "fixture", "benchmark", "acceptance"],
    sections: [
      {
        id: "evaluation_tools",
        title: { en: "Evaluation tools", "zh-CN": "评测工具" },
        description: {
          en: "Hidden by default and gated by Desktop Main capabilities.",
          "zh-CN": "默认隐藏，并由 Desktop Main 能力门控。",
        },
        settings: [
          setting("runtime_inspector", "Runtime Inspector", "运行期检查器", "button", "Developer"),
          setting("voice_pilot", "Voice Pilot", "语音 Pilot", "status", "Evaluation"),
          setting("fixture_harness", "Fixture harness", "Fixture 测试工具", "status", "Evaluation"),
          setting("cloud_diagnostic", "Cloud acceptance diagnostic", "云端验收诊断", "button", "Evaluation"),
        ],
      },
    ],
  },
  {
    id: "about_updates",
    audience: "Everyone",
    defaultVisible: true,
    status: "ready",
    keywords: ["version", "channel", "update", "signature"],
    sections: [
      {
        id: "about",
        title: { en: "About Jarvis-K", "zh-CN": "关于 Jarvis-K" },
        description: {
          en: "Version, release channel, and update status.",
          "zh-CN": "版本、发布通道和更新状态。",
        },
        settings: [
          setting("version", "Version", "版本", "status", "Product"),
          setting("release_channel", "Release channel", "发布通道", "status", "Product"),
          setting("update_status", "Updates", "更新", "status", "Product", { status: "unavailable" }),
        ],
      },
    ],
  },
];

export const prototypeStatus = [
  { label: { en: "Runtime", "zh-CN": "运行时" }, value: { en: "Ready", "zh-CN": "就绪" }, tone: "success" },
  { label: { en: "Cloud routing", "zh-CN": "云端路由" }, value: { en: "Off", "zh-CN": "关闭" }, tone: "neutral" },
  { label: { en: "Credentials", "zh-CN": "凭据" }, value: { en: "Configured state only", "zh-CN": "仅显示配置状态" }, tone: "success" },
  { label: { en: "Evaluation", "zh-CN": "评测" }, value: { en: "Hidden by default", "zh-CN": "默认隐藏" }, tone: "warning" },
  { label: { en: "Network", "zh-CN": "网络" }, value: { en: "Not used by prototype", "zh-CN": "原型不使用" }, tone: "success" },
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

function setting(id, en, zh, control, visibility, options = {}) {
  return {
    id,
    label: { en, "zh-CN": zh },
    control,
    visibility,
    status: options.status ?? "ready",
    sensitive: options.sensitive === true,
    danger: options.danger ?? "none",
  };
}
