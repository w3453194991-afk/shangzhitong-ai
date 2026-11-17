import Link from "next/link";
import { Megaphone, PenLine, Trash2, Video } from "lucide-react";
import { EmptyState, PageHead, StatusBadge } from "@/components/ui";
import { deleteGeneration } from "@/lib/actions";
import { requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_META = {
  copy: { label: "文案", icon: <PenLine size={15} />, href: "/app/marketing/copy" },
  video: { label: "视频脚本", icon: <Video size={15} />, href: "/app/marketing/video" },
  campaign: { label: "活动策划", icon: <Megaphone size={15} />, href: "/app/marketing/campaign" },
} as const;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireMerchant();
  const db = await getDb();
  let items = db.generations
    .filter((g) => g.tenantId === ctx.tenant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (params.type && ["copy", "video", "campaign"].includes(params.type)) {
    items = items.filter((g) => g.type === params.type);
  }
  const canDelete = ctx.role !== "staff";

  return (
    <>
      <PageHead
        title="生成历史"
        sub="每次生成都保存输入、结果、模型与 token 用量；可复制、回看或删除"
        actions={<Link className="btn btn-primary" href="/app/marketing/copy">新建生成</Link>}
      />

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <Link className={`tab ${!params.type ? "active" : ""}`} href="/app/marketing/history" style={{ background: !params.type ? "#fff" : "transparent" }}>
          全部
        </Link>
        {(["copy", "video", "campaign"] as const).map((t) => (
          <Link
            key={t}
            className={`tab ${params.type === t ? "active" : ""}`}
            href={`/app/marketing/history?type=${t}`}
            style={{ background: params.type === t ? "#fff" : "transparent" }}
          >
            {TYPE_META[t].label}
          </Link>
        ))}
        <span className="small muted">共 {items.length} 条</span>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            title="暂无生成记录"
            desc="生成内容后会自动保存在这里，且只对当前企业可见。"
            action={<Link className="btn btn-primary btn-sm" href="/app/marketing/copy">去生成文案</Link>}
          />
        </div>
      ) : (
        <div className="stack">
          {items.map((g) => (
            <section className="card" key={g.id}>
              <div className="card-head">
                <div className="row">
                  <span className="badge navy">{TYPE_META[g.type].icon} {TYPE_META[g.type].label}</span>
                  <div>
                    <div className="card-title">{g.title}</div>
                    <div className="card-desc">{formatDateTime(g.createdAt)} · {g.model}</div>
                  </div>
                </div>
                <div className="row">
                  <StatusBadge value={g.status} />
                  <Link className="btn btn-sm" href={TYPE_META[g.type].href}>再生成</Link>
                  {canDelete ? (
                    <form action={deleteGeneration}>
                      <input type="hidden" name="id" value={g.id} />
                      <button className="btn btn-sm btn-danger" type="submit">
                        <Trash2 size={14} /> 删除
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
              <div className="card-body" style={{ paddingTop: 14 }}>
                <details>
                  <summary className="link small" style={{ cursor: "pointer" }}>
                    查看完整内容与输入参数
                  </summary>
                  <div className="result-block mt-16">
                    <div className="result-body">{g.plainText}</div>
                  </div>
                  <div className="kv small mt-16">
                    <div className="k">生成人</div>
                    <div>{db.users.find((u) => u.id === g.createdBy)?.name ?? g.createdBy}</div>
                    <div className="k">输入参数</div>
                    <div style={{ wordBreak: "break-all" }}>{JSON.stringify(g.input)}</div>
                  </div>
                </details>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
