import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // LLM API
  llmApiKey: process.env.LLM_API_KEY || '',
  llmApiBase: process.env.LLM_API_BASE || 'https://api.openai.com/v1',
  llmModel: process.env.LLM_MODEL || 'gpt-4o-mini',

  // 服务配置
  port: parseInt(process.env.PORT || '3000', 10),
  cronSchedule: process.env.CRON_SCHEDULE || '0 8 * * *',

  // 领域分类
  categories: (process.env.CATEGORIES || 'ai,tech,finance,society,entertainment').split(','),

  // 鉴权
  apiSecret: process.env.API_SECRET || '',
};
