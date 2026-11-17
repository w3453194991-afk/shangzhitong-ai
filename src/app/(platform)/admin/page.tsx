import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  CircleAlert,
  Coins,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { PageHead, StatCard, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDate, formatDateTime, isThisMonth, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();
  const db = await getDb();
  const tenants = db.tenants;
  const active = tenants.filter((t) => t.status === "active");
  const trial = tenants.filter((t) => t.status === "trial");
  const suspended = tenants.filter((t) => t.status === "suspended");

  const usage = db.usageLogs.filter((l) => l.status === "success");
  const monthUsage = usage.filter((l) => isThisMonth(l.createdAt));
  const cost = monthUsage.reduce((s, l) => s + l.cost, 0);

  const usageByTenant = tenants
    .map((t) => ({
      tenant: t,
      count: monthUsage.filter((l) => l.tenantId === t.id).length,
      cost: monthUsage.filter((l) => l.tenantId === t.id).reduce((s, l) => s + l.cost, 0),
    }))
    .sort((a, b) => b.count - a.count);
  const maxUsage = Math.max(1, ...usageByTenant.map((u) => u.count));

  const openTickets = db.tickets.filter((t) => t.status !== "resolved");
  const recentCustomers = db.customers.filter((c) => isThisMonth(c.createdAt)).length;
  const totalCustomers = db.customers.length;

  return (
    <>
      <PageHead
        title="平台总览"
        sub={`${admin.name} · 平台企业客户、订阅与 AI 用量的统一视图`}
        actions={
          <Link className="btn btn-primary" href="/admin/tenants">
            <Building2 size={16} /> 新增企业
          </Link>
        }
      />

      <div className="grid grid-4">
        <StatCard label="企业客户数" value={tenants.length} foot={`${active.length} 家正常 · ${trial.length} 家试用`} icon={<Store size={17} />} />
        <StatCard label="本月新增客户" value={recentCustomers} tone="green" foot={`平台累计 ${totalCustomers} 位`} icon={<Users size={17} />} />
        <StatCard label="本月 AI 调用" value={monthUsage.length} tone="navy" foot={`${usage.length} 次累计`} icon={<Sparkles size={17} />} />
        <StatCard label="本月 AI 成本" value={money(cost)} tone="orange" foot="按模型单价估算 · estimated" icon={<Coins size={17} />} />
      </div>

      <div className="split" style={{ marginTop: 18 }}>
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">企业 AI 用量</div>
                <div className="card-desc">本月成功调用次数 · 仅平台端可跨企业汇总</div>
              </div>
              <span className="badge blue">{monthUsage.length} 次</span>
            </div>
            <div className="card-body">
              {usageByTenant.map(({ tenant, count, cost: c }) => (
                <div className="hbar" key={tenant.id}>
                  <div className="hb-label" style={{ width: 118 }}>
                    <Link className="link" href={`/admin/tenants/${tenant.id}`}>{tenant.name}</Link>
                  </div>
                  <div className="hb-track">
                    <div className="hb-fill" style={{ width: `${(count / maxUsage) * 100}%` }} />
                  </div>
                  <div className="hb-value">{count}</div>
                </div>
              ))}
              <div className="divider" />
              <div className="row small muted" style={{ justifyContent: "space-between" }}>
                <span>成本按模型单价估算，Token 缺失时标记 estimated</span>
                <Link className="link" href="/admin/ai-usage">查看明细 →</Link>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">企业客户列表</div>
                <div className="card-desc">点击进入企业详情，可调整状态、套餐与额度</div>
              </div>
              <Link className="link small" href="/admin/tenants">全部企业</Link>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>企业</th>
                    <th>状态</th>
                    <th>套餐</th>
                    <th>本月调用</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.slice(0, 4).map((t) => {
                    const sub = db.subscriptions.find((s) => s.tenantId === t.id);
                    const plan = db.plans.find((p) => p.id === sub?.planId);
                    return (
                      <tr key={t.id}>
                        <td>
                          <Link className="cell-main link" href={`/admin/tenants/${t.id}`}>{t.name}</Link>
                          <div className="cell-sub">{t.category} · {t.code}</div>
                        </td>
                        <td><StatusBadge value={t.status} /></td>
                        <td className="small">{plan?.name ?? "未订阅"}</td>
                        <td className="small">{monthUsage.filter((l) => l.tenantId === t.id).length} 次</td>
                        <td className="small muted">{formatDate(t.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">待处理工单</div>
              <span className="badge orange">{openTickets.length}</span>
            </div>
            <div className="card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
              <div className="list">
                {openTickets.slice(0, 3).map((t) => (
                  <Link className="list-row" href="/admin/tickets" key={t.id}>
                    <div className="lr-icon"><CircleAlert size={15} /></div>
                    <div className="lr-main">
                      <div className="lr-title">{t.title}</div>
                      <div className="lr-sub">
                        {db.tenants.find((x) => x.id === t.tenantId)?.name} · {formatDateTime(t.createdAt)}
                      </div>
                    </div>
                    <StatusBadge value={t.status} />
                  </Link>
                ))}
                {openTickets.length === 0 ? <div className="small muted">暂无待处理工单。</div> : null}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">最近操作</div>
              <Link className="link small" href="/admin/audit-logs">全部日志</Link>
            </div>
            <div className="card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
              <div className="list">
                {db.auditLogs.slice(0, 4).map((a) => (
                  <div className="list-row" key={a.id}>
                    <div className="lr-icon"><Activity size={15} /></div>
                    <div className="lr-main">
                      <div className="lr-title">{a.target}</div>
                      <div className="lr-sub">{a.detail}</div>
                    </div>
                    <span className="tiny muted nowrap">{formatDateTime(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">运营提醒</div>
            </div>
            <div className="card-body">
              <div className="stack" style={{ gap: 9 }}>
                <Link className="row small" href="/admin/tenants">
                  <ArrowRight size={14} /> {trial.length} 家试用企业待跟进转化
                </Link>
                <Link className="row small" href="/admin/tenants">
                  <ArrowRight size={14} /> {suspended.length} 家企业处于暂停状态
                </Link>
                <Link className="row small" href="/admin/subscriptions">
                  <ArrowRight size={14} /> {db.subscriptions.filter((s) => new Date(s.expiresAt).getTime() - Date.now() < 30 * 86400000).length} 个订阅将在 30 天内到期
                </Link>
              </div>
              <div className="notice mt-16">
                平台运营默认不查看企业客户详情、聊天全文与私密文件内容。
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
