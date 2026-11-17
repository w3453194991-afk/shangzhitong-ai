import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";
import { PageHead } from "@/components/ui";
import { ChatBox } from "@/components/chat-box";
import { requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const ctx = await requireMerchant();
  const db = await getDb();
  const convo = db.conversations.find(
    (c) => c.tenantId === ctx.tenant.id && c.userId === ctx.user.id,
  );
  const files = db.files.filter((f) => f.tenantId === ctx.tenant.id);
  const readyFiles = files.filter((f) => f.status === "ready");
  const dishes = db.dishes.filter((d) => d.tenantId === ctx.tenant.id && d.status === "on");
  const canAsk = ["active", "trial"].includes(ctx.tenant.status);

  const messages =
    convo?.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      sources: m.sources,
      found: undefined,
    })) ?? [];

  return (
    <>
      <PageHead
        title="AI 问答"
        sub={`${ctx.tenant.name} 专属知识库 · 回答引用来源，缺少资料时明确说明`}
        actions={<Link className="btn" href="/app/knowledge/files">管理文档</Link>}
      />
      <div className="split">
        <ChatBox initialMessages={messages} canAsk={canAsk} />

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">知识库状态</div>
            </div>
            <div className="card-body">
              <div className="kv">
                <div className="k">可检索文档</div>
                <div>{readyFiles.length} / {files.length} 个</div>
                <div className="k">在售产品</div>
                <div>{dishes.length} 个</div>
                <div className="k">检索方式</div>
                <div>向量 + 关键词（演示版为关键词检索）</div>
                <div className="k">隔离方式</div>
                <div>tenant_id 强制过滤</div>
              </div>
              <div className="divider" />
              <div className="list">
                {readyFiles.slice(0, 3).map((f) => (
                  <div className="list-row" key={f.id}>
                    <div className="lr-icon"><FileText size={15} /></div>
                    <div className="lr-main">
                      <div className="lr-title">{f.name}</div>
                      <div className="lr-sub">{f.category} · {formatDateTime(f.uploadedAt)}</div>
                    </div>
                  </div>
                ))}
                {readyFiles.length === 0 ? (
                  <div className="small muted">
                    暂无已解析文档，仍可基于产品资料回答问题。
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">防幻觉规则</div>
              <ShieldCheck size={16} className="muted" />
            </div>
            <div className="card-body small muted" style={{ lineHeight: 1.9 }}>
              <p>价格、交付内容、服务范围、资质与优惠政策属于高风险事实。</p>
              <p className="mt-8">检索不到或资料冲突时，回答必须说明无法确认，不能自行推断。</p>
              <p className="mt-8">试试问「你们有海外仓服务吗」：系统会返回资料不足，而不是编造服务。</p>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">本次会话</div>
            </div>
            <div className="card-body">
              <div className="kv small">
                <div className="k">会话主题</div>
                <div>{convo?.title ?? "尚未提问"}</div>
                <div className="k">消息数量</div>
                <div>{convo?.messages.length ?? 0} 条</div>
                <div className="k">开始时间</div>
                <div>{convo ? formatDateTime(convo.createdAt) : "—"}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
