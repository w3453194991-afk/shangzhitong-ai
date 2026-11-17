"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Copy, History, Loader2, Sparkles } from "lucide-react";
import { generateMarketing, type GenState } from "@/lib/actions";
import type { GenerationType } from "@/lib/types";

interface DishOption {
  id: string;
  name: string;
  price: number;
  status: string;
}

interface Props {
  type: GenerationType;
  dishes: DishOption[];
  quotaUsed: number;
  quota: number;
  canWrite: boolean;
}

const initial: GenState = { ok: false };

export function GeneratorForm({ type, dishes, quotaUsed, quota, canWrite }: Props) {
  const [state, action, pending] = useActionState(generateMarketing, initial);
  const [selected, setSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState("");

  const onSale = dishes.filter((d) => d.status === "on");

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 1600);
    });
  }

  return (
    <>
      <form action={action} className="stack">
        <input type="hidden" name="type" value={type} />
        {selected.map((id) => (
          <input type="hidden" name="dishIds" value={id} key={id} />
        ))}

        {type === "copy" ? (
          <div className="form-grid">
            <div className="field">
              <label>发布渠道</label>
              <select className="select" name="channel" defaultValue="wechat_moments">
                <option value="wechat_moments">微信朋友圈</option>
                <option value="wechat_official">公众号</option>
                <option value="douyin">抖音</option>
                <option value="xiaohongshu">小红书</option>
                <option value="website">官网</option>
                <option value="offline">线下物料</option>
              </select>
            </div>
            <div className="field">
              <label>内容类型</label>
              <select className="select" name="contentType" defaultValue="promotion">
                <option value="promotion">产品推广</option>
                <option value="activity">活动预告</option>
                <option value="brand">品牌宣传</option>
                <option value="case">客户案例</option>
              </select>
            </div>
            <div className="field">
              <label>主题</label>
              <input className="input" name="topic" defaultValue="成长型企业数字化选型" placeholder="例如：新品发布 / 行业解决方案" />
            </div>
            <div className="field">
              <label>目标客群</label>
              <select className="select" name="audience" defaultValue="成长型企业负责人">
                <option>成长型企业负责人</option>
                <option>信息化 / 行政负责人</option>
                <option>生产与运营团队</option>
                <option>采购负责人</option>
                <option>行业合作伙伴</option>
              </select>
            </div>
            <div className="field">
              <label>语气风格</label>
              <select className="select" name="tone" defaultValue="专业务实">
                <option>专业务实</option>
                <option>简洁利落</option>
                <option>理性克制</option>
                <option>有行业洞察</option>
              </select>
            </div>
            <div className="field">
              <label>内容长度</label>
              <select className="select" name="length" defaultValue="short">
                <option value="short">短文案（约 150 字）</option>
                <option value="long">长文案（约 300 字）</option>
              </select>
            </div>
            <div className="field full">
              <label>补充约束</label>
              <input
                className="input"
                name="constraints"
                placeholder="例如：不承诺未确认的折扣；案例需客户授权"
              />
            </div>
          </div>
        ) : null}

        {type === "video" ? (
          <div className="form-grid">
            <div className="field">
              <label>视频时长</label>
              <select className="select" name="duration" defaultValue="30">
                <option value="15">15 秒</option>
                <option value="30">30 秒</option>
                <option value="60">60 秒</option>
              </select>
            </div>
            <div className="field">
              <label>视频类型</label>
              <select className="select" name="videoType" defaultValue="产品介绍">
                <option>产品介绍</option>
                <option>功能演示</option>
                <option>客户案例</option>
                <option>品牌宣传</option>
              </select>
            </div>
            <div className="field">
              <label>主题</label>
              <input className="input" name="topic" defaultValue="核心产品价值演示" />
            </div>
            <div className="field">
              <label>是否口播</label>
              <select className="select" name="voiceover" defaultValue="yes">
                <option value="yes">需要口播</option>
                <option value="no">仅字幕</option>
              </select>
            </div>
            <div className="field full">
              <label>拍摄条件</label>
              <input className="input" name="shooting" defaultValue="手机横屏拍摄，办公 / 生产现场自然光" />
            </div>
          </div>
        ) : null}

        {type === "campaign" ? (
          <div className="form-grid">
            <div className="field">
              <label>活动目标</label>
              <select className="select" name="goal" defaultValue="获取高质量销售线索">
                <option>获取高质量销售线索</option>
                <option>推动产品试用</option>
                <option>提升品牌行业认知</option>
                <option>激活老客户续约</option>
                <option>推广新版本 / 新服务</option>
              </select>
            </div>
            <div className="field">
              <label>目标人群</label>
              <select className="select" name="audience" defaultValue="成长型企业负责人">
                <option>成长型企业负责人</option>
                <option>信息化负责人</option>
                <option>生产负责人</option>
                <option>老客户</option>
              </select>
            </div>
            <div className="field">
              <label>开始日期</label>
              <input className="input" type="date" name="startDate" />
            </div>
            <div className="field">
              <label>结束日期</label>
              <input className="input" type="date" name="endDate" />
            </div>
            <div className="field">
              <label>预算范围（元）</label>
              <input className="input" name="budget" defaultValue="8000" inputMode="numeric" />
            </div>
            <div className="field">
              <label>活动限制</label>
              <input className="input" name="limits" defaultValue="同一企业限报名一次，权益以活动页公示为准" />
            </div>
          </div>
        ) : null}

        <div className="field">
          <label>关联产品（可多选）</label>
          <div className="check-grid">
            {onSale.length === 0 ? (
              <span className="small muted">暂无可选的在售产品，请先到「产品资料」添加。</span>
            ) : (
              onSale.map((d) => {
                const checked = selected.includes(d.id);
                return (
                  <label className="check-pill" key={d.id}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id),
                        )
                      }
                    />
                    {d.name} · ¥{d.price}
                  </label>
                );
              })
            )}
          </div>
          <div className="hint">不选择时，系统自动使用企业前 3 个在售产品。</div>
        </div>

        <div className="ai-banner">
          <Sparkles size={17} style={{ flex: "0 0 auto", marginTop: 2 }} />
          <div>
            生成时自动注入企业品牌资料、选中的产品与真实价格；本次调用将计入套餐额度（本月已用 {quotaUsed}/{quota} 次）。
          </div>
        </div>

        {state.error ? (
          <div className="notice red">
            <AlertCircle size={17} />
            <div>{state.error}</div>
          </div>
        ) : null}

        <div className="row">
          <button className="btn btn-primary btn-lg" type="submit" disabled={pending || !canWrite}>
            {pending ? <Loader2 size={17} className="spin" /> : <Sparkles size={17} />}
            {pending ? "正在读取企业资料并生成…" : "开始生成"}
          </button>
          {!canWrite ? <span className="small muted">当前企业状态不可发起新的生成。</span> : null}
          <Link className="btn" href="/app/marketing/history">
            <History size={16} /> 生成历史
          </Link>
        </div>
      </form>

      {state.ok && state.payload ? (
        <div className="mt-24">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>生成结果 · {state.title}</div>
            <span className="badge green"><Check size={12} /> 已保存到历史记录</span>
          </div>
          <ResultView payload={state.payload} onCopy={copy} copied={copied} />
        </div>
      ) : null}
    </>
  );
}

function ResultView({
  payload,
  onCopy,
  copied,
}: {
  payload: Record<string, unknown>;
  onCopy: (text: string, key: string) => void;
  copied: string;
}) {
  if (payload.kind === "copy") {
    const versions = payload.versions as {
      label: string;
      title: string;
      body: string;
      tags: string;
      cta: string;
    }[];
    return (
      <div>
        {versions.map((v, i) => {
          const full = `${v.title}\n\n${v.body}\n\n${v.tags}\n${v.cta}`;
          return (
            <div className="result-block" key={i}>
              <div className="result-head">
                <span>{v.label}</span>
                <button className="copy-btn" type="button" onClick={() => onCopy(full, `v${i}`)}>
                  {copied === `v${i}` ? <Check size={12} style={{ verticalAlign: "-2px" }} /> : <Copy size={12} style={{ verticalAlign: "-2px" }} />}{" "}
                  {copied === `v${i}` ? "已复制" : "复制"}
                </button>
              </div>
              <div className="result-body">
                <strong>{v.title}</strong>
                {"\n\n"}
                {v.body}
                {"\n\n"}
                <span style={{ color: "#3478c8" }}>{v.tags}</span>
                {"\n"}
                <span className="muted">CTA：{v.cta}</span>
              </div>
            </div>
          );
        })}
        <div className="notice orange mt-16">
          <AlertCircle size={17} />
          <div>{String(payload.notes ?? "")}</div>
        </div>
      </div>
    );
  }

  if (payload.kind === "video") {
    const scenes = payload.scenes as {
      no: number;
      time: string;
      visual: string;
      line: string;
      subtitle: string;
      transition: string;
    }[];
    const full = scenes
      .map(
        (s) =>
          `镜头 ${s.no}（${s.time}）\n画面：${s.visual}\n${s.line ? `口播：${s.line}\n` : ""}字幕：${s.subtitle}\n转场：${s.transition}`,
      )
      .join("\n\n");
    return (
      <div className="result-block">
        <div className="result-head">
          <span>{String(payload.title ?? "")} · 共 {String(payload.totalSeconds ?? "")} 秒</span>
          <button className="copy-btn" type="button" onClick={() => onCopy(full, "video")}>
            {copied === "video" ? "已复制" : "复制全部"}
          </button>
        </div>
        <div className="table-wrap">
          <table className="table scene-table">
            <thead>
              <tr>
                <th style={{ width: 54 }}>镜头</th>
                <th style={{ width: 90 }}>时间</th>
                <th>画面</th>
                <th>口播 / 字幕</th>
                <th style={{ width: 90 }}>转场</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((s) => (
                <tr key={s.no}>
                  <td className="strong">{s.no}</td>
                  <td className="nowrap small">{s.time}</td>
                  <td className="small">{s.visual}</td>
                  <td className="small">
                    {s.line ? <div>{s.line}</div> : null}
                    <div className="muted">字幕：{s.subtitle}</div>
                  </td>
                  <td className="small muted">{s.transition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: 14 }}>
          <div className="notice orange">
            <AlertCircle size={17} />
            <div>{String(payload.notes ?? "")}</div>
          </div>
        </div>
      </div>
    );
  }

  const rules = payload.rules as string[];
  const steps = payload.steps as string[];
  const risks = payload.risks as string[];
  return (
    <div className="result-block">
      <div className="result-head">
        <span>{String(payload.theme ?? "")}</span>
        <button
          className="copy-btn"
          type="button"
          onClick={() =>
            onCopy(
              `${payload.theme}\n\n规则：\n${rules.join("\n")}\n\n步骤：\n${steps.join("\n")}\n\n宣传文案：\n${payload.copy}`,
              "campaign",
            )
          }
        >
          {copied === "campaign" ? "已复制" : "复制方案"}
        </button>
      </div>
      <div className="result-body">
        <div className="section-title">活动规则</div>
        {rules.map((r, i) => (
          <div key={i}>· {r}</div>
        ))}
        <div className="section-title mt-16">执行步骤</div>
        {steps.map((s, i) => (
          <div key={i}>{i + 1}. {s}</div>
        ))}
        <div className="section-title mt-16">宣传文案</div>
        {String(payload.copy ?? "")}
        <div className="section-title mt-16">风险提示</div>
        {risks.map((r, i) => (
          <div key={i} className="muted">· {r}</div>
        ))}
      </div>
    </div>
  );
}
