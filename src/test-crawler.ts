import { fetchAllSources } from './crawler/index.js';
import { insertRawItems } from './db/schema.js';
import { getItemsByDate } from './db/schema.js';

async function testCrawlers() {
  console.log('=== 爬虫测试开始 ===\n');

  // 1. 爬取所有源
  const items = await fetchAllSources();
  console.log(`\n总计爬取 ${items.length} 条\n`);

  // 2. 按来源统计
  const sourceCounts: Record<string, number> = {};
  for (const item of items) {
    sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
  }
  console.log('各来源数量:');
  for (const [source, count] of Object.entries(sourceCounts)) {
    console.log(`  ${source}: ${count} 条`);
  }

  // 3. 存入数据库
  const today = new Date().toISOString().split('T')[0];
  const inserted = insertRawItems(items, today);
  console.log(`\n入库 ${inserted} 条（去重跳过 ${items.length - inserted} 条）`);

  // 4. 从数据库读取验证
  const dbItems = getItemsByDate(today);
  console.log(`数据库中今日数据: ${dbItems.length} 条`);

  // 5. 展示前5条
  console.log('\n前5条数据预览:');
  dbItems.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i + 1}. [${item.source}] ${item.title}`);
    console.log(`     URL: ${item.url}`);
  });

  console.log('\n=== 爬虫测试完成 ===');
}

testCrawlers().catch(console.error);
