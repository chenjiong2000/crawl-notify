import axios from 'axios';
import type { RawItem } from '../types.js';

export async function fetchReddit(): Promise<RawItem[]> {
  try {
    const response = await axios.get('https://www.reddit.com/r/popular/hot.json?limit=30', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const posts = response.data?.data?.children || [];
    return posts.map((post: any) => ({
      title: post.data?.title || '',
      url: post.data?.url?.startsWith('/r/') 
        ? `https://www.reddit.com${post.data.url}` 
        : (post.data?.url || ''),
      source: 'reddit',
      hotScore: post.data?.score || 0,
    }));
  } catch (error) {
    console.error('[Reddit] 爬取失败:', error instanceof Error ? error.message : error);
    return [];
  }
}
