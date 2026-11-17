import Link from "next/link";
import { BarChart3, PieChart, Sparkles, TrendingUp } from "lucide-react";
import { PageHead, StatCard } from "@/components/ui";
import { requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";
import { isThisMonth, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const ctx = await requireMerchant();
  const db = await getDb();
  const tenantId = ctx.tenant.id;
  const customers = db.customers.filter((c) => c.tenantId === tenantId);
  const generations = db.generations.filter((g) => g.tenantId === tenantId);
  const usage = db.usageLogs.filter((l) => l.tenantId === tenantId);

  const months: { key: string; label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months.push({
      key,
      label: `${d.getMonth() + 1}月`,
      count: customers.filter((c) => {
        const cd = new Date(c.createdAt);
        return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
      }).length,
    });
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.count));

  const sources = Object.entries(
    customers.reduce<Record<string, number>>((acc, c) => {
      const key = c.source || "未填写";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(1, ...sources.map(([, n]) => n));

  const tags = Object.entries(
    customers.reduce<Record<string, number>>((acc, c) => {
      for (const t of c.tags) acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const allFollowups = customers.flatMap((c) => c.followups);
  const completed = allFollowups.filter((f) => f.status === "completed").length;
  const rate = allFollowups.length ? Math.round((completed / allFollowups.length) * 100) : 0;

  const monthUsage = usage.filter((l) => isThisMonth(l.createdAt) && l.status === "success");
  const tokens = monthUsage.reduce((s, l) => s + l.inputTokens + l.outputTokens, 0);
  const cost = monthUsage.reduce((s, l) => s + l.cost, 0);
  const typeCount = {
    copy: generations.filter((g) => g.type === "copy").length,
    video: generations.filter((g) => g.type === "video").length,
    campaign: generations.filter((g) => g.type === "campaign").length,
    chat: monthUsage.filter((l) => l.type === "chat").length,
  };

  return (
    <>
      <PageHead
        title="数据分析"
        sub="仅展示系统真实掌握的数据；未接入财务 / 订单系统，因此不展示营收、订单量、客单价等指标"
        actions={<Link className="btn" href="/app/analytics">刷新</Link>}
      />

      <div className="grid grid-4">
        <StatCard label="本月新增客户" value={months[months.length - 1].count} icon={<TrendingUp size={17} />} />
        <StatCard label="跟进完成率" value={`${rate}%`} tone="green" icon={<BarChart3 size={17} />} foot={`${completed}/${allFollowups.length} 条跟进`} />
        <StatCard label="本月 AI 调用" value={monthUsage.length} tone="navy" icon={<Sparkles size={17} />} foot={`额度 ${ctx.used}/${ctx.quota}`} />
        <StatCard label="本月估算成本" value={money(cost)} tone="orange" icon={<PieChart size={17} />} foot={`${tokens.toLocaleString()} tokens`} />
      </div>

      <div className="split" style={{ marginTop: 18 }}>
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">新增客户趋势</div>
                <div className="card-desc">最近 6 个自然月 · 按企业本地时间</div>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-bars">
                {months.map((m, i) => (
                  <div className="chart-bar-col" key={m.key}>
                    <div className="chart-value">{m.count}</div>
                    <div
                      className={`chart-bar ${i < months.length - 1 ? "alt" : ""}`}
                      style={{ height: `${Math.max(4, (m.count / maxMonth) * 140)}px` }}
                    />
                    <div className="chart-label">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">客户来源分布</div>
              <span className="small muted">{customers.length} 位客户</span>
            </div>
            <div className="card-body">
              {sources.length === 0 ? (
                <div className="small muted">暂无客户数据。</div>
              ) : (
                sources.map(([name, n]) => (
                  <div className="hbar" key={name}>
                    <div className="hb-label">{name}</div>
                    <div className="hb-track">
                      <div className="hb-fill" style={{ width: `${(n / maxSource) * 100}%` }} />
                    </div>
                    <div className="hb-value">{n}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">AI 生成构成</div>
            </div>
            <div className="card-body">
              <div className="kv">
                <div className="k">营销文案</div>
                <div>{typeCount.copy} 条</div>
                <div className="k">视频脚本</div>
                <div>{typeCount.video} 条</div>
                <div className="k">活动策划</div>
                <div>{typeCount.campaign} 条</div>
                <div className="k">知识问答</div>
                <div>{typeCount.chat} 次（本月）</div>
              </div>
              <div className="divider" />
              <div className="kv small">
                <div className="k">默认模型</div>
                <div>sz-ai-pro（演示）</div>
                <div className="k">Token 统计</div>
                <div>以供应商返回值为准，缺失标记 estimated</div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">客户标签分布</div>
            </div>
            <div className="card-body">
              {tags.length === 0 ? (
                <div className="small muted">暂无标签。</div>
              ) : (
                <div className="row" style={{ gap: 8 }}>
                  {tags.map(([tag, n]) => (
                    <span className="badge blue" key={tag}>
                      {tag} · {n}
                    </span>
                  ))}
                </div>
              )}
              <div className="notice mt-16">
                当前未接入财务与订单系统，因此不展示营收、订单量、客单价、产品销量等指标。
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">跟进情况</div>
            </div>
            <div className="card-body">
              <div className="kv small">
                <div className="k">跟进记录</div>
                <div>{allFollowups.length} 条</div>
                <div className="k">已完成</div>
                <div>{completed} 条</div>
                <div className="k">待跟进</div>
                <div>{allFollowups.length - completed} 条</div>
                <div className="k">完成率</div>
                <div>{rate}%</div>
              </div>
              <div className="divider" />
              <Link className="link small" href="/app/customers">去客户管理处理待跟进 →</Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
