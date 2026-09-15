import axios from 'axios';
import { config } from '../config.js';
import type { Item, LLMResponse } from '../types.js';

export async function processWithLLM(items: Item[]): Promise<LLMResponse> {
  if (items.length === 0) {
    return { items: [], speechText: '今日暂无热点资讯。' };
  }

  // 限制最多处理30条，避免超时
  const limitedItems = items.slice(0, 30);
  console.log(`[LLM] 处理 ${limitedItems.length} 条（共 ${items.length} 条，限制30条）`);

  const categories = config.categories.join(', ');
  const itemsText = limitedItems.map((item, i) => 
    `${i + 1}. [${item.source}] ${item.title}`
  ).join('\n');

  const prompt = `你是一个资讯编辑。以下是今天的热点资讯标题列表：

${itemsText}

请完成以下任务：
1. 为每条资讯生成中文摘要（50-100字），口语化表达，适合朗读
2. 将每条资讯分类到以下领域之一：${categories}
3. 生成一段综合朗读稿（speechText），要求：
   - 开头问候："大家好，以下是${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}的热点资讯"
   - 按领域分组，组间有自然过渡
   - 口语化，避免括号、斜杠等符号
   - 500-800字，约2-3分钟朗读量
   - 结尾："以上就是今天的热点资讯，感谢收听"
4. 为每个有内容的领域生成专属朗读稿（categorySpeechTexts），格式：
   - key 是领域名（如 "ai", "tech", "finance"）
   - value 是该领域的朗读稿（150-300字，开头说明领域，结尾简短收尾）

请以JSON格式返回：
{
  "items": [
    { "title": "原始标题", "summary": "摘要内容", "category": "领域" }
  ],
  "speechText": "综合朗读稿",
  "categorySpeechTexts": {
    "ai": "AI领域朗读稿",
    "tech": "科技领域朗读稿"
  }
}`;

  try {
    const response = await axios.post(
      `${config.llmApiBase}/chat/completions`,
      {
        model: config.llmModel,
        messages: [
          { role: 'system', content: '你是一个专业的资讯编辑，擅长总结和分析热点新闻。请始终以JSON格式返回结果。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.llmApiKey}`,
        },
        timeout: 120000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    
    // 提取 JSON（可能被 markdown 代码块包裹）
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    
    const result = JSON.parse(jsonStr) as LLMResponse;
    return result;
  } catch (error) {
    console.error('[LLM] 处理失败:', error instanceof Error ? error.message : error);
    // 返回默认结果
    return {
      items: limitedItems.map(item => ({
        title: item.title,
        summary: item.title,
        category: 'tech',
      })),
      speechText: `今日共有${limitedItems.length}条热点资讯，但LLM处理失败，请稍后重试。`,
    };
  }
}
