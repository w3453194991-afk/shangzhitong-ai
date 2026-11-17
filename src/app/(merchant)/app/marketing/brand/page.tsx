import Link from "next/link";
import { CheckCircle2, Lock } from "lucide-react";
import { PageHead, Notice } from "@/components/ui";
import { saveBrand } from "@/lib/actions";
import { canEditBrand, requireMerchant } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BrandPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; denied?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireMerchant();
  const brand = ctx.brand;
  const editable = canEditBrand(ctx.role) && ["active", "trial"].includes(ctx.tenant.status);

  return (
    <>
      <PageHead
        title="品牌资料"
        sub="这些资料会注入每一次 AI 生成，决定内容是否有企业差异"
        actions={<Link className="btn" href="/app/knowledge/products">管理产品资料</Link>}
      />
      {params.saved ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={17} />
          <div>品牌资料已保存，下次 AI 生成将使用最新资料。</div>
        </div>
      ) : null}
      {params.denied ? (
        <div className="notice orange" style={{ marginBottom: 16 }}>
          <Lock size={17} />
          <div>当前角色没有编辑品牌资料的权限（仅企业管理员 / 部门主管可编辑）。</div>
        </div>
      ) : null}

      <div className="split">
        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">企业与品牌信息</div>
              <div className="card-desc">当前登录人：{ctx.user.name}（{ctx.role === "owner" ? "企业管理员" : ctx.role === "manager" ? "部门主管" : "员工"}）</div>
            </div>
            {!editable ? <span className="badge orange">只读</span> : <span className="badge green">可编辑</span>}
          </div>
          <div className="card-body">
            <form action={saveBrand} className="stack">
              <div className="form-grid">
                <div className="field">
                  <label>品牌名称</label>
                  <input className="input" name="brandName" defaultValue={brand?.brandName ?? ctx.tenant.name} disabled={!editable} required />
                </div>
                <div className="field">
                  <label>所属行业</label>
                  <input className="input" name="category" defaultValue={brand?.category ?? ctx.tenant.category} disabled={!editable} />
                </div>
                <div className="field full">
                  <label>品牌介绍</label>
                  <textarea
                    className="textarea"
                    name="description"
                    defaultValue={brand?.description ?? ""}
                    disabled={!editable}
                    placeholder="例：面向成长型企业的数字化服务商，提供协同办公、数据看板与私有化部署。"
                    rows={4}
                  />
                  <div className="hint">建议 60-150 字，写清楚定位、核心产品、价格带与服务能力。</div>
                </div>
                <div className="field">
                  <label>企业地址</label>
                  <input className="input" name="address" defaultValue={brand?.address ?? ""} disabled={!editable} />
                </div>
                <div className="field">
                  <label>联系电话</label>
                  <input className="input" name="phone" defaultValue={brand?.phone ?? ""} disabled={!editable} />
                </div>
                <div className="field full">
                  <label>服务时间</label>
                  <input className="input" name="businessHours" defaultValue={brand?.businessHours ?? ""} disabled={!editable} placeholder="例如：09:00-18:00（工作日）" />
                </div>
                <div className="field">
                  <label>目标客户</label>
                  <input
                    className="input"
                    name="audience"
                    defaultValue={brand?.audience.join("，") ?? ""}
                    disabled={!editable}
                    placeholder="用逗号分隔，例如：成长型企业负责人，信息化负责人"
                  />
                </div>
                <div className="field">
                  <label>语气风格</label>
                  <input className="input" name="tone" defaultValue={brand?.tone ?? ""} disabled={!editable} placeholder="例如：专业、务实" />
                </div>
                <div className="field full">
                  <label>品牌特色</label>
                  <input
                    className="input"
                    name="highlights"
                    defaultValue={brand?.highlights.join("，") ?? ""}
                    disabled={!editable}
                    placeholder="例如：本地化交付，7×24 响应，支持私有化部署"
                  />
                </div>
                <div className="field full">
                  <label>禁用表达 / 营销约束</label>
                  <textarea
                    className="textarea"
                    name="constraints"
                    defaultValue={brand?.constraints.join("，") ?? ""}
                    disabled={!editable}
                    rows={2}
                    placeholder="例如：不承诺未确认的折扣与效果，未经授权的案例不对外使用"
                  />
                  <div className="hint">AI 生成时会避开这些表达；安全与合规信息也在这里维护。</div>
                </div>
              </div>
              {editable ? (
                <div className="row">
                  <button className="btn btn-primary btn-lg" type="submit">保存品牌资料</button>
                  <span className="small muted">上次更新：{brand ? formatDateTime(brand.updatedAt) : "尚未创建"}</span>
                </div>
              ) : (
                <Notice tone="orange" icon={<Lock size={17} />}>
                  当前账号为只读状态（员工角色或企业不可用），无法修改品牌资料。
                </Notice>
              )}
            </form>
          </div>
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">资料如何被使用</div>
            </div>
            <div className="card-body small muted" style={{ lineHeight: 1.9 }}>
              <p><strong style={{ color: "var(--ink)" }}>品牌介绍</strong> 决定内容的语气、定位与场景，不会出现与企业无关的表述。</p>
              <p className="mt-8"><strong style={{ color: "var(--ink)" }}>目标客户</strong> 影响内容切入角度与渠道建议。</p>
              <p className="mt-8"><strong style={{ color: "var(--ink)" }}>品牌特色</strong> 会作为可信卖点出现在文案中。</p>
              <p className="mt-8"><strong style={{ color: "var(--ink)" }}>禁用表达</strong> 会在 Prompt 中作为硬约束，避免夸大或未确认承诺。</p>
              <div className="notice mt-16">
                AI 只使用本企业资料与产品，不会引入其他企业的数据。
              </div>
            </div>
          </section>
          <section className="card">
            <div className="card-head">
              <div className="card-title">当前企业</div>
            </div>
            <div className="card-body">
              <div className="kv small">
                <div className="k">企业名称</div>
                <div>{ctx.tenant.name}</div>
                <div className="k">企业编号</div>
                <div>{ctx.tenant.code}</div>
                <div className="k">状态</div>
                <div>{ctx.tenant.status}</div>
                <div className="k">创建时间</div>
                <div>{formatDateTime(ctx.tenant.createdAt)}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
