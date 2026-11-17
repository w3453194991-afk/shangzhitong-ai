import Link from "next/link";
import { CheckCircle2, MessageSquare, Send } from "lucide-react";
import { EmptyState, PageHead, StatCard, StatusBadge } from "@/components/ui";
import { adminReplyTicket } from "@/lib/actions";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ replied?: string }>;
}) {
  const params = await searchParams;
  await requireAdmin();
  const db = await getDb();
  const tickets = [...db.tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHead
        title="反馈工单"
        sub="企业提交的问题与需求；回复后企业端可见状态与内容"
        actions={<span className="badge orange">{tickets.filter((t) => t.status !== "resolved").length} 个待处理</span>}
      />

      {params.replied ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={17} />
          <div>回复已发送，企业端工单状态已同步更新。</div>
        </div>
      ) : null}

      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <StatCard label="工单总数" value={tickets.length} icon={<MessageSquare size={17} />} />
        <StatCard label="处理中" value={tickets.filter((t) => t.status === "processing").length} tone="orange" />
        <StatCard label="已解决" value={tickets.filter((t) => t.status === "resolved").length} tone="green" />
      </div>

      {tickets.length === 0 ? (
        <div className="card"><EmptyState title="暂无工单" desc="企业可在系统设置中提交反馈。" /></div>
      ) : (
        <div className="stack">
          {tickets.map((t) => {
            const tenant = db.tenants.find((x) => x.id === t.tenantId);
            return (
              <section className="card" key={t.id}>
                <div className="card-head">
                  <div>
                    <div className="card-title">{t.title}</div>
                    <div className="card-desc">
                      {tenant ? <Link className="link" href={`/admin/tenants/${t.tenantId}`}>{tenant.name}</Link> : "—"} ·{" "}
                      {formatDateTime(t.createdAt)} · 负责人 {t.assignee}
                    </div>
                  </div>
                  <StatusBadge value={t.status} />
                </div>
                <div className="card-body">
                  <div className="ai-banner" style={{ background: "#f7f9fc", borderColor: "var(--border)", color: "var(--ink)" }}>
                    <MessageSquare size={17} style={{ flex: "0 0 auto", marginTop: 2 }} />
                    <div>{t.content}</div>
                  </div>
                  {t.replies.length > 0 ? (
                    <div className="stack mt-16" style={{ gap: 8 }}>
                      {t.replies.map((r, i) => (
                        <div key={i} className="notice green">
                          <div>
                            <strong>{r.by}</strong>：{r.content}
                            <div className="tiny muted mt-8">{formatDateTime(r.createdAt)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="divider" />
                  <form action={adminReplyTicket} className="form-grid">
                    <input type="hidden" name="id" value={t.id} />
                    <div className="field full">
                      <label>回复内容</label>
                      <textarea className="textarea" name="content" rows={2} placeholder="回复企业，例如：已检查存储配置，请重新上传。" required />
                    </div>
                    <div className="field">
                      <label>更新状态</label>
                      <select className="select" name="status" defaultValue={t.status === "open" ? "processing" : "resolved"}>
                        <option value="open">待处理</option>
                        <option value="processing">处理中</option>
                        <option value="resolved">已解决</option>
                      </select>
                    </div>
                    <div className="field" style={{ justifyContent: "flex-end" }}>
                      <button className="btn btn-primary" type="submit"><Send size={15} /> 发送回复</button>
                    </div>
                  </form>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
