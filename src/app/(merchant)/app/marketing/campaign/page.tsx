import Link from "next/link";
import { AlertTriangle, Megaphone } from "lucide-react";
import { PageHead } from "@/components/ui";
import { GeneratorForm } from "@/components/generator-form";
import { requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CampaignPage() {
  const ctx = await requireMerchant();
  const db = await getDb();
  const dishes = db.dishes.filter((d) => d.tenantId === ctx.tenant.id);
  const canWrite = ["active", "trial"].includes(ctx.tenant.status);

  return (
    <>
      <PageHead
        title="活动策划"
        sub="输入目标、预算与人群，输出主题、规则、执行步骤、宣传文案和风险提示"
        actions={<Link className="btn" href="/app/marketing/history">生成历史</Link>}
      />
      <div className="split">
        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">活动参数</div>
              <div className="card-desc">活动规则需负责人确认后执行，AI 不自动承诺优惠或效果</div>
            </div>
            <span className="badge orange"><Megaphone size={12} /> 策划</span>
          </div>
          <div className="card-body">
            <GeneratorForm
              type="campaign"
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
              <div className="card-title">活动执行原则</div>
            </div>
            <div className="card-body small muted" style={{ lineHeight: 1.9 }}>
              <div className="row" style={{ alignItems: "flex-start" }}>
                <AlertTriangle size={15} style={{ marginTop: 2, flex: "0 0 auto", color: "#e69a35" }} />
                <span>不擅自承诺具体折扣、赠品数量或交付周期，最终以正式报价与合同为准。</span>
              </div>
              <div className="row mt-8" style={{ alignItems: "flex-start" }}>
                <AlertTriangle size={15} style={{ marginTop: 2, flex: "0 0 auto", color: "#e69a35" }} />
                <span>活动前确认出餐能力与人员排班，避免因排队影响体验。</span>
              </div>
              <div className="row mt-8" style={{ alignItems: "flex-start" }}>
                <AlertTriangle size={15} style={{ marginTop: 2, flex: "0 0 auto", color: "#e69a35" }} />
                <span>宣传内容发布前，由负责人或部门主管核对价格、时间与限制条件。</span>
              </div>
            </div>
          </section>
          <section className="card">
            <div className="card-head">
              <div className="card-title">当前企业基础</div>
            </div>
            <div className="card-body">
              <div className="kv small">
                <div className="k">企业</div>
                <div>{ctx.tenant.name}</div>
                <div className="k">品类</div>
                <div>{ctx.tenant.category}</div>
                <div className="k">客群</div>
                <div>{ctx.brand?.audience.join("、") || "未填写"}</div>
                <div className="k">在售产品</div>
                <div>{dishes.filter((d) => d.status === "on").length} 个</div>
              </div>
              <div className="notice mt-16">
                活动预算与折扣由企业自行确认，平台只提供策划建议与内容草稿。
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
