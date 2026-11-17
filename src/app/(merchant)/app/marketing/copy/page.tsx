import Link from "next/link";
import { AlertCircle, Info, Sparkles } from "lucide-react";
import { PageHead } from "@/components/ui";
import { GeneratorForm } from "@/components/generator-form";
import { requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CopyPage() {
  const ctx = await requireMerchant();
  const db = await getDb();
  const dishes = db.dishes.filter((d) => d.tenantId === ctx.tenant.id);
  const canWrite = ["active", "trial"].includes(ctx.tenant.status);

  return (
    <>
      <PageHead
        title="AI 文案生成"
        sub="按渠道与主题生成贴合企业口吻的文案，自动引用品牌资料与产品真实价格"
        actions={<Link className="btn" href="/app/marketing/history">生成历史</Link>}
      />
      <div className="split">
        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">生成表单</div>
              <div className="card-desc">一次生成至少 2 个候选版本，可分别复制</div>
            </div>
            <span className="badge blue"><Sparkles size={12} /> AI</span>
          </div>
          <div className="card-body">
            <GeneratorForm
              type="copy"
              dishes={dishes.map((d) => ({ id: d.id, name: d.name, price: d.price, status: d.status }))}
              quotaUsed={ctx.used}
              quota={ctx.quota}
              canWrite={canWrite}
            />
          </div>
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">本次将注入的企业资料</div>
              <Link className="link small" href="/app/marketing/brand">编辑</Link>
            </div>
            <div className="card-body">
              {ctx.brand ? (
                <>
                  <div className="section-title" style={{ fontSize: 13 }}>{ctx.brand.brandName}</div>
                  <p className="small muted" style={{ lineHeight: 1.8 }}>{ctx.brand.description}</p>
                  <div className="divider" />
                  <div className="kv small">
                    <div className="k">所属行业</div>
                    <div>{ctx.brand.category}</div>
                    <div className="k">目标客群</div>
                    <div>{ctx.brand.audience.join("、") || "未填写"}</div>
                    <div className="k">语气</div>
                    <div>{ctx.brand.tone}</div>
                    <div className="k">禁用表达</div>
                    <div>{ctx.brand.constraints.join("；") || "未设置"}</div>
                  </div>
                </>
              ) : (
                <div className="notice orange">
                  <AlertCircle size={17} />
                  <div>尚未完善品牌资料，AI 无法生成有企业差异的文案。</div>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">生成小贴士</div>
            </div>
            <div className="card-body small muted" style={{ lineHeight: 1.9 }}>
              <div className="row" style={{ alignItems: "flex-start" }}>
                <Info size={15} style={{ marginTop: 2, flex: "0 0 auto" }} />
                <span>选择具体产品后，AI 只会使用这些产品的真实名称与价格，不会编造未录入的产品。</span>
              </div>
              <div className="row mt-8" style={{ alignItems: "flex-start" }}>
                <Info size={15} style={{ marginTop: 2, flex: "0 0 auto" }} />
                <span>发布前请人工核对价格、服务范围与优惠信息，AI 不自动承诺任何折扣或效果。</span>
              </div>
              <div className="row mt-8" style={{ alignItems: "flex-start" }}>
                <Info size={15} style={{ marginTop: 2, flex: "0 0 auto" }} />
                <span>同样的任务在不同企业会得到不同结果，因为会读取各自的品牌与产品资料。</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
