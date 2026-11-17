import { promises as fs } from "fs";
import path from "path";

const file = path.join(process.cwd(), "data", "db.json");

await fs.rm(file, { force: true });
console.log("演示数据库已清除。下次启动应用时会自动重新生成种子数据。");
