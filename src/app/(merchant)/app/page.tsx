import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  Megaphone,
  PenLine,
  Sparkles,
  Store,
  Users,
  Video,
  UserPlus,
  Database,
} from "lucide-react";
import { EmptyState, PageHead, Progress, StatCard, StatusBadge } from "@/components/ui";
import { requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDate, formatDateTime, isFuture, isThisMonth, label } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_META = {
  copy: { label: "营销文案", icon: <PenLine size={16} />, href: "/app/marketing/copy" },
  video: { label: "视频脚本", icon: <Video size={16} />, href: "/app/marketing/video" },
  campaign: { label: "活动策划", icon: <Megaphone size={16} />, href: "/app/marketing/campaign" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; blocked?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireMerchant();
  const db = await getDb();
  const tenantId = ctx.tenant.id;

  const customers = db.customers.filter((c) => c.tenantId === tenantId);
  const newCustomers = customers.filter((c) => isThisMonth(c.createdAt));
  const pendingFollowups = customers
    .flatMap((c) => c.followups.map((f) => ({ ...f, customer: c })))
    .filter((f) => f.status === "pending")
    .sort((a, b) => a.nextAt.localeCompare(b.nextAt));
  const generations = db.generations
    .filter((g) => g.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const monthGenerations = generations.filter((g) => isThisMonth(g.createdAt));

  const brand = ctx.brand;
  const brandChecks = [
    { label: "品牌介绍", done: !!brand?.description },
    { label: "目标客群", done: (brand?.audience.length ?? 0) > 0 },
    { label: "企业地址与服务时间", done: !!brand?.address && !!brand?.businessHours },
    { label: "品牌特色", done: (brand?.highlights.length ?? 0) > 0 },
    { label: "至少 3 个在售产品", done: db.dishes.filter((d) => d.tenantId === tenantId && d.status === "on").length >= 3 },
  ];
  const readiness = Math.round((brandChecks.filter((c) => c.done).length / brandChecks.length) * 100);

  return (
    <>
      {params.blocked ? (
        <div className="notice red" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} />
          <div>{params.blocked}</div>
        </div>
      ) : null}
      {params.denied ? (
        <div className="notice orange" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} />
          <div>当前角色没有该操作权限，已阻止请求。</div>
        </div>
      ) : null}

      <PageHead
        title={`${greeting()}，${ctx.user.name}`}
        sub={`${ctx.tenant.name} · ${ctx.tenant.category} · ${formatDate(new Date().toISOString())}`}
        actions={
          <>
            <Link className="btn" href="/app/marketing/brand">
              <Store size={16} /> 完善品牌资料
            </Link>
            <Link className="btn btn-primary" href="/app/marketing/copy">
              <Sparkles size={16} /> 生成营销内容
            </Link>
          </>
        }
      />

      <div className="grid grid-4">
        <StatCard
          label="客户总数"
          value={customers.length}
          foot="当前企业全部有效客户"
          icon={<Users size={17} />}
        />
        <StatCard
          label="本月新增客户"
          value={newCustomers.length}
          foot="按企业本地自然月统计"
          tone="green"
          icon={<UserPlus size={17} />}
        />
        <StatCard
          label="待跟进"
          value={pendingFollowups.length}
          foot={pendingFollowups.length ? "最早一项已到期" : "暂无到期跟进"}
          tone="orange"
          icon={<CalendarClock size={17} />}
        />
        <StatCard
          label="本月 AI 生成"
          value={monthGenerations.length}
          foot={`套餐额度 ${ctx.used}/${ctx.quota}`}
          tone="navy"
          icon={<Sparkles size={17} />}
        />
      </div>

      <div className="split" style={{ marginTop: 18 }}>
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">快捷入口</div>
                <div className="card-desc">自动带入企业品牌资料与在售产品</div>
              </div>
            </div>
            <div className="card-body">
              <div className="quick-grid">
                <Link className="quick-card" href="/app/marketing/copy">
                  <div className="qi"><PenLine size={17} /></div>
                  <div>
                    <div className="qt">文案生成</div>
                    <div className="qd">朋友圈 / 公众号 / 官网</div>
                  </div>
                </Link>
                <Link className="quick-card" href="/app/marketing/video">
                  <div className="qi"><Video size={17} /></div>
                  <div>
                    <div className="qt">视频脚本</div>
                    <div className="qd">15 / 30 / 60 秒分镜</div>
                  </div>
                </Link>
                <Link className="quick-card" href="/app/marketing/campaign">
                  <div className="qi"><Megaphone size={17} /></div>
                  <div>
                    <div className="qt">活动策划</div>
                    <div className="qd">目标、规则与执行步骤</div>
                  </div>
                </Link>
                <Link className="quick-card" href="/app/knowledge/chat">
                  <div className="qi"><FileText size={17} /></div>
                  <div>
                    <div className="qt">知识库问答</div>
                    <div className="qd">回答带来源引用</div>
                  </div>
                </Link>
                <Link className="quick-card" href="/app/customers">
                  <div className="qi"><Users size={17} /></div>
                  <div>
                    <div className="qt">客户跟进</div>
                    <div className="qd">{pendingFollowups.length} 项待跟进</div>
                  </div>
                </Link>
                <Link className="quick-card" href="/app/knowledge/products">
                  <div className="qi"><Database size={17} /></div>
                  <div>
                    <div className="qt">产品资料</div>
                    <div className="qd">产品与报价维护</div>
                  </div>
                </Link>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">最近生成</div>
                <div className="card-desc">AI 内容会记录企业资料、token 与额度消耗</div>
              </div>
              <Link className="link small" href="/app/marketing/history">
                全部记录 <ArrowRight size={13} style={{ verticalAlign: "-2px" }} />
              </Link>
            </div>
            <div className="card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
              {generations.length === 0 ? (
                <EmptyState
                  title="还没有生成记录"
                  desc="从一条企业介绍开始，AI 会读取企业品牌资料。"
                  action={
                    <Link className="btn btn-primary btn-sm" href="/app/marketing/copy">
                      去生成
                    </Link>
                  }
                />
              ) : (
                <div className="list">
                  {generations.slice(0, 4).map((g) => (
                    <Link className="list-row" href="/app/marketing/history" key={g.id}>
                      <div className="lr-icon">{TYPE_META[g.type].icon}</div>
                      <div className="lr-main">
                        <div className="lr-title">{g.title}</div>
                        <div className="lr-sub">
                          {TYPE_META[g.type].label} · {formatDateTime(g.createdAt)} · {g.model}
                        </div>
                      </div>
                      <StatusBadge value={g.status === "completed" ? "completed" : "failed"} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">今日待办</div>
                <div className="card-desc">来自客户跟进与资料完善</div>
              </div>
            </div>
            <div className="card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
              {pendingFollowups.length === 0 ? (
                <EmptyState title="今天没有到期跟进" desc="可以去补充品牌资料，或生成一条新内容。" />
              ) : (
                <div className="list">
                  {pendingFollowups.slice(0, 4).map((f) => (
                    <Link
                      className="list-row"
                      href={`/app/customers/${f.customer.id}`}
                      key={f.id}
                    >
                      <div className="lr-icon"><CalendarClock size={16} /></div>
                      <div className="lr-main">
                        <div className="lr-title">
                          {f.customer.name} · {f.content}
                        </div>
                        <div className="lr-sub">
                          下次跟进 {f.nextAt ? formatDate(f.nextAt) : "未设置"} · 负责人 {f.by}
                          {f.nextAt && isFuture(f.nextAt) ? " · 未到期" : ""}
                        </div>
                      </div>
                      <ArrowRight size={15} className="muted" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">AI 额度</div>
                <div className="card-desc">{ctx.plan?.name ?? "未订阅"}套餐 · 本月</div>
              </div>
              <span className="badge blue">{ctx.used} / {ctx.quota}</span>
            </div>
            <div className="card-body">
              <Progress value={ctx.used} max={ctx.quota} />
              <div className="row small muted mt-8" style={{ justifyContent: "space-between" }}>
                <span>已用 {ctx.used} 次</span>
                <span>剩余 {Math.max(0, ctx.quota - ctx.used)} 次</span>
              </div>
              <div className="divider" />
              <div className="kv">
                <div className="k">套餐状态</div>
                <div>{ctx.subscription ? <StatusBadge value={ctx.subscription.status === "active" ? "active" : "trial"} /> : "—"}</div>
                <div className="k">到期时间</div>
                <div>{ctx.subscription ? formatDate(ctx.subscription.expiresAt) : "—"}</div>
                <div className="k">当前角色</div>
                <div>{label(ctx.role)}</div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">资料完善度</div>
                <div className="card-desc">资料越完整，AI 输出越贴近企业</div>
              </div>
              <span className="badge green">{readiness}%</span>
            </div>
            <div className="card-body">
              <Progress value={readiness} max={100} />
              <div className="stack mt-16" style={{ gap: 9 }}>
                {brandChecks.map((c) => (
                  <div className="row small" key={c.label}>
                    {c.done ? (
                      <CheckCircle2 size={15} color="#1b9a72" />
                    ) : (
                      <AlertTriangle size={15} color="#e69a35" />
                    )}
                    <span className={c.done ? "muted" : ""}>{c.label}</span>
                    {!c.done ? (
                      <Link className="link small" style={{ marginLeft: "auto" }} href="/app/marketing/brand">
                        去完善
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}
