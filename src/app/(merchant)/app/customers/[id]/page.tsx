import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, CheckCircle2, Phone, StickyNote } from "lucide-react";
import { PageHead, StatusBadge } from "@/components/ui";
import { addFollowup, completeFollowup } from "@/lib/actions";
import { requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDateTime, isFuture, maskPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ followed?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireMerchant();
  const db = await getDb();
  const customer = db.customers.find((c) => c.id === id && c.tenantId === ctx.tenant.id);
  if (!customer) notFound();

  const followups = [...customer.followups].sort((a, b) => b.at.localeCompare(a.at));
  const pending = followups.filter((f) => f.status === "pending");
  const canWrite = ["active", "trial"].includes(ctx.tenant.status);

  return (
    <>
      <PageHead
        title={customer.name}
        sub={`建档于 ${formatDateTime(customer.createdAt)} · 来源 ${customer.source}`}
        actions={<Link className="btn" href="/app/customers"><ArrowLeft size={16} /> 返回客户列表</Link>}
      />
      {sp.followed ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={17} />
          <div>跟进记录已保存{followups[0]?.nextAt ? `，下次跟进时间 ${formatDateTime(followups[0].nextAt)}` : ""}。</div>
        </div>
      ) : null}

      <div className="split">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">跟进记录</div>
              <span className="badge orange">{pending.length} 项待跟进</span>
            </div>
            <div className="card-body">
              {followups.length === 0 ? (
                <div className="empty" style={{ padding: "24px 0" }}>
                  <div className="empty-title">还没有跟进记录</div>
                  <div className="small">记录一次沟通，便于下次拜访前回访。</div>
                </div>
              ) : (
                <div className="stack" style={{ gap: 0 }}>
                  {followups.map((f, i) => (
                    <div
                      key={f.id}
                      className="list-row"
                      style={{ alignItems: "flex-start", padding: "14px 0", borderBottom: i === followups.length - 1 ? "none" : undefined }}
                    >
                      <div className="lr-icon"><CalendarCheck size={15} /></div>
                      <div className="lr-main">
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <div className="lr-title">{f.content}</div>
                          <StatusBadge value={f.status} />
                        </div>
                        <div className="lr-sub">
                          {formatDateTime(f.at)} · {f.by}
                          {f.result ? ` · 结果：${f.result}` : ""}
                        </div>
                        {f.nextAt ? (
                          <div className="small" style={{ marginTop: 4, color: isFuture(f.nextAt) ? "var(--muted)" : "var(--orange)" }}>
                            下次跟进：{formatDateTime(f.nextAt)}
                            {f.status === "pending" && canWrite ? (
                              <form action={completeFollowup} style={{ display: "inline", marginLeft: 10 }}>
                                <input type="hidden" name="customerId" value={customer.id} />
                                <input type="hidden" name="followupId" value={f.id} />
                                <button className="link small" type="submit" style={{ background: "none", border: 0, padding: 0 }}>
                                  标记已完成
                                </button>
                              </form>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">新增跟进</div>
            </div>
            <div className="card-body">
              <form action={addFollowup} className="stack">
                <input type="hidden" name="customerId" value={customer.id} />
                <div className="form-grid">
                  <div className="field full">
                    <label>跟进内容</label>
                    <input className="input" name="content" placeholder="例如：回访上次家庭聚餐体验" required />
                  </div>
                  <div className="field">
                    <label>沟通结果</label>
                    <input className="input" name="result" placeholder="例如：满意，希望增加私有化部署选项" />
                  </div>
                  <div className="field">
                    <label>下次跟进时间</label>
                    <input className="input" type="datetime-local" name="nextAt" />
                  </div>
                </div>
                <div className="row">
                  <button className="btn btn-primary" type="submit" disabled={!canWrite}>保存跟进</button>
                  <span className="small muted">设置下次跟进时间后，会自动进入工作台待办。</span>
                </div>
              </form>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">客户资料</div>
              <StatusBadge value={customer.status} />
            </div>
            <div className="card-body">
              <div className="kv">
                <div className="k">姓名</div>
                <div className="strong">{customer.name}</div>
                <div className="k">手机号</div>
                <div><Phone size={13} className="muted" /> {maskPhone(customer.phone)}</div>
                <div className="k">来源</div>
                <div>{customer.source}</div>
                <div className="k">标签</div>
                <div className="row" style={{ gap: 5 }}>
                  {customer.tags.length ? customer.tags.map((t) => <span className="tag" key={t}>{t}</span>) : <span className="muted">未设置</span>}
                </div>
                <div className="k">建档时间</div>
                <div>{formatDateTime(customer.createdAt)}</div>
              </div>
              <div className="divider" />
              <div className="row" style={{ alignItems: "flex-start" }}>
                <StickyNote size={15} className="muted" style={{ marginTop: 3 }} />
                <div className="small">{customer.note || "暂无备注"}</div>
              </div>
              <div className="notice mt-16">
                手机号默认脱敏展示；导出需具备客户导出权限，并记录审计日志。
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">跟进概况</div>
            </div>
            <div className="card-body">
              <div className="kv small">
                <div className="k">累计跟进</div>
                <div>{followups.length} 次</div>
                <div className="k">已完成</div>
                <div>{followups.filter((f) => f.status === "completed").length} 次</div>
                <div className="k">待跟进</div>
                <div>{pending.length} 次</div>
                <div className="k">最近跟进</div>
                <div>{followups[0] ? formatDateTime(followups[0].at) : "—"}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
