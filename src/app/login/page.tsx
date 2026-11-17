import Image from "next/image";
import { AlertCircle, ArrowRight, Building2, LockKeyhole, ShieldCheck, Sparkles, Store, Users } from "lucide-react";
import { loginAction } from "./actions";
import { DEMO_PASSWORD } from "@/lib/constants";

export const dynamic = "force-dynamic";

const accounts = [
  {
    email: "owner1@shangzhitong.demo",
    name: "王丽 · 云岭科技",
    desc: "企业管理员 · 可编辑品牌、产品、客户与套餐查看",
    icon: <Store size={16} />,
    tone: "#3478c8",
  },
  {
    email: "manager1@shangzhitong.demo",
    name: "赵强 · 云岭科技",
    desc: "部门主管 · 可用营销、知识库与客户，不可改套餐",
    icon: <Users size={16} />,
    tone: "#1b9a72",
  },
  {
    email: "owner2@shangzhitong.demo",
    name: "李强 · 恒丰智能",
    desc: "第二家企业 · 用于验证跨企业数据隔离",
    icon: <Building2 size={16} />,
    tone: "#e69a35",
  },
  {
    email: "admin@shangzhitong.demo",
    name: "张宁 · 平台管理员",
    desc: "平台管理端 · 企业、套餐、用量、工单与审计",
    icon: <ShieldCheck size={16} />,
    tone: "#17345a",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="login-logo">
          <Image
            src="/brand/logo-full.png"
            alt="商智通 · AI 赋能企业 智慧经营增长"
            width={1010}
            height={875}
            priority
          />
        </div>
        <h1>
          把企业的真实资料，
          <br />
          变成能持续复用的增长内容。
        </h1>
        <p>
          录入企业介绍、产品与案例后，生成贴合企业口吻的营销文案、短视频脚本与活动方案；知识库问答带来源引用，客户跟进有记录，平台运营有数据。
        </p>
        <div className="login-points">
          <div className="pt">
            <span><Sparkles size={13} /></span>
            AI 内容读取企业资料与产品报价，不套用通用模板
          </div>
          <div className="pt">
            <span><LockKeyhole size={13} /></span>
            多租户 tenant_id + 角色权限，企业数据严格隔离
          </div>
          <div className="pt">
            <span><ShieldCheck size={13} /></span>
            平台统一模型网关，用量与成本可追踪
          </div>
        </div>
        <div className="login-foot">
          商智通 · AI 赋能企业 · 智慧经营增长
          <br />
          高校创造力大赛演示版 · 页面中的企业、客户与经营数据均为演示数据。
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <h2>登录工作台</h2>
          <p className="sub">选择演示身份一键进入，或使用账号密码登录。</p>

          {params?.error ? (
            <div className="notice red mt-16">
              <AlertCircle size={17} />
              <div>账号或密码不正确。演示账号密码均为 {DEMO_PASSWORD}。</div>
            </div>
          ) : null}

          <div className="demo-accounts">
            {accounts.map((a) => (
              <form action={loginAction} key={a.email}>
                <input type="hidden" name="email" value={a.email} />
                <input type="hidden" name="password" value={DEMO_PASSWORD} />
                <button className="demo-account" type="submit">
                  <div className="avatar" style={{ background: "#eef3fa", color: a.tone }}>
                    {a.icon}
                  </div>
                  <div className="da-main">
                    <div className="da-name">{a.name}</div>
                    <div className="da-desc">{a.desc}</div>
                  </div>
                  <ArrowRight size={15} className="da-arrow" />
                </button>
              </form>
            ))}
          </div>

          <div className="divider" />

          <form action={loginAction} className="form-grid">
            <div className="field full">
              <label htmlFor="email">账号邮箱</label>
              <input
                id="email"
                name="email"
                className="input"
                placeholder="owner1@shangzhitong.demo"
                defaultValue=""
                required
              />
            </div>
            <div className="field full">
              <label htmlFor="password">密码</label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                defaultValue={DEMO_PASSWORD}
                required
              />
              <div className="hint">演示环境统一密码：{DEMO_PASSWORD}（正式版接入 Supabase Auth）</div>
            </div>
            <div className="full">
              <button className="btn btn-primary btn-block btn-lg" type="submit">
                登录
              </button>
            </div>
          </form>

          <p className="small muted mt-16" style={{ textAlign: "center" }}>
            平台无公开注册入口 · 企业由平台管理员开通并邀请负责人
          </p>
          <p className="small muted" style={{ textAlign: "center", marginTop: 4 }}>
            忘记密码或需要开通账号，请联系平台管理员
          </p>
        </div>
      </section>
    </div>
  );
}
