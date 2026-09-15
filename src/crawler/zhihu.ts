import axios from 'axios';
import type { RawItem } from '../types.js';

export async function fetchZhihu(): Promise<RawItem[]> {
  try {
    // 使用知乎热榜的备用接口
    const response = await axios.get('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=30', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'x-requested-with': 'fetch',
      },
    });

    const data = response.data?.data || [];
    return data.map((item: any) => ({
      title: item.target?.title || '',
      url: item.target?.id ? `https://www.zhihu.com/question/${item.target.id}` : '',
      source: 'zhihu',
      hotScore: item.detail_text ? parseInt(item.detail_text.replace(/[^\d]/g, '')) : 0,
    })).filter((item: RawItem) => item.title);
  } catch (error) {
    console.error('[Zhihu] 爬取失败:', error instanceof Error ? error.message : error);
    return [];
  }
}
