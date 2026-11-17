import Link from "next/link";
import { CircleOff, Pencil, Plus, Trash2 } from "lucide-react";
import { EmptyState, PageHead, StatusBadge } from "@/components/ui";
import { deleteDish, saveDish, toggleDish } from "@/lib/actions";
import { requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; denied?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireMerchant();
  const db = await getDb();
  const products = db.dishes
    .filter((d) => d.tenantId === ctx.tenant.id)
    .sort((a, b) => Number(b.status === "on") - Number(a.status === "on"));
  const canEdit = ctx.role !== "staff";

  return (
    <>
      <PageHead
        title="产品与服务资料"
        sub="AI 生成与知识库问答只会使用这里维护的真实产品、服务与价格"
        actions={<span className="badge blue">{products.filter((d) => d.status === "on").length} 个在售</span>}
      />

      {params.saved ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <div>产品资料已保存。</div>
        </div>
      ) : null}
      {params.denied ? (
        <div className="notice orange" style={{ marginBottom: 16 }}>
          <div>当前角色没有此操作权限。</div>
        </div>
      ) : null}

      <div className="split">
        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">产品列表</div>
              <div className="card-desc">共 {products.length} 个 · 已下架产品不会进入 AI 上下文</div>
            </div>
          </div>
          {products.length === 0 ? (
            <EmptyState title="还没有产品" desc="先添加 3 个以上在售产品，AI 生成会更有依据。" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>产品 / 服务</th>
                    <th>分类</th>
                    <th>价格</th>
                    <th>状态</th>
                    <th>更新</th>
                    <th className="right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div className="cell-main">{d.name}</div>
                        <div className="cell-sub">{d.spec} · {d.recommendedFor || "通用客户"}</div>
                      </td>
                      <td><span className="tag">{d.category}</span></td>
                      <td className="strong">¥{d.price.toLocaleString("zh-CN")}</td>
                      <td><StatusBadge value={d.status} /></td>
                      <td className="small muted">{formatDate(d.updatedAt)}</td>
                      <td>
                        <div className="row" style={{ justifyContent: "flex-end", gap: 6 }}>
                          <Link className="btn btn-sm" href={`/app/knowledge/products/${d.id}`}>
                            <Pencil size={13} /> 编辑
                          </Link>
                          <form action={toggleDish}>
                            <input type="hidden" name="id" value={d.id} />
                            <button className="btn btn-sm" type="submit">
                              <CircleOff size={13} /> {d.status === "on" ? "下架" : "上架"}
                            </button>
                          </form>
                          {canEdit ? (
                            <form action={deleteDish}>
                              <input type="hidden" name="id" value={d.id} />
                              <button className="btn btn-sm btn-danger" type="submit">
                                <Trash2 size={13} />
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">新增产品 / 服务</div>
              <div className="card-desc">价格必须真实，AI 会直接引用</div>
            </div>
            <Plus size={17} className="muted" />
          </div>
          <div className="card-body">
            {canEdit ? (
              <form action={saveDish} className="stack">
                <div className="form-grid">
                  <div className="field">
                    <label>产品名称</label>
                    <input className="input" name="name" placeholder="例如：云岭数据看板" required />
                  </div>
                  <div className="field">
                    <label>分类</label>
                    <input className="input" name="category" placeholder="软件产品 / 硬件 / 服务" defaultValue="企业服务" />
                  </div>
                  <div className="field">
                    <label>价格（元）</label>
                    <input className="input" name="price" inputMode="decimal" defaultValue="0" required />
                  </div>
                  <div className="field">
                    <label>规格 / 版本</label>
                    <input className="input" name="spec" placeholder="例如：10 账号 / 年" />
                  </div>
                  <div className="field full">
                    <label>核心功能 / 交付内容</label>
                    <input className="input" name="ingredients" placeholder="例如：审批流、数据看板、权限分级" />
                  </div>
                  <div className="field full">
                    <label>产品简介</label>
                    <textarea className="textarea" name="description" rows={3} placeholder="产品解决的问题、核心能力与交付方式，用于生成内容与问答。" />
                  </div>
                  <div className="field">
                    <label>适用客户</label>
                    <input className="input" name="recommendedFor" placeholder="例如：成长型企业" />
                  </div>
                  <div className="field">
                    <label>状态</label>
                    <select className="select" name="status" defaultValue="on">
                      <option value="on">在售</option>
                      <option value="off">已下架</option>
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary" type="submit">保存产品</button>
                <div className="hint">批量导入 Excel 模板在正式版提供，导入前会先预览校验错误行。</div>
              </form>
            ) : (
              <div className="notice orange">员工角色只读，无法新增或修改产品。</div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}