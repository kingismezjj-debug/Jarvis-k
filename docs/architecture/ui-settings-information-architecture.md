# Settings Information Architecture

Date: 2026-08-28

Audit HEAD: `b77dff2d98765bdf3ce5867881fdf1fae2ad69a1`

Phase UI-0 defines the target architecture only. It does not migrate Product
Settings.

## Target Categories

| Order | Category | Chinese | Default visibility | Includes | Excludes |
| ---: | --- | --- | --- | --- | --- |
| 1 | General | 通用 | Product | Language, startup, close behavior, reset, basic preferences | Provider credentials, diagnostics |
| 2 | Appearance & Pet | 外观与桌宠 | Product | Theme, density, Desktop Pet, reduced motion, local skin state | Skin Studio unless Developer Mode is on |
| 3 | Voice & Audio | 语音与音频 | Product | ASR provider status, mic permission, PTT, TTS | Voice Regression/Pilot |
| 4 | Models & Intelligence | 模型与智能 | Product | Deterministic rules, model selection, provider credentials, cloud egress state | One-time acceptance internals |
| 5 | Tools & Automation | 工具与自动化 | Product | Approved app launch, browser open, filesystem search, approval defaults | Fixture harnesses |
| 6 | Plugins & MCP | 插件与 MCP | Product | Plugin list, permissions, MCP adapter status | Community upload |
| 7 | Memory & Privacy | 记忆与隐私 | Product | Memory controls, retention, export/delete, local-only data policy | Benchmark datasets |
| 8 | Notifications | 通知 | Product | Tray notifications, quiet behavior | Login startup mechanics |
| 9 | Advanced | 高级 | Product with careful copy | Resource profile, diagnostic export, recovery tools | Evaluation harnesses |
| 10 | Developer & Evaluation | 开发者与评测 | Hidden by default | Runtime Inspector, fixtures, pilots, acceptance, benchmarks | Ordinary product settings |
| 11 | About & Updates | 关于与更新 | Product | Version, release channel, signature/update status | Credentials |

Target section count: 11 categories, 11 first-pass sections in the prototype.

## Move, Merge, Hide

| Current item | Target action |
| --- | --- |
| Language | Keep; move under General. |
| Close button behavior | Keep; move under General. |
| Launch at login | Keep; move under General. |
| Local TTS toggle | Move to Voice & Audio. |
| Desktop Pet enable/on-top/reduced motion | Move to Appearance & Pet. |
| Theme | Keep under Appearance & Pet. |
| Pet Skin preview/install/Studio | Hide by Developer Mode until stable; separate from theme. |
| Developer Mode toggle | Move to Advanced or Developer & Evaluation entry point with warning. |
| Runtime Inspector toggle/probe | Hide under Developer & Evaluation. |
| Command Router product mode | Move to Tools & Automation or Models & Intelligence depending on final binding. |
| Qwen runtime control | Hide under Developer & Evaluation until product route is approved. |
| Chat Answer product mode | Move to Models & Intelligence. |
| Voice Regression/Pilot | Keep Evaluation-only. |
| Memory Alpha controls | Merge into Memory & Privacy with clear alpha status. |
| Model Governance | Move to Models & Intelligence; advanced details folded. |
| GLM/DeepSeek one-time acceptance | Developer & Evaluation only. |

## Page Layout

Desktop:

- Left category navigation.
- Top search field.
- Main content sections with definition-list status rows.
- Optional right status rail only when it adds product value.
- Danger zone is visually distinct and requires confirmation.

Narrow windows:

- Category navigation becomes stacked or two-column.
- No horizontal scrolling.
- Button labels wrap cleanly.
- Long Chinese text keeps line height and does not truncate critical warnings.

## Settings Definition Registry

Draft interface:

```ts
type SettingsDefinition = {
  settingId: string;
  categoryId: string;
  sectionId: string;
  labelKey: string;
  descriptionKey: string;
  searchKeywordKeys: string[];
  controlType:
    | "switch"
    | "segmented"
    | "select"
    | "input"
    | "button"
    | "danger"
    | "credential"
    | "status"
    | "link";
  settingBindingId: string;
  validationContractId: string;
  capabilityGate: "product" | "advanced" | "developer" | "evaluation";
  visibility: "product" | "advanced" | "developer" | "evaluation";
  sensitive: boolean;
  restartRequired: boolean;
  defaultValueProjection: string;
  statusProjectionId: string;
  dangerLevel: "none" | "low" | "medium" | "high";
  order: number;
  helpReferenceId: string;
};
```

Rules:

- Registry describes definitions only; Settings Service owns values.
- Desktop Main owns trusted capability projections.
- Renderer cannot use the registry to enable hidden gates.
- Credentials never enter registry values.
- Duplicate `settingId` fails.
- Missing i18n keys fail.
- Unknown `controlType` fails.
- Product pages cannot reference Developer/Evaluation-only definitions.
- Sensitive settings must use trusted renderers and safe status projections.

## Search Index

The search index should be generated from registry keys:

- labels
- descriptions
- localized keyword keys
- category names
- status projection labels
- help references

It should not index credential values, user memory, file paths, prompts, provider responses, plugin inputs, or diagnostics payloads.
