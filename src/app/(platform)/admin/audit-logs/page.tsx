import { ShieldCheck } from "lucide-react";
import { PageHead, StatCard, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  await requireAdmin();
  const db = await getDb();
  const logs = [...db.auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHead
        title="系统日志"
        sub="记录管理员创建/禁用企业、改套餐、改额度、改模型、导出数据等敏感操作"
        actions={<span className="badge navy"><ShieldCheck size={12} /> 只读审计</span>}
      />

      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <StatCard label="审计记录" value={logs.length} icon={<ShieldCheck size={17} />} />
        <StatCard label="涉及企业" value={new Set(logs.map((l) => l.tenantId).filter(Boolean)).size} tone="navy" />
        <StatCard label="今日操作" value={logs.filter((l) => new Date(l.createdAt).toDateString() === new Date().toDateString()).length} tone="green" />
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <div className="card-title">操作记录</div>
            <div className="card-desc">包含操作者、角色、目标企业、动作与详情</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>时间</th>
                <th>操作者</th>
                <th>动作</th>
                <th>目标</th>
                <th>企业</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((a) => (
                <tr key={a.id}>
                  <td className="small muted nowrap">{formatDateTime(a.createdAt)}</td>
                  <td className="small">
                    {a.actor}
                    <div className="cell-sub">{a.actorRole}</div>
                  </td>
                  <td><span className="badge blue">{a.action}</span></td>
                  <td className="small strong">{a.target}</td>
                  <td className="small">{db.tenants.find((t) => t.id === a.tenantId)?.name ?? "平台"}</td>
                  <td className="small muted">{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="notice mt-16">
        平台运营默认不查看企业客户手机号、聊天全文与私密文件；如需支持访问，必须记录原因与授权范围。
      </div>
    </>
  );
}
