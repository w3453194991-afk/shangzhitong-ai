import Link from "next/link";
import { Download, Search, UserPlus, Users } from "lucide-react";
import { EmptyState, PageHead, StatCard, StatusBadge } from "@/components/ui";
import { saveCustomer } from "@/lib/actions";
import { canExportCustomers, requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDate, isFuture, isThisMonth, maskPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string; status?: string; saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireMerchant();
  const db = await getDb();
  let customers = db.customers
    .filter((c) => c.tenantId === ctx.tenant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const all = customers;
  const sources = [...new Set(all.map((c) => c.source).filter(Boolean))];
  const q = (params.q ?? "").trim().toLowerCase();
  if (q) {
    customers = customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.note.toLowerCase().includes(q),
    );
  }
  if (params.source) customers = customers.filter((c) => c.source === params.source);
  if (params.status) customers = customers.filter((c) => c.status === params.status);

  const pending = all
    .flatMap((c) => c.followups.map((f) => ({ ...f, customer: c })))
    .filter((f) => f.status === "pending");
  const exportable = canExportCustomers(ctx.role);
  const canWrite = ["active", "trial"].includes(ctx.tenant.status);

  return (
    <>
      <PageHead
        title="客户管理"
        sub="轻量客户档案、标签与跟进记录，手机号默认脱敏展示"
        actions={
          exportable ? (
            <a className="btn" href="/api/merchant/customers/export">
              <Download size={16} /> 导出本企业客户
            </a>
          ) : (
            <span className="badge orange">当前角色不可导出</span>
          )
        }
      />

      {params.saved ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <div>客户资料已保存。</div>
        </div>
      ) : null}
      {params.error ? (
        <div className="notice red" style={{ marginBottom: 16 }}>
          <div>客户姓名不能为空。</div>
        </div>
      ) : null}

      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <StatCard label="客户总数" value={all.length} icon={<Users size={17} />} foot="未删除客户记录" />
        <StatCard label="本月新增" value={all.filter((c) => isThisMonth(c.createdAt)).length} tone="green" icon={<UserPlus size={17} />} />
        <StatCard label="待跟进事项" value={pending.length} tone="orange" icon={<Search size={17} />} foot={`${pending.filter((f) => !isFuture(f.nextAt)).length} 项已到期`} />
      </div>

      <div className="split">
        <section className="card">
          <div className="card-head">
            <div className="card-title">客户列表</div>
            <span className="small muted">{customers.length} 条</span>
          </div>
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <form className="filter-bar" method="get">
              <input className="input" name="q" placeholder="搜索姓名 / 手机号 / 备注" defaultValue={params.q ?? ""} />
              <select className="select" name="source" defaultValue={params.source ?? ""}>
                <option value="">全部来源</option>
                {sources.map((s) => (
                  <option value={s} key={s}>{s}</option>
                ))}
              </select>
              <select className="select" name="status" defaultValue={params.status ?? ""}>
                <option value="">全部状态</option>
                <option value="new">新客户</option>
                <option value="active">活跃</option>
                <option value="pending">待跟进</option>
                <option value="lost">已流失</option>
              </select>
              <button className="btn" type="submit">筛选</button>
              <Link className="link small" href="/app/customers">清除</Link>
            </form>
          </div>
          {customers.length === 0 ? (
            <EmptyState title="没有找到客户" desc="调整筛选条件，或在右侧新增客户。" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>客户</th>
                    <th>手机号</th>
                    <th>来源</th>
                    <th>标签</th>
                    <th>状态</th>
                    <th>下次跟进</th>
                    <th className="right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const next = c.followups
                      .filter((f) => f.status === "pending")
                      .sort((a, b) => a.nextAt.localeCompare(b.nextAt))[0];
                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="cell-main">{c.name}</div>
                          <div className="cell-sub">建档 {formatDate(c.createdAt)}</div>
                        </td>
                        <td className="small muted">{maskPhone(c.phone)}</td>
                        <td className="small">{c.source}</td>
                        <td>
                          <div className="row" style={{ gap: 4 }}>
                            {c.tags.slice(0, 2).map((t) => (
                              <span className="tag" key={t}>{t}</span>
                            ))}
                          </div>
                        </td>
                        <td><StatusBadge value={c.status} /></td>
                        <td className="small">
                          {next ? (
                            <span style={{ color: isFuture(next.nextAt) ? "var(--muted)" : "var(--orange)" }}>
                              {next.nextAt ? formatDate(next.nextAt) : "待安排"}
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className="right">
                          <Link className="btn btn-sm" href={`/app/customers/${c.id}`}>详情</Link>
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
              <div className="card-title">新增客户</div>
              <div className="card-desc">只记录业务必要信息</div>
            </div>
            <UserPlus size={17} className="muted" />
          </div>
          <div className="card-body">
            <form action={saveCustomer} className="stack">
              <div className="form-grid">
                <div className="field">
                  <label>姓名</label>
                  <input className="input" name="name" required placeholder="例如：刘经理" />
                </div>
                <div className="field">
                  <label>手机号（可选）</label>
                  <input className="input" name="phone" placeholder="仅用于本企业跟进" />
                </div>
                <div className="field">
                  <label>来源</label>
                  <select className="select" name="source" defaultValue="官网表单">
                    <option>官网表单</option>
                    <option>行业展会</option>
                    <option>朋友圈</option>
                    <option>公众号</option>
                    <option>老客户转介绍</option>
                    <option>电话咨询</option>
                    <option>百度搜索</option>
                    <option>其他</option>
                  </select>
                </div>
                <div className="field">
                  <label>状态</label>
                  <select className="select" name="status" defaultValue="new">
                    <option value="new">新客户</option>
                    <option value="active">活跃</option>
                    <option value="pending">待跟进</option>
                  </select>
                </div>
                <div className="field full">
                  <label>标签</label>
                  <input className="input" name="tags" placeholder="逗号分隔，例如：重点客户，续约意向" />
                </div>
                <div className="field full">
                  <label>备注</label>
                  <textarea className="textarea" name="note" rows={3} placeholder="例如：某制造企业信息化负责人，关注私有化部署" />
                </div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={!canWrite}>
                保存客户
              </button>
              {!canWrite ? <div className="hint">企业暂停中，无法新增客户。</div> : null}
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
