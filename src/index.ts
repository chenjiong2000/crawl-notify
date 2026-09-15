import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { startScheduler } from './scheduler/daily.js';
import { runDailyTask } from './scheduler/task.js';
import { getItemsByDate } from './db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务（JSON 文件）
app.use('/data', express.static(path.join(__dirname, '../public/data')));

// API: 获取最新数据
app.get('/api/data', (req: Request, res: Response) => {
  const category = req.query.category as string;
  const filePath = category 
    ? path.join(__dirname, '../public/data', `${category}.json`)
    : path.join(__dirname, '../public/data/latest.json');
  
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(raw));
  } catch {
    res.status(404).json({ error: '数据不存在' });
  }
});

// API: 查询历史数据
app.get('/api/history', (req: Request, res: Response) => {
  const date = req.query.date as string;
  if (!date) {
    return res.status(400).json({ error: '请提供 date 参数' });
  }
  
  const items = getItemsByDate(date);
  res.json({ date, items });
});

// API: 手动触发更新
app.post('/api/refresh', async (req: Request, res: Response) => {
  // 可选鉴权
  if (config.apiSecret) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== config.apiSecret) {
      return res.status(401).json({ error: '未授权' });
    }
  }

  console.log('[API] 手动触发更新...');
  res.json({ message: '任务已启动，请稍后查看结果' });
  
  // 异步执行，不阻塞响应
  runDailyTask().catch(console.error);
});

// 健康检查
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 启动服务
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`[Server] 服务已启动，端口: ${PORT}`);
  console.log(`[Server] 健康检查: http://localhost:${PORT}/health`);
  console.log(`[Server] 最新数据: http://localhost:${PORT}/data/latest.json`);
  
  // 启动定时任务
  startScheduler();
});
