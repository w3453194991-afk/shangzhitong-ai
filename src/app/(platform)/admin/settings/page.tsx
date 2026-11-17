import { CheckCircle2, LockKeyhole, Save, ShieldCheck } from "lucide-react";
import { PageHead } from "@/components/ui";
import { adminUpdatePlatformNote } from "@/lib/actions";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const admin = await requireAdmin();

  return (
    <>
      <PageHead
        title="平台设置"
        sub="公告、系统参数与安全配置；敏感变更写入审计日志"
        actions={<span className="badge navy">{admin.name}</span>}
      />

      {params.saved ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={17} />
          <div>平台设置已保存，并记录操作审计。</div>
        </div>
      ) : null}

      <div className="split">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">公告与文案</div>
              <Save size={16} className="muted" />
            </div>
            <div className="card-body">
              <form action={adminUpdatePlatformNote} className="stack">
                <input type="hidden" name="action" value="platform.announcement" />
                <div className="field">
                  <label>平台公告（显示在企业端工作台）</label>
                  <textarea
                    className="textarea"
                    name="detail"
                    rows={4}
                    defaultValue="【演示环境】本系统为高校创造力大赛演示版本，示例数据均为虚构。正式上线前请完善隐私政策与用户协议。"
                  />
                </div>
                <div className="field">
                  <label>AI 生成内容提示</label>
                  <input
                    className="input"
                    defaultValue="AI 生成内容仅供参考，发布前请人工核对价格、优惠与宣传合规性。"
                    disabled
                  />
                  <div className="hint">该提示固定在生成结果与发布提醒中展示。</div>
                </div>
                <button className="btn btn-primary" type="submit">保存公告</button>
              </form>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">安全配置</div>
              <LockKeyhole size={16} className="muted" />
            </div>
            <div className="card-body">
              <div className="kv">
                <div className="k">登录认证</div>
                <div>Supabase Auth（正式版）/ 演示会话（当前）</div>
                <div className="k">租户隔离</div>
                <div>RLS + 服务端 tenant 校验（演示版为服务端强制过滤）</div>
                <div className="k">模型密钥</div>
                <div>仅服务端环境变量，浏览器不可见</div>
                <div className="k">文件存储</div>
                <div>私有 Bucket + 短时签名 URL</div>
                <div className="k">审计日志</div>
                <div>已启用 · 记录管理员敏感操作</div>
                <div className="k">超级管理员</div>
                <div>首次部署使用一次性 bootstrap 脚本创建</div>
              </div>
              <div className="divider" />
              <div className="stack" style={{ gap: 8 }}>
                {[
                  "AI / 数据库 Service Role 密钥只在服务端",
                  "禁止通过 NEXT_PUBLIC_ 前缀暴露敏感密钥",
                  "跨租户查询只能在服务端管理接口执行",
                  "平台运营默认不查看企业隐私内容",
                ].map((t) => (
                  <div className="row small" key={t}>
                    <CheckCircle2 size={14} color="#1b9a72" /> {t}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div className="card-title">上线检查</div>
              <ShieldCheck size={16} className="muted" />
            </div>
            <div className="card-body">
              <div className="stack" style={{ gap: 10 }}>
                {[
                  ["T01 平台权限", true],
                  ["T04 企业 A/B 隔离", true],
                  ["T06 套餐变更同步", true],
                  ["T09 额度不足拦截", true],
                  ["T11 知识库来源引用", true],
                  ["T16 密钥不在前端", true],
                  ["T19 审计日志覆盖", true],
                  ["T20 备份恢复演练", false],
                ].map(([name, done]) => (
                  <div className="row small" key={String(name)}>
                    <span className={`badge ${done ? "green" : "orange"}`}>
                      {done ? "通过" : "待演练"}
                    </span>
                    {name}
                  </div>
                ))}
              </div>
              <div className="notice mt-16">
                正式上线前仍需确认域名、模型供应商与价格、套餐售价、隐私政策与邀请服务。
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">演示环境</div>
            </div>
            <div className="card-body small muted" style={{ lineHeight: 1.9 }}>
              <p>数据保存在本地 `data/db.json`，可通过 `npm run seed` 清空并重新生成演示数据。</p>
              <p className="mt-8">演示账号密码统一为 `demo123`，仅用于本地体验。</p>
              <p className="mt-8">接入 Supabase 后，这些页面无需重写，只需替换 `src/lib/store.ts` 与 `src/lib/session.ts` 的数据访问实现。</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
