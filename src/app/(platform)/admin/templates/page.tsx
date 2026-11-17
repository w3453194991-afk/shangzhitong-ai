import { ClipboardList, FileStack } from "lucide-react";
import { PageHead, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const templates = [
  {
    name: "企业增长助手 System Prompt",
    category: "系统",
    version: "v1.3",
    scope: "全部企业",
    desc: "定义企业增长助手角色、输出 JSON schema、禁止编造事实与价格，所有生成共用。",
    status: "active",
  },
  {
    name: "朋友圈产品推广模板",
    category: "文案",
    version: "v2.1",
    scope: "全部企业",
    desc: "注入品牌资料、目标客群与产品，输出 2 个候选版本，包含标题、正文、话题与 CTA。",
    status: "active",
  },
  {
    name: "30 秒产品演示视频分镜模板",
    category: "视频",
    version: "v1.0",
    scope: "基础版及以上",
    desc: "按镜头序号输出时间段、画面、口播、字幕与转场，镜头时长合计与选择时长一致。",
    status: "active",
  },
  {
    name: "B2B 线索获取活动模板",
    category: "活动",
    version: "v1.2",
    scope: "全部企业",
    desc: "生成活动主题、规则、执行步骤、宣传文案与风险提示，不承诺具体折扣与效果。",
    status: "active",
  },
  {
    name: "行业解决方案白皮书模板",
    category: "文案",
    version: "v0.9",
    scope: "专业版及以上",
    desc: "面向企业决策者的理性叙述模板，结构为痛点、方案、交付与行动建议。",
    status: "pending",
  },
];

export default async function TemplatesPage() {
  await requireAdmin();
  return (
    <>
      <PageHead
        title="模板管理"
        sub="公共提示词与营销模板的版本管理；企业端按套餐权限使用"
        actions={<span className="badge blue"><FileStack size={12} /> {templates.length} 个模板</span>}
      />

      <div className="notice" style={{ marginBottom: 16 }}>
        <ClipboardList size={17} />
        <div>
          演示版模板以只读方式展示，实际生成由服务端内置引擎执行。正式接入模型后，可在此维护模板版本、适用范围与启停状态。
        </div>
      </div>

      <div className="grid grid-2">
        {templates.map((t) => (
          <section className="card" key={t.name}>
            <div className="card-head">
              <div>
                <div className="card-title">{t.name}</div>
                <div className="card-desc">{t.category} · {t.version} · {t.scope}</div>
              </div>
              <StatusBadge value={t.status === "active" ? "active" : "pending"}>
                {t.status === "active" ? "已启用" : "待审核"}
              </StatusBadge>
            </div>
            <div className="card-body small muted" style={{ lineHeight: 1.8 }}>{t.desc}</div>
          </section>
        ))}
      </div>
    </>
  );
}
