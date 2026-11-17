import Link from "next/link";
import { Clapperboard, Info } from "lucide-react";
import { PageHead } from "@/components/ui";
import { GeneratorForm } from "@/components/generator-form";
import { requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const ctx = await requireMerchant();
  const db = await getDb();
  const dishes = db.dishes.filter((d) => d.tenantId === ctx.tenant.id);
  const canWrite = ["active", "trial"].includes(ctx.tenant.status);

  return (
    <>
      <PageHead
        title="短视频脚本"
        sub="按 15 / 30 / 60 秒生成分镜、口播、字幕与转场，镜头时长自动对齐"
        actions={<Link className="btn" href="/app/marketing/history">生成历史</Link>}
      />
      <div className="split">
        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">脚本参数</div>
              <div className="card-desc">输出镜头序号、时间段、画面、台词、字幕和转场</div>
            </div>
            <span className="badge blue"><Clapperboard size={12} /> 分镜</span>
          </div>
          <div className="card-body">
            <GeneratorForm
              type="video"
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
              <div className="card-title">拍摄建议</div>
            </div>
            <div className="card-body small muted" style={{ lineHeight: 1.9 }}>
              <div className="row" style={{ alignItems: "flex-start" }}>
                <Info size={15} style={{ marginTop: 2, flex: "0 0 auto" }} />
                <span>15 秒适合功能钩子，30 秒适合产品介绍，60 秒可以讲清楚场景痛点与交付过程。</span>
              </div>
              <div className="row mt-8" style={{ alignItems: "flex-start" }}>
                <Info size={15} style={{ marginTop: 2, flex: "0 0 auto" }} />
                <span>优先用手机竖屏拍摄，自然光下拍出锅气，避免过度滤镜。</span>
              </div>
              <div className="row mt-8" style={{ alignItems: "flex-start" }}>
                <Info size={15} style={{ marginTop: 2, flex: "0 0 auto" }} />
                <span>口播内容来自企业资料，价格镜头请以正式报价单为准。</span>
              </div>
            </div>
          </section>
          <section className="card">
            <div className="card-head">
              <div className="card-title">可用素材</div>
              <Link className="link small" href="/app/knowledge/products">管理产品</Link>
            </div>
            <div className="card-body">
              <div className="kv small">
                <div className="k">在售产品</div>
                <div>{dishes.filter((d) => d.status === "on").length} 个</div>
                <div className="k">品牌特色</div>
                <div>{ctx.brand?.highlights.join("、") || "未填写"}</div>
                <div className="k">服务时间</div>
                <div>{ctx.brand?.businessHours || "未填写"}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
