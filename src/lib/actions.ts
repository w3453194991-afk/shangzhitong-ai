"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mutateDb, getDb, uid } from "./store";
import {
  assertTenantWritable,
  canEditBrand,
  canManageMembers,
  requireAdmin,
  requireMerchant,
  requireRole,
  type MerchantContext,
} from "./session";
import {
  answerQuestion,
  estimateUsage,
  generateCampaign,
  generateCopy,
  generateVideo,
  MODEL_NAME,
  type CampaignInput,
  type CopyInput,
  type VideoInput,
} from "./generator";
import type { GenerationType, TenantStatus, MemberRole } from "./types";
import { formatDateTime } from "./utils";

function str(fd: FormData, key: string, fallback = ""): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : fallback;
}
function csv(fd: FormData, key: string): string[] {
  return str(fd, key)
    .split(/[,，、\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function num(fd: FormData, key: string, fallback = 0): number {
  const n = Number(str(fd, key));
  return Number.isFinite(n) ? n : fallback;
}

async function writeAudit(
  actor: string,
  actorRole: string,
  tenantId: string | null,
  action: string,
  target: string,
  detail: string,
) {
  await mutateDb((db) => {
    db.auditLogs.unshift({
      id: uid("a"),
      actor,
      actorRole,
      tenantId,
      action,
      target,
      detail,
      createdAt: new Date().toISOString(),
    });
  });
}

function ensureWritable(ctx: MerchantContext) {
  const err = assertTenantWritable(ctx);
  if (err) redirect(`/app?blocked=${encodeURIComponent(err)}`);
}

/* ============================ 企业端 ============================ */

export async function saveBrand(formData: FormData) {
  const ctx = await requireMerchant();
  if (!canEditBrand(ctx.role)) redirect("/app/marketing/brand?denied=1");
  ensureWritable(ctx);
  const payload = {
    brandName: str(formData, "brandName"),
    description: str(formData, "description"),
    category: str(formData, "category"),
    address: str(formData, "address"),
    phone: str(formData, "phone"),
    businessHours: str(formData, "businessHours"),
    audience: csv(formData, "audience"),
    tone: str(formData, "tone"),
    constraints: csv(formData, "constraints"),
    highlights: csv(formData, "highlights"),
  };
  await mutateDb((db) => {
    const existing = db.brands.find((b) => b.tenantId === ctx.tenant.id);
    if (existing) {
      Object.assign(existing, payload, { updatedAt: new Date().toISOString() });
    } else {
      db.brands.push({
        tenantId: ctx.tenant.id,
        ...payload,
        updatedAt: new Date().toISOString(),
      });
    }
  });
  revalidatePath("/app/marketing/brand");
  revalidatePath("/app");
  redirect("/app/marketing/brand?saved=1");
}

export async function saveDish(formData: FormData) {
  const ctx = await requireMerchant();
  if (!canEditBrand(ctx.role)) redirect("/app/knowledge/products?denied=1");
  ensureWritable(ctx);
  const id = str(formData, "id");
  const payload = {
    name: str(formData, "name"),
    category: str(formData, "category"),
    price: num(formData, "price"),
    spec: str(formData, "spec"),
    ingredients: str(formData, "ingredients"),
    description: str(formData, "description"),
    recommendedFor: str(formData, "recommendedFor"),
    status: (str(formData, "status") === "off" ? "off" : "on") as "on" | "off",
    updatedAt: new Date().toISOString(),
  };
  await mutateDb((db) => {
    if (id) {
      const dish = db.dishes.find((d) => d.id === id && d.tenantId === ctx.tenant.id);
      if (dish) Object.assign(dish, payload);
    } else {
      db.dishes.unshift({
        id: uid("d"),
        tenantId: ctx.tenant.id,
        ...payload,
      });
    }
  });
  revalidatePath("/app/knowledge/products");
  revalidatePath("/app");
  redirect("/app/knowledge/products?saved=1");
}

export async function toggleDish(formData: FormData) {
  const ctx = await requireMerchant();
  ensureWritable(ctx);
  const id = str(formData, "id");
  await mutateDb((db) => {
    const dish = db.dishes.find((d) => d.id === id && d.tenantId === ctx.tenant.id);
    if (dish) {
      dish.status = dish.status === "on" ? "off" : "on";
      dish.updatedAt = new Date().toISOString();
    }
  });
  revalidatePath("/app/knowledge/products");
}

export async function deleteDish(formData: FormData) {
  const ctx = await requireMerchant();
  if (ctx.role === "staff") redirect("/app/knowledge/products?denied=1");
  ensureWritable(ctx);
  const id = str(formData, "id");
  await mutateDb((db) => {
    db.dishes = db.dishes.filter((d) => !(d.id === id && d.tenantId === ctx.tenant.id));
  });
  revalidatePath("/app/knowledge/products");
}

export interface GenState {
  ok: boolean;
  error?: string;
  generationId?: string;
  title?: string;
  type?: GenerationType;
  payload?: Record<string, unknown>;
}

export async function generateMarketing(_prev: GenState, formData: FormData): Promise<GenState> {
  const ctx = await requireMerchant();
  const blocked = assertTenantWritable(ctx);
  if (blocked) return { ok: false, error: blocked };

  const db = await getDb();
  const type = str(formData, "type") as GenerationType;
  if (!["copy", "video", "campaign"].includes(type)) {
    return { ok: false, error: "不支持的生成类型。" };
  }
  const tenantSub = db.subscriptions.find(
    (s) => s.tenantId === ctx.tenant.id && s.status !== "cancelled",
  );
  const plan = db.plans.find((p) => p.id === tenantSub?.planId);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const used = db.usageLogs.filter(
    (l) =>
      l.tenantId === ctx.tenant.id &&
      l.status === "success" &&
      new Date(l.createdAt) >= monthStart,
  ).length;
  const quota = tenantSub?.quotaOverride ?? plan?.aiQuota ?? 100;
  if (used >= quota) {
    return {
      ok: false,
      error: `本月 AI 额度已用完（${used}/${quota}）。请联系平台升级套餐或调整额度后再试。`,
    };
  }

  const brand = ctx.brand;
  if (!brand) {
    return { ok: false, error: "请先在「品牌资料」完善企业信息，AI 才能生成有企业差异的内容。" };
  }
  const dishes = db.dishes.filter((d) => d.tenantId === ctx.tenant.id);
  const dishIds = formData.getAll("dishIds").filter((v): v is string => typeof v === "string");

  let payload: Record<string, unknown>;
  let title: string;
  let promptDescription: string;
  let plainText: string;

  if (type === "copy") {
    const input: CopyInput = {
      channel: str(formData, "channel"),
      contentType: str(formData, "contentType"),
      topic: str(formData, "topic"),
      audience: str(formData, "audience"),
      tone: str(formData, "tone"),
      length: str(formData, "length"),
      constraints: str(formData, "constraints"),
      dishIds,
    };
    const result = generateCopy(brand, dishes, input);
    payload = { kind: "copy", ...result };
    title = result.title;
    promptDescription = JSON.stringify(input);
    plainText = result.versions.map((v) => `${v.title}\n${v.body}\n${v.cta}`).join("\n\n---\n\n");
  } else if (type === "video") {
    const input: VideoInput = {
      duration: str(formData, "duration"),
      videoType: str(formData, "videoType"),
      topic: str(formData, "topic"),
      voiceover: str(formData, "voiceover"),
      shooting: str(formData, "shooting"),
      dishIds,
    };
    const result = generateVideo(brand, dishes, input);
    payload = { kind: "video", ...result };
    title = result.title;
    promptDescription = JSON.stringify(input);
    plainText = result.scenes
      .map(
        (s) =>
          `镜头 ${s.no}（${s.time}）\n画面：${s.visual}\n${s.line ? `口播：${s.line}\n` : ""}字幕：${s.subtitle}\n转场：${s.transition}`,
      )
      .join("\n\n");
  } else {
    const input: CampaignInput = {
      goal: str(formData, "goal"),
      startDate: str(formData, "startDate"),
      endDate: str(formData, "endDate"),
      budget: str(formData, "budget"),
      audience: str(formData, "audience"),
      dishIds,
      limits: str(formData, "limits"),
    };
    const result = generateCampaign(brand, dishes, input);
    payload = { kind: "campaign", ...result };
    title = result.title;
    promptDescription = JSON.stringify(input);
    plainText = `${result.theme}\n\n规则：\n${result.rules.join("\n")}\n\n步骤：\n${result.steps.join("\n")}\n\n宣传文案：\n${result.copy}\n\n风险提示：\n${result.risks.join("\n")}`;
  }

  const genId = uid("g");
  const usage = estimateUsage(type, promptDescription, plainText);
  await mutateDb((db2) => {
    db2.generations.unshift({
      id: genId,
      tenantId: ctx.tenant.id,
      createdBy: ctx.user.id,
      type,
      title,
      input: { ...JSON.parse(promptDescription), dishIds },
      result: payload,
      plainText,
      model: MODEL_NAME,
      status: "completed",
      createdAt: new Date().toISOString(),
    });
    db2.usageLogs.unshift({
      id: uid("u"),
      tenantId: ctx.tenant.id,
      userId: ctx.user.id,
      model: MODEL_NAME,
      type,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.cost,
      status: "success",
      estimated: true,
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath("/app");
  revalidatePath("/app/marketing/history");
  return { ok: true, generationId: genId, title, type, payload };
}

export async function deleteGeneration(formData: FormData) {
  const ctx = await requireMerchant();
  const id = str(formData, "id");
  await mutateDb((db) => {
    db.generations = db.generations.filter(
      (g) => !(g.id === id && g.tenantId === ctx.tenant.id),
    );
  });
  revalidatePath("/app/marketing/history");
}

export async function uploadFile(formData: FormData) {
  const ctx = await requireMerchant();
  if (ctx.role === "staff") redirect("/app/knowledge/files?denied=1");
  ensureWritable(ctx);
  const name = str(formData, "name").trim();
  const content = str(formData, "content").trim();
  if (!name || !content) redirect("/app/knowledge/files?error=empty");
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "txt";
  await mutateDb((db) => {
    db.files.unshift({
      id: uid("f"),
      tenantId: ctx.tenant.id,
      name,
      category: str(formData, "category") || "未分类",
      ext,
      sizeKb: Math.max(1, Math.round(content.length / 512)),
      status: "ready",
      content,
      uploadedAt: new Date().toISOString(),
    });
  });
  revalidatePath("/app/knowledge/files");
  revalidatePath("/app/knowledge/chat");
  redirect("/app/knowledge/files?uploaded=1");
}

export async function reparseFile(formData: FormData) {
  const ctx = await requireMerchant();
  const id = str(formData, "id");
  await mutateDb((db) => {
    const file = db.files.find((f) => f.id === id && f.tenantId === ctx.tenant.id);
    if (file) {
      file.status = "ready";
    }
  });
  revalidatePath("/app/knowledge/files");
}

export async function deleteFile(formData: FormData) {
  const ctx = await requireMerchant();
  const id = str(formData, "id");
  await mutateDb((db) => {
    db.files = db.files.filter((f) => !(f.id === id && f.tenantId === ctx.tenant.id));
  });
  revalidatePath("/app/knowledge/files");
  revalidatePath("/app/knowledge/chat");
}

export interface ChatState {
  ok: boolean;
  error?: string;
  question?: string;
  answer?: string;
  sources?: { id: string; title: string; kind: "dish" | "file" }[];
  found?: boolean;
}

export async function askQuestion(_prev: ChatState, formData: FormData): Promise<ChatState> {
  const ctx = await requireMerchant();
  const blocked = assertTenantWritable(ctx);
  if (blocked) return { ok: false, error: blocked };
  const question = str(formData, "question").trim();
  if (!question) return { ok: false, error: "请输入问题。" };

  const db = await getDb();
  const tenantSub = db.subscriptions.find(
    (s) => s.tenantId === ctx.tenant.id && s.status !== "cancelled",
  );
  const plan = db.plans.find((p) => p.id === tenantSub?.planId);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const used = db.usageLogs.filter(
    (l) =>
      l.tenantId === ctx.tenant.id &&
      l.status === "success" &&
      new Date(l.createdAt) >= monthStart,
  ).length;
  const quota = tenantSub?.quotaOverride ?? plan?.aiQuota ?? 100;
  if (used >= quota) {
    return { ok: false, error: `本月 AI 额度已用完（${used}/${quota}），请联系平台升级套餐。` };
  }

  const dishes = db.dishes.filter((d) => d.tenantId === ctx.tenant.id);
  const files = db.files.filter((f) => f.tenantId === ctx.tenant.id);
  const result = answerQuestion(question, ctx.brand, dishes, files);
  const usage = estimateUsage("chat", question, result.answer);
  const now = new Date().toISOString();

  await mutateDb((db2) => {
    let convo = db2.conversations.find(
      (c) => c.tenantId === ctx.tenant.id && c.userId === ctx.user.id,
    );
    if (!convo) {
      convo = {
        id: uid("c"),
        tenantId: ctx.tenant.id,
        userId: ctx.user.id,
        title: question.slice(0, 24),
        messages: [],
        createdAt: now,
      };
      db2.conversations.unshift(convo);
    }
    convo.messages.push(
      { id: uid("m"), role: "user", content: question, sources: [], createdAt: now },
      {
        id: uid("m"),
        role: "assistant",
        content: result.answer,
        sources: result.sources,
        createdAt: now,
      },
    );
    db2.usageLogs.unshift({
      id: uid("u"),
      tenantId: ctx.tenant.id,
      userId: ctx.user.id,
      model: MODEL_NAME,
      type: "chat",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.cost,
      status: "success",
      estimated: true,
      createdAt: now,
    });
  });
  revalidatePath("/app/knowledge/chat");
  return {
    ok: true,
    question,
    answer: result.answer,
    sources: result.sources,
    found: result.found,
  };
}

export async function saveCustomer(formData: FormData) {
  const ctx = await requireMerchant();
  ensureWritable(ctx);
  const id = str(formData, "id");
  const payload = {
    name: str(formData, "name"),
    phone: str(formData, "phone"),
    source: str(formData, "source") || "未填写",
    note: str(formData, "note"),
    status: (str(formData, "status") || "new") as "new" | "active" | "pending" | "lost",
    tags: csv(formData, "tags"),
  };
  if (!payload.name) redirect("/app/customers?error=name");
  await mutateDb((db) => {
    if (id) {
      const customer = db.customers.find((c) => c.id === id && c.tenantId === ctx.tenant.id);
      if (customer) Object.assign(customer, payload);
    } else {
      db.customers.unshift({
        id: uid("c"),
        tenantId: ctx.tenant.id,
        ...payload,
        createdAt: new Date().toISOString(),
        followups: [],
      });
    }
  });
  revalidatePath("/app/customers");
  revalidatePath("/app");
  redirect("/app/customers?saved=1");
}

export async function addFollowup(formData: FormData) {
  const ctx = await requireMerchant();
  ensureWritable(ctx);
  const customerId = str(formData, "customerId");
  await mutateDb((db) => {
    const customer = db.customers.find(
      (c) => c.id === customerId && c.tenantId === ctx.tenant.id,
    );
    if (!customer) return;
    customer.followups.unshift({
      id: uid("fu"),
      at: new Date().toISOString(),
      content: str(formData, "content"),
      result: str(formData, "result"),
      nextAt: str(formData, "nextAt"),
      status: str(formData, "nextAt") ? "pending" : "completed",
      by: ctx.user.name,
    });
    if (customer.status === "new") customer.status = "active";
  });
  revalidatePath(`/app/customers/${customerId}`);
  revalidatePath("/app/customers");
  revalidatePath("/app");
  redirect(`/app/customers/${customerId}?followed=1`);
}

export async function completeFollowup(formData: FormData) {
  const ctx = await requireMerchant();
  const customerId = str(formData, "customerId");
  const followupId = str(formData, "followupId");
  await mutateDb((db) => {
    const customer = db.customers.find(
      (c) => c.id === customerId && c.tenantId === ctx.tenant.id,
    );
    const fu = customer?.followups.find((f) => f.id === followupId);
    if (fu) fu.status = "completed";
  });
  revalidatePath(`/app/customers/${customerId}`);
  revalidatePath("/app/customers");
}

export async function submitTicket(formData: FormData) {
  const ctx = await requireMerchant();
  await mutateDb((db) => {
    db.tickets.unshift({
      id: uid("tk"),
      tenantId: ctx.tenant.id,
      createdBy: ctx.user.id,
      title: str(formData, "title"),
      content: str(formData, "content"),
      status: "open",
      assignee: "待分派",
      replies: [],
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath("/app/settings");
  redirect("/app/settings?ticket=1");
}

export async function inviteMember(formData: FormData) {
  const ctx = await requireRole(["owner"]);
  if (!canManageMembers(ctx.role)) redirect("/app/settings?denied=1");
  const email = str(formData, "email").trim().toLowerCase();
  const name = str(formData, "name").trim() || email.split("@")[0];
  const role = str(formData, "role") as MemberRole;
  if (!email) redirect("/app/settings?error=email");
  await mutateDb((db) => {
    if (!db.users.some((u) => u.email.toLowerCase() === email)) {
      db.users.push({
        id: uid("u"),
        email,
        name,
        role: role === "manager" || role === "staff" ? role : "staff",
        tenantId: ctx.tenant.id,
        createdAt: new Date().toISOString(),
      });
    }
  });
  await writeAudit(
    ctx.user.name,
    ctx.role,
    ctx.tenant.id,
    "member.invite",
    name,
    `邀请成员加入 ${ctx.tenant.name}，角色 ${role}`,
  );
  revalidatePath("/app/settings");
  redirect("/app/settings?invited=1");
}

/* ============================ 平台端 ============================ */

export async function createTenant(formData: FormData) {
  const admin = await requireAdmin();
  const name = str(formData, "name").trim();
  const ownerEmail = str(formData, "ownerEmail").trim().toLowerCase();
  const planId = str(formData, "planId") || "p-trial";
  const statusInput = str(formData, "status") as TenantStatus;
  const status: TenantStatus = statusInput === "active" ? "active" : "trial";
  if (!name || !ownerEmail) redirect("/admin/tenants?error=required");

  const db = await getDb();
  if (db.users.some((u) => u.email.toLowerCase() === ownerEmail)) {
    redirect("/admin/tenants?error=emailexists");
  }
  const tenantId = uid("t");
  const code = (str(formData, "code") || name.slice(0, 4)).toUpperCase();
  const plan = db.plans.find((p) => p.id === planId) ?? db.plans[0];
  const now = new Date();
  const expires = new Date(now.getTime() + (plan.durationDays || 30) * 86400000);

  await mutateDb((db2) => {
    db2.tenants.unshift({
      id: tenantId,
      code,
      name,
      category: str(formData, "category") || "企业服务",
      contactName: str(formData, "contactName") || ownerEmail,
      contactPhone: str(formData, "contactPhone"),
      status,
      createdAt: now.toISOString(),
    });
    db2.subscriptions.unshift({
      id: uid("s"),
      tenantId,
      planId: plan.id,
      status: status === "active" ? "active" : "trial",
      startsAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    });
    db2.users.push({
      id: uid("u"),
      email: ownerEmail,
      name: str(formData, "contactName") || "企业负责人",
      role: "owner",
      tenantId,
      createdAt: now.toISOString(),
    });
    db2.brands.push({
      tenantId,
      brandName: name,
      description: `${name}，主营${str(formData, "category") || "企业服务"}。请在企业资料中补充介绍。`,
      category: str(formData, "category") || "企业服务",
      address: "",
      phone: str(formData, "contactPhone"),
      businessHours: "",
      audience: [],
      tone: "专业、务实",
      constraints: ["不承诺未确认的折扣与效果", "价格以正式报价为准"],
      highlights: [],
      updatedAt: now.toISOString(),
    });
    db2.auditLogs.unshift({
      id: uid("a"),
      actor: admin.name,
      actorRole: "super_admin",
      tenantId,
      action: "tenant.create",
      target: name,
      detail: `创建企业，分配${plan.name}套餐，邀请负责人 ${ownerEmail}`,
      createdAt: now.toISOString(),
    });
  });
  revalidatePath("/admin/tenants");
  revalidatePath("/admin");
  redirect(`/admin/tenants/${tenantId}?created=1`);
}

export async function updateTenantStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status") as TenantStatus;
  const allowed: TenantStatus[] = [
    "pending",
    "trial",
    "active",
    "suspended",
    "expired",
    "closed",
  ];
  if (!allowed.includes(status)) redirect("/admin/tenants?error=status");
  const db = await getDb();
  const tenant = db.tenants.find((t) => t.id === id);
  if (!tenant) redirect("/admin/tenants?error=notfound");
  const prevStatus = tenant.status;
  await mutateDb((db2) => {
    const t = db2.tenants.find((x) => x.id === id)!;
    t.status = status;
    db2.auditLogs.unshift({
      id: uid("a"),
      actor: admin.name,
      actorRole: "super_admin",
      tenantId: id,
      action: "tenant.status",
      target: t.name,
      detail: `状态从 ${prevStatus} 调整为 ${status}`,
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${id}`);
  revalidatePath("/admin");
  redirect(`/admin/tenants/${id}?updated=1`);
}

export async function updateSubscription(formData: FormData) {
  const admin = await requireAdmin();
  const tenantId = str(formData, "tenantId");
  const planId = str(formData, "planId");
  const quotaOverrideRaw = str(formData, "quotaOverride");
  const expiresAt = str(formData, "expiresAt");
  const db = await getDb();
  const tenant = db.tenants.find((t) => t.id === tenantId);
  if (!tenant) redirect("/admin/tenants");
  const plan = db.plans.find((p) => p.id === planId);
  await mutateDb((db2) => {
    let sub = db2.subscriptions.find(
      (s) => s.tenantId === tenantId && s.status !== "cancelled",
    );
    if (!sub) {
      sub = {
        id: uid("s"),
        tenantId,
        planId,
        status: "active",
        startsAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      };
      db2.subscriptions.unshift(sub);
    }
    sub.planId = planId;
    sub.quotaOverride = quotaOverrideRaw ? Number(quotaOverrideRaw) : null;
    if (expiresAt) sub.expiresAt = new Date(expiresAt).toISOString();
    sub.status = db2.tenants.find((t) => t.id === tenantId)?.status === "trial" ? "trial" : "active";
    db2.auditLogs.unshift({
      id: uid("a"),
      actor: admin.name,
      actorRole: "super_admin",
      tenantId,
      action: "subscription.update",
      target: tenant.name,
      detail: `套餐调整为 ${plan?.name ?? planId}${quotaOverrideRaw ? `，额度覆盖 ${quotaOverrideRaw} 次/月` : ""}`,
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin");
  redirect(`/admin/tenants/${tenantId}?updated=1`);
}

export async function savePlan(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const payload = {
    name: str(formData, "name"),
    price: num(formData, "price"),
    aiQuota: num(formData, "aiQuota", 100),
    features: csv(formData, "features"),
    durationDays: num(formData, "durationDays", 30),
    status: (str(formData, "status") === "inactive" ? "inactive" : "active") as
      | "active"
      | "inactive",
  };
  if (!payload.name) redirect("/admin/plans?error=name");
  await mutateDb((db) => {
    if (id) {
      const plan = db.plans.find((p) => p.id === id);
      if (plan) Object.assign(plan, payload);
    } else {
      db.plans.push({ id: uid("p"), ...payload });
    }
    db.auditLogs.unshift({
      id: uid("a"),
      actor: admin.name,
      actorRole: "super_admin",
      tenantId: null,
      action: id ? "plan.update" : "plan.create",
      target: payload.name,
      detail: `套餐价格 ${payload.price} 元，AI 额度 ${payload.aiQuota} 次/月`,
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath("/admin/plans");
  redirect("/admin/plans?saved=1");
}

export async function adminReplyTicket(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const content = str(formData, "content");
  const nextStatus = str(formData, "status") || "processing";
  const db = await getDb();
  const ticket = db.tickets.find((t) => t.id === id);
  if (!ticket) redirect("/admin/tickets");
  await mutateDb((db2) => {
    const t = db2.tickets.find((x) => x.id === id)!;
    t.replies.push({
      by: admin.name,
      content,
      createdAt: new Date().toISOString(),
    });
    t.status = nextStatus as "open" | "processing" | "resolved";
    db2.auditLogs.unshift({
      id: uid("a"),
      actor: admin.name,
      actorRole: "super_admin",
      tenantId: t.tenantId,
      action: "ticket.reply",
      target: t.title,
      detail: `回复工单并设置状态为 ${nextStatus}`,
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath("/admin/tickets");
  redirect("/admin/tickets?replied=1");
}

export async function adminUpdatePlatformNote(formData: FormData) {
  const admin = await requireAdmin();
  const action = str(formData, "action");
  await writeAudit(
    admin.name,
    "super_admin",
    null,
    action || "platform.setting",
    "平台设置",
    str(formData, "detail") || `更新平台设置（${formatDateTime(new Date().toISOString())}）`,
  );
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
