import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn, label } from "@/lib/utils";

export function PageHead({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub ? <div className="page-sub">{sub}</div> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
      <div className="section-title" style={{ marginBottom: 0 }}>{children}</div>
      {extra}
    </div>
  );
}

export function StatCard({
  label: text,
  value,
  foot,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  foot?: ReactNode;
  icon?: ReactNode;
  tone?: "green" | "orange" | "navy";
}) {
  return (
    <div className={cn("stat", tone)}>
      <div className="label">{text}</div>
      <div className="value">{value}</div>
      {foot ? <div className="foot">{foot}</div> : null}
      {icon ? <div className="icon">{icon}</div> : null}
    </div>
  );
}

const TONE_MAP: Record<string, string> = {
  active: "green",
  trial: "blue",
  pending: "orange",
  suspended: "red",
  expired: "red",
  closed: "red",
  new: "blue",
  lost: "red",
  open: "orange",
  processing: "blue",
  resolved: "green",
  ready: "green",
  failed: "red",
  uploaded: "blue",
  completed: "green",
  on: "green",
  off: "red",
  success: "green",
  owner: "navy",
  manager: "blue",
  staff: "orange",
  platform_admin: "navy",
};

export function StatusBadge({ value, children }: { value: string; children?: ReactNode }) {
  return (
    <span className={cn("badge", TONE_MAP[value])}>
      <span className="dot" />
      {children ?? label(value)}
    </span>
  );
}

export function Progress({
  value,
  max,
  warnAt = 0.85,
}: {
  value: number;
  max: number;
  warnAt?: number;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn("progress", pct >= warnAt * 100 && "warn")}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({
  title,
  desc,
  action,
  icon,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon ?? <Inbox size={22} />}</div>
      <div className="empty-title">{title}</div>
      {desc ? <div className="small">{desc}</div> : null}
      {action ? <div className="mt-16">{action}</div> : null}
    </div>
  );
}

export function Notice({
  tone,
  children,
  icon,
}: {
  tone?: "orange" | "red" | "green";
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className={cn("notice", tone)}>
      {icon}
      <div>{children}</div>
    </div>
  );
}
