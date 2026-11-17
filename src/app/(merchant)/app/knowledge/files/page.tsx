import { CheckCircle2, FileText, RefreshCw, Trash2, Upload } from "lucide-react";
import { EmptyState, PageHead, StatusBadge } from "@/components/ui";
import { deleteFile, reparseFile, uploadFile } from "@/lib/actions";
import { requireMerchant } from "@/lib/session";
import { getDb } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ uploaded?: string; denied?: string; error?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireMerchant();
  const db = await getDb();
  const files = db.files
    .filter((f) => f.tenantId === ctx.tenant.id)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const canEdit = ctx.role !== "staff";

  return (
    <>
      <PageHead
        title="文档管理"
        sub="上传产品手册、方案与经营资料，AI 问答只检索本企业文档"
        actions={<span className="badge blue">{files.length} 个文件</span>}
      />

      {params.uploaded ? (
        <div className="notice green" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={17} />
          <div>文件已上传并完成解析（演示版直接将文本切分为可检索知识）。</div>
        </div>
      ) : null}
      {params.denied ? (
        <div className="notice orange" style={{ marginBottom: 16 }}>
          <div>当前角色没有文档管理权限，请联系部门主管或企业管理员操作。</div>
        </div>
      ) : null}

      <div className="split">
        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">文件列表</div>
              <div className="card-desc">删除文件会同步移除其知识切片与检索结果</div>
            </div>
          </div>
          {files.length === 0 ? (
            <EmptyState
              title="还没有知识文档"
              desc="上传产品手册、服务信息或方案，AI 回答时会引用这些资料。"
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>文件</th>
                    <th>分类</th>
                    <th>大小</th>
                    <th>状态</th>
                    <th>上传时间</th>
                    <th className="right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <FileText size={16} className="muted" />
                          <div>
                            <div className="cell-main">{f.name}</div>
                            <div className="cell-sub">.{f.ext} · 私有存储</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="tag">{f.category}</span></td>
                      <td className="small muted">{f.sizeKb} KB</td>
                      <td><StatusBadge value={f.status} /></td>
                      <td className="small muted nowrap">{formatDateTime(f.uploadedAt)}</td>
                      <td>
                        <div className="row" style={{ justifyContent: "flex-end", gap: 6 }}>
                          {f.status !== "ready" ? (
                            <form action={reparseFile}>
                              <input type="hidden" name="id" value={f.id} />
                              <button className="btn btn-sm" type="submit">
                                <RefreshCw size={13} /> 重新解析
                              </button>
                            </form>
                          ) : null}
                          {canEdit ? (
                            <form action={deleteFile}>
                              <input type="hidden" name="id" value={f.id} />
                              <button className="btn btn-sm btn-danger" type="submit">
                                <Trash2 size={13} />
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">上传文档</div>
                <div className="card-desc">演示版通过粘贴文本模拟上传</div>
              </div>
              <Upload size={17} className="muted" />
            </div>
            <div className="card-body">
              <form action={uploadFile} className="stack">
                <div className="field">
                  <label>文件名（含扩展名）</label>
                  <input className="input" name="name" placeholder="例如：产品与报价手册.txt" required />
                </div>
                <div className="field">
                  <label>分类</label>
                  <select className="select" name="category" defaultValue="产品">
                    <option>产品</option>
                    <option>企业信息</option>
                    <option>案例</option>
                    <option>经营资料</option>
                    <option>其他</option>
                  </select>
                </div>
                <div className="field">
                  <label>文档内容</label>
                  <textarea
                    className="textarea"
                    name="content"
                    rows={5}
                    placeholder="粘贴产品、报价、服务范围或活动规则等文本内容，AI 问答会检索这里。"
                    required
                  />
                  <div className="hint">支持 PDF/DOCX/TXT/CSV/XLSX；单文件不超过 20 MB（正式版）。</div>
                </div>
                {canEdit ? (
                  <button className="btn btn-primary" type="submit">上传并解析</button>
                ) : (
                  <div className="notice orange">员工角色只读，无法上传或删除文档。</div>
                )}
              </form>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div className="card-title">安全说明</div>
            </div>
            <div className="card-body small muted" style={{ lineHeight: 1.9 }}>
              <p>文件存放在私有 Bucket，访问需签名 URL，不生成公开链接。</p>
              <p className="mt-8">解析与检索均按 tenant_id 过滤，企业 A 的问答不会检索到企业 B 的文档。</p>
              <p className="mt-8">正式版接入对象存储与解析任务后，这里会显示 processing / failed 状态与失败原因。</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
