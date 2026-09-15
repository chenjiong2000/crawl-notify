import axios from 'axios';
import type { RawItem } from '../types.js';

export async function fetchHackerNews(): Promise<RawItem[]> {
  try {
    // 获取 top stories ID 列表
    const idsResponse = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json', {
      timeout: 10000,
    });
    const ids: number[] = idsResponse.data.slice(0, 30); // 取前30条

    // 并发获取每条详情
    const results = await Promise.all(
      ids.map(async (id): Promise<RawItem | null> => {
        try {
          const res = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            timeout: 5000,
          });
          const item = res.data;
          return {
            title: item.title || '',
            url: item.url || `https://news.ycombinator.com/item?id=${id}`,
            source: 'hackernews',
            hotScore: item.score || 0,
          };
        } catch {
          return null;
        }
      })
    );

    return results.filter((item): item is RawItem => item !== null);
  } catch (error) {
    console.error('[HackerNews] 爬取失败:', error instanceof Error ? error.message : error);
    return [];
  }
}
