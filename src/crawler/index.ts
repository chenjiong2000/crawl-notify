import { fetchWeibo } from './weibo.js';
import { fetchZhihu } from './zhihu.js';
import { fetchKr36 } from './kr36.js';
import { fetchHackerNews } from './hackernews.js';
import { fetchReddit } from './reddit.js';
import type { RawItem } from '../types.js';

export async function fetchAllSources(): Promise<RawItem[]> {
  console.log('[Crawler] 开始爬取所有数据源...');

  const results = await Promise.allSettled([
    fetchWeibo(),
    fetchZhihu(),
    fetchKr36(),
    fetchHackerNews(),
    fetchReddit(),
  ]);

  const allItems: RawItem[] = [];

  results.forEach((result, index) => {
    const sources = ['weibo', 'zhihu', '36kr', 'hackernews', 'reddit'];
    if (result.status === 'fulfilled') {
      console.log(`[${sources[index]}] 成功获取 ${result.value.length} 条`);
      allItems.push(...result.value);
    } else {
      console.error(`[${sources[index]}] 爬取失败:`, result.reason);
    }
  });

  console.log(`[Crawler] 总计获取 ${allItems.length} 条原始数据`);
  return allItems;
}
