import { CheckCircle2, Plus, Tags } from "lucide-react";
import { PageHead, StatusBadge } from "@/components/ui";
import { savePlan } from "@/lib/actions";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  await requireAdmin();
  const db = await getDb();

  return (
    <>
      <PageHead
        title="套餐管理"
        sub="套餐价格、功能权限与 AI 额度由平台统一配置，企业端读取同一份数据"
        actions={
          <span className="badge blue">
            <Tags size={12} /> {db.plans.length} 个套餐
          </span>
        }
      />

      {params.saved ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <div>套餐配置已保存，企业端额度校验将读取最新配置。</div>
        </div>
      ) : null}

      <div className="grid grid-3">
        {db.plans.map((p) => {
          const subscribers = db.subscriptions.filter(
            (s) => s.planId === p.id && s.status !== "cancelled",
          ).length;
          return (
            <section className="card" key={p.id}>
              <div className="card-head">
                <div>
                  <div className="card-title">{p.name}</div>
                  <div className="card-desc">{subscribers} 家企业订阅</div>
                </div>
                <StatusBadge value={p.status === "active" ? "active" : "closed"} />
              </div>
              <div className="card-body">
                <div className="row" style={{ alignItems: "baseline" }}>
                  <span style={{ fontSize: 28, fontWeight: 700 }}>¥{p.price}</span>
                  <span className="small muted">/ {p.durationDays} 天</span>
                </div>
                <div className="small muted mt-8">AI 额度 {p.aiQuota} 次 / 月</div>
                <div className="divider" />
                <div className="stack" style={{ gap: 6 }}>
                  {p.features.map((f) => (
                    <div className="row small" key={f}>
                      <CheckCircle2 size={13} color="#1b9a72" /> {f}
                    </div>
                  ))}
                </div>
                <div className="divider" />
                <form action={savePlan} className="stack" style={{ gap: 10 }}>
                  <input type="hidden" name="id" value={p.id} />
                  <div className="form-grid">
                    <div className="field">
                      <label>名称</label>
                      <input className="input" name="name" defaultValue={p.name} />
                    </div>
                    <div className="field">
                      <label>价格（元）</label>
                      <input className="input" name="price" defaultValue={p.price} />
                    </div>
                    <div className="field">
                      <label>AI 额度（次/月）</label>
                      <input className="input" name="aiQuota" defaultValue={p.aiQuota} />
                    </div>
                    <div className="field">
                      <label>有效期（天）</label>
                      <input className="input" name="durationDays" defaultValue={p.durationDays} />
                    </div>
                    <div className="field full">
                      <label>权益（逗号分隔）</label>
                      <input className="input" name="features" defaultValue={p.features.join("，")} />
                    </div>
                    <div className="field full">
                      <label>状态</label>
                      <select className="select" name="status" defaultValue={p.status}>
                        <option value="active">启用</option>
                        <option value="inactive">停用</option>
                      </select>
                    </div>
                  </div>
                  <button className="btn" type="submit">保存套餐</button>
                </form>
              </div>
            </section>
          );
        })}
      </div>

      <section className="card mt-16">
        <div className="card-head">
          <div>
            <div className="card-title">新增套餐</div>
            <div className="card-desc">示例额度仅用于演示，正式定价需结合模型成本核算</div>
          </div>
          <Plus size={17} className="muted" />
        </div>
        <div className="card-body">
          <form action={savePlan} className="form-grid">
            <div className="field">
              <label>套餐名称</label>
              <input className="input" name="name" placeholder="例如：连锁版" required />
            </div>
            <div className="field">
              <label>价格（元）</label>
              <input className="input" name="price" defaultValue="999" />
            </div>
            <div className="field">
              <label>AI 额度（次/月）</label>
              <input className="input" name="aiQuota" defaultValue="3000" />
            </div>
            <div className="field">
              <label>有效期（天）</label>
              <input className="input" name="durationDays" defaultValue="365" />
            </div>
            <div className="field full">
              <label>权益</label>
              <input className="input" name="features" placeholder="多组织、专属模板、优先支持" />
            </div>
            <div className="field">
              <label>状态</label>
              <select className="select" name="status" defaultValue="active">
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </div>
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-primary" type="submit">创建套餐</button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
