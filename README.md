# AgentAction

AgentAction 是一个本地优先的多智能体任务宿主。`v0.1` 首版已经落下：

- 独立 Node.js daemon 控制面
- Electron + Vue3 桌面客户端
- 任务容器、轻量编队卡、结果卡主链路
- 角色库、装备库、运行时接入页、资产页
- 官方案例任务卡、角色、装备和运行时种子数据
- SQLite 持久化、HTTP/WebSocket API、事件推送
- 纯文本导入预览（skill / MCP）
- GitHub 运行时元数据与一键 clone 接入（当前覆盖 OpenClaw）

## 技术结构

```text
apps/
  daemon/   # 本地控制面
  desktop/  # Electron + Vue3
  relay/    # 轻中继 stub
packages/
  shared/
  task-engine/
  plugin-core/
  runtime-core/
plugins/
  equipment/
  runtimes/
  templates/
```

## 开发

```bash
pnpm install
pnpm dev
```

默认端口：

- daemon: `http://127.0.0.1:4318`
- desktop renderer dev server: `http://127.0.0.1:5173`
- relay: `http://127.0.0.1:4328`

## 构建

```bash
pnpm build
pnpm package:desktop
```

## 当前实现范围

当前仓库是对中文方案的首个可运行实现，重点先把以下内容打透：

- 任务大厅四张案例卡
- 轻量编队卡
- 任务详情页
- `/btw` 显式分枝
- 插话排队与队列管理
- 主审送审 / 打回 / finish
- 主结果卡与现场资产提炼
- 运行时接入骨架

更深的智能体 hack、飞书桥接、镜像调度 provider、电脑执行 provider 还留在下一轮迭代中继续补完。

## GitHub 接入

当前运行时页已经内置官方 GitHub 源信息：

- Codex: `https://github.com/openai/codex`
- OpenClaw: `https://github.com/openclaw/openclaw`
- Claw-Code: `https://github.com/ultraworkers/claw-code`

其中 `OpenClaw` 已支持通过 daemon 一键浅克隆到 `plugins/runtimes/clones/openclaw` 并刷新运行时状态。
