import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Shell } from "@/components/shell";
import { requireMerchant } from "@/lib/session";
import { label } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MerchantLayout({ children }: { children: ReactNode }) {
  const ctx = await requireMerchant();
  const today = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(new Date());

  const statusLabel =
    ctx.tenant.status === "active"
      ? "正常"
      : ctx.tenant.status === "trial"
        ? "试用中"
        : label(ctx.tenant.status);

  return (
    <Shell
      kind="merchant"
      user={{ name: ctx.user.name, roleLabel: label(ctx.user.role) }}
      tenant={{
        name: ctx.tenant.name,
        plan: ctx.plan ? `${ctx.plan.name}套餐` : "未订阅",
        statusLabel,
        quota: ctx.quota,
        used: ctx.used,
        category: ctx.tenant.category,
      }}
      today={today}
    >
      {ctx.tenant.status === "suspended" ? (
        <div className="notice red" style={{ marginBottom: 18 }}>
          <AlertCircle size={17} />
          <div>
            企业服务已暂停：当前只能查看历史数据，AI 生成与新增业务写入将被拒绝。请联系平台支持处理。
          </div>
        </div>
      ) : null}
      {children}
    </Shell>
  );
}
