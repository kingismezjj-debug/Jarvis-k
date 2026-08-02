# Jarvis-K 项目交接文档：Phase 1 到 Phase 6.19

更新日期：2026-08-01  
仓库：`E:\Jarvis-K`  
分支：`main`  
当前状态：本地 `main` 领先 `origin/main` 19 个提交  
最新提交：`6c7e2d5 feat: add embedding artifact pinning guard`

本文档用于打开新的 Codex 窗口继续开发。它总结 Jarvis-K 从最初底座到 Phase 6.19 的实际完成内容、Hugging Face 头脑风暴后的架构结论、当前可测试能力、剩余缺口，以及下一阶段应该按什么顺序推进。

## 1. 项目总目标

Jarvis-K 是一个面向 Windows 的本地化智能体 Agent 桌面运行时，目标不是做一个单页聊天 UI，而是做一个可长期演进的桌面 Agent 底座：

- Electron 桌面壳负责窗口、IPC、安全边界、`safeStorage`、Core 监督和重启。
- React HUD 只负责展示状态、发送用户意图、消费 DTO。
- Core 负责 Agent 运行时状态、命令处理、业务状态机和注入端口调度。
- Core Host 是唯一组合根，负责把 Core、Voice、Memory、Capability、Inference Provider 和具体适配器组装起来。
- Provider、数据库、模型运行时、语音服务、下载器等具体实现必须通过端口注入，不能直接泄漏到 Core/UI/Desktop。
- 本地能力和云端能力要可切换：低配设备默认云端或 Lite，本地增强能力按设备、许可证、资源和用户授权逐步启用。

长期产品方向包括：

- 语音唤醒、语音输入和语音播报。
- 长期记忆、会话历史、用户偏好和操作记录。
- 屏幕理解、OCR、窗口/控件定位。
- 本地工具执行、网站/软件/文件夹打开、Windows 自动化。
- 云端大模型负责复杂推理，本地小模型负责低延迟、隐私敏感或基础路由任务。
- 普通商业用户可安装、可监督、可恢复、可卸载、可审计。

## 2. 当前架构结论

当前 Jarvis-K 的核心架构已经稳定为：

```text
React HUD
  -> Electron preload bridge
  -> Electron Desktop IPC/security/supervisor
  -> Core Host child process
  -> Agent Core
     -> Voice Engine through injected ports
     -> MemoryRepository through injected ports
     -> Capability/model governance through injected ports
     -> Inference providers through injected ports
```

关键边界：

- `packages/contracts`：只放传输 DTO、命令、事件、Zod schema。
- `packages/core`：只依赖 provider-neutral ports，不依赖 SQLite、Electron、React、`ws`、具体模型运行时或具体 provider。
- `packages/voice`：语音状态机和会话策略，不含讯飞签名细节。
- `packages/voice-adapter-xunfei`：讯飞 RTASR 的签名、连接、重试、解析和 provider 策略。
- `packages/memory`：Memory provider-neutral 端口和 schema。
- `packages/memory-sqlite`：SQLite schema、迁移、健康检查、快照导入导出。
- `packages/capabilities`：设备能力、模型治理、资源调度、provider availability、preflight 和 lifecycle 端口。
- `packages/inference-adapter-fixture`：测试用 fixture 推理 provider。
- `packages/inference-adapter-embedding-local`：计划中的本地 embedding provider readiness 包，目前 fail-closed。
- `apps/core-host`：唯一具体组合根。
- `apps/desktop`：IPC、安全边界、`safeStorage`、Core 监督。
- `apps/ui`：只消费 DTO 和发送意图。

这条边界是后续所有 Phase 继续开发的底线。

## 3. Phase 1：桌面运行时底座

Phase 1 完成的是 Jarvis-K 独立仓库和最小桌面 Agent runtime，而不是语音、模型或记忆。

已完成：

- npm workspaces 基线。
- `contracts`、`core`、`ui`、`desktop` 四个基础 workspace。
- protocol v1，使用 Zod 验证命令、结果、错误、事件、快照和 correlation id。
- Electron context-isolated preload bridge。
- Electron 主进程到 Core child process 的受监督通信。
- Core 健康探针、请求超时、受控重启、单调 supervisor event sequence id。
- React HUD、Tailwind、shadcn/ui、Radix、Lucide 基础界面。
- renderer reload 后可恢复 Core snapshot。
- dependency boundary checker。
- Vitest 和 Electron Playwright smoke test。

Phase 1 意义：

- Jarvis-K 从一开始就不是 UI 直连业务逻辑。
- Core 可以崩溃并被 Desktop 监督重启，主窗口不跟着退出。
- 所有跨进程通信都有 typed contract 和校验。

完成状态：已完成，回滚引用为 commit `1f3376a`（当前 checkout 未发现对应 Git tag）。

## 4. Phase 2：Voice Engine 和讯飞 RTASR

Phase 2 完成了 provider-neutral 语音层，以及一个真实可用的讯飞 RTASR provider 接入路径。

已完成：

- Voice Engine 状态机。
- PTT、continuous listening、TTS suspend/resume、barge-in、inactivity recovery。
- Browser microphone capture：AudioWorklet 优先，ScriptProcessor fallback。
- 16 kHz PCM capture，40 ms frame aggregation。
- bounded binary audio IPC：renderer -> desktop -> Core Host -> provider。
- 单麦克风、单 AudioContext、单 capture controller、单 ASR session owner。
- 讯飞 adapter 独立在 `packages/voice-adapter-xunfei`。
- 讯飞签名、连接复用、`10800` retry、segment silence finalization、duplicate suppression、disconnect recovery。
- Electron `safeStorage` voice settings window。
- 凭证只走本地加密设置和 private Core Host IPC，不进入 React state 或公开命令 IPC。
- deterministic PTT smoke、provider fault recovery、renderer reload microphone release、Core restart recovery。
- 真实讯飞连接测试和用户手动语音 PTT 可用性确认。

Phase 2 意义：

- 已经证明 Jarvis-K 可以接真实外部 provider，但 provider 策略不会污染 Core/UI/Desktop。
- 语音输入不是浏览器 Web Speech API 的临时拼接，而是可监督的 Agent runtime 能力。

仍未包含：

- 本地 Whisper。
- wake word。
- 本地 TTS。
- 语音模型下载和本地模型 runtime。

完成状态：已完成，回滚引用为 commit `5d195ee`（当前 checkout 未发现对应 Git tag）。

## 5. Phase 2.6：工程硬化和 Onboarding

Phase 2.6 是进入 Memory 和模型治理前的工程硬化阶段。

已完成：

- README、SECURITY、开发者 onboarding。
- `.env.example`。
- CI 工作流。
- 边界和构建流程修正。
- 曾经 GitHub Actions 因干净 CI 没有先构建 `voice-adapter-xunfei` 失败，已在后续提交中修复。

完成状态：已完成，回滚引用为 commit `9e8c3b6`（当前 checkout 未发现对应 Git tag）。

## 6. Phase 3：本地 Memory 和 SQLite 持久化

Phase 3 已经不只是“保存聊天消息”，而是完成了本地 memory 的第一套可维护能力。

### 6.1 Durable Message Memory

已完成：

- 新增 `@jarvis-k/memory` provider-neutral memory 包。
- 新增 `@jarvis-k/memory-sqlite` SQLite adapter。
- Core 通过可选 `MemoryRepository` 注入启动恢复消息。
- Core 接收消息后写入 memory。
- SQLite 只在 `apps/core-host` 组合。
- Core 不依赖 SQLite。

### 6.2 Conversation Metadata

已完成：

- conversations 表。
- active conversation 设置。
- conversation list/upsert/update/select 端口。
- legacy message-only DB backfill。
- message append 时同步维护 conversation timestamp。

### 6.3 Recall And Summaries

已完成：

- recent-message recall port。
- summary records。
- SQLite summaries 表和迁移。
- 有界 recent-message recall，按时间顺序返回。
- 没有在 Core 内放 summarization provider 策略。

### 6.4 Maintenance And Recovery

已完成：

- memory health。
- SQLite `PRAGMA integrity_check`。
- export/import memory snapshot。
- corrupted/unavailable DB 时 Core degraded 而不是崩溃。
- message write failure 显示 structured health/error。

### 6.5 UI 和 Smoke 收口

已完成：

- React HUD 支持 conversation tabs、新建、选择、重命名。
- 发送消息默认走 active conversation。
- runtime activity panel 展示 memory health。
- HUD 支持 snapshot JSON export/import。
- desktop smoke 覆盖 conversation UI、Core restart 后恢复、snapshot export/import。
- `smoke:desktop:memory-degraded` 覆盖损坏 SQLite 文件时的降级启动。

Phase 3 意义：

- Jarvis-K 已经有本地可持久化记忆底座。
- 用户对话和会话元数据可以跨 Core 重启/桌面重启恢复。
- Memory adapter 损坏不会拖垮整个 Agent。

当前缺口：

- 还没有长期记忆的自动抽取策略。
- 还没有 embedding/vector retrieval。
- 还没有用户可视化编辑/删除具体长期记忆条目的完整 UX。
- 还没有 memory encryption at rest 的最终产品方案。

完成状态：Phase 3 本地 Memory 底座已完成。

## 7. Phase 4：Capability 和 Model Governance 底座

Phase 4 不是接入真实模型，而是为以后接 Hugging Face、本地 runtime、模型下载、设备分层和资源调度建立治理层。

已完成：

- device capability snapshot。
- runtime mode recommendation：Lite、Standard、Local Enhanced 等模式基础。
- provider-neutral model manifests、model candidates、inventory、audit records。
- installability policy：pinned revision、SHA-256、license risk、memory、VRAM。
- file-system lifecycle skeleton，默认 artifact fetcher 未配置。
- supervised model operation snapshots。
- dry-run install preparation。
- resource scheduler leases and diagnostics。
- runtime adapter discovery，默认不暴露真实 adapter。
- embedding、OCR、intent routing、reranking 的 capability-specific inference ports。
- provider availability 和 configuration requirements。
- inference execution preflight，在 provider 被调用前解释 capability/provider/model/resource blockers。

Phase 4.5 安全闸门：

- `npm run check:boundaries`。
- `npm run check:sensitive-artifacts`。
- 阻止真实 runtime dependency、模型 artifacts、本地 DB、`.env` 等进入默认验证路径。

Phase 4 意义：

- 后续所有模型都必须先通过治理层，而不是直接在 UI/Core 里调用模型。
- 模型下载、安装、加载、执行、卸载、回滚都被视为 lifecycle 问题。
- resource scheduler 开始为未来多模型抢内存/显存的问题留位置。

明确未启用：

- 真实 Hugging Face 下载。
- 真实模型加载或推理。
- Python、CUDA、ONNX Runtime、Paddle、CTranslate2、llama.cpp、Transformers 等 runtime dependency。
- 用户可见的真实推理执行入口。

完成状态：已完成，形成 Phase 4 底座稳定节点。

## 8. Phase 5：Fixture-backed Inference Baseline

Phase 5 用 deterministic fixture provider 证明了端到端推理链路，但仍不接真实模型。

已完成：

- 新增 `@jarvis-k/inference-adapter-fixture`。
- fixture-backed execution：
  - `agent.generateEmbeddings`
  - `agent.routeIntent`
  - `agent.recognizeOcr`
  - `agent.rerank`
- Jarvis-owned fixture manifests。
- provider descriptors 和 configuration requirements。
- `apps/core-host` 在 `JARVIS_K_ENABLE_FIXTURE_INFERENCE=1` 下组合 fixture providers。
- Core 只通过 injected provider-neutral ports 执行。
- operation 状态：`prechecking`、`executing`、`completed`、`blocked`、sanitized `failed`。
- UI development observation controls。
- `smoke:desktop:fixture-inference` 覆盖四条 fixture execution path。

Phase 5 意义：

- 已证明未来真实 provider 可以替换 fixture provider，而不用改 Core/UI/Desktop 主链路。
- embedding、intent、OCR、rerank 的命令、preflight、operation、UI observation 都有端到端基线。
- fixture provider 可长期作为 regression 和开发测试 provider 保留。

明确未启用：

- 真实 embedding/OCR/router/reranker provider。
- 真实模型下载。
- 真实本地 runtime。
- provider credentials 或外部网络访问。

完成状态：已完成，回滚引用为 commit `ed3ae29`（当前 checkout 未发现对应 Git tag）。

## 9. Phase 6.1 到 Phase 6.19：本地 Embedding Provider Readiness

Phase 6 的第一条真实 provider 路径选择了 embedding，而不是 STT、OCR、TTS 或本地 LLM。

选择 embedding 的原因：

- DTO surface 最小。
- 不需要二进制图像输入。
- 对长期记忆和检索价值很高。
- 比 STT/TTS/OCR 更容易先证明 revision、artifact、runtime、license、benchmark、composition 的完整闸门。

当前目标 provider：

- Provider id：`embedding.local.qwen3`
- Model id：`Qwen/Qwen3-Embedding-0.6B`
- Capability：`embedding`
- Runtime direction：provisional `transformers`
- 当前执行状态：未组合、未注册、未启用

### 9.1 Wave 6.1

已完成：

- 新增 `@jarvis-k/inference-adapter-embedding-local`。
- provider descriptor 暴露为 `unconfigured` 和 `disabled`。
- `UnavailableLocalEmbeddingProvider` fail-closed。
- readiness descriptor 在 `apps/core-host` 中可见。
- 没有注入 execution provider。

### 9.2 Wave 6.2

已完成：

- provider-local readiness evaluator。
- 阻止 missing manifest、floating revision、missing SHA-256、red-risk license、不完整 runtime review。

### 9.3 Wave 6.3

已完成：

- planning-only `ModelRuntimeAdapter` skeleton。
- `canLoad` 为 false，`load` 永远 sanitized failure。
- 没有注册 runtime。

### 9.4 Wave 6.4

已完成：

- runtime strategy guard。
- 未来 runtime package 边界定为 `@jarvis-k/inference-runtime-transformers-local`。
- 明确 runtime dependency license、Windows packaging、process isolation、tokenizer/config pinning、benchmark gates。

### 9.5 Wave 6.5

已完成：

- provider-specific preflight guard。
- provider 即使可见，也因为 `unconfigured` 和 `disabled` 阻止执行。

### 9.6 Wave 6.6

已完成：

- artifact pin plan。
- required artifact 角色包括未来 weights、model config、tokenizer config、tokenizer vocabulary、pooling config。
- 默认 `unpinned` 且 `downloadEnabled: false`。
- 没有写入真实 URL、真实 revision、真实 SHA-256。

### 9.7 Wave 6.7

已完成：

- artifact pins 接入 readiness gate。
- `artifact.pins` 成为 formal provider configuration requirement。

### 9.8 Wave 6.8

已完成：

- runtime strategy 接入 readiness gate。
- `runtime.strategy` 成为 formal provider configuration requirement。

### 9.9 Wave 6.9

已完成：

- composition decision guard。
- 明确 readiness 通过不等于可以执行。
- 还需要 runtime registered、execution provider composed、explicit enablement。

### 9.10 Wave 6.10

已完成：

- manifest draft guard。
- draft 只是 audit artifact。
- 不能被解析成正式 `ModelManifest`。
- 阻止 artifact URL、revision、SHA-256、installable/downloadable 状态进入 draft。

### 9.11 Wave 6.11

已完成：

- immutable revision approval guard。
- 默认 `pending`。
- 阻止 `main`、`master`、`latest`、`HEAD` 等 floating revision。
- 没有写真实 revision。

### 9.12 Wave 6.12

已完成：

- artifact pin approval guard。
- 默认 `pending`。
- 阻止 floating artifact revision。
- 没有写真实 SHA-256、artifact URL 或 artifact filename。

### 9.13 Wave 6.13

已完成：

- license redistribution approval guard。
- 默认 `pending`。
- red-risk manifest 即使 approval record 标记 approved 也会被阻止。

### 9.14 Wave 6.14

已完成：

- benchmark resource profile approval guard。
- Lite、Standard、Local Enhanced 都必须记录 latency、memory、quality profile capture。
- 默认 `downloadEnabled: false`，`executionEnabled: false`。
- 没有真实 benchmark metric。

### 9.15 Wave 6.15

已完成：

- readiness checklist summary guard。
- 汇总 revision、artifact pins、runtime strategy、license、benchmark gates。
- summary 只暴露 gate status 和 sanitized reasons。

### 9.16 Wave 6.16

已完成：

- configuration checklist visibility guard。
- provider configuration report 只显示 sanitized blockers。
- 不暴露 revision、SHA-256、URL、artifact filename、benchmark metric。

### 9.17 Wave 6.17

已完成：

- `docs/phase-6-go-no-go.md`。
- 明确 current safe state、guard inventory、no-go rules、go criteria。

### 9.18 Wave 6.18

已完成：

- revision selection procedure guard。
- `docs/phase-6-revision-selection-procedure.md`。
- 候选 revision 可进入 ready-for-approval，但 procedure summary 不暴露具体 revision。

### 9.19 Wave 6.19

已完成：

- artifact pinning procedure guard。
- `docs/phase-6-artifact-pinning-procedure.md`。
- 从 approved revision 到 approved artifact pins 的人工流程已定义。
- procedure summary 不暴露 revision、SHA-256、artifact filename、URL。

Phase 6.19 当前验证：

- `npm run verify`：PASS。
- 52 个 test files。
- 270 个 tests。

Phase 6 当前意义：

- Jarvis-K 已经具备“接入第一个真实本地模型前必须经过的闸门系统”。
- 当前本地 embedding provider 是可见、可审计、可 preflight 的计划 provider，但不能执行。
- 这是正确状态：先把闸门、审批、可见性和失效保护做好，再谈真实模型文件和 runtime。

## 10. Hugging Face 头脑风暴后的结论

当时讨论的重点不是“马上接 Hugging Face”，而是评估 STT、TTS、OCR、Embedding、Reranker、Router、本地视觉、多设备分层、模型生命周期和商业许可证风险。最终架构决策如下。

### 10.1 总体结论

- 不应该在底座未稳定前直接下载模型、安装 runtime 或改生产链路。
- 正确顺序是先完成 Phase 4/5 的模型治理和 fixture 执行基线，再在 Phase 6 选择一个低风险真实 provider 做 readiness。
- 第一条真实 provider 路径应该选 embedding，而不是 Whisper、PaddleOCR、Kokoro 或本地视觉大模型。
- 云端大模型继续负责复杂推理、规划和重视觉任务。
- 本地模块优先负责低延迟、隐私敏感、可结构化验证的任务。
- 所有本地模型都必须走 provider interface、preflight、resource scheduler、lifecycle、license review、artifact pin 和 explicit enablement。

### 10.2 第一阶段最值得加入的三个模块

按当前 Jarvis-K 架构，最合理的第一阶段模块是：

1. 轻量 embedding + memory retrieval  
   价值最高，能直接增强长期记忆和历史检索，也是 Phase 6 当前路线。

2. 本地 STT 候选链路  
   可以显著改善语音体验和隐私，但需要 runtime packaging、VAD、流式/近实时、设备分层和模型大小策略，不能比 embedding 更早强行落地。

3. 普通截图 OCR  
   对屏幕理解和工具执行很关键，但应先做图片 OCR，不把 PDF 解析和复杂文档能力绑进第一步，避免 PyMuPDF/AGPL 风险。

当前代码已经选择了第 1 项作为 Phase 6 首条路径。

### 10.3 看起来很强但当前不该默认加入的模块

- `Qwen3-VL-8B` 或同级本地视觉大模型：资源重，低配不可用，适合高配或云端默认。
- 大型本地 LLM：不是当前目标，云端主模型仍负责复杂推理。
- 未经审核的社区量化模型：license、provenance、hash、runtime 风险不清。
- Kokoro 相关链路如果实际依赖 eSpeak NG：GPL-3.0 分发风险需要法律复核。
- PaddleOCR 的 PDF 能力如果依赖 PyMuPDF：AGPL/商业授权风险需要拆分。
- 任意 PowerShell 自动执行：必须禁止，工具执行只能走白名单、schema 校验、权限等级、用户确认和审计。

### 10.4 本地与云端职责划分

推荐本地优先：

- wake word。
- VAD。
- 短音频 STT，视设备能力而定。
- 基础 OCR 图片模式。
- embedding。
- 小型 intent/router。
- 权限判断、工具白名单、参数校验、审计。

推荐云端默认：

- 复杂推理。
- 复杂视觉理解。
- 大型多模态任务。
- 低配设备无法承载的 STT/TTS/OCR/embedding。
- 需要更高准确率的最终判断。

### 10.5 Provider 抽象需要覆盖的能力

已有或已规划的 provider 抽象不应只包含模型 provider，还需要：

- `SpeechToTextProvider`
- `TextToSpeechProvider`
- `OCRProvider`
- `EmbeddingProvider`
- `RerankerProvider`
- `IntentRouterProvider`
- `LLMProvider`
- `WakeWordProvider`
- `VADProvider`
- `ScreenCaptureProvider`
- `ToolExecutorProvider`
- `PermissionProvider`
- `MemoryStoreProvider`
- `DeviceCapabilityProvider`
- `ModelDownloadManager`
- `ModelLifecycleManager`

当前 Phase 4/5/6 已经把 embedding、OCR、intent routing、reranking、device capability、model lifecycle 和 provider availability 的基础路径搭起来。STT/TTS/wake word/OCR 真实 provider 后续应按同样模式加入。

### 10.6 设备分层结论

低配设备不能强行本地常驻大模型。

建议模式：

- Lite：8GB 内存或集显设备，以云端推理为主，本地只跑极轻能力或系统能力。
- Standard：16GB 内存设备，允许 embedding、轻量 OCR、轻量 STT 按需加载。
- Local Enhanced：32GB 内存加独显设备，允许更多本地模型按需加载，但仍需 resource scheduler。
- Private Offline：高配并且用户明确选择隐私离线模式，才考虑更完整本地链路。

首启不能只看显卡型号，需要测：

- CPU 推理速度。
- 可用内存。
- GPU/显存。
- CUDA、DirectML、OpenVINO、ONNX Runtime 支持。
- 磁盘空间。
- 网络速度。
- 模型加载时间。
- 短语音转录实时系数。

Phase 4 的 device capability 和 benchmark/resource profile gates 已经为这件事打底。

### 10.7 模型生命周期结论

Jarvis-K 主安装包不应包含所有大模型。

必须支持：

- 按需下载。
- 用户查看模型大小。
- 用户选择下载、更新、删除。
- 断点续传。
- 下载完成后 SHA-256 校验。
- 每个模型固定到不可变 revision/commit。
- 模型放到独立目录。
- 按需加载和释放。
- 显存不足时切换 CPU 或云端。
- 更新失败回滚。
- 卸载 Jarvis-K 时可选择是否保留模型和记忆。
- 商业版未来优先考虑自有 CDN mirror，不能长期依赖匿名 Hugging Face 下载。

Phase 4 lifecycle skeleton 和 Phase 6 artifact/revision guards 正是在为这套机制铺路。

### 10.8 License 和商业风险结论

不能只看 Hugging Face 顶部 license 标签。每个候选都需要分别核查：

- 模型权重 license。
- 推理代码 license。
- tokenizer license。
- G2P/phoneme 组件。
- Python 依赖。
- native DLL/EXE。
- CUDA、ONNX、DirectML runtime redistribution 条款。
- 社区 GGUF/ONNX/INT4 量化版本的来源和授权。
- 训练数据或声音数据可能带来的额外风险。
- 商标、声音人格权、隐私和署名要求。
- 本地自动下载是否合法。
- 放入安装包重新分发是否合法。
- 镜像到自有 CDN 是否合法。
- 提供收费 API 是否合法。
- 微调后重新分发是否合法。
- 是否要求公开 Jarvis-K 源码。
- 是否需要 LICENSE/NOTICE。

当前应特别小心：

- eSpeak NG 相关 GPL 风险。
- PyMuPDF 相关 AGPL/商业授权风险。
- 未经核查的社区量化版本。
- 模型文件、真实 revision、真实 hash 和 signed URL 泄漏到仓库。

## 11. 目前已经可以测试的功能

当前可以作为开发者测试的能力：

- Electron 桌面 HUD 启动。
- Core child process 在线、健康探针、受控重启。
- typed command IPC。
- 文本消息发送和 snapshot 展示。
- renderer reload 后恢复 Core snapshot。
- SQLite memory 持久化。
- conversation list/new/select/rename。
- active conversation 消息过滤。
- memory health 展示。
- memory snapshot export/import。
- corrupted memory DB 降级启动。
- PTT 语音路径和讯飞 RTASR provider 配置路径。
- 真实讯飞连接测试，但必须由用户本地授权并输入凭证。
- fixture inference：embedding、intent、OCR、reranking。
- provider availability、configuration requirement、preflight blockers。
- 本地 embedding planned provider 的 readiness visibility 和 fail-closed behavior。

建议本地测试命令：

```powershell
npm run verify
npm run smoke:desktop
npm run smoke:desktop:memory-degraded
npm run smoke:desktop:fixture-inference
```

真实讯飞测试只在用户明确授权并使用本地已轮换凭证时运行：

```powershell
npm run acceptance:xunfei
```

## 12. 当前不能宣称已经完成的功能

不要对外宣称以下能力已经生产可用：

- 真实本地 embedding 推理。
- 真实 Hugging Face 模型下载。
- 真实模型 artifact 管理。
- 真实 Transformers/Python/CUDA/ONNX/Paddle runtime。
- 本地 Whisper STT。
- 本地 Kokoro TTS。
- 本地 PaddleOCR。
- 本地 Qwen router。
- 本地 Qwen3-VL 或其它视觉大模型。
- wake word。
- Windows 自动化闭环执行。
- 任意 PowerShell 生成和执行。
- 长期记忆自动抽取、去重、敏感信息治理和用户可编辑管理。
- 面向普通用户的一键安装包。

当前 Phase 6 的本地 embedding provider 是“准备接入真实模型的闸门系统”，不是“已经能跑模型”。

## 13. 当前完成度判断

这是工程判断，不是市场发布口径：

- Phase 1 桌面 runtime：100%。
- Phase 2 语音 provider-neutral + 讯飞路径：100%。
- Phase 2.6 工程硬化：100%。
- Phase 3 本地 Memory/SQLite/conversation/maintenance：100%。
- Phase 4 capability/model governance 底座：100%。
- Phase 5 fixture-backed inference baseline：100%。
- Phase 6 本地 embedding readiness guards：约 85% 到 90%。还差真实 revision 审批、artifact pins 审批、runtime strategy 最终实现、license/benchmark 批准和 execution composition。
- 真实本地 embedding execution：0%，这是刻意保持的安全状态。
- 整体 Agent 底座完成度：约 75% 到 80%。
- 普通用户 alpha 产品完成度：约 45% 到 55%，主要还缺真实本地智能能力、工具执行权限系统、安装包、用户级设置体验和长期记忆治理。

## 14. 接下来应该做什么

### 14.1 立即事项

1. 先处理 GitHub 同步  
   当前 `main` 领先 `origin/main` 19 个提交。下一步应先把本地稳定节点 push 到 GitHub，并确认远端 CI 通过。如果 GitHub 仍提示上传失败，先排查网络、权限、远端大小限制、secret/artifact guard、LFS 或大文件问题。

2. 生成并提交本交接文档  
   本文档应作为新窗口接续开发的入口。

3. 打一个 Phase 6 readiness baseline  
   在 push 和 CI 通过后，建议打一个稳定标签，例如 `phase-6-readiness-guard-baseline`。标签名可再确认。

### 14.2 Phase 6 收口顺序

推荐继续按保守小波次推进：

1. Phase 6.20：runtime implementation procedure guard  
   只写流程和 guard，不引入 runtime dependency。明确未来 `@jarvis-k/inference-runtime-transformers-local` 的实现边界、helper process、Windows packaging、resource scheduler 接入、失败降级和验证 gate。

2. Phase 6.21：license review procedure guard  
   把模型权重、runtime、tokenizer、native dependency、redistribution、NOTICE/LICENSE 的人工审核流程固化为 provider-local guard。

3. Phase 6.22：benchmark capture procedure guard  
   定义 Lite、Standard、Local Enhanced 三类设备如何采集 latency/memory/quality/profile，不写真实 metric。

4. Phase 6 closeout  
   更新 `docs/phase-6-progress.md` 和 completion 文档，确认所有 guards、no-go rules、verification gates，然后打标签。

### 14.3 进入真实本地 embedding 测试前必须完成

真实本地 embedding 测试不能只靠“模型看起来 license 合适”。必须满足：

- 用户明确批准进入真实 revision-selection wave。
- 选择不可变 upstream revision，不使用 `main`、`latest`、`HEAD`。
- artifact list 完整。
- 每个 artifact 有 verified SHA-256。
- 没有 signed URL、token、credential-bearing URL。
- license/redistribution review approved。
- dedicated runtime package approved。
- runtime 不进入 Core/UI/Desktop/contracts/capabilities。
- Windows packaging 和 helper process supervision 方案通过。
- Lite/Standard/Local Enhanced benchmark profile 通过。
- `apps/core-host` 显式组合 runtime 和 execution provider。
- explicit execution enablement。
- `npm run verify`、boundary guard、sensitive-artifact guard、desktop smoke 和 provider-specific smoke 全部通过。

### 14.4 Phase 7 建议目标

Phase 7 不建议一上来做“大模型全家桶”。更合理的目标是“Alpha 可测试闭环”：

- 把已完成的桌面、语音、记忆、fixture inference、provider visibility 包装成可稳定启动的开发者 alpha。
- 加强设置页和状态页：语音凭证、memory path、provider readiness、当前模式、禁用原因。
- 加入 memory 管理 UX：查看、删除、导出、导入。
- 加入工具执行权限系统的 contracts/ports/fixture provider，而不是直接执行真实 Windows 操作。
- 如果 Phase 6 真实 embedding 已经通过所有 gate，再把 embedding retrieval 接入 memory recall。

## 15. 到什么位置可以交接和开始测试使用

### 15.1 现在就可以交接给开发者

只要本交接文档提交，并且本地 `npm run verify` 通过，就可以打开新窗口继续开发。当前项目状态已经足够清晰，边界也稳定。

开发者可测试范围：

- 桌面启动。
- Core 监督和重启。
- 文本会话。
- 本地 SQLite memory。
- conversation UI。
- memory snapshot import/export。
- memory degraded recovery。
- fixture inference。
- provider readiness/preflight visibility。
- 讯飞语音路径，前提是用户本地授权并配置凭证。

### 15.2 可以给普通用户试用前的最低门槛

建议至少满足：

- 19 个本地提交 push 到 GitHub。
- GitHub Actions CI 通过。
- 打 Phase 6 readiness baseline tag。
- `npm run verify` 通过。
- `npm run smoke:desktop` 通过。
- `npm run smoke:desktop:memory-degraded` 通过。
- `npm run smoke:desktop:fixture-inference` 通过。
- README 或测试说明明确：当前不包含真实本地模型执行。
- 语音凭证配置过程清楚，不泄漏任何密钥。
- 用户知道这是 developer alpha，不是最终商业安装包。

### 15.3 可以测试真实本地 embedding 前的最低门槛

必须先完成 Phase 6 的真实审批链：

- approved immutable revision。
- approved artifact pins。
- approved license redistribution review。
- approved runtime strategy。
- approved runtime package。
- approved benchmark profiles。
- provider-specific blocked/degraded/available tests。
- execution provider 在 `apps/core-host` 中显式组合。
- 仍然不能让 Core 直接依赖 runtime 或 provider。

## 16. 关键文件索引

文档：

- `docs/architecture.md`
- `docs/phase-0-1-results.md`
- `docs/phase-2-results.md`
- `docs/phase-2.6-hardening.md`
- `docs/phase-3-progress.md`
- `docs/phase-4-completion.md`
- `docs/phase-5-completion.md`
- `docs/phase-6-progress.md`
- `docs/phase-6-go-no-go.md`
- `docs/phase-6-revision-selection-procedure.md`
- `docs/phase-6-artifact-pinning-procedure.md`

核心代码：

- `packages/contracts/src`
- `packages/core/src/runtime.ts`
- `packages/voice/src`
- `packages/voice-adapter-xunfei/src`
- `packages/memory/src`
- `packages/memory-sqlite/src`
- `packages/capabilities/src`
- `packages/inference-adapter-fixture/src`
- `packages/inference-adapter-embedding-local/src`
- `apps/core-host/src/index.ts`
- `apps/desktop/src`
- `apps/ui/src`

测试和守卫：

- `scripts/check-boundaries.mjs`
- `scripts/check-sensitive-artifacts.mjs`
- `tests/desktop-smoke.mjs`
- `tests/desktop-memory-degraded-smoke.mjs`
- `tests/desktop-fixture-inference-smoke.mjs`
- `tests/real-xunfei-acceptance.mjs`

## 17. 继续开发时的硬约束

不要做：

- 不要修改 `E:\bailongma`。
- 不要修改 `C:\Users\Administrator\Jarvis-ui`。
- 不要提交凭证、API key、token、signed URL、真实模型文件、模型缓存。
- 不要把真实 revision/hash 写入文档或测试，除非用户明确批准进入对应 approval wave。
- 不要把 Python/CUDA/ONNX/Paddle/Transformers/llama.cpp 等 runtime 依赖加进 Core、Desktop、UI、contracts 或 capabilities。
- 不要让 Core 依赖 SQLite、Electron、React、`ws`、具体 provider 或具体模型 runtime。
- 不要让 UI 放业务策略。
- 不要让 Desktop 放 provider 策略。
- 不要让模型输出直接变成未验证的 PowerShell 或 Windows 操作。

必须做：

- 每个新能力先走 contracts/ports/schema。
- 具体 provider 只在 provider package 和 `apps/core-host` 组合。
- 每个 wave 更新对应 progress/completion 文档。
- 每个稳定节点运行验证并提交。
- 触碰 Core/Desktop startup、IPC 或 provider visibility 时跑 desktop smoke。
- 真实 provider 相关输出必须 sanitized，不暴露 secret、URL、digest、artifact filename 或本地私密路径。

## 18. 新窗口建议提示词

可以在新 Codex 窗口直接使用下面这段：

```text
你正在继续开发 Windows 桌面智能体 Jarvis-K。仓库在 E:\Jarvis-K，分支 main，当前本地 main 领先 origin/main 19 个提交，最新提交为 6c7e2d5 feat: add embedding artifact pinning guard。请先阅读 docs/jarvis-k-project-handoff-phase-1-to-6.19.md、docs/architecture.md、docs/phase-6-progress.md 和 docs/phase-6-go-no-go.md。

当前 Phase 1 到 Phase 5 已完成：桌面监督 Core runtime、讯飞语音路径、本地 SQLite Memory/conversation/snapshot、capability/model governance、fixture-backed inference baseline。Phase 6 已推进到 6.19，本地 embedding provider embedding.local.qwen3 只有 readiness/guard/procedure，不允许真实下载或执行。

下一步先检查 git status，然后优先处理 push 到 GitHub 和 CI；之后继续 Phase 6 收口，建议从 runtime implementation procedure guard 开始。保持低耦合：Core 不得依赖 SQLite/Electron/React/ws/具体 provider/模型 runtime，UI 只消费 DTO 和发送意图，Desktop 只做 IPC/security/safeStorage/supervision，apps/core-host 是唯一具体组合根。不要触碰 E:\bailongma 或 C:\Users\Administrator\Jarvis-ui，不要输出、写入、提交任何凭证、token、signed URL、真实模型 artifact、真实 revision/hash、Python/CUDA/ONNX/Paddle/Transformers runtime dependency，除非用户明确批准进入对应真实 provider approval wave。

每个稳定节点运行 npm run verify、npm run check:boundaries、npm run check:sensitive-artifacts；涉及桌面启动、IPC 或 provider visibility 时运行 npm run smoke:desktop、npm run smoke:desktop:memory-degraded、npm run smoke:desktop:fixture-inference。更新 docs/phase-6-progress.md 并提交。
```

## 19. 总结

Jarvis-K 现在已经不是原型 UI，而是一个低耦合、可监督、可持久化、可扩展 provider 的 Windows 桌面 Agent runtime。

当前最有价值的资产是：

- 稳定的 Electron/Core 监督边界。
- 真实语音 provider 接入经验。
- SQLite memory 和 conversation 持久化。
- model/capability governance。
- fixture-backed inference 端到端链路。
- Phase 6 对真实本地模型的安全闸门。

接下来最重要的不是急着跑模型，而是先把本地 19 个提交推到 GitHub，确认 CI 通过，然后把 Phase 6 的 runtime/license/benchmark procedure guards 收口成一个 readiness baseline。到了这个位置，Jarvis-K 可以正式进入 developer alpha 测试；真实本地 embedding 执行则必须等 revision、artifact、license、runtime、benchmark 和 composition 全部批准后再开始。
