"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { AlertTriangle, Bot, Loader2, Send, User } from "lucide-react";
import { askQuestion, type ChatState } from "@/lib/actions";

interface UiSource {
  id: string;
  title: string;
  kind: "dish" | "file";
}
interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: UiSource[];
  found?: boolean;
}

const initial: ChatState = { ok: false };

export function ChatBox({
  initialMessages,
  canAsk,
}: {
  initialMessages: UiMessage[];
  canAsk: boolean;
}) {
  const [state, action, pending] = useActionState(askQuestion, initial);
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const handled = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.ok && state.answer && state.question) {
      const key = `${state.question}::${state.answer.slice(0, 40)}`;
      if (handled.current !== key) {
        handled.current = key;
        setMessages((prev) => [
          ...prev,
          { id: `q-${key}`, role: "user", content: state.question!, sources: [] },
          {
            id: `a-${key}`,
            role: "assistant",
            content: state.answer!,
            sources: state.sources ?? [],
            found: state.found,
          },
        ]);
        setDraft("");
      }
    }
  }, [state]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const suggestions = [
    "核心产品有哪些？",
    "云岭协同多少钱？",
    "服务时间是什么时候？",
    "你们有海外仓服务吗？",
  ];

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">AI 问答</div>
          <div className="card-desc">
            回答基于企业文档与产品资料，展示引用来源；检索不到时明确说明
          </div>
        </div>
        <span className="badge green">仅检索本企业</span>
      </div>

      <div className="chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <div className="empty" style={{ padding: "30px 10px" }}>
            <div className="empty-icon"><Bot size={22} /></div>
            <div className="empty-title">问点企业相关的问题</div>
            <div className="small">
              例如：核心产品有哪些、云岭协同多少钱、服务时间是什么时候。缺少资料时不会编造。
            </div>
            <div className="check-grid mt-16" style={{ justifyContent: "center" }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="check-pill"
                  onClick={() => setDraft(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div className={`msg ${m.role}`} key={m.id}>
              <div className="avatar">
                {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className="bubble">
                {m.content}
                {m.role === "assistant" && m.sources.length > 0 ? (
                  <div className="sources">
                    {m.sources.map((s) => (
                      <span className="source-chip" key={`${s.kind}-${s.id}`}>
                        {s.kind === "file" ? "文档" : "产品"} · {s.title}
                      </span>
                    ))}
                  </div>
                ) : null}
                {m.role === "assistant" && m.found === false ? (
                  <div className="sources">
                    <span className="badge orange"><AlertTriangle size={11} /> 资料不足，未作推测</span>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
        {pending ? (
          <div className="msg assistant">
            <div className="avatar"><Bot size={14} /></div>
            <div className="bubble row muted">
              <Loader2 size={15} className="spin" /> 正在检索本企业知识库…
            </div>
          </div>
        ) : null}
        {state.error ? (
          <div className="notice red">
            <AlertTriangle size={17} />
            <div>{state.error}</div>
          </div>
        ) : null}
      </div>

      <form action={action} className="chat-input">
        <textarea
          className="textarea"
          name="question"
          placeholder={canAsk ? "输入问题，例如：我们公司的核心产品有哪些？" : "企业暂停中，暂时无法提问"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!canAsk || pending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (draft.trim()) e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button className="btn btn-primary btn-lg" type="submit" disabled={!canAsk || pending || !draft.trim()}>
          <Send size={16} /> 发送
        </button>
      </form>
    </div>
  );
}
