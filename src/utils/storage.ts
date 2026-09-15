import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import { getItemsByDate, getItemsByDateAndCategory } from '../db/schema.js';
import type { Item, OutputJSON, OutputItem } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../public/data');

// 确保输出目录存在
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 将 Item 转换为输出格式
function toOutputItem(item: Item): OutputItem {
  return {
    title: item.title,
    summary: item.summary || item.title,
    category: item.category || 'tech',
    source: item.source,
    url: item.url || '',
  };
}

// 生成综合 JSON（latest.json）
export function generateLatestJSON(date: string, speechText: string): void {
  ensureDir();
  const items = getItemsByDate(date);
  const output: OutputJSON = {
    date,
    updatedAt: new Date().toISOString(),
    speechText,
    items: items.map(toOutputItem),
  };

  const filePath = path.join(DATA_DIR, 'latest.json');
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`[Storage] 已生成 ${filePath}，共 ${output.items.length} 条`);
}

// 按领域生成 JSON
export function generateCategoryJSON(date: string, categorySpeechTexts: Record<string, string>): void {
  ensureDir();

  for (const category of config.categories) {
    const items = getItemsByDateAndCategory(date, category);
    if (items.length === 0) continue;

    const output: OutputJSON = {
      date,
      updatedAt: new Date().toISOString(),
      category,
      speechText: categorySpeechTexts[category] || `今日${category}领域共有${items.length}条热点资讯。`,
      items: items.map(toOutputItem),
    };

    const filePath = path.join(DATA_DIR, `${category}.json`);
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`[Storage] 已生成 ${filePath}，共 ${output.items.length} 条`);
  }
}

// 从 LLM 结果中提取各领域的朗读稿
export function extractCategorySpeechTexts(
  speechText: string,
  items: { category: string }[]
): Record<string, string> {
  // 简化实现：各领域使用通用朗读稿
  // 实际可以让 LLM 分别生成各领域的朗读稿
  const result: Record<string, string> = {};
  const categoryCounts: Record<string, number> = {};

  for (const item of items) {
    const cat = item.category;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  for (const [category, count] of Object.entries(categoryCounts)) {
    result[category] = `今日${category}领域共有${count}条热点资讯。详细内容请查看列表。`;
  }

  return result;
}
