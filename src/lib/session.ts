import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./store";
import type {
  BrandProfile,
  MemberRole,
  Plan,
  Subscription,
  Tenant,
  User,
} from "./types";

export const SESSION_COOKIE = "sq_uid";

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const uid = jar.get(SESSION_COOKIE)?.value;
  if (!uid) return null;
  const db = await getDb();
  return db.users.find((u) => u.id === uid) ?? null;
}

export interface MerchantContext {
  user: User;
  tenant: Tenant;
  role: MemberRole;
  subscription?: Subscription;
  plan?: Plan;
  brand?: BrandProfile;
  quota: number;
  used: number;
  monthStart: Date;
}

export async function getMerchantContext(): Promise<MerchantContext | null> {
  const user = await getSessionUser();
  if (!user || !user.tenantId || user.role === "platform_admin") return null;
  const db = await getDb();
  const tenant = db.tenants.find((t) => t.id === user.tenantId);
  if (!tenant) return null;
  const subscription = db.subscriptions.find(
    (s) => s.tenantId === tenant.id && s.status !== "cancelled",
  );
  const plan = subscription ? db.plans.find((p) => p.id === subscription.planId) : undefined;
  const brand = db.brands.find((b) => b.tenantId === tenant.id);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const used = db.usageLogs.filter(
    (l) =>
      l.tenantId === tenant.id &&
      l.status === "success" &&
      new Date(l.createdAt).getTime() >= monthStart.getTime(),
  ).length;
  const quota = subscription?.quotaOverride ?? plan?.aiQuota ?? 100;
  return {
    user,
    tenant,
    role: user.role as MemberRole,
    subscription,
    plan,
    brand,
    quota,
    used,
    monthStart,
  };
}

export async function requireMerchant(): Promise<MerchantContext> {
  const ctx = await getMerchantContext();
  if (!ctx) redirect("/login");
  return ctx;
}

export async function requireRole(roles: MemberRole[]): Promise<MerchantContext> {
  const ctx = await requireMerchant();
  if (!roles.includes(ctx.role)) redirect("/app?denied=1");
  return ctx;
}

export async function requireAdmin(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "platform_admin") redirect("/app?denied=admin");
  return user;
}

/** Server-side write gate used by every mutation action. */
export function assertTenantWritable(ctx: MerchantContext): string | null {
  if (ctx.tenant.status === "suspended")
    return "企业服务已暂停，暂时无法新增或修改数据，请联系平台支持。";
  if (ctx.tenant.status === "closed")
    return "企业已关闭，无法继续操作。";
  if (ctx.tenant.status === "pending")
    return "企业尚未激活，请先完成资料设置。";
  return null;
}

export function canEditBrand(role: MemberRole) {
  return role === "owner" || role === "manager";
}

export function canManageMembers(role: MemberRole) {
  return role === "owner";
}

export function canExportCustomers(role: MemberRole) {
  return role === "owner" || role === "manager";
}

export function canChangePlan(role: MemberRole) {
  return role === "owner";
}
