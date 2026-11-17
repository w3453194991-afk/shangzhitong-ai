import { CheckCircle2, Crown, Lock, Send, Ticket as TicketIcon, UserPlus } from "lucide-react";
import { PageHead, Progress, StatusBadge } from "@/components/ui";
import { inviteMember, submitTicket } from "@/lib/actions";
import { canManageMembers, requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string; ticket?: string; error?: string; denied?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireMerchant();
  const db = await getDb();
  const members = db.users.filter((u) => u.tenantId === ctx.tenant.id);
  const tickets = db.tickets.filter((t) => t.tenantId === ctx.tenant.id);
  const owner = canManageMembers(ctx.role);

  return (
    <>
      <PageHead
        title="系统设置"
        sub="企业信息、成员、套餐、账号与反馈工单"
        actions={<span className="badge navy">{ctx.tenant.name}</span>}
      />

      {params.invited ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={17} />
          <div>成员邀请已创建（演示版账号密码为 demo123，正式版使用邀请链接设置密码）。</div>
        </div>
      ) : null}
      {params.ticket ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={17} />
          <div>反馈工单已提交，平台运营会在工单页处理并回复。</div>
        </div>
      ) : null}
      {params.denied || params.error ? (
        <div className="notice orange" style={{ marginBottom: 16 }}>
          <div>{params.denied ? "当前角色没有该操作权限。" : "请填写完整信息。"}</div>
        </div>
      ) : null}

      <div className="split">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">企业信息</div>
                <div className="card-desc">企业主体信息由平台开通时创建</div>
              </div>
            </div>
            <div className="card-body">
              <div className="kv">
                <div className="k">企业名称</div>
                <div className="strong">{ctx.tenant.name}</div>
                <div className="k">企业编号</div>
                <div>{ctx.tenant.code}</div>
                <div className="k">所属行业</div>
                <div>{ctx.tenant.category}</div>
                <div className="k">联系人</div>
                <div>{ctx.tenant.contactName} · {ctx.tenant.contactPhone}</div>
                <div className="k">企业状态</div>
                <div><StatusBadge value={ctx.tenant.status} /></div>
                <div className="k">开通时间</div>
                <div>{formatDate(ctx.tenant.createdAt)}</div>
              </div>
              <div className="notice mt-16">
                企业名称、状态与套餐由平台管理端维护；企业端仅维护品牌资料与业务数据。
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">成员管理</div>
                <div className="card-desc">同一企业成员共享业务数据，权限按角色区分</div>
              </div>
              <span className="badge blue">{members.length} 人</span>
            </div>
            <div className="card-body">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>成员</th>
                      <th>角色</th>
                      <th>加入时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="cell-main">{m.name}</div>
                          <div className="cell-sub">{m.email}</div>
                        </td>
                        <td><StatusBadge value={m.role} /></td>
                        <td className="small muted">{formatDate(m.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divider" />
              {owner ? (
                <form action={inviteMember} className="form-grid">
                  <div className="field">
                    <label>成员姓名</label>
                    <input className="input" name="name" placeholder="例如：李主管" />
                  </div>
                  <div className="field">
                    <label>邮箱</label>
                    <input className="input" name="email" type="email" placeholder="manager@example.com" required />
                  </div>
                  <div className="field">
                    <label>角色</label>
                    <select className="select" name="role" defaultValue="manager">
                      <option value="manager">部门主管</option>
                      <option value="staff">员工</option>
                    </select>
                  </div>
                  <div className="field" style={{ justifyContent: "flex-end" }}>
                    <button className="btn btn-primary" type="submit">
                      <UserPlus size={15} /> 邀请成员
                    </button>
                  </div>
                </form>
              ) : (
                <div className="notice orange">
                  <Lock size={17} />
                  <div>只有企业管理员可以邀请或管理成员。</div>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">我的反馈工单</div>
                <div className="card-desc">提交后平台运营可在管理端回复</div>
              </div>
              <TicketIcon size={17} className="muted" />
            </div>
            <div className="card-body">
              {tickets.length === 0 ? (
                <div className="small muted" style={{ marginBottom: 14 }}>还没有提交过工单。</div>
              ) : (
                <div className="stack" style={{ gap: 10, marginBottom: 16 }}>
                  {tickets.map((t) => (
                    <div key={t.id} className="result-block">
                      <div className="result-head">
                        <span>{t.title}</span>
                        <StatusBadge value={t.status} />
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        <div className="small">{t.content}</div>
                        {t.replies.map((r, i) => (
                          <div className="notice green mt-8" key={i}>
                            <div>
                              <strong>{r.by}</strong>：{r.content}
                              <div className="tiny muted mt-8">{formatDateTime(r.createdAt)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <form action={submitTicket} className="stack">
                <div className="field">
                  <label>问题标题</label>
                  <input className="input" name="title" placeholder="例如：产品手册上传失败" required />
                </div>
                <div className="field">
                  <label>问题描述</label>
                  <textarea className="textarea" name="content" rows={3} placeholder="描述你遇到的问题与期望结果" required />
                </div>
                <button className="btn" type="submit"><Send size={15} /> 提交反馈</button>
              </form>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">当前套餐</div>
                <div className="card-desc">由平台管理端分配与调整</div>
              </div>
              <Crown size={17} className="muted" />
            </div>
            <div className="card-body">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="strong" style={{ fontSize: 18 }}>{ctx.plan?.name ?? "未订阅"}</div>
                  <div className="small muted">
                    {ctx.plan ? `¥${ctx.plan.price} / ${ctx.plan.durationDays} 天` : "请联系平台开通"}
                  </div>
                </div>
                {ctx.subscription ? (
                  <StatusBadge value={ctx.subscription.status === "active" ? "active" : "trial"} />
                ) : null}
              </div>
              <div className="divider" />
              <div className="small muted">本月 AI 额度</div>
              <div className="row mt-8" style={{ justifyContent: "space-between" }}>
                <span className="strong">{ctx.used} / {ctx.quota} 次</span>
                <span className="small muted">剩余 {Math.max(0, ctx.quota - ctx.used)} 次</span>
              </div>
              <div className="mt-8"><Progress value={ctx.used} max={ctx.quota} /></div>
              <div className="divider" />
              <div className="stack" style={{ gap: 7 }}>
                {(ctx.plan?.features ?? []).map((f) => (
                  <div className="row small" key={f}>
                    <CheckCircle2 size={14} color="#1b9a72" /> {f}
                  </div>
                ))}
              </div>
              <div className="kv small mt-16">
                <div className="k">生效日期</div>
                <div>{ctx.subscription ? formatDate(ctx.subscription.startsAt) : "—"}</div>
                <div className="k">到期日期</div>
                <div>{ctx.subscription ? formatDate(ctx.subscription.expiresAt) : "—"}</div>
                {ctx.subscription?.quotaOverride ? (
                  <>
                    <div className="k">额度覆盖</div>
                    <div>{ctx.subscription.quotaOverride} 次 / 月</div>
                  </>
                ) : null}
              </div>
              {!owner ? <div className="notice orange mt-16">修改套餐需联系企业管理员或平台管理员。</div> : null}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">账号信息</div>
            </div>
            <div className="card-body">
              <div className="kv small">
                <div className="k">登录人</div>
                <div>{ctx.user.name}</div>
                <div className="k">邮箱</div>
                <div>{ctx.user.email}</div>
                <div className="k">角色</div>
                <div>{ctx.role === "owner" ? "企业管理员" : ctx.role === "manager" ? "部门主管" : "员工"}</div>
                <div className="k">登录方式</div>
                <div>演示账号（正式版 Supabase Auth）</div>
              </div>
              <div className="divider" />
              <form action="/api/logout" method="post">
                <button className="btn btn-block" type="submit">退出登录</button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
