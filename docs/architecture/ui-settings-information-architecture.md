# Settings Information Architecture

Date: 2026-08-28

Audit HEAD: `fd4ff9513940c20f218dcdf834599bb597c9402e`

Phase UI-0R refines the target Settings presentation after visual prototype
review. It does not migrate Product Settings, Settings Service, IPC, credentials,
providers, Voice, Pet runtime, Plugin runtime, Executor, or Installer behavior.

## Product Categories

Normal Product Settings should expose eight top-level categories:

| Order | Category | Chinese | Default visibility | Includes | Excludes |
| ---: | --- | --- | --- | --- | --- |
| 1 | General | 通用 | Product | Language, startup, close behavior, reset, basic preferences | Provider credentials, diagnostics |
| 2 | Appearance & Pet | 外观与桌宠 | Product | Theme, density, Desktop Pet, reduced motion, local skin state | Skin Studio unless Developer Mode is on |
| 3 | Voice & Audio | 语音与音频 | Product | ASR provider status, mic permission, PTT, TTS | Voice Regression/Pilot |
| 4 | Models & Intelligence | 模型与智能 | Product | Local command rules, model selection, provider connection state, cloud consent summary | One-time acceptance internals |
| 5 | Tools & Plugins | 工具与插件 | Product | Approved app launches, browser opening, file search, plugin permissions, MCP status | Fixture harnesses and community upload |
| 6 | Memory & Privacy | 记忆与隐私 | Product | Memory controls, retention, export/delete, local-only data policy | Benchmark datasets |
| 7 | Notifications | 通知 | Product | Tray notifications, quiet behavior | Login startup mechanics |
| 8 | About & Updates | 关于与更新 | Product | Version, release channel, update status, System Status, Diagnostics | Credentials |

`Developer & Evaluation` is not part of normal Product navigation. It becomes an
extra category only when Developer Mode is on.

## Advanced Strategy

`Advanced` no longer occupies the default top-level Product navigation. Advanced
options should live at the bottom of the category they affect, with careful copy
and local status. A top-level Advanced page should appear only if there is a real
cross-domain setting that cannot be responsibly placed elsewhere.

System Status and detailed Diagnostics move to:

`About & Updates -> System Status / Diagnostics`

Daily pages show only status relevant to the current category. The prototype no
longer has a persistent right-side diagnostic rail.

## Developer and Evaluation Gates

- Product mode does not show `Developer & Evaluation`.
- Developer Mode ON adds the extra `Developer & Evaluation` category.
- Evaluation tools inside that category require a second Evaluation capability
  gate.
- Internal status enums, control types, capability IDs, fixture markers, and
  acceptance details are allowed only inside Developer/Evaluation surfaces.
- Product pages use productized labels and current values, not implementation
  metadata.

## Move, Merge, Hide

| Current item | Target action |
| --- | --- |
| Language | Keep; move under General as a value row. |
| Close button behavior | Keep; move under General as a value row. |
| Launch at login | Keep; move under General as a switch row. |
| Restore default settings | Move to General bottom, `Reset & Recovery`. |
| Local TTS toggle | Move to Voice & Audio. |
| Desktop Pet enable/on-top/reduced motion | Move to Appearance & Pet. |
| Theme | Keep under Appearance & Pet. |
| Pet Skin preview/install/Studio | Hide by Developer Mode until stable; separate from theme. |
| Developer Mode toggle | Place behind an advanced affordance, not as a permanent Product category. |
| Runtime Inspector toggle/probe | Hide under Developer & Evaluation. |
| Command Router product mode | Move to Tools & Plugins or Models & Intelligence depending on final binding. |
| Qwen runtime control | Hide under Developer & Evaluation until Product route is approved. |
| Chat Answer product mode | Move to Models & Intelligence. |
| Voice Regression/Pilot | Keep Evaluation-only. |
| Memory Alpha controls | Merge into Memory & Privacy with clear alpha status. |
| Model Governance | Move to Models & Intelligence; advanced details folded. |
| GLM/DeepSeek one-time acceptance | Developer & Evaluation only. |

## Page Layout

Desktop:

- Left category navigation.
- Top search field.
- Main content sections with a readable max width.
- No persistent Status Summary rail in normal Product Settings.
- Compact setting rows show label, description, and current value.
- Complex provider/model/plugin controls may use cards.
- Danger actions live in a distinct section and require confirmation.

Narrow windows:

- The full vertical category list is replaced by a compact category selector,
  drawer, or equivalent pattern.
- No horizontal scrolling.
- Content starts within the first viewport.
- Button labels wrap cleanly.
- Long Chinese text keeps line height and does not truncate critical warnings.

## Setting Row Pattern

Every ordinary row should expose the current value or state:

```text
Display language
Choose the language Jarvis uses in the app.
English >

界面语言
选择 Jarvis 界面显示语言。
中文（简体） >
```

Control guidance:

- Boolean: compact switch row.
- Small enum: segmented control or value row.
- Many options: select or dialog.
- Credential: dedicated connection card.
- Model download: dedicated model card.
- Plugin permissions: dedicated permission card.
- Danger action: independent danger section.
- Diagnostics: About/Developer definition list, not the main setting row pattern.

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

Search results must show count, category breadcrumb, setting name, description,
and current value/state. They must include an empty result state in both English
and Chinese.

The index must not include credential values, user memory, file paths, prompts,
provider responses, plugin inputs, or diagnostics payloads.
