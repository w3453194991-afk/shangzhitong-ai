import type { ReactNode } from "react";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  const today = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(new Date());

  return (
    <Shell
      kind="admin"
      user={{ name: user.name, roleLabel: "平台超级管理员" }}
      today={today}
    >
      {children}
    </Shell>
  );
}
