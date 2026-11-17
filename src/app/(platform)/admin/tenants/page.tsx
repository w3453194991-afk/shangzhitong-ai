import Link from "next/link";
import { Plus, Search, Store } from "lucide-react";
import { EmptyState, PageHead, StatusBadge } from "@/components/ui";
import { createTenant } from "@/lib/actions";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDate, isThisMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const db = await getDb();
  const plans = db.plans;
  let tenants = [...db.tenants].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const q = (params.q ?? "").trim().toLowerCase();
  if (q) {
    tenants = tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.contactName.toLowerCase().includes(q),
    );
  }
  if (params.status) tenants = tenants.filter((t) => t.status === params.status);

  const errorMsg =
    params.error === "emailexists"
      ? "该邮箱已被使用，请更换负责人邮箱。"
      : params.error
        ? "请填写企业名称与负责人邮箱。"
        : null;

  return (
    <>
      <PageHead
        title="企业客户管理"
        sub="平台管理员开通企业、分配套餐并邀请负责人；数据写入共享数据库"
        actions={
          <form className="filter-bar" method="get">
            <input className="input" name="q" placeholder="搜索名称 / 编号 / 联系人" defaultValue={params.q ?? ""} />
            <select className="select" name="status" defaultValue={params.status ?? ""}>
              <option value="">全部状态</option>
              <option value="active">正常</option>
              <option value="trial">试用中</option>
              <option value="pending">待激活</option>
              <option value="suspended">已暂停</option>
              <option value="closed">已关闭</option>
            </select>
            <button className="btn" type="submit"><Search size={15} /> 搜索</button>
          </form>
        }
      />

      {errorMsg ? (
        <div className="notice red" style={{ marginBottom: 16 }}>
          <div>{errorMsg}</div>
        </div>
      ) : null}

      <div className="split">
        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">企业列表</div>
              <div className="card-desc">共 {tenants.length} 家 · 点击查看成员、套餐、用量与操作记录</div>
            </div>
            <span className="badge blue">{db.tenants.filter((t) => t.status === "active").length} 家正常</span>
          </div>
          {tenants.length === 0 ? (
            <EmptyState title="没有匹配的企业" desc="调整搜索条件，或在右侧新增企业。" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>企业</th>
                    <th>联系人</th>
                    <th>状态</th>
                    <th>套餐</th>
                    <th>本月调用</th>
                    <th>创建时间</th>
                    <th className="right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => {
                    const sub = db.subscriptions.find((s) => s.tenantId === t.id && s.status !== "cancelled");
                    const plan = db.plans.find((p) => p.id === sub?.planId);
                    const used = db.usageLogs.filter(
                      (l) => l.tenantId === t.id && l.status === "success" && isThisMonth(l.createdAt),
                    ).length;
                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="cell-main">{t.name}</div>
                          <div className="cell-sub">{t.category} · {t.code}</div>
                        </td>
                        <td className="small">
                          {t.contactName}
                          <div className="cell-sub">{t.contactPhone}</div>
                        </td>
                        <td><StatusBadge value={t.status} /></td>
                        <td className="small">
                          {plan?.name ?? "未订阅"}
                          <div className="cell-sub">{sub ? formatDate(sub.expiresAt) + " 到期" : "—"}</div>
                        </td>
                        <td className="small">{used} 次</td>
                        <td className="small muted">{formatDate(t.createdAt)}</td>
                        <td className="right">
                          <Link className="btn btn-sm" href={`/admin/tenants/${t.id}`}>详情</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">新增企业</div>
              <div className="card-desc">同时创建租户、订阅与企业管理员账号</div>
            </div>
            <Plus size={17} className="muted" />
          </div>
          <div className="card-body">
            <form action={createTenant} className="stack">
              <div className="form-grid">
                <div className="field">
                  <label>企业名称</label>
                  <input className="input" name="name" placeholder="例如：云岭科技" required />
                </div>
                <div className="field">
                  <label>企业编号</label>
                  <input className="input" name="code" placeholder="例如：YLKJ" />
                </div>
                <div className="field">
                  <label>所属行业</label>
                  <input className="input" name="category" placeholder="例如：企业软件 / 数字化服务" />
                </div>
                <div className="field">
                  <label>联系人</label>
                  <input className="input" name="contactName" placeholder="负责人姓名" />
                </div>
                <div className="field">
                  <label>联系电话</label>
                  <input className="input" name="contactPhone" placeholder="手机号" />
                </div>
                <div className="field">
                  <label>套餐</label>
                  <select className="select" name="planId" defaultValue="p-trial">
                    {plans.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name} · {p.aiQuota} 次/月
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>开通状态</label>
                  <select className="select" name="status" defaultValue="trial">
                    <option value="trial">试用中</option>
                    <option value="active">正常使用</option>
                  </select>
                </div>
                <div className="field">
                  <label>负责人邮箱</label>
                  <input className="input" name="ownerEmail" type="email" placeholder="owner@example.com" required />
                </div>
              </div>
              <div className="notice orange">
                演示版会直接创建企业管理员账号，初始密码为 demo123；正式版通过 Supabase Auth 邀请链接设置密码。
              </div>
              <button className="btn btn-primary" type="submit"><Store size={15} /> 创建企业并邀请负责人</button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
