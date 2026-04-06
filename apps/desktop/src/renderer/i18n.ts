import { computed } from "vue";
import type { AppLocale } from "@/stores/shell";
import { useShellStore } from "@/stores/shell";

type UiCopy = Record<string, string>;

const uiCopy: Record<AppLocale, UiCopy> = {
  "zh-CN": {
    "app.name": "AgentAction",
    "app.subtitle": "派任务，收结果",
    "app.summary": "让两只 AI 牛马自己 battle，直到出结果。",
    "nav.dashboard": "任务大厅",
    "nav.roles": "角色库",
    "nav.equipment": "装备库",
    "nav.runtimes": "智能体接入",
    "nav.assets": "结果与资产",
    "nav.settings": "设置",
    "shell.status": "当前状态",
    "shell.tasks": "任务",
    "shell.roles": "角色",
    "shell.defaultRuntime": "助手",
    "shell.connected": "已连接",
    "shell.connecting": "连接中",
    "shell.footer": "当前助手：{runtime}",

    "language.title": "选择语言",
    "language.subtitle": "首次进入先选择语言，当前只支持中文和英文。",
    "language.zh": "中文",
    "language.en": "English",

    "onboarding.step": "新手引导 {current}/{total}",
    "onboarding.skip": "跳过引导",
    "onboarding.next": "下一步",
    "onboarding.finish": "开始进入软件",
    "onboarding.hero.title": "把任务派下去，等 battle 出结果。",
    "onboarding.hero.subtitle":
      "这里重点不是聊天，而是让两个 AI 持续推进任务，直到拿回成品。",
    "onboarding.hero.battle": "结对 battle",
    "onboarding.hero.recording": "录制态演示",
    "onboarding.hero.outputs": "将生成",
    "onboarding.hero.output1": "可运行程序",
    "onboarding.hero.output2": "PPT",
    "onboarding.hero.output3": "批注文档",
    "onboarding.hero.tip1": "自动化全流程推进",
    "onboarding.hero.tip2": "异常时自动继续修正",
    "onboarding.hero.tip3": "最终收束成可交付结果",
    "onboarding.why.title": "为什么会省心",
    "onboarding.why.point1": "任务会自己推进",
    "onboarding.why.point1Desc": "用户不用反复盯着回车和刷新。",
    "onboarding.why.point2": "结果会有人审",
    "onboarding.why.point2Desc": "不只是执行，还会 battle 到可交付。",
    "onboarding.why.point3": "finish 后再通知你",
    "onboarding.why.point3Desc": "你可以挂机，回来看成品。",
    "onboarding.tasks.title": "第一阶段先把这 4 个真实需求打磨好",
    "onboarding.tasks.subtitle": "这些不是案例摆设，而是普通用户真正会点的任务入口。",
    "onboarding.cta.title": "进入首页后，你可以先看 battle，再决定派什么任务。",
    "onboarding.cta.subtitle": "只要没跳过或没完成引导，下次打开仍会先进入这里。",

    "home.title": "派遣一个任务，让两只AI牛马自己battle，直到出结果",
    "home.subtitle": "从真实需求开始。",
    "home.primaryCta": "开始任务",
    "home.secondaryCta": "查看角色",
    "home.overview": "当前进度",
    "home.running": "执行中",
    "home.review": "待验收",
    "home.defaultRuntimePanel": "正在推进",
    "home.runtimeReady": "可用",
    "home.runtimePending": "待检查",
    "home.latestTask": "最近任务",
    "home.noTask": "暂无任务",
    "home.noTaskDesc": "创建任务后会显示在这里",
    "home.roles": "角色",
    "home.rolesSubtitle": "当前角色",
    "home.templates": "任务模板",
    "home.templatesSubtitle": "先选一个真实需求",

    "dispatch.title": "轻量编队卡",
    "dispatch.start": "一键配置并开始",
    "dispatch.starting": "正在创建任务...",
    "dispatch.roles": "推荐角色",
    "dispatch.rolesSubtitle": "确认这次由谁执行",
    "dispatch.equipment": "推荐配置",
    "dispatch.equipmentSubtitle": "确认这次要带的配置",
    "dispatch.materials": "任务所需资料",
    "dispatch.materialsSubtitle": "缺少的资料会继续追问",
    "dispatch.recommendedOnly": "只推荐，不自动装",

    "task.runtime": "当前助手",
    "task.finishDiscipline": "交付状态",
    "task.enabled": "开启",
    "task.disabled": "关闭",
    "task.share": "分享",
    "task.requestReview": "送审",
    "task.reject": "打回",
    "task.finish": "finish",
    "task.status": "进度",
    "task.events": "消息",
    "task.session": "当前对话",
    "task.sessionReady": "已连接",
    "task.sessionMissing": "未连接",
    "task.compact": "上下文整理",
    "task.compactSeen": "已整理",
    "task.compactNone": "未整理",
    "task.contract": "交付内容",
    "task.contractReady": "已提交",
    "task.contractPending": "待提交",
    "task.workspace": "主工作区",
    "task.workspaceSubtitle": "当前任务正在推进",
    "task.composerPlaceholder": "继续补充资料，或告诉系统接下来要做什么...",
    "task.queue": "排队插话",
    "task.branch": "显式 /btw",
    "task.send": "发到主线",
    "task.sideThreads": "旁枝线程",
    "task.sideThreadsSubtitle": "需要时再展开细问",
    "task.noBranch": "当前没有旁枝。",
    "task.contractTitle": "交付内容",
    "task.contractSubtitle": "当前任务准备交付的结果",
    "task.contractEmpty": "当前还没有准备好的交付内容。",
    "task.needsReview": "需要主审",
    "task.directFinish": "可直接收束",
    "task.assets": "现场资产",
    "task.assetsSubtitle": "从这次任务里收下来的东西",
    "task.shares": "分享记录",
    "task.sharesSubtitle": "这次任务分享出去的记录",

    "result.card": "主结果卡",
    "result.attachments": "附属产物",
    "result.extractArtifact": "提炼为产物",
    "result.extractMemory": "提炼记忆",
    "result.extractSkill": "提炼技能",

    "queue.title": "插话队列",
    "queue.subtitle": "新消息会先排队",
    "queue.promote": "转 /btw",
    "queue.cancel": "取消",
    "queue.empty": "当前没有排队消息。",

    "runtimes.title": "查看当前可用的智能体与接入状态。",
    "runtimes.subtitle": "在这里确认助手是否可用，或补充新的接入来源。",
    "runtimes.check": "检查可用性",
    "runtimes.clone": "一键 clone 接入",
    "runtimes.github": "打开 GitHub",

    "assets.title": "结果与资产",
    "assets.subtitle": "按任务回看，也能继续筛选。",
    "assets.filters.tasks": "全部任务",
    "assets.filters.roles": "全部角色",
    "assets.filters.kinds": "全部类型",
    "assets.kind.artifact": "产物",
    "assets.kind.memory": "记忆",
    "assets.kind.skill": "技能",

    "settings.title": "设置",
    "settings.subtitle": "语言、引导和基础设置都在这里。",
    "settings.language": "语言",
    "settings.languageDesc": "当前第一阶段只支持中文和英文。",
    "settings.onboarding": "新手引导",
    "settings.onboardingDesc": "可以重新查看引导页。",
    "settings.onboardingReset": "重新打开新手引导",
    "settings.providers": "当前模型来源"
  },
  "en-US": {
    "app.name": "AgentAction",
    "app.subtitle": "Dispatch and Deliver",
    "app.summary": "Dispatch one task and let two AI workers battle until a result lands.",
    "nav.dashboard": "Dashboard",
    "nav.roles": "Roles",
    "nav.equipment": "Loadout",
    "nav.runtimes": "Agents",
    "nav.assets": "Results & Assets",
    "nav.settings": "Settings",
    "shell.status": "Current Status",
    "shell.tasks": "Tasks",
    "shell.roles": "Roles",
    "shell.defaultRuntime": "Assistant",
    "shell.connected": "Connected",
    "shell.connecting": "Connecting",
    "shell.footer": "Current assistant: {runtime}",

    "language.title": "Choose Language",
    "language.subtitle": "Pick your language first. Phase one supports Chinese and English only.",
    "language.zh": "中文",
    "language.en": "English",

    "onboarding.step": "Onboarding {current}/{total}",
    "onboarding.skip": "Skip",
    "onboarding.next": "Next",
    "onboarding.finish": "Enter Workspace",
    "onboarding.hero.title": "Dispatch the task and wait for the battle result.",
    "onboarding.hero.subtitle":
      "This is about pushing work forward until delivery, not just chatting with AI.",
    "onboarding.hero.battle": "Paired Battle",
    "onboarding.hero.recording": "Recorded Demo",
    "onboarding.hero.outputs": "Expected Outputs",
    "onboarding.hero.output1": "Runnable app",
    "onboarding.hero.output2": "PPT deck",
    "onboarding.hero.output3": "Annotated document",
    "onboarding.hero.tip1": "Workflow keeps moving on its own",
    "onboarding.hero.tip2": "Agents keep repairing when things go wrong",
    "onboarding.hero.tip3": "Final output lands as a deliverable result",
    "onboarding.why.title": "Why it feels lighter",
    "onboarding.why.point1": "Tasks keep moving",
    "onboarding.why.point1Desc": "You do not need to babysit every enter key.",
    "onboarding.why.point2": "Someone still reviews the work",
    "onboarding.why.point2Desc": "Execution and review keep pushing toward delivery.",
    "onboarding.why.point3": "You only return at finish",
    "onboarding.why.point3Desc": "The system notifies you when the work is ready.",
    "onboarding.tasks.title": "Phase one sharpens four real tasks",
    "onboarding.tasks.subtitle": "These are the main entry points, not decorative examples.",
    "onboarding.cta.title": "Start by watching one battle, then dispatch your own task.",
    "onboarding.cta.subtitle": "Until you skip or finish onboarding, it opens every time.",

    "home.title": "Dispatch one task and let two AI workers battle until a result lands.",
    "home.subtitle": "Start from a real need.",
    "home.primaryCta": "Start Task",
    "home.secondaryCta": "View Roles",
    "home.overview": "Current Progress",
    "home.running": "In Progress",
    "home.review": "Pending Review",
    "home.defaultRuntimePanel": "Now Running",
    "home.runtimeReady": "Available",
    "home.runtimePending": "Pending",
    "home.latestTask": "Latest Task",
    "home.noTask": "No task yet",
    "home.noTaskDesc": "New tasks will appear here.",
    "home.roles": "Roles",
    "home.rolesSubtitle": "Current roles",
    "home.templates": "Task Templates",
    "home.templatesSubtitle": "Pick one real-world task",

    "dispatch.title": "Quick Dispatch",
    "dispatch.start": "Apply and Start",
    "dispatch.starting": "Creating task...",
    "dispatch.roles": "Recommended Roles",
    "dispatch.rolesSubtitle": "Confirm who will handle this run",
    "dispatch.equipment": "Recommended Setup",
    "dispatch.equipmentSubtitle": "Confirm what should be equipped",
    "dispatch.materials": "Required Materials",
    "dispatch.materialsSubtitle": "Missing materials will be requested next",
    "dispatch.recommendedOnly": "Suggested only",

    "task.runtime": "Current Assistant",
    "task.finishDiscipline": "Delivery Status",
    "task.enabled": "On",
    "task.disabled": "Off",
    "task.share": "Share",
    "task.requestReview": "Review",
    "task.reject": "Send Back",
    "task.finish": "Finish",
    "task.status": "Progress",
    "task.events": "Messages",
    "task.session": "Current Conversation",
    "task.sessionReady": "Connected",
    "task.sessionMissing": "Not Connected",
    "task.compact": "Context Cleanup",
    "task.compactSeen": "Done",
    "task.compactNone": "Not Yet",
    "task.contract": "Delivery",
    "task.contractReady": "Submitted",
    "task.contractPending": "Pending",
    "task.workspace": "Workspace",
    "task.workspaceSubtitle": "This task is moving here",
    "task.composerPlaceholder": "Add more context or tell the system what to do next...",
    "task.queue": "Queue",
    "task.branch": "Open /btw",
    "task.send": "Send",
    "task.sideThreads": "Side Threads",
    "task.sideThreadsSubtitle": "Open a side thread only when needed",
    "task.noBranch": "No side threads yet.",
    "task.contractTitle": "Delivery",
    "task.contractSubtitle": "What this task is currently preparing to deliver",
    "task.contractEmpty": "No delivery is ready yet.",
    "task.needsReview": "Needs Review",
    "task.directFinish": "Can Close Directly",
    "task.assets": "Task Assets",
    "task.assetsSubtitle": "Things collected from this task",
    "task.shares": "Share Records",
    "task.sharesSubtitle": "Share records for this task",

    "result.card": "Main Result",
    "result.attachments": "Attachments",
    "result.extractArtifact": "Extract Artifact",
    "result.extractMemory": "Extract Memory",
    "result.extractSkill": "Extract Skill",

    "queue.title": "Clarification Queue",
    "queue.subtitle": "New messages wait here first",
    "queue.promote": "Move to /btw",
    "queue.cancel": "Cancel",
    "queue.empty": "No queued messages.",

    "runtimes.title": "Check available assistants and connection status.",
    "runtimes.subtitle": "Use this page to confirm what is ready and add new sources when needed.",
    "runtimes.check": "Check Availability",
    "runtimes.clone": "Clone from GitHub",
    "runtimes.github": "Open GitHub",

    "assets.title": "Results and Assets",
    "assets.subtitle": "Browse by task, then filter further.",
    "assets.filters.tasks": "All Tasks",
    "assets.filters.roles": "All Roles",
    "assets.filters.kinds": "All Types",
    "assets.kind.artifact": "Artifact",
    "assets.kind.memory": "Memory",
    "assets.kind.skill": "Skill",

    "settings.title": "Settings",
    "settings.subtitle": "Language, onboarding, and basic settings live here.",
    "settings.language": "Language",
    "settings.languageDesc": "Phase one supports Chinese and English only.",
    "settings.onboarding": "Onboarding",
    "settings.onboardingDesc": "Open the onboarding flow again.",
    "settings.onboardingReset": "Restart Onboarding",
    "settings.providers": "Current Model Sources"
  }
};

const roleCopy: Record<string, Partial<Record<AppLocale, { displayName: string; persona: string; nickname: string }>>> = {
  role_product_xiaoce: {
    "en-US": {
      displayName: "🐎 Product Manager",
      nickname: "🐎",
      persona: "Clarifies the goal, reviews the work, and decides whether it goes back."
    }
  },
  role_engineer_ache: {
    "en-US": {
      displayName: "🐮 Programmer",
      nickname: "🐮",
      persona: "Builds, fixes, and keeps pushing the task toward delivery."
    }
  }
};

const templateCopy: Record<string, Partial<Record<AppLocale, { title: string; tagline: string; description: string; outcomeTitle: string; requiredMaterials: string[]; scenarioSteps: string[] }>>> = {
  tpl_paper_word_review: {
    "en-US": {
      title: "Read my paper and produce an annotated Word file",
      tagline: "Digest the paper and references, then return a Word file with inline comments.",
      description: "For academic users who want a review-ready Word document instead of a vague answer.",
      outcomeTitle: "Annotated Word main result",
      requiredMaterials: ["Paper Word or PDF", "Reference files or links", "Expected revision direction"],
      scenarioSteps: [
        "Confirm the paper and references are complete",
        "Read the paper and references to extract key issues",
        "Return a Word file with revision comments"
      ]
    }
  },
  tpl_bili_course_notes: {
    "en-US": {
      title: "Find Bilibili courses and generate subtitles plus notes",
      tagline: "Search, capture audio, transcribe, and summarize in one flow.",
      description: "For learning workflows where users want clean notes and subtitles instead of raw videos.",
      outcomeTitle: "Course notes main result",
      requiredMaterials: ["Topic keyword or course link", "Preferred difficulty or duration", "Preferred note format"],
      scenarioSteps: [
        "Find and shortlist courses",
        "Capture audio and subtitle outputs",
        "Summarize everything into study notes"
      ]
    }
  },
  tpl_books_summary_plan: {
    "en-US": {
      title: "Read books in a folder and export summaries plus a study plan",
      tagline: "Read each book, summarize it, and return a learning schedule.",
      description: "For long-form reading workflows that need structure and follow-through.",
      outcomeTitle: "Learning plan main result",
      requiredMaterials: ["Folder path of e-books", "Learning goal", "Weekly available time"],
      scenarioSteps: [
        "Confirm the folder path and target reading list",
        "Extract key ideas from each book",
        "Return summaries and a study plan"
      ]
    }
  },
  tpl_build_feature: {
    "en-US": {
      title: "Build software and keep repairing until it is actually done",
      tagline: "Clarify requirements, pair agents, and keep iterating until delivery.",
      description: "For users who want a working deliverable instead of a one-shot code answer.",
      outcomeTitle: "Runnable app main result",
      requiredMaterials: ["Feature goal", "Existing code path or repository", "Target platform / run mode"],
      scenarioSteps: [
        "Clarify the requirement in detail",
        "Implement and keep checking",
        "Battle until the result is ready for delivery"
      ]
    }
  }
};

const runtimeCopy: Record<string, Partial<Record<AppLocale, { name: string; description: string; installLabel: string; statusReady: string; statusWaiting: string }>>> = {
  runtime_hack_codex_cli: {
    "en-US": {
      name: "Codex CLI Runtime",
      description: "Reuses the local Codex install and injects through a wrapper/probe flow.",
      installLabel: "Uses the existing Codex CLI install on this machine.",
      statusReady: "Probe Passed",
      statusWaiting: "Waiting for probe"
    }
  },
  runtime_hack_claw_code: {
    "en-US": {
      name: "Claw-Code Runtime",
      description: "Targets the Claude Code replacement path through clone + hack intake.",
      installLabel: "Checks local install first, then allows GitHub clone intake.",
      statusReady: "Ready",
      statusWaiting: "Needs install or probe"
    }
  },
  runtime_clone_openclaw: {
    "en-US": {
      name: "OpenClaw Runtime",
      description: "Uses clone-based intake for the OpenClaw path.",
      installLabel: "Designed for direct GitHub clone intake.",
      statusReady: "Ready",
      statusWaiting: "Waiting for clone"
    }
  }
};

function interpolate(value: string, vars?: Record<string, string | number>): string {
  if (!vars) {
    return value;
  }

  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function useI18n() {
  const shell = useShellStore();

  const locale = computed<AppLocale>(() => shell.locale ?? "zh-CN");

  function t(key: string, vars?: Record<string, string | number>): string {
    const fallback = uiCopy["zh-CN"][key] ?? key;
    const value = uiCopy[locale.value][key] ?? fallback;
    return interpolate(value, vars);
  }

  function roleDisplayName(roleId: string, fallback: string): string {
    return roleCopy[roleId]?.[locale.value]?.displayName ?? fallback;
  }

  function roleNickname(roleId: string, fallback: string): string {
    return roleCopy[roleId]?.[locale.value]?.nickname ?? fallback;
  }

  function rolePersona(roleId: string, fallback: string): string {
    return roleCopy[roleId]?.[locale.value]?.persona ?? fallback;
  }

  function templateField<T extends keyof NonNullable<(typeof templateCopy)[string]["en-US"]>>(
    templateId: string,
    field: T,
    fallback: NonNullable<(typeof templateCopy)[string]["en-US"]>[T]
  ): NonNullable<(typeof templateCopy)[string]["en-US"]>[T] {
    return (templateCopy[templateId]?.[locale.value]?.[field] ??
      fallback) as NonNullable<(typeof templateCopy)[string]["en-US"]>[T];
  }

  function runtimeField<T extends keyof NonNullable<(typeof runtimeCopy)[string]["en-US"]>>(
    runtimeId: string,
    field: T,
    fallback: NonNullable<(typeof runtimeCopy)[string]["en-US"]>[T]
  ): NonNullable<(typeof runtimeCopy)[string]["en-US"]>[T] {
    return (runtimeCopy[runtimeId]?.[locale.value]?.[field] ??
      fallback) as NonNullable<(typeof runtimeCopy)[string]["en-US"]>[T];
  }

  return {
    locale,
    t,
    roleDisplayName,
    roleNickname,
    rolePersona,
    templateField,
    runtimeField
  };
}
