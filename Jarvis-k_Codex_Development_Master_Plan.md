# Jarvis-k 开发总纲与 Codex 严格执行计划

> 文档性质：项目最高级开发规划、架构边界与验收标准  
> 适用对象：Codex、项目开发者、代码审查者  
> 当前目标平台：Windows 10/11  
> 当前技术栈：Electron、React、TypeScript、Node.js、Python 辅助运行时、SQLite  
> 文档版本：1.0  
> 制定日期：2026-08-10

---

## 0. Codex 必读指令

在对 Jarvis-k 进行任何开发之前，Codex 必须完整阅读本文档，并把本文档视为项目级最高优先级产品规划。若具体任务与本文档冲突，应停止实现并说明冲突，不得自行扩大范围。

Codex 必须遵守以下规则：

1. 当前最高优先级是形成真实用户闭环，不再以增加 Phase 编号、审批文档、preflight、fixture 或诊断类作为主要进展。
2. 每个里程碑必须产生用户能够实际体验、实际操作、实际验证的功能。
3. 优先实现最小真实路径，再补充必要的测试、安全边界和简洁文档。
4. 不得把模拟执行、接口定义、preflight 通过或 approval gate 完成描述为产品功能完成。
5. 未经明确要求，不得为一个小功能创建多份阶段文档、审批门或重复的抽象层。
6. 不得绕过现有 Electron 安全边界、IPC 验证、权限确认、凭证隔离和错误脱敏机制。
7. 不得让语言模型生成的任意 Shell、PowerShell、JavaScript 或系统命令未经验证直接执行。
8. 不得为了追求“通用”而同时扩展 Windows、macOS 和 Linux；当前只把 Windows 做深。
9. 每次开发都必须先检查现有实现，复用已有接口，避免重复建立同类模块。
10. 每次提交必须明确写出当前完成等级。

### 0.1 功能完成等级

所有开发结果必须使用以下等级描述：

| 等级 | 名称 | 定义 |
|---|---|---|
| L1 | Contract Ready | 数据结构、接口或协议已经定义 |
| L2 | Fixture Tested | 使用模拟实现完成测试 |
| L3 | Real Implementation | 已接入真实模型、真实操作系统或真实服务 |
| L4 | User-facing Integration | 用户能从正式 UI/语音入口实际使用 |
| L5 | Release Ready | 完成安全、安装、升级、兼容和真实端到端验收 |

只有达到 L4 才能在进度报告中写“功能可用”；只有达到 L5 才能写“功能完成”。

---

## 1. 产品愿景

Jarvis-k 不是另一个聊天机器人，也不是单纯的语音助手。Jarvis-k 的目标是成为：

> 一个运行在 Windows 上、以中文语音和自然语言为主要入口，能够理解用户目标、调用不同模型、操作本机软件、连接插件、执行多步骤任务，并允许用户定制角色与 UI 的个人智能体运行平台。

Jarvis-k 的长期核心价值不是绑定某个模型，而是建立一套稳定的：

- 任务协议；
- 能力协议；
- 插件协议；
- 权限协议；
- 模型路由机制；
- Windows 执行机制；
- 结果验证机制；
- 中断、恢复和撤销机制；
- 用户可控记忆；
- 中文本地化生态。

模型、语音服务、皮肤和插件都必须可以替换，而核心任务与安全系统保持稳定。

---

## 2. 产品目标

### 2.1 智能体底座

用户通过文字或语音下达指令。系统先使用规则和本地小模型理解意图，然后把任务分发给：

- 普通对话模型；
- Codex 编程执行器；
- Windows 本机执行器；
- 网络搜索执行器；
- 已安装插件；
- 多步骤任务规划器；
- 记忆与资料检索系统。

### 2.2 插件平台

提供固定、稳定、版本化的插件 SDK，让开发者可以开发：

- 股票分析；
- 电商助手；
- 客服助手；
- 企业内部系统连接器；
- 文件处理；
- 数据分析；
- 工作流自动化；
- 中国大陆本地服务适配。

插件平台必须兼顾 Jarvis 原生插件与 MCP 兼容，但所有外部工具都必须经过 Jarvis-k 权限层。

### 2.3 桌面助手与桌面宠物

Jarvis-k 可以缩小到桌面右下角，表现为类似 QQ 宠物的桌面角色。用户可以唤醒它并下达指令。桌面角色负责表达状态和提供快捷入口，完整配置仍由主控制台承担。

### 2.4 可换皮肤和社区

用户可以通过皮肤工坊修改颜色、字体、背景、布局预设、图标、宠物动画和音效，导出为安全的皮肤包并上传社区。皮肤不得拥有插件权限或执行代码。

### 2.5 中国大陆可用性

产品需要优先支持：

- 中文语音；
- 国内可访问的模型与服务；
- 国内下载镜像；
- 本地优先的数据处理；
- 中国常用软件与平台；
- 插件隐私和数据出境说明；
- 低配电脑和集显电脑的可用模式。

---

## 3. 总体架构

```text
Voice / Text / Desktop Event
            |
            v
Input Normalizer
            |
            v
Fast Router: Rules + Qwen 0.6B
            |
            +-----------------------------+
            |                             |
            v                             v
    Direct Capability              Task Planner
            |                             |
            +-------------+---------------+
                          v
                    Task Runtime
                          |
        +-----------------+------------------+
        |                 |                  |
        v                 v                  v
 Windows Executor    Model Agents       Plugin Runtime
        |                 |                  |
        +-----------------+------------------+
                          v
                  Result Validator
                          |
                          v
          UI / Voice Feedback / Memory
```

### 3.1 进程边界

继续保留当前合理分层：

- React Renderer：只负责显示和用户交互；
- Electron Desktop Host：窗口、托盘、IPC、权限、子进程监督、安全存储；
- Core Host：唯一具体依赖组合入口；
- Agent Core：任务、消息、路由和状态，不依赖具体提供商；
- Provider/Adapter：模型、语音、数据库和系统能力的具体实现；
- Plugin Runtime：插件独立进程或隔离 Worker；
- Python Runtime：仅用于确有必要的本地模型运行。

Renderer 不得直接获得 Node、文件系统、Shell、插件进程或模型凭证访问权。

---

## 4. 核心任务系统

当前 `tasks: []` 必须发展为真实任务运行时。简单命令可以只有一步，复杂命令由多个步骤组成。

### 4.1 Task 最小结构

```json
{
  "taskId": "task_123",
  "goal": "整理H200合同价格",
  "status": "running",
  "risk": "medium",
  "createdAt": "ISO-8601",
  "steps": [
    {
      "stepId": "step_1",
      "capability": "filesystem.search",
      "status": "completed"
    },
    {
      "stepId": "step_2",
      "capability": "document.extract",
      "status": "running"
    }
  ]
}
```

### 4.2 状态

- queued
- planning
- awaiting_confirmation
- running
- paused
- completed
- failed
- cancelled
- rolling_back
- rolled_back

### 4.3 必备能力

- 创建任务；
- 更新步骤；
- 暂停、继续、取消；
- 超时；
- 失败重试；
- 向用户询问缺失信息；
- 保存任务状态；
- 应用重启后恢复可恢复任务；
- 记录真实执行结果，而不是只记录计划。

---

## 5. 双层路由系统

### 5.1 第一层：快速路由

按以下顺序执行：

1. 确定性规则；
2. 用户快捷命令；
3. Qwen3-0.6B 意图分类；
4. 低置信度时交给复杂规划模型或向用户询问。

首版意图集合控制在 10～20 个，例如：

- chat.general
- desktop.open_app
- desktop.control_app
- filesystem.search
- filesystem.open
- browser.open
- web.search
- coding.task
- plugin.invoke
- workflow.run
- task.complex
- system.settings
- unknown

### 5.2 路由输出

路由器只允许输出经过 Schema 验证的 JSON：

```json
{
  "intent": "desktop.open_app",
  "target": "notepad",
  "arguments": {},
  "confidence": 0.97,
  "risk": "low",
  "requiresConfirmation": false
}
```

路由模型不得直接输出或执行 Shell 命令。

### 5.3 第二层：规划器

只处理：

- 多步骤任务；
- 模糊任务；
- 需要组合多个插件的任务；
- 执行失败后的重新规划；
- 需要视觉或文件上下文的任务。

规划器必须输出步骤计划，由 Task Runtime 逐步执行；不得拥有绕过权限层的直接执行通道。

---

## 6. 模型资源池

Jarvis-k 不追求单一模型包打天下。模型通过统一 Provider 接口接入并可替换。

| 能力 | 首选方案 | 运行策略 |
|---|---|---|
| 意图路由 | Qwen3-0.6B | 规则优先，小模型常驻或缓存 |
| Embedding | Qwen3-Embedding-0.6B | 按需或缓存 |
| 普通对话 | 可配置本地/云端模型 | 按用户模式选择 |
| 复杂规划 | 强云端模型或本地较大模型 | 仅复杂任务调用 |
| 编程 | Codex 专业执行器 | 仅 coding.task |
| ASR | 讯飞＋后续本地 ASR | 监听时启用 |
| TTS | 本地/国内云端可配置 | 按需 |
| OCR | 小型 OCR Provider | 按需 |
| 屏幕理解 | 多模态 Provider | 必要时调用 |
| Reranker | 小型排序模型 | 候选较多时调用 |

### 6.1 硬件模式

- 轻量模式：规则＋0.6B CPU＋云端复杂模型；
- 标准模式：本地路由、Embedding、ASR，复杂任务用云端；
- 增强模式：适配 16GB 显存和 64GB 内存，本地 4B/8B、视觉、ASR/TTS 按需加载；
- 自定义模式：高级用户手动配置。

不得让多个非必要模型长期同时占用显存。模型生命周期必须支持加载、健康检查、空闲缓存和释放。

---

## 7. Windows 操作执行架构

按稳定性优先级选择执行方式：

1. Windows/System API；
2. Windows UI Automation；
3. 浏览器 DOM、浏览器扩展或 Playwright；
4. 截图＋视觉模型＋鼠标键盘模拟。

不得默认使用视觉坐标点击代替可用的系统 API、UIA 或 DOM。

### 7.1 第一批真实工具

- desktop.open_app
- browser.open_url
- filesystem.search
- filesystem.open
- window.focus
- window.minimize
- clipboard.write（需权限）
- notepad.write_text

### 7.2 执行级别

- Observe：只能读取；
- Draft：只能生成草稿或副本；
- Act：允许一般副作用；
- Commit：发送、删除、付款、发布、提交订单等高风险操作。

Commit 操作必须明确展示参数并由用户确认。金融交易、付款、凭证变更等不得默认自动执行。

### 7.3 撤销机制

工具必须声明：

- 是否有副作用；
- 是否可撤销；
- 撤销窗口；
- 回滚方式；
- 是否必须确认。

优先采用保存副本、回收站、草稿、Git checkpoint、修改前快照和数据库事务。

---

## 8. 插件平台

### 8.1 组成

```text
Jarvis Plugin Platform
├── Plugin SDK
├── Plugin Registry
├── Plugin Runtime
├── Permission Broker
├── Capability Catalog
├── MCP Adapter
└── Community Client
```

### 8.2 插件 Manifest 示例

```json
{
  "schemaVersion": 1,
  "id": "cn.jarvis-k.stock-analysis",
  "name": "股票分析助手",
  "version": "1.0.0",
  "apiVersion": "1",
  "entry": "dist/main.js",
  "capabilities": [
    {
      "name": "stock.quote",
      "description": "查询股票实时报价",
      "inputSchema": "schemas/stock-quote-input.json",
      "outputSchema": "schemas/stock-quote-output.json"
    }
  ],
  "permissions": [
    "network:quotes.example.cn",
    "storage:plugin"
  ],
  "runtime": "node-worker"
}
```

### 8.3 插件安全原则

- 插件独立进程或隔离 Worker；
- 默认没有文件、网络、屏幕、剪贴板和系统执行权限；
- 只开放 Manifest 声明且用户批准的权限；
- 输入和输出都必须 Schema 验证；
- 网络域名 allowlist；
- 超时、速率限制和审计日志；
- 插件存储相互隔离；
- 插件不能直接访问其他插件数据；
- 插件不能绕过 Core 调用操作系统；
- MCP 工具仍必须经过 Jarvis 权限层。

### 8.4 插件 UI

插件可以返回 Jarvis-k 支持的安全 UI 卡片，例如表格、图表、表单、股票报价和商品对比。首版不得允许插件向主界面注入任意 React、HTML 或 JavaScript。

### 8.5 首批示例插件

1. 股票报价与基础分析插件；
2. 商品搜索与价格比较插件。

两个示例插件必须成为第三方开发文档的参考实现。

---

## 9. 工作流与示教模式

除正式插件外，Jarvis-k 应支持普通用户创建和分享工作流。

### 9.1 自然语言快捷技能

示例：

> 以后我说“检查 IZYtoken”，就检查服务器状态、429、502 和客户余额。

系统生成工作流草稿，向用户展示步骤，确认后保存。

### 9.2 示教模式

用户开启“学习我接下来的操作”，Jarvis 记录经允许的：

- 打开的程序；
- UIA 控件；
- 输入字段类型；
- 文件变化；
- 剪贴板变化；
- 确认点。

系统生成参数化工作流。录制时必须过滤密码、Token、银行卡和其他敏感信息。

此功能属于后期创新方向，不得早于真实工具闭环和 Plugin SDK。

---

## 10. 记忆系统

记忆分为：

- 当前对话；
- 当前任务；
- 用户偏好；
- 人物、公司和项目实体；
- 工作流程；
- 文件索引；
- 历史任务。

向量数据库只负责语义检索，不代表完整记忆系统。

### 10.1 用户控制

用户必须能够：

- 查看记忆；
- 编辑记忆；
- 删除记忆；
- 禁止记录；
- 设置仅当前会话；
- 设置过期时间；
- 控制插件访问范围；
- 导出和导入。

系统不得默认把所有屏幕、语音和文件内容长期保存。

### 10.2 当前优先级

现有 SQLite 与 Embedding 基础已经足够支持早期版本。在完成真实任务闭环前，不继续大规模扩展 Memory approval gate、测试人群扩张或新的向量基础设施。

---

## 11. 语音系统

完整链路：

```text
Wake Word → VAD → ASR → Router → Task/Tool → Result → TTS
```

必须支持：

- 按键说话；
- 唤醒词；
- 连续监听的明确开关；
- 部分转录显示；
- 说完自动提交；
- TTS 播放；
- 用户打断；
- 麦克风和隐私状态可见；
- 离线/云端方案切换；
- ASR 失败后的文字输入降级。

讯飞可作为早期国内联网方案，但长期需要可替换的本地 ASR Provider。

---

## 12. 桌面宠物与界面

Jarvis-k 提供三个界面层级：

| 界面 | 作用 |
|---|---|
| 宠物窗口 | 透明、小型、置顶、拖动、状态表达、唤醒入口 |
| 快捷面板 | 对话、任务进度、确认、结果 |
| 完整控制台 | 插件、模型、记忆、权限、皮肤和系统设置 |

宠物状态至少包括：

- idle
- listening
- thinking
- speaking
- executing
- awaiting_confirmation
- success
- error
- sleeping
- privacy_locked

角色人格可以影响语言风格、TTS 音色、动画和主动程度，但不能改变权限与安全策略。

---

## 13. 皮肤系统与皮肤社区

### 13.1 资产分类

- Theme：颜色、字体、圆角、阴影；
- Layout：经过允许的布局预设和参数；
- Skin：主题、图片、图标、宠物和音效组合；
- Custom UI App：可执行自定义 UI，首版禁止，未来另行设计沙箱。

### 13.2 皮肤安全原则

普通皮肤只能包含 Manifest、JSON 配置和静态资源，不得包含：

- JavaScript；
- 外部 URL；
- 任意 HTML；
- 任意 CSS 导入；
- iframe；
- 带脚本 SVG；
- Electron IPC；
- 文件、网络或插件权限。

### 13.3 `.jkskin` 结构

```text
skin-name.jkskin
├── manifest.json
├── theme.json
├── layout.json
├── assets/
├── pet/
└── sounds/
```

### 13.4 Theme Engine

现有 UI 已使用 CSS Variables，应首先实现：

- Theme Schema；
- 三套内置主题；
- Theme Provider；
- 实时切换；
- 本地保存；
- 无效主题自动恢复默认值。

### 13.5 Skin Studio

后期提供：

- 颜色编辑；
- 字体和圆角；
- 背景；
- 布局预设；
- 聊天气泡；
- 宠物动画；
- 音效；
- 实时预览；
- 隐私元数据清理；
- 导出 `.jkskin`；
- 上传社区。

### 13.6 社区审核

上传端必须检查路径穿越、解压炸弹、文件数量、文件大小、MIME、SVG/Lottie 外部资源、病毒、Manifest、版本兼容、版权声明和 SHA-256 文件清单。

---

## 14. 主动助手与场景模式

长期可以支持：

- 编程模式；
- IZYtoken 运营模式；
- 股票模式；
- 电商模式；
- 日常助手模式。

不同场景可以调整快捷入口、默认工具、皮肤和模型，但不能改变全局安全策略。

主动程度分为：

- 安静：只在用户唤醒时工作；
- 标准：只提醒重要事件；
- 主动：提供有限工作建议；
- 勿扰：完全不主动。

主动助手不得演变成广告系统，不得未经允许持续扫描用户屏幕和文件。

---

## 15. 可观测性与隐私

保留当前良好的错误脱敏与进程监督基础，但可观测性应服务于真实产品问题。

必须记录：

- 任务 ID；
- 路由结果和置信度；
- 选中的能力；
- 权限决策；
- 执行耗时；
- 成功/失败分类；
- 是否经过用户确认；
- 是否执行回滚。

不得记录：

- API Key；
- 密码；
- 完整认证头；
- 未经允许的屏幕原图；
- 未经允许的完整文件内容；
- 模型生成的敏感 Shell 内容；
- 插件私有数据。

---

## 16. 真实评测体系

现有单元测试继续保留，但项目核心指标改为真实任务成功率。

### 16.1 路由评测

建立至少 300 条、逐步扩展到 1000 条中文测试集，覆盖：

- 口语；
- 错别字；
- 中英混合；
- 模糊表达；
- 多意图；
- 危险命令；
- 插件缺失；
- 低置信度。

指标：意图准确率、参数准确率、错误拒绝率、危险操作拦截率、延迟。

### 16.2 Windows 操作评测

固定真实任务：

- 打开记事本并输入指定文字；
- 打开指定 URL；
- 找到指定文件；
- 聚焦、最小化和恢复窗口；
- 读取 UIA 控件；
- 中途窗口变化后的恢复。

### 16.3 端到端评测

测量：

```text
唤醒成功率 → ASR 准确率 → 路由准确率 → 工具成功率
→ 结果验证成功率 → TTS/界面反馈成功率
```

---

## 17. 严格开发路线

### Milestone 1：真实文字命令闭环

目标：用户输入文字后，Jarvis 能真实选择能力、执行并返回结果。

范围：

- 规则路由；
- Task 基础状态；
- 打开记事本；
- 打开 URL；
- 打开 VS Code；
- 文件搜索；
- 普通问答 Provider；
- 真实 assistant 消息；
- UI 显示执行状态和结果。

验收场景：

1. “打开记事本”真实打开 Notepad；
2. “打开 IZYtoken 官网”真实打开网页；
3. “帮我找桌面上的合同”返回真实文件候选；
4. “什么是 API 中转站”得到真实模型回答；
5. 错误时 UI 显示可理解的失败原因。

完成门槛：全部达到 L4，真实 Windows 端到端手工验收通过。

### Milestone 2：Qwen 本地路由器

范围：

- 接通 Qwen3-0.6B；
- JSON Schema 输出；
- 置信度；
- 参数提取；
- 规则优先；
- 低置信度询问或云端兜底；
- 300 条中文评测集。

完成门槛：真实模型达到 L4；不得用 Qwen3-Embedding 冒充路由模型。

### Milestone 3：真实 Windows 执行层

范围：

- System API；
- Windows UI Automation；
- 窗口发现；
- 控件 inspect/search/invoke/set-value；
- 权限确认；
- 超时；
- 结果验证；
- 基础撤销。

完成门槛：至少五个固定 Windows 真实任务连续通过。

### Milestone 4：Plugin SDK Alpha

范围：

- Manifest；
- Registry；
- 安装、启用、禁用、卸载；
- 独立运行时；
- 权限 Broker；
- Capability Catalog；
- 输入/输出 Schema；
- 股票与电商两个真实示例插件；
- MCP 适配器最小版本。

完成门槛：第三方可以仅阅读文档完成一个新插件，并被 Jarvis 路由和调用。

### Milestone 5：皮肤 Phase 1

范围：

- Theme Schema；
- 三套内置主题；
- 实时切换；
- 本地保存；
- 默认恢复；
- 不执行任意代码。

完成门槛：用户可在正式 UI 中切换并持久化主题。

### Milestone 6：完整语音闭环

范围：

- 唤醒词；
- VAD；
- ASR；
- 路由；
- 工具/插件执行；
- TTS；
- 打断；
- 隐私状态。

完成门槛：从语音唤醒到真实完成“打开记事本并输入一段文字”的端到端验收通过。

### Milestone 7：桌面宠物

范围：

- 系统托盘；
- 透明无边框窗口；
- 置顶；
- 拖动和贴边；
- 状态动画；
- 点击打开快捷面板；
- 开机启动选项；
- 低资源模式。

### Milestone 8：皮肤包与皮肤工坊

范围：

- `.jkskin`；
- 导入/导出；
- 静态资源验证；
- 宠物和声音包；
- 可视化编辑；
- 实时预览；
- 本地发布包生成。

### Milestone 9：社区与生态

范围：

- 插件、工作流、皮肤、宠物、声音包分类；
- 上传、审核、下载、更新；
- 评分、举报；
- 作者主页；
- 签名与安全扫描；
- 后续再评估付费与分成。

---

## 18. 当前明确暂停事项

在 Milestone 1～4 完成前，暂停或严格限制：

- 新的 Memory tester expansion；
- 更多 embedding approval gate；
- 重复的 preflight/diagnostic/closeout 文档；
- 多智能体自由协商；
- 完全自治长时间 Agent；
- 自训基础大模型；
- macOS/Linux 支持；
- 插件支付和创作者分成；
- 任意 React/JavaScript 皮肤；
- 自动股票交易；
- 无确认发送邮件或消息；
- 多个大模型同时常驻；
- 仅为未来假设创建的过度抽象。

---

## 19. 每个 Codex 开发任务的标准流程

### 19.1 开始前

Codex 必须输出：

1. 本任务属于哪个 Milestone；
2. 用户可见结果是什么；
3. 预计达到 L1～L5 哪一级；
4. 将复用哪些现有模块；
5. 本任务明确不做什么；
6. 真实验收方式。

### 19.2 实现顺序

1. 检查现有代码与边界；
2. 实现最小真实路径；
3. 将路径接入正式 Core、Desktop 和 UI；
4. 增加必要单元测试；
5. 增加至少一个真实集成或端到端测试；
6. 执行 build、typecheck、test；
7. 在 Windows 环境完成真实手工验收；
8. 更新一份主进度记录，避免新增重复文档。

### 19.3 结束报告模板

```text
Milestone:
完成等级: L1/L2/L3/L4/L5

用户现在可以：
- ...

真实实现：
- ...

模拟或尚未接通部分：
- ...

验证结果：
- build:
- typecheck:
- unit tests:
- integration tests:
- Windows manual acceptance:

已知限制：
- ...

下一项最小真实工作：
- ...
```

不得用“框架已准备好”“preflight 通过”“未来可以接入”替代用户可用结果。

---

## 20. 首个应立即交给 Codex 的任务

```text
请完整阅读《Jarvis-k 开发总纲与 Codex 严格执行计划》，然后执行
Milestone 1 的第一个纵向切片：

“用户在正式 React UI 输入‘打开记事本’，Agent Core 通过规则路由生成
desktop.open_app 结构化调用，权限层判定为低风险，真实 Windows 执行器
打开 Notepad，Task Runtime 记录步骤状态，UI 显示执行中和完成结果。”

要求：
1. 必须使用真实 Windows 执行，不得只使用 fixture。
2. 必须接入正式 UI → Electron IPC → Core Host → Core → Tool Executor 路径。
3. 不得新建 Phase 文档、approval request 或与功能无关的 preflight 类。
4. 保留现有安全边界和 Schema 验证。
5. 非 Windows 环境允许单元测试使用 fixture，但 Windows 正式路径必须真实存在。
6. 给出 Windows 手工验收步骤。
7. 完成报告必须标注 L1～L5 等级，不能把 fixture 测试称为功能完成。
```

---

## 21. 最终成功标准

Jarvis-k 第一阶段成功，不以代码行数、测试数量、Phase 数量或文档数量衡量，而以普通用户能否稳定完成以下体验衡量：

1. 唤醒桌面上的 Jarvis；
2. 用中文说出目标；
3. Jarvis 正确理解并选择模型、工具或插件；
4. 对敏感操作明确请求确认；
5. 在 Windows 上完成真实操作；
6. 验证执行结果；
7. 通过宠物、快捷面板或语音反馈结果；
8. 失败时解释原因并可以重试、修改或撤销；
9. 用户可以安装插件扩展能力；
10. 用户可以更换或制作皮肤和宠物外观；
11. 低配电脑能够使用轻量模式；
12. 核心数据和权限始终由用户控制。

当以上闭环真实成立时，Jarvis-k 才从“优秀的智能体基础设施项目”成为“真正可用的桌面智能体产品”。
