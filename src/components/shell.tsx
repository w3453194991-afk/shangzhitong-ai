"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Bot,
  ChefHat,
  ClipboardList,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  PenLine,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  Ticket,
  Users,
  Video,
  X,
} from "lucide-react";
import { Progress } from "./ui";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string;
  disabled?: boolean;
  exact?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

export interface ShellProps {
  kind: "merchant" | "admin";
  user: { name: string; roleLabel: string };
  tenant?: {
    name: string;
    plan: string;
    statusLabel: string;
    quota: number;
    used: number;
    category: string;
  };
  today: string;
  children: ReactNode;
}

const merchantNav: NavGroup[] = [
  {
    items: [{ href: "/app", label: "工作台", icon: <LayoutDashboard />, exact: true }],
  },
  {
    title: "AI 营销中心",
    items: [
      { href: "/app/marketing/copy", label: "文案生成", icon: <PenLine /> },
      { href: "/app/marketing/video", label: "视频脚本", icon: <Video /> },
      { href: "/app/marketing/campaign", label: "活动策划", icon: <Megaphone /> },
      { href: "/app/marketing/brand", label: "品牌资料", icon: <ChefHat /> },
    ],
  },
  {
    title: "企业知识库",
    items: [
      { href: "/app/knowledge/files", label: "文档管理", icon: <FileText /> },
      { href: "/app/knowledge/products", label: "产品资料", icon: <Boxes /> },
      { href: "/app/knowledge/chat", label: "AI 问答", icon: <MessageSquare /> },
    ],
  },
  {
    title: "经营",
    items: [
      { href: "/app/customers", label: "客户管理", icon: <Users /> },
      { href: "/app/analytics", label: "数据分析", icon: <BarChart3 /> },
    ],
  },
  {
    title: "账户",
    items: [
      { href: "/app/settings", label: "系统设置", icon: <Settings /> },
      {
        href: "/app/automation",
        label: "自动化中心",
        icon: <Bot />,
        badge: "即将上线",
        disabled: true,
      },
    ],
  },
];

const adminNav: NavGroup[] = [
  {
    items: [{ href: "/admin", label: "平台总览", icon: <LayoutDashboard />, exact: true }],
  },
  {
    title: "运营管理",
    items: [
      { href: "/admin/tenants", label: "企业客户", icon: <Store /> },
      { href: "/admin/users", label: "用户管理", icon: <Users /> },
      { href: "/admin/plans", label: "套餐管理", icon: <Tags /> },
      { href: "/admin/subscriptions", label: "订阅 / 订单", icon: <CreditCard /> },
    ],
  },
  {
    title: "AI 与内容",
    items: [
      { href: "/admin/ai-models", label: "AI 模型管理", icon: <Sparkles /> },
      { href: "/admin/ai-usage", label: "AI 用量管理", icon: <BarChart3 /> },
      { href: "/admin/templates", label: "模板管理", icon: <ClipboardList /> },
    ],
  },
  {
    title: "支持与安全",
    items: [
      { href: "/admin/tickets", label: "反馈工单", icon: <Ticket /> },
      { href: "/admin/audit-logs", label: "系统日志", icon: <ShieldCheck /> },
      { href: "/admin/settings", label: "平台设置", icon: <Settings /> },
    ],
  },
];

export function Shell({ kind, user, tenant, today, children }: ShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const groups = kind === "merchant" ? merchantNav : adminNav;

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const current = groups.flatMap((g) => g.items).find((i) => isActive(i));

  return (
    <div className="shell">
      <div
        className={cn("sidebar-overlay", open && "open")}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside className={cn("sidebar", open && "open")}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-row">
            <div className="logo-mark logo-mark-img">
              <Image src="/brand/logo-icon.png" alt="商智通" width={46} height={30} priority />
            </div>
            <div>
              <div className="brand-name">商智通</div>
              <div className="brand-sub">
                {kind === "merchant" ? "企业 AI 经营增长助手" : "平台运营控制台"}
              </div>
            </div>
            <button
              className="mobile-only menu-btn"
              style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#fff" }}
              onClick={() => setOpen(false)}
              aria-label="关闭菜单"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {kind === "merchant" && tenant ? (
          <div className="tenant-chip">
            <div className="name">
              <span>{tenant.name}</span>
              <span className="badge green" style={{ fontSize: 10 }}>{tenant.statusLabel}</span>
            </div>
            <div className="meta">
              {tenant.category} · {tenant.plan}
            </div>
            <div style={{ marginTop: 8 }}>
              <Progress value={tenant.used} max={tenant.quota} />
              <div className="meta" style={{ marginTop: 4 }}>
                本月 AI 额度 {tenant.used}/{tenant.quota}
              </div>
            </div>
          </div>
        ) : (
          <div className="tenant-chip">
            <div className="name">
              <span>平台运营中心</span>
              <span className="badge blue" style={{ fontSize: 10 }}>演示环境</span>
            </div>
            <div className="meta">企业客户 · 套餐 · 用量 · 审计</div>
          </div>
        )}

        <nav className="nav">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.title ? <div className="nav-group">{group.title}</div> : null}
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "nav-item",
                    isActive(item) && "active",
                    item.disabled && "disabled",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="row" style={{ gap: 8, marginBottom: 6 }}>
            <BookOpen size={13} />
            <span>演示数据 · 可随时一键重置</span>
          </div>
          <div>V1.0 · 2026-11</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="打开菜单">
            <Menu size={18} />
          </button>
          <div className="topbar-title">{current?.label ?? (kind === "merchant" ? "企业端" : "平台管理端")}</div>
          <div className="topbar-right">
            <span className="badge navy" style={{ fontSize: 11 }}>
              {today}
            </span>
            <Link href={kind === "merchant" ? "/app/settings" : "/admin/settings"} className="link small">
              <HelpCircle size={16} style={{ verticalAlign: "-3px" }} />
            </Link>
            <span className="link small" title="演示环境暂无通知">
              <Bell size={16} style={{ verticalAlign: "-3px" }} />
            </span>
            <div className="user-chip">
              <div className="avatar">{user.name.slice(0, 1)}</div>
              <div>
                <div className="name">{user.name}</div>
                <div className="role">{user.roleLabel}</div>
              </div>
            </div>
            <form action="/api/logout" method="post">
              <button className="menu-btn" style={{ display: "grid" }} title="退出登录" type="submit">
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </header>
        <main className="content">{children}</main>
        <div className="footer-note">
          商智通 · 演示环境，页面数据来自本地演示数据库 · 企业之间严格隔离
        </div>
      </div>
    </div>
  );
}
