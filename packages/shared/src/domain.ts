export type SurfaceOrigin = "desktop" | "feishu" | "share-link" | "api";

export type TaskStatus = "collecting" | "running" | "review" | "done";

export type QueueMessageStatus = "queued" | "promoted" | "cancelled";

export type ConversationKind = "main" | "branch" | "pair";

export type RoleProfession = "product" | "engineer" | "research" | "executor";

export type EquipmentSlot =
  | "profession"
  | "browser"
  | "document"
  | "social"
  | "project"
  | "rule"
  | "extension";

export type EquipmentKind = "skill" | "mcp";

export type AssetKind = "artifact" | "memory" | "skill";

export type RuntimePluginKind = "hack" | "clone" | "adapter";

export type RuntimeSupportMode = "deep" | "enhanced" | "basic";

export type RuntimeSource = "existing-install" | "cloned-source" | "dist-hack";

export type ModelProviderKind = "remote" | "ollama" | "ktransformers";

export type EventType =
  | "task.created"
  | "task.state.changed"
  | "conversation.delta"
  | "conversation.queue.enqueued"
  | "conversation.branch.opened"
  | "runtime.started"
  | "runtime.stopped"
  | "tool.called"
  | "tool.result"
  | "artifact.created"
  | "memory.suggested"
  | "skill.suggested"
  | "compact.detected"
  | "compact.synced"
  | "review.requested"
  | "review.rejected"
  | "finish.requested"
  | "finish.confirmed"
  | "share.created"
  | "error.raised";

export interface AvatarConfig {
  type: "png" | "live2d";
  src: string;
  moodMap?: Record<string, string>;
}

export interface EquipmentPlugin {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  kind: EquipmentKind;
  label?: string;
  source: "official" | "imported";
  typeTag?: string;
  contentPreview?: string;
  affects: string[];
}

export interface RuntimePlugin {
  id: string;
  name: string;
  description: string;
  pluginKind: RuntimePluginKind;
  source: RuntimeSource;
  supportMode: RuntimeSupportMode;
  targetRuntime: string;
  command?: string;
  pathHint?: string;
  capabilities: string[];
  status: "ready" | "degraded" | "missing";
}

export interface Role {
  id: string;
  displayName: string;
  nickname: string;
  profession: RoleProfession;
  persona: string;
  avatar: AvatarConfig;
  statusLabel: string;
  defaultEquipmentIds: string[];
  currentEquipmentIds: string[];
  cloneLineageId: string;
  cloneSourceRoleId?: string;
  isClone?: boolean;
  projectExperienceSkillIds: string[];
  notes?: string;
}

export interface RoleSelection {
  roleId: string;
  equipmentIds: string[];
  ruleEquipmentId?: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  authorLabel: string;
  content: string;
  createdAt: string;
  eventType?: EventType;
  folded?: boolean;
}

export interface QueuedMessage {
  id: string;
  content: string;
  from: string;
  createdAt: string;
  status: QueueMessageStatus;
}

export interface Conversation {
  id: string;
  kind: ConversationKind;
  title: string;
  messages: ConversationMessage[];
}

export interface ResultAttachment {
  id: string;
  title: string;
  type: "file" | "note" | "script" | "package";
  summary: string;
}

export interface ResultCard {
  id: string;
  title: string;
  summary: string;
  primaryActionLabel: string;
  attachments: ResultAttachment[];
  canContinue: boolean;
  canExtract: boolean;
  canShare: boolean;
}

export interface AssetRecord {
  id: string;
  kind: AssetKind;
  taskId: string;
  roleId?: string;
  title: string;
  summary: string;
  createdAt: string;
}

export interface ShareRecord {
  id: string;
  taskId: string;
  url: string;
  allowComment: boolean;
  createdAt: string;
}

export interface TaskTemplatePlugin {
  id: string;
  title: string;
  tagline: string;
  description: string;
  instructionsSkillId: string;
  recommendedRoleIds: string[];
  recommendedEquipmentIds: string[];
  recommendedRuleId?: string;
  requiredMaterials: string[];
  outcomeTitle: string;
  scenarioSteps: string[];
}

export interface Task {
  id: string;
  title: string;
  templateId?: string;
  status: TaskStatus;
  origin: SurfaceOrigin;
  createdAt: string;
  updatedAt: string;
  roleSelections: RoleSelection[];
  mainConversation: Conversation;
  branches: Conversation[];
  pairConversation?: Conversation;
  queue: QueuedMessage[];
  resultCard?: ResultCard;
  assets: AssetRecord[];
  shares: ShareRecord[];
  requiredMaterials: string[];
  collectedMaterials: string[];
  reviewerRoleId?: string;
  finishRequired: boolean;
}

export interface AppBootstrap {
  templates: TaskTemplatePlugin[];
  roles: Role[];
  equipment: EquipmentPlugin[];
  runtimes: RuntimePlugin[];
  providers: ProviderConfig[];
  tasks: Task[];
  assets: AssetRecord[];
  pluginInventory: PluginInventory;
}

export interface ProviderConfig {
  id: string;
  kind: ModelProviderKind;
  name: string;
  enabled: boolean;
  role: string;
  proxyMode: "split-by-target" | "direct-only" | "system";
  note: string;
}

export interface PluginDirectoryEntry {
  name: string;
  relativePath: string;
  containerType: "file" | "folder";
  family: "skills" | "mcp" | "hacks" | "clones" | "adapters" | "templates";
}

export interface PluginInventory {
  equipmentFiles: PluginDirectoryEntry[];
  runtimeFiles: PluginDirectoryEntry[];
  templateFiles: PluginDirectoryEntry[];
}

export interface EventEnvelope<T = Record<string, unknown>> {
  id: string;
  type: EventType;
  taskId?: string;
  payload: T;
  createdAt: string;
}
