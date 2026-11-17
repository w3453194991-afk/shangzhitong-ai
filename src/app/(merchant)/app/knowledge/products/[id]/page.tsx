import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { PageHead } from "@/components/ui";
import { saveDish } from "@/lib/actions";
import { requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireMerchant();
  const db = await getDb();
  const product = db.dishes.find((d) => d.id === id && d.tenantId === ctx.tenant.id);
  if (!product) notFound();
  const canEdit = ctx.role !== "staff";

  return (
    <>
      <PageHead
        title={`编辑产品 · ${product.name}`}
        sub={`最近更新 ${formatDateTime(product.updatedAt)}`}
        actions={<Link className="btn" href="/app/knowledge/products"><ArrowLeft size={16} /> 返回列表</Link>}
      />
      <section className="card" style={{ maxWidth: 860 }}>
        <div className="card-head">
          <div className="card-title">产品资料</div>
          {!canEdit ? <span className="badge orange"><Lock size={11} /> 只读</span> : null}
        </div>
        <div className="card-body">
          <form action={saveDish} className="stack">
            <input type="hidden" name="id" value={product.id} />
            <div className="form-grid">
              <div className="field">
                <label>产品名称</label>
                <input className="input" name="name" defaultValue={product.name} disabled={!canEdit} required />
              </div>
              <div className="field">
                <label>分类</label>
                <input className="input" name="category" defaultValue={product.category} disabled={!canEdit} />
              </div>
              <div className="field">
                <label>价格（元）</label>
                <input className="input" name="price" defaultValue={product.price} disabled={!canEdit} required />
              </div>
              <div className="field">
                <label>规格 / 版本</label>
                <input className="input" name="spec" defaultValue={product.spec} disabled={!canEdit} />
              </div>
              <div className="field full">
                <label>核心功能 / 交付内容</label>
                <input className="input" name="ingredients" defaultValue={product.ingredients} disabled={!canEdit} />
              </div>
              <div className="field full">
                <label>产品简介</label>
                <textarea className="textarea" name="description" defaultValue={product.description} disabled={!canEdit} rows={4} />
              </div>
              <div className="field">
                <label>适用客户</label>
                <input className="input" name="recommendedFor" defaultValue={product.recommendedFor} disabled={!canEdit} />
              </div>
              <div className="field">
                <label>状态</label>
                <select className="select" name="status" defaultValue={product.status} disabled={!canEdit}>
                  <option value="on">在售</option>
                  <option value="off">已下架</option>
                </select>
              </div>
            </div>
            <div className="row">
              {canEdit ? <button className="btn btn-primary" type="submit">保存修改</button> : null}
              <Link className="btn" href="/app/knowledge/products">取消</Link>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}