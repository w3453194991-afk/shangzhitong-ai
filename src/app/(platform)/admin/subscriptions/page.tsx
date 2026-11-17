import Link from "next/link";
import { CreditCard, RefreshCcw } from "lucide-react";
import { PageHead, StatCard, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/store";
import { daysBetween, formatDate, isThisMonth, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  await requireAdmin();
  const db = await getDb();
  const subs = db.subscriptions
    .filter((s) => s.status !== "cancelled")
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));

  const activeCount = subs.filter((s) => s.status === "active").length;
  const trialCount = subs.filter((s) => s.status === "trial").length;
  const expiring = subs.filter((s) => {
    const days = daysBetween(new Date(), new Date(s.expiresAt));
    return days >= 0 && days <= 30;
  });
  const mrr = subs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      const plan = db.plans.find((p) => p.id === s.planId);
      return sum + (plan?.price ?? 0);
    }, 0);

  return (
    <>
      <PageHead
        title="订阅 / 订单"
        sub="首版为人工收款与后台开通，不接入在线支付；企业端展示同一份订阅状态"
        actions={<span className="badge orange">人工收款模式</span>}
      />

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <StatCard label="订阅总数" value={subs.length} icon={<CreditCard size={17} />} />
        <StatCard label="正常订阅" value={activeCount} tone="green" foot={`${trialCount} 家试用中`} />
        <StatCard label="30 天内到期" value={expiring.length} tone="orange" icon={<RefreshCcw size={17} />} />
        <StatCard label="月度合约金额" value={money(mrr)} tone="navy" foot="仅正常订阅的套餐标价合计" />
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <div className="card-title">订阅列表</div>
            <div className="card-desc">调整套餐与额度请进入企业详情页，变更会记录审计日志</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>企业</th>
                <th>套餐</th>
                <th>状态</th>
                <th>生效日期</th>
                <th>到期日期</th>
                <th>本月调用 / 额度</th>
                <th>收款状态</th>
                <th className="right">操作</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const tenant = db.tenants.find((t) => t.id === s.tenantId);
                const plan = db.plans.find((p) => p.id === s.planId);
                const used = db.usageLogs.filter(
                  (l) => l.tenantId === s.tenantId && l.status === "success" && isThisMonth(l.createdAt),
                ).length;
                const days = daysBetween(new Date(), new Date(s.expiresAt));
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-main">{tenant?.name ?? "—"}</div>
                      <div className="cell-sub">{tenant?.category}</div>
                    </td>
                    <td className="small">{plan?.name ?? "—"}</td>
                    <td><StatusBadge value={s.status === "active" ? "active" : "trial"} /></td>
                    <td className="small muted">{formatDate(s.startsAt)}</td>
                    <td className="small">
                      {formatDate(s.expiresAt)}
                      {days < 0 ? (
                        <div className="cell-sub" style={{ color: "var(--red)" }}>已过期 {Math.abs(days)} 天</div>
                      ) : days <= 30 ? (
                        <div className="cell-sub" style={{ color: "var(--orange)" }}>剩余 {days} 天</div>
                      ) : null}
                    </td>
                    <td className="small">{used} / {s.quotaOverride ?? plan?.aiQuota ?? 0} 次</td>
                    <td>
                      <span className="badge green">已人工确认</span>
                    </td>
                    <td className="right">
                      <Link className="btn btn-sm" href={`/admin/tenants/${s.tenantId}`}>调整</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="notice mt-16">
        正式版接入在线支付前，续费与变更由运营人员线下确认后在企业详情页调整；每次变更写入 audit_logs。
      </div>
    </>
  );
}
