import axios from 'axios';
import type { RawItem } from '../types.js';

export async function fetchWeibo(): Promise<RawItem[]> {
  try {
    const response = await axios.get('https://weibo.com/ajax/side/hotSearch', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://weibo.com/',
      },
    });

    const data = response.data?.data?.realtime || [];
    return data.map((item: any) => ({
      title: item.word || item.note,
      url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word || item.note)}`,
      source: 'weibo',
      hotScore: item.num || 0,
    }));
  } catch (error) {
    console.error('[Weibo] 爬取失败:', error instanceof Error ? error.message : error);
    return [];
  }
}
