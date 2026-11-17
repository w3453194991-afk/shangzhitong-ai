import { getMerchantContext, canExportCustomers } from "@/lib/session";
import { mutateDb, uid } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export async function GET() {
  const ctx = await getMerchantContext();
  if (!ctx) return new Response("未登录", { status: 401 });
  if (!canExportCustomers(ctx.role)) {
    return new Response("当前角色没有客户导出权限", { status: 403 });
  }
  const rows = await mutateDb((db) => {
    const customers = db.customers.filter((c) => c.tenantId === ctx.tenant.id);
    db.auditLogs.unshift({
      id: uid("a"),
      actor: ctx.user.name,
      actorRole: ctx.role,
      tenantId: ctx.tenant.id,
      action: "customer.export",
      target: `${customers.length} 条客户记录`,
      detail: "导出本企业客户资料（CSV）",
      createdAt: new Date().toISOString(),
    });
    return customers;
  });

  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["姓名", "手机号", "来源", "状态", "标签", "备注", "建档日期", "跟进次数"];
  const lines = rows.map((c) =>
    [
      c.name,
      c.phone,
      c.source,
      c.status,
      c.tags.join("/"),
      c.note,
      formatDate(c.createdAt),
      String(c.followups.length),
    ]
      .map(escape)
      .join(","),
  );
  const csv = `\uFEFF${header.map(escape).join(",")}\n${lines.join("\n")}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${ctx.tenant.code}.csv"`,
    },
  });
}
