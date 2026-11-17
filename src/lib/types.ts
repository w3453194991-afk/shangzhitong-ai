export type TenantStatus =
  | "pending"
  | "trial"
  | "active"
  | "suspended"
  | "expired"
  | "closed";

export type MemberRole = "owner" | "manager" | "staff";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "platform_admin" | MemberRole;
  tenantId?: string;
  platformRole?: "super_admin" | "operator";
  createdAt: string;
}

export interface Tenant {
  id: string;
  code: string;
  name: string;
  category: string;
  contactName: string;
  contactPhone: string;
  status: TenantStatus;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  aiQuota: number;
  features: string[];
  durationDays: number;
  status: "active" | "inactive";
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: "trial" | "active" | "expired" | "cancelled";
  startsAt: string;
  expiresAt: string;
  quotaOverride?: number | null;
}

export interface BrandProfile {
  tenantId: string;
  brandName: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  businessHours: string;
  audience: string[];
  tone: string;
  constraints: string[];
  highlights: string[];
  updatedAt: string;
}

export interface Dish {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  price: number;
  spec: string;
  ingredients: string;
  description: string;
  recommendedFor: string;
  status: "on" | "off";
  updatedAt: string;
}

export type GenerationType = "copy" | "video" | "campaign";

export interface Generation {
  id: string;
  tenantId: string;
  createdBy: string;
  type: GenerationType;
  title: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  plainText: string;
  model: string;
  status: "completed" | "failed";
  createdAt: string;
}

export interface KnowledgeFile {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  ext: string;
  sizeKb: number;
  status: "uploaded" | "processing" | "ready" | "failed";
  content: string;
  uploadedAt: string;
}

export interface ChatSource {
  id: string;
  title: string;
  kind: "dish" | "file";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: ChatSource[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface Followup {
  id: string;
  at: string;
  content: string;
  result: string;
  nextAt: string;
  status: "pending" | "completed";
  by: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  source: string;
  note: string;
  status: "new" | "active" | "pending" | "lost";
  tags: string[];
  createdAt: string;
  followups: Followup[];
}

export interface UsageLog {
  id: string;
  tenantId: string;
  userId: string;
  model: string;
  type: GenerationType | "chat";
  inputTokens: number;
  outputTokens: number;
  cost: number;
  status: "success" | "failed";
  estimated?: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  tenantId: string;
  createdBy: string;
  title: string;
  content: string;
  status: "open" | "processing" | "resolved";
  assignee: string;
  replies: { by: string; content: string; createdAt: string }[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  actorRole: string;
  tenantId: string | null;
  action: string;
  target: string;
  detail: string;
  createdAt: string;
}

export interface Database {
  version: number;
  users: User[];
  tenants: Tenant[];
  plans: Plan[];
  subscriptions: Subscription[];
  brands: BrandProfile[];
  dishes: Dish[];
  generations: Generation[];
  files: KnowledgeFile[];
  conversations: Conversation[];
  customers: Customer[];
  usageLogs: UsageLog[];
  tickets: Ticket[];
  auditLogs: AuditLog[];
}
