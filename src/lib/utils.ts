export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function monthStart(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function isFuture(iso: string): boolean {
  return !!iso && new Date(iso).getTime() > Date.now();
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone || "—";
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function money(n: number): string {
  return `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: n % 1 === 0 ? 0 : 2 })}`;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / 86400000);
}

export function clampText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "待激活",
  trial: "试用中",
  active: "正常",
  suspended: "已暂停",
  expired: "已到期",
  closed: "已关闭",
  new: "新客户",
  lost: "已流失",
  open: "待处理",
  processing: "处理中",
  resolved: "已解决",
  uploaded: "已上传",
  ready: "可检索",
  failed: "失败",
  completed: "已完成",
  on: "在售",
  off: "已下架",
  success: "成功",
  manager: "部门主管",
  owner: "企业管理员",
  staff: "员工",
  platform_admin: "平台管理员",
};

export function label(value: string): string {
  return STATUS_LABELS[value] ?? value;
}
