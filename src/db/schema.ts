import { getDb } from './index.js';
import type { RawItem, Item } from '../types.js';

// 插入爬取的原始条目（去重）
export function insertRawItems(items: RawItem[], crawlDate: string): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO items (title, url, source, hot_score, crawl_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  const insertMany = db.transaction((items: RawItem[]) => {
    for (const item of items) {
      if (!isDuplicate(item.source, item.title, crawlDate)) {
        stmt.run(item.title, item.url, item.source, item.hotScore || null, crawlDate);
        inserted++;
      }
    }
  });

  insertMany(items);
  return inserted;
}

// 去重检查（同一天同一来源同一标题）
function isDuplicate(source: string, title: string, date: string): boolean {
  const db = getDb();
  const row = db.prepare(`
    SELECT id FROM items 
    WHERE source = ? AND title = ? AND crawl_date = ?
    LIMIT 1
  `).get(source, title, date);
  return !!row;
}

// 更新 LLM 处理结果（摘要+分类）
export function updateProcessedItem(id: number, summary: string, category: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE items 
    SET summary = ?, category = ? 
    WHERE id = ?
  `).run(summary, category, id);
}

// 批量更新 LLM 处理结果
export function batchUpdateResults(results: { id: number; summary: string; category: string }[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE items 
    SET summary = ?, category = ? 
    WHERE id = ?
  `);

  const updateMany = db.transaction((results: { id: number; summary: string; category: string }[]) => {
    for (const r of results) {
      stmt.run(r.summary, r.category, r.id);
    }
  });

  updateMany(results);
}

// 按日期查询当天所有条目
export function getItemsByDate(date: string): Item[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM items 
    WHERE crawl_date = ? 
    ORDER BY hot_score DESC
  `).all(date) as Item[];
}

// 按日期和领域查询
export function getItemsByDateAndCategory(date: string, category: string): Item[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM items 
    WHERE crawl_date = ? AND category = ?
    ORDER BY hot_score DESC
  `).all(date, category) as Item[];
}

// 获取当天未处理的条目（summary 为空）
export function getUnprocessedItems(date: string): Item[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM items 
    WHERE crawl_date = ? AND summary IS NULL
  `).all(date) as Item[];
}
