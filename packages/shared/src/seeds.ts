import type {
  AssetRecord,
  EquipmentPlugin,
  Role,
  RuntimePlugin,
  TaskTemplatePlugin
} from "./domain";

const officialEquipment: EquipmentPlugin[] = [
  {
    id: "equip_prof_product",
    name: "产品主理技法",
    description: "擅长拆需求、收口交付和主审把关。",
    slot: "profession",
    kind: "skill",
    source: "official",
    typeTag: "Skill",
    affects: ["采访需求", "验收", "打回重做"]
  },
  {
    id: "equip_prof_engineer",
    name: "程序交付工坊",
    description: "偏向可运行结果、测试与打包收束。",
    slot: "profession",
    kind: "skill",
    source: "official",
    typeTag: "Skill",
    affects: ["编码", "调试", "打包"]
  },
  {
    id: "equip_prof_research",
    name: "资料深读研究法",
    description: "长文阅读、资料归纳和学习路径整理。",
    slot: "profession",
    kind: "skill",
    source: "official",
    typeTag: "Skill",
    affects: ["检索", "长文阅读", "总结"]
  },
  {
    id: "equip_prof_executor",
    name: "电脑执行流程",
    description: "负责桌面流程拆解和关键动作确认。",
    slot: "profession",
    kind: "skill",
    source: "official",
    typeTag: "Skill",
    affects: ["桌面操作", "关键确认", "执行回报"]
  },
  {
    id: "equip_doc_word_review",
    name: "论文批注工作流",
    description: "阅读论文与参考文献，收束到带批注 Word。",
    slot: "document",
    kind: "skill",
    source: "official",
    typeTag: "Skill",
    affects: ["Word 输出", "批注建议", "参考文献整理"]
  },
  {
    id: "equip_doc_reading_plan",
    name: "电子书学习规划器",
    description: "逐本总结，导出学习计划与行动清单。",
    slot: "document",
    kind: "skill",
    source: "official",
    typeTag: "Skill",
    affects: ["总结", "学习规划", "知识沉淀"]
  },
  {
    id: "equip_browser_bili",
    name: "B 站课程搜集器",
    description: "负责检索课程、收集链接和筛选内容质量。",
    slot: "browser",
    kind: "skill",
    source: "official",
    typeTag: "Skill",
    affects: ["课程搜索", "链接整理", "筛选推荐"]
  },
  {
    id: "equip_mcp_context7",
    name: "Context7 文档桥",
    description: "接入 MCP 文档上下文能力。",
    slot: "document",
    kind: "mcp",
    source: "official",
    typeTag: "MCP",
    affects: ["文档检索", "参考资料注入"]
  },
  {
    id: "equip_rule_pua",
    name: "PUA 守则",
    description: "强调闭环、主审和完成度追责的守则装备。",
    slot: "rule",
    kind: "skill",
    source: "official",
    typeTag: "Skill",
    affects: ["结果闭环", "finish 纪律", "执行风格"]
  },
  {
    id: "equip_project_delivery",
    name: "项目经验包·交付收束",
    description: "把半成品收束成主结果卡和附属产物。",
    slot: "project",
    kind: "skill",
    source: "official",
    typeTag: "Skill",
    affects: ["产物提炼", "结果卡", "交付说明"]
  }
];

const officialRoles: Role[] = [
  {
    id: "role_product_xiaoce",
    displayName: "产品·小策",
    nickname: "小策",
    profession: "product",
    persona: "擅长追问目标、收口范围，并对结果可交付性负责。",
    avatar: {
      type: "png",
      src: "role-product.png",
      moodMap: {
        idle: "role-product-idle.png",
        review: "role-product-review.png"
      }
    },
    statusLabel: "待派遣",
    defaultEquipmentIds: [
      "equip_prof_product",
      "equip_mcp_context7",
      "equip_rule_pua",
      "equip_project_delivery"
    ],
    currentEquipmentIds: [
      "equip_prof_product",
      "equip_mcp_context7",
      "equip_rule_pua",
      "equip_project_delivery"
    ],
    cloneLineageId: "lineage_product_xiaoce",
    projectExperienceSkillIds: [],
    notes: "主审型角色，适合作为 /combined 的验收方。"
  },
  {
    id: "role_engineer_ache",
    displayName: "程序员·阿澈",
    nickname: "阿澈",
    profession: "engineer",
    persona: "偏可运行与可打包交付，适合作为实现与修复角色。",
    avatar: {
      type: "png",
      src: "role-engineer.png",
      moodMap: {
        idle: "role-engineer-idle.png",
        coding: "role-engineer-coding.png"
      }
    },
    statusLabel: "待派遣",
    defaultEquipmentIds: [
      "equip_prof_engineer",
      "equip_mcp_context7",
      "equip_rule_pua",
      "equip_project_delivery"
    ],
    currentEquipmentIds: [
      "equip_prof_engineer",
      "equip_mcp_context7",
      "equip_rule_pua",
      "equip_project_delivery"
    ],
    cloneLineageId: "lineage_engineer_ache",
    projectExperienceSkillIds: [],
    notes: "主执行型角色，适合开发、调试和打包。"
  },
  {
    id: "role_research_wenbo",
    displayName: "资料·闻博",
    nickname: "闻博",
    profession: "research",
    persona: "擅长资料深读、课程搜集和学习计划整理。",
    avatar: {
      type: "png",
      src: "role-research.png",
      moodMap: {
        idle: "role-research-idle.png",
        reading: "role-research-reading.png"
      }
    },
    statusLabel: "待派遣",
    defaultEquipmentIds: [
      "equip_prof_research",
      "equip_browser_bili",
      "equip_doc_reading_plan",
      "equip_mcp_context7"
    ],
    currentEquipmentIds: [
      "equip_prof_research",
      "equip_browser_bili",
      "equip_doc_reading_plan",
      "equip_mcp_context7"
    ],
    cloneLineageId: "lineage_research_wenbo",
    projectExperienceSkillIds: [],
    notes: "长文阅读与资料整理专长。"
  },
  {
    id: "role_executor_xingya",
    displayName: "执行·行牙",
    nickname: "行牙",
    profession: "executor",
    persona: "偏桌面流程执行，关键动作前会显式请求确认。",
    avatar: {
      type: "png",
      src: "role-executor.png",
      moodMap: {
        idle: "role-executor-idle.png",
        acting: "role-executor-acting.png"
      }
    },
    statusLabel: "待派遣",
    defaultEquipmentIds: [
      "equip_prof_executor",
      "equip_browser_bili",
      "equip_project_delivery"
    ],
    currentEquipmentIds: [
      "equip_prof_executor",
      "equip_browser_bili",
      "equip_project_delivery"
    ],
    cloneLineageId: "lineage_executor_xingya",
    projectExperienceSkillIds: [],
    notes: "负责把任务中的电脑操作步骤跑通。"
  }
];

const officialTemplates: TaskTemplatePlugin[] = [
  {
    id: "tpl_paper_word_review",
    title: "帮我阅读论文并生成带批注的 Word",
    tagline: "把论文和参考文献吃透，再给我一个可手改的带批注文档。",
    description: "适合学生和研究者，把 PDF/Word 论文和参考文献转成可手改的批注版结果。",
    instructionsSkillId: "equip_doc_word_review",
    recommendedRoleIds: ["role_research_wenbo", "role_product_xiaoce"],
    recommendedEquipmentIds: [
      "equip_doc_word_review",
      "equip_mcp_context7",
      "equip_project_delivery"
    ],
    recommendedRuleId: "equip_rule_pua",
    requiredMaterials: ["论文 Word 或 PDF", "参考文献文件或链接", "期望改进方向"],
    outcomeTitle: "带批注 Word 主结果卡",
    scenarioSteps: [
      "角色先确认论文文件和参考文献是否齐备",
      "资料角色阅读论文与参考文献并整理问题点",
      "产品角色收束修改建议并生成带批注 Word"
    ]
  },
  {
    id: "tpl_bili_course_notes",
    title: "帮我从 Bilibili 找课并生成字幕和笔记",
    tagline: "找课、抓音频、转文字、做结构化笔记，一次走完。",
    description: "适合需要快速进入某个领域的普通用户，最终导出字幕和课程笔记。",
    instructionsSkillId: "equip_browser_bili",
    recommendedRoleIds: ["role_research_wenbo", "role_executor_xingya"],
    recommendedEquipmentIds: [
      "equip_browser_bili",
      "equip_doc_reading_plan",
      "equip_project_delivery"
    ],
    requiredMaterials: ["课程主题关键词或链接", "偏好难度或时长", "笔记偏好格式"],
    outcomeTitle: "课程笔记主结果卡",
    scenarioSteps: [
      "资料角色筛选课程并确认候选",
      "执行角色抓取音频和字幕产物",
      "资料角色总结成结构化笔记"
    ]
  },
  {
    id: "tpl_books_summary_plan",
    title: "帮我读文件夹里的电子书并导出总结与学习规划",
    tagline: "逐本阅读、逐本总结，再生成可执行的学习路线。",
    description: "适合长期学习型任务，收束出每本书的总结和学习行动安排。",
    instructionsSkillId: "equip_doc_reading_plan",
    recommendedRoleIds: ["role_research_wenbo"],
    recommendedEquipmentIds: [
      "equip_doc_reading_plan",
      "equip_project_delivery"
    ],
    requiredMaterials: ["电子书文件夹路径", "学习目标", "每周可投入时间"],
    outcomeTitle: "学习规划主结果卡",
    scenarioSteps: [
      "确认文件夹路径和目标书单",
      "逐本抽取关键观点并归档",
      "输出每本总结和总学习规划"
    ]
  },
  {
    id: "tpl_build_feature",
    title: "帮我开发程序并自动检修直到真正完毕",
    tagline: "先采访清楚，再结对开发、反复打回，直到能运行、能交付。",
    description: "适合普通用户提出功能想法，最终收束到可运行的程序结果卡。",
    instructionsSkillId: "equip_prof_product",
    recommendedRoleIds: ["role_product_xiaoce", "role_engineer_ache"],
    recommendedEquipmentIds: [
      "equip_prof_product",
      "equip_prof_engineer",
      "equip_rule_pua",
      "equip_project_delivery",
      "equip_mcp_context7"
    ],
    recommendedRuleId: "equip_rule_pua",
    requiredMaterials: ["功能目标", "现有代码路径或仓库", "期望平台/运行方式"],
    outcomeTitle: "可运行程序主结果卡",
    scenarioSteps: [
      "产品角色先采访需求，把范围收清楚",
      "程序员角色实现并持续自检",
      "主审角色打回直到满足可运行、检查通过、主结果卡生成"
    ]
  }
];

const officialRuntimePlugins: RuntimePlugin[] = [
  {
    id: "runtime_hack_codex_cli",
    name: "Codex CLI Hack 接入",
    description: "复用已有安装，通过 wrapper 与事件劫持接入。",
    pluginKind: "hack",
    source: "existing-install",
    supportMode: "enhanced",
    targetRuntime: "codex",
    command: "codex",
    githubUrl: "https://github.com/openai/codex",
    installLabel: "优先复用本机已安装 Codex CLI，也可参考官方仓库安装。",
    installMode: "existing",
    probeArgs: ["--version"],
    checkState: "unknown",
    capabilities: ["stream", "tool-events", "compact-detect", "finish"],
    status: "ready"
  },
  {
    id: "runtime_hack_claw_code",
    name: "Claw-Code Hack 接入",
    description: "优先接入 claw-code 作为 Claude Code 替代路线。",
    pluginKind: "hack",
    source: "existing-install",
    supportMode: "enhanced",
    targetRuntime: "claw-code",
    command: "claw-code",
    githubUrl: "https://github.com/ultraworkers/claw-code",
    installLabel: "优先复用已有安装；如果本机没有命令，可先 GitHub clone 再做接管。",
    installMode: "existing",
    supportsCloneInstall: true,
    probeArgs: ["--help"],
    checkState: "unknown",
    capabilities: ["stream", "tool-events", "finish"],
    status: "ready"
  },
  {
    id: "runtime_clone_openclaw",
    name: "OpenClaw Clone 接入",
    description: "对难部署场景保留源码 clone 并接管的能力。",
    pluginKind: "clone",
    source: "cloned-source",
    supportMode: "deep",
    targetRuntime: "openclaw",
    pathHint: "plugins/runtimes/clones/openclaw",
    githubUrl: "https://github.com/openclaw/openclaw",
    installLabel: "适合直接从 GitHub 一键浅克隆并纳入平台调度。",
    installMode: "clone",
    probeArgs: ["--help"],
    checkState: "unknown",
    shallowClone: true,
    capabilities: ["stream", "tool-events", "compact-detect", "finish", "daemon-hooks"],
    status: "degraded"
  }
];

const demoAssets: AssetRecord[] = [];

export function getOfficialEquipment(): EquipmentPlugin[] {
  return officialEquipment;
}

export function getOfficialRoles(): Role[] {
  return officialRoles;
}

export function getOfficialTemplates(): TaskTemplatePlugin[] {
  return officialTemplates;
}

export function getOfficialRuntimePlugins(): RuntimePlugin[] {
  return officialRuntimePlugins;
}

export function getDemoAssets(): AssetRecord[] {
  return demoAssets;
}
