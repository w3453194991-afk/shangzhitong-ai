import Link from "next/link";
import { UserCog, Users } from "lucide-react";
import { PageHead, StatCard, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  await requireAdmin();
  const db = await getDb();
  const q = (params.q ?? "").trim().toLowerCase();
  let users = [...db.users].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (q) {
    users = users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }
  const merchantUsers = db.users.filter((u) => u.role !== "platform_admin");
  const owners = merchantUsers.filter((u) => u.role === "owner");

  return (
    <>
      <PageHead
        title="用户管理"
        sub="平台账号与企业成员关系；角色变更后企业端权限立即更新"
        actions={
          <form className="filter-bar" method="get">
            <input className="input" name="q" placeholder="搜索姓名 / 邮箱" defaultValue={params.q ?? ""} />
            <button className="btn" type="submit">搜索</button>
          </form>
        }
      />

      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <StatCard label="全部用户" value={db.users.length} icon={<Users size={17} />} />
        <StatCard label="企业管理员" value={owners.length} tone="green" icon={<UserCog size={17} />} />
        <StatCard label="企业成员" value={merchantUsers.length} tone="navy" foot="企业管理员 / 部门主管 / 员工" />
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <div className="card-title">用户与成员关系</div>
            <div className="card-desc">一个用户可加入多个租户；平台管理员不能伪装为 tenant owner</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>用户</th>
                <th>所属企业</th>
                <th>角色</th>
                <th>账号状态</th>
                <th>加入时间</th>
                <th className="right">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const tenant = db.tenants.find((t) => t.id === u.tenantId);
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="cell-main">{u.name}</div>
                      <div className="cell-sub">{u.email}</div>
                    </td>
                    <td className="small">
                      {tenant ? (
                        <Link className="link" href={`/admin/tenants/${tenant.id}`}>{tenant.name}</Link>
                      ) : (
                        <span className="muted">平台级</span>
                      )}
                    </td>
                    <td><StatusBadge value={u.role} /></td>
                    <td>
                      {u.role === "platform_admin" ? (
                        <span className="badge navy">平台账号</span>
                      ) : tenant?.status === "suspended" || tenant?.status === "closed" ? (
                        <span className="badge red">随企业停用</span>
                      ) : (
                        <span className="badge green">正常</span>
                      )}
                    </td>
                    <td className="small muted">{formatDate(u.createdAt)}</td>
                    <td className="right">
                      {tenant ? (
                        <Link className="btn btn-sm" href={`/admin/tenants/${tenant.id}`}>查看企业</Link>
                      ) : (
                        <span className="small muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="notice mt-16">
        成员邀请与角色调整由企业管理员在企业端「系统设置」发起；平台管理员保留禁用、移除与排障权限，均记录审计日志。
      </div>
    </>
  );
}
