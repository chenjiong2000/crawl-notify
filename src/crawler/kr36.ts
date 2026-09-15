import axios from 'axios';
import * as cheerio from 'cheerio';
import type { RawItem } from '../types.js';

export async function fetchKr36(): Promise<RawItem[]> {
  try {
    // 尝试36氪的API接口
    const response = await axios.get('https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const data = response.data?.data?.hotRankList || [];
    return data.map((item: any) => ({
      title: item.templateMaterial?.widgetTitle || item.templateMaterial?.summary || '',
      url: item.templateMaterial?.url || `https://36kr.com/p/${item.itemId}`,
      source: '36kr',
      hotScore: item.templateMaterial?.hotScore || 0,
    })).filter((item: RawItem) => item.title);
  } catch (error) {
    console.error('[36Kr] 爬取失败:', error instanceof Error ? error.message : error);
    return [];
  }
}
