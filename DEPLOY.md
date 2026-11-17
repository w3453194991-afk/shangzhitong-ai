# 部署到 Linux 服务器（宝塔面板 + Docker）

本项目使用 Next.js standalone 输出，配合 Docker 部署。演示数据保存在容器内的 `/app/data`，通过 Docker 命名卷持久化，重建容器不会丢数据。

## 一、准备

- 服务器：Linux（x86_64 或 arm64 均可），建议 2GB 内存以上
- 宝塔面板已安装，并在「软件商店」安装 **Docker**（会自动带 Docker Compose）
- 本地已打好包含本文件的源码包

> 1GB 内存的服务器构建 Next.js 可能因内存不足失败，先加 1–2GB swap 再构建。

## 二、上传并启动

1. 宝塔「文件」进入 `/www/wwwroot`，新建目录 `shangzhitong`，上传源码 zip 并解压到该目录。
2. 宝塔「终端」执行：

```bash
cd /www/wwwroot/shangzhitong
docker compose up -d --build
```

如果提示 `docker compose` 不存在，改用：

```bash
docker-compose up -d --build
```

3. 查看状态与日志：

```bash
docker compose ps
docker compose logs -f app
```

看到容器状态为 `healthy` 即启动成功。

4. 宝塔「安全」放行 `3000` 端口（仅用 IP 访问时需要），然后打开：

```
http://服务器公网IP:3000
```

演示账号：`owner1@shangzhitong.demo`，统一密码 `demo123`。首次登录会自动生成演示数据。

## 三、绑定域名与 HTTPS（推荐）

1. 宝塔「网站」→ 添加站点，域名填你的域名，PHP 版本选「纯静态」。
2. 进入站点设置 →「反向代理」→ 添加：
   - 代理名称：`shangzhitong`
   - 目标 URL：`http://127.0.0.1:3000`
   - 发送域名：`$host`
3. 在站点设置 →「SSL」申请 Let's Encrypt 证书并开启强制 HTTPS。
4. 绑定域名后，建议把 `docker-compose.yml` 的端口改为只监听本机，避免 3000 直接暴露公网：

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

修改后执行 `docker compose up -d`，并在宝塔安全里删除 3000 的放行规则。

## 四、数据管理

数据卷名称：`shangzhitong-data`（映射到容器 `/app/data`）。

### 重置演示数据

```bash
cd /www/wwwroot/shangzhitong
docker compose exec app node scripts/reset-db.mjs
docker compose restart app
```

重启后下次访问会自动重新生成种子数据。

### 备份

```bash
cd /www/wwwroot/shangzhitong
docker run --rm -v shangzhitong-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/shangzhitong-data.tar.gz -C /data .
```

### 恢复

```bash
cd /www/wwwroot/shangzhitong
docker compose down
docker run --rm -v shangzhitong-data:/data -v "$PWD":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/shangzhitong-data.tar.gz -C /data"
docker compose up -d
```

## 五、更新版本

上传新的源码包覆盖旧文件（保留 `docker-compose.yml` 即可），然后：

```bash
cd /www/wwwroot/shangzhitong
docker compose up -d --build
```

数据卷不受影响，已录入的企业、产品与客户数据会保留。

## 六、常用排查

| 现象 | 排查 |
| --- | --- |
| 容器反复重启 | `docker compose logs --tail=100 app` 看报错；多为端口被占用 |
| 3000 端口打不开 | 宝塔安全放行 3000；云厂商安全组也要放行 |
| 域名 502 | 反代目标必须是 `http://127.0.0.1:3000`；确认容器 healthy |
| 构建报 OOM | 增加 swap 或升级到 2GB 内存，再重新 build |
| 页面正常但图片不显示 | 重新执行 `docker compose build --no-cache`，确认构建包含 `sharp` |
| 登录后数据被重置 | 检查是否误删了 `shangzhitong-data` 卷 |

## 七、说明

- 当前为演示版，数据保存在 JSON 文件（单容器、单进程），不要启动多个副本，否则会争用同一份数据。
- 正式商用建议按 README 的「从演示版接入正式环境」切换到 Supabase 等托管数据库。
- 不要把 `.env`、密钥或真实客户数据打进镜像；如需接入真实模型，在宝塔 Docker 编排里添加环境变量。