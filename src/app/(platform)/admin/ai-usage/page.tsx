import Link from "next/link";
import { Activity, Coins, Gauge, TriangleAlert } from "lucide-react";
import { PageHead, StatCard, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDateTime, isThisMonth, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AiUsagePage() {
  await requireAdmin();
  const db = await getDb();
  const logs = [...db.usageLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const month = logs.filter((l) => isThisMonth(l.createdAt));
  const success = month.filter((l) => l.status === "success");
  const failed = month.filter((l) => l.status === "failed");
  const tokens = month.reduce((s, l) => s + l.inputTokens + l.outputTokens, 0);
  const cost = month.reduce((s, l) => s + l.cost, 0);

  const byTenant = db.tenants
    .map((t) => {
      const items = month.filter((l) => l.tenantId === t.id);
      return {
        tenant: t,
        count: items.length,
        tokens: items.reduce((s, l) => s + l.inputTokens + l.outputTokens, 0),
        cost: items.reduce((s, l) => s + l.cost, 0),
      };
    })
    .sort((a, b) => b.count - a.count);

  const byType = ["copy", "video", "campaign", "chat"].map((type) => ({
    type,
    count: month.filter((l) => l.type === type).length,
  }));

  return (
    <>
      <PageHead
        title="AI 用量管理"
        sub="按企业、模型与时间统计调用、Token、成本与失败率；企业端只看自己的汇总"
        actions={<span className="badge blue">{month.length} 次本月调用</span>}
      />

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <StatCard label="本月调用" value={month.length} icon={<Activity size={17} />} foot={`成功 ${success.length} · 失败 ${failed.length}`} />
        <StatCard label="Token 总量" value={tokens.toLocaleString()} tone="navy" icon={<Gauge size={17} />} foot="缺失时按字符估算并标记" />
        <StatCard label="估算成本" value={money(cost)} tone="orange" icon={<Coins size={17} />} foot="按后台模型单价计算" />
        <StatCard
          label="失败率"
          value={`${month.length ? Math.round((failed.length / month.length) * 100) : 0}%`}
          tone="green"
          icon={<TriangleAlert size={17} />}
          foot="失败请求不扣减额度（演示口径）"
        />
      </div>

      <div className="split">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">按企业汇总（本月）</div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>企业</th>
                    <th>调用</th>
                    <th>Token</th>
                    <th>估算成本</th>
                    <th className="right">详情</th>
                  </tr>
                </thead>
                <tbody>
                  {byTenant.map((row) => (
                    <tr key={row.tenant.id}>
                      <td>
                        <div className="cell-main">{row.tenant.name}</div>
                        <div className="cell-sub">{row.tenant.category}</div>
                      </td>
                      <td className="strong">{row.count}</td>
                      <td className="small">{row.tokens.toLocaleString()}</td>
                      <td className="small">{money(row.cost)}</td>
                      <td className="right">
                        <Link className="btn btn-sm" href={`/admin/tenants/${row.tenant.id}`}>查看</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">最近调用日志</div>
              <span className="small muted">最近 12 条</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>企业</th>
                    <th>类型</th>
                    <th>模型</th>
                    <th>Token</th>
                    <th>成本</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 12).map((l) => (
                    <tr key={l.id}>
                      <td className="small muted nowrap">{formatDateTime(l.createdAt)}</td>
                      <td className="small">{db.tenants.find((t) => t.id === l.tenantId)?.name ?? "—"}</td>
                      <td className="small">{l.type}</td>
                      <td className="small">{l.model}</td>
                      <td className="small">{(l.inputTokens + l.outputTokens).toLocaleString()}</td>
                      <td className="small">{money(l.cost)}</td>
                      <td><StatusBadge value={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">按类型分布</div>
            </div>
            <div className="card-body">
              {byType.map((t) => {
                const max = Math.max(1, ...byType.map((x) => x.count));
                return (
                  <div className="hbar" key={t.type}>
                    <div className="hb-label">
                      {t.type === "copy" ? "文案生成" : t.type === "video" ? "视频脚本" : t.type === "campaign" ? "活动策划" : "知识问答"}
                    </div>
                    <div className="hb-track">
                      <div className="hb-fill" style={{ width: `${(t.count / max) * 100}%` }} />
                    </div>
                    <div className="hb-value">{t.count}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">计量口径</div>
            </div>
            <div className="card-body small muted" style={{ lineHeight: 1.9 }}>
              <p>· 一次成功完成的生成请求计 1 次业务调用。</p>
              <p>· 失败请求单独记录，不扣减额度或按平台规则处理。</p>
              <p>· Token 以供应商返回为准；未返回时估算并标记 estimated。</p>
              <p>· 成本按后台配置的 input/output 单价与币种计算。</p>
              <p>· 企业端只看到本企业用量，平台端可跨企业汇总与排障。</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
