import { Bot, KeyRound, Server, Sparkles } from "lucide-react";
import { PageHead, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const models = [
  {
    provider: "内置演示网关 (mock)",
    model: "sz-ai-pro",
    baseUrl: "服务端内置生成器",
    key: "无需密钥",
    timeout: "10s",
    enabled: true,
    isDefault: true,
  },
  {
    provider: "OpenAI 兼容",
    model: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
    key: "sk-••••••••（环境变量）",
    timeout: "60s",
    enabled: false,
    isDefault: false,
  },
  {
    provider: "DeepSeek",
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com",
    key: "sk-••••••••（环境变量）",
    timeout: "60s",
    enabled: false,
    isDefault: false,
  },
];

export default async function AiModelsPage() {
  await requireAdmin();
  return (
    <>
      <PageHead
        title="AI 模型管理"
        sub="所有 AI 调用统一经过服务端 Model Gateway；密钥仅保存在服务端环境变量"
        actions={<span className="badge orange">演示版使用内置生成器</span>}
      />

      <div className="notice" style={{ marginBottom: 16 }}>
        <Sparkles size={17} />
        <div>
          当前演示环境不依赖外部模型：AI 生成与问答由服务端规则引擎完成，因此无需 API Key 即可体验完整流程。正式接入时，在 `.env` 配置 `AI_BASE_URL`、`AI_API_KEY`、`AI_DEFAULT_MODEL`，前端不会接触密钥。
        </div>
      </div>

      <div className="stack">
        {models.map((m) => (
          <section className="card" key={m.model}>
            <div className="card-head">
              <div className="row">
                <div className="lr-icon" style={{ width: 38, height: 38, borderRadius: 10, background: "#eef3fa", color: "#17345a", display: "grid", placeItems: "center" }}>
                  <Bot size={18} />
                </div>
                <div>
                  <div className="card-title">
                    {m.provider} · {m.model}
                  </div>
                  <div className="card-desc">{m.baseUrl}</div>
                </div>
              </div>
              <div className="row">
                {m.isDefault ? <span className="badge blue">默认模型</span> : null}
                <StatusBadge value={m.enabled ? "active" : "closed"}>{m.enabled ? "已启用" : "未启用"}</StatusBadge>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-3">
                <div className="brand-line"><KeyRound size={15} /> 密钥：{m.key}</div>
                <div className="brand-line"><Server size={15} /> 超时：{m.timeout}</div>
                <div className="brand-line">
                  <Sparkles size={15} /> 用途：文案 / 脚本 / 活动 / 问答
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="card mt-16">
        <div className="card-head">
          <div className="card-title">模型调用约束</div>
        </div>
        <div className="card-body small muted" style={{ lineHeight: 1.9 }}>
          <p>· 业务页面不得直接请求模型供应商接口，必须经服务端统一网关。</p>
          <p>· 请求前检查租户状态、套餐有效期、功能开关与剩余额度。</p>
          <p>· 调用后记录 input/output tokens、模型、估算成本、耗时、状态与失败原因。</p>
          <p>· 数据库只保存密钥引用（secret reference），接口响应不返回明文密钥。</p>
          <p>· 超时、限流与重试需要控制，避免对非幂等操作重复计费。</p>
        </div>
      </section>
    </>
  );
}
