import { fetchAllSources } from '../crawler/index.js';
import { insertRawItems, getUnprocessedItems, batchUpdateResults } from '../db/schema.js';
import { processWithLLM } from '../llm/processor.js';
import { generateLatestJSON, generateCategoryJSON, extractCategorySpeechTexts } from '../utils/storage.js';

export async function runDailyTask() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  console.log(`[Task] 开始执行每日任务，日期: ${today}`);

  try {
    // 1. 爬取所有数据源
    console.log('[Task] Step 1: 爬取数据源...');
    const rawItems = await fetchAllSources();
    
    if (rawItems.length === 0) {
      console.log('[Task] 未获取到任何数据，任务结束');
      return;
    }

    // 2. 存入数据库（去重）
    console.log('[Task] Step 2: 存入数据库...');
    const inserted = insertRawItems(rawItems, today);
    console.log(`[Task] 新增 ${inserted} 条，去重跳过 ${rawItems.length - inserted} 条`);

    // 3. 获取未处理的条目
    console.log('[Task] Step 3: 获取未处理条目...');
    const unprocessed = getUnprocessedItems(today);
    console.log(`[Task] 待处理 ${unprocessed.length} 条`);

    if (unprocessed.length === 0) {
      console.log('[Task] 无待处理条目，任务结束');
      return;
    }

    // 4. 调用 LLM 处理
    console.log('[Task] Step 4: 调用 LLM 处理...');
    const llmResult = await processWithLLM(unprocessed);

    // 5. 更新数据库
    console.log('[Task] Step 5: 更新数据库...');
    const updateData = llmResult.items.map((item) => {
      // 模糊匹配：精确匹配 > 包含匹配 > 前缀匹配
      let dbItem = unprocessed.find((u) => u.title === item.title);
      if (!dbItem) {
        dbItem = unprocessed.find((u) => 
          u.title.includes(item.title) || item.title.includes(u.title)
        );
      }
      if (!dbItem) {
        // 取前10个字符匹配
        const prefix = item.title.slice(0, 10);
        dbItem = unprocessed.find((u) => u.title.startsWith(prefix));
      }
      return {
        id: dbItem?.id || 0,
        summary: item.summary,
        category: item.category,
      };
    }).filter((item) => item.id > 0);
    
    batchUpdateResults(updateData);
    console.log(`[Task] 已更新 ${updateData.length}/${llmResult.items.length} 条记录`);

    // 6. 生成 JSON 文件
    console.log('[Task] Step 6: 生成 JSON 文件...');
    generateLatestJSON(today, llmResult.speechText);
    
    // 使用 LLM 生成的各领域朗读稿，如果没有则用默认文案
    const categorySpeechTexts = llmResult.categorySpeechTexts || 
      extractCategorySpeechTexts(llmResult.speechText, llmResult.items);
    generateCategoryJSON(today, categorySpeechTexts);

    console.log(`[Task] 每日任务完成！`);
  } catch (error) {
    console.error('[Task] 任务执行失败:', error instanceof Error ? error.message : error);
  }
}
