import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, UserCog } from "lucide-react";
import { PageHead, Progress, StatCard, StatusBadge } from "@/components/ui";
import { updateSubscription, updateTenantStatus } from "@/lib/actions";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDate, formatDateTime, isThisMonth, label, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  await requireAdmin();
  const db = await getDb();
  const tenant = db.tenants.find((t) => t.id === id);
  if (!tenant) notFound();

  const sub = db.subscriptions.find((s) => s.tenantId === tenant.id && s.status !== "cancelled");
  const plan = db.plans.find((p) => p.id === sub?.planId);
  const members = db.users.filter((u) => u.tenantId === tenant.id);
  const customers = db.customers.filter((c) => c.tenantId === tenant.id);
  const usage = db.usageLogs.filter((l) => l.tenantId === tenant.id);
  const monthUsage = usage.filter((l) => l.status === "success" && isThisMonth(l.createdAt));
  const quota = sub?.quotaOverride ?? plan?.aiQuota ?? 0;
  const generations = db.generations.filter((g) => g.tenantId === tenant.id);
  const audits = db.auditLogs.filter((a) => a.tenantId === tenant.id).slice(0, 6);
  const files = db.files.filter((f) => f.tenantId === tenant.id);
  const cost = monthUsage.reduce((s, l) => s + l.cost, 0);
  const expiresValue = sub ? new Date(sub.expiresAt).toISOString().slice(0, 10) : "";

  return (
    <>
      <PageHead
        title={tenant.name}
        sub={`${tenant.category} · ${tenant.code} · 创建于 ${formatDate(tenant.createdAt)}`}
        actions={
          <>
            <Link className="btn" href="/admin/tenants"><ArrowLeft size={16} /> 返回企业列表</Link>
            <StatusBadge value={tenant.status} />
          </>
        }
      />

      {sp.created ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <div>企业已创建，订阅与企业管理员账号已同步生成。可将演示密码 demo123 告知负责人完成首次登录。</div>
        </div>
      ) : null}
      {sp.updated ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <div>修改已保存并写入审计日志；企业端下次读取上下文时立即生效。</div>
        </div>
      ) : null}

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <StatCard label="客户数" value={customers.length} />
        <StatCard label="本月 AI 调用" value={monthUsage.length} tone="navy" foot={`额度 ${quota} 次`} />
        <StatCard label="累计生成" value={generations.length} tone="green" foot={`${files.length} 个知识文档`} />
        <StatCard label="本月成本" value={money(cost)} tone="orange" foot="estimated" />
      </div>

      <div className="split">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">套餐与额度</div>
              {sub ? <StatusBadge value={sub.status === "active" ? "active" : "trial"} /> : <span className="badge red">未订阅</span>}
            </div>
            <div className="card-body">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="strong" style={{ fontSize: 17 }}>{plan?.name ?? "未订阅"}套餐</div>
                  <div className="small muted">
                    {sub ? `${formatDate(sub.startsAt)} 至 ${formatDate(sub.expiresAt)}` : "尚未开通"}
                  </div>
                </div>
                <span className="small muted">本月 {monthUsage.length} / {quota} 次</span>
              </div>
              <div className="mt-8"><Progress value={monthUsage.length} max={Math.max(1, quota)} /></div>
              <div className="divider" />
              <form action={updateSubscription} className="form-grid">
                <input type="hidden" name="tenantId" value={tenant.id} />
                <div className="field">
                  <label>套餐</label>
                  <select className="select" name="planId" defaultValue={sub?.planId ?? db.plans[0].id}>
                    {db.plans.map((p) => (
                      <option value={p.id} key={p.id}>{p.name} · {p.aiQuota} 次/月 · ¥{p.price}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>额度覆盖（次/月）</label>
                  <input className="input" name="quotaOverride" defaultValue={sub?.quotaOverride ?? ""} placeholder="留空则使用套餐默认额度" />
                </div>
                <div className="field">
                  <label>到期日期</label>
                  <input className="input" type="date" name="expiresAt" defaultValue={expiresValue} />
                </div>
                <div className="field" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" type="submit">保存套餐调整</button>
                </div>
              </form>
              <div className="notice mt-16">
                调整后企业端「套餐 / 额度」读取同一份订阅数据，无需同步复制。
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">状态与访问控制</div>
                <div className="card-desc">状态修改会立即影响企业端业务请求</div>
              </div>
              <ShieldAlert size={17} className="muted" />
            </div>
            <div className="card-body">
              <div className="row">
                {(["active", "trial", "suspended", "closed"] as const).map((s) => (
                  <form action={updateTenantStatus} key={s}>
                    <input type="hidden" name="id" value={tenant.id} />
                    <input type="hidden" name="status" value={s} />
                    <button
                      className={`btn btn-sm ${tenant.status === s ? "btn-navy" : ""}`}
                      type="submit"
                      disabled={tenant.status === s}
                    >
                      {label(s)}
                    </button>
                  </form>
                ))}
              </div>
              <div className="kv small mt-16">
                <div className="k">当前状态</div>
                <div><StatusBadge value={tenant.status} /></div>
                <div className="k">暂停影响</div>
                <div>AI 生成与新增业务写入被拒绝，仍可查看历史数据</div>
                <div className="k">关闭影响</div>
                <div>不可登录，仅保留数据导出与注销处理流程</div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">操作审计</div>
              <Link className="link small" href="/admin/audit-logs">全部日志</Link>
            </div>
            <div className="card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
              {audits.length === 0 ? (
                <div className="small muted">暂无该企业的管理操作记录。</div>
              ) : (
                <div className="list">
                  {audits.map((a) => (
                    <div className="list-row" key={a.id}>
                      <div className="lr-icon"><UserCog size={15} /></div>
                      <div className="lr-main">
                        <div className="lr-title">{a.action} · {a.target}</div>
                        <div className="lr-sub">{a.detail}</div>
                      </div>
                      <span className="tiny muted nowrap">{formatDateTime(a.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">基础资料</div>
            </div>
            <div className="card-body">
              <div className="kv small">
                <div className="k">联系人</div>
                <div>{tenant.contactName}</div>
                <div className="k">联系电话</div>
                <div>{tenant.contactPhone || "—"}</div>
                <div className="k">企业编号</div>
                <div>{tenant.code}</div>
                <div className="k">所属行业</div>
                <div>{tenant.category}</div>
                <div className="k">创建时间</div>
                <div>{formatDateTime(tenant.createdAt)}</div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">成员</div>
              <span className="badge blue">{members.length} 人</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>成员</th><th>角色</th></tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="cell-main">{m.name}</div>
                        <div className="cell-sub">{m.email}</div>
                      </td>
                      <td><StatusBadge value={m.role} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">最近 AI 调用</div>
              <Link className="link small" href="/admin/ai-usage">用量明细</Link>
            </div>
            <div className="card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
              {usage.length === 0 ? (
                <div className="small muted">暂无调用记录。</div>
              ) : (
                <div className="list">
                  {usage.slice(0, 5).map((l) => (
                    <div className="list-row" key={l.id}>
                      <div className="lr-icon"><span className="tiny">{l.type}</span></div>
                      <div className="lr-main">
                        <div className="lr-title">{l.model}</div>
                        <div className="lr-sub">{l.inputTokens + l.outputTokens} tokens · {money(l.cost)}</div>
                      </div>
                      <span className="tiny muted nowrap">{formatDateTime(l.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="notice mt-16">
                平台默认只看汇总与用量，不查看企业客户详情、聊天全文或私密文件。
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
