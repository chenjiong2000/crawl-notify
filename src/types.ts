// 爬虫返回的原始条目
export interface RawItem {
  title: string;
  url: string;
  source: string;
  hotScore?: number;
}

// 数据库中的完整条目
export interface Item {
  id: number;
  title: string;
  url: string | null;
  source: string;
  hot_score: number | null;
  summary: string | null;
  category: string | null;
  crawl_date: string;
  created_at: string;
}

// 输出 JSON 中的条目
export interface OutputItem {
  title: string;
  summary: string;
  category: string;
  source: string;
  url: string;
}

// 输出 JSON 格式
export interface OutputJSON {
  date: string;
  updatedAt: string;
  category?: string;
  speechText: string;
  items: OutputItem[];
}

// LLM 处理后的结果
export interface LLMResult {
  title: string;
  summary: string;
  category: string;
}

// LLM 返回的完整响应
export interface LLMResponse {
  items: LLMResult[];
  speechText: string;
  categorySpeechTexts?: Record<string, string>;
}
