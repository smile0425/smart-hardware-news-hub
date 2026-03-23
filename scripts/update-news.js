/**
 * 自动更新新闻数据脚本
 * 通过 Kimi API + 联网搜索获取最新 AI 智能硬件新闻并更新 news.json
 */

const fs = require('fs');
const path = require('path');

const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_API_KEY = process.env.KIMI_API_KEY;
const NEWS_FILE = path.join(__dirname, '..', 'data', 'news.json');

async function chat(messages, tools) {
  const body = {
    model: 'moonshot-v1-128k',
    messages,
    temperature: 0.3,
    max_tokens: 8192
  };
  if (tools) body.tools = tools;

  const resp = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`API 调用失败: ${resp.status} ${err}`);
  }
  return resp.json();
}

async function fetchLatestNews() {
  if (!KIMI_API_KEY) {
    console.error('未设置 KIMI_API_KEY 环境变量');
    process.exit(1);
  }

  const today = new Date().toISOString().split('T')[0];


  const systemMsg = '你是一个专业的AI智能硬件和嵌入式技术新闻编辑。请使用联网搜索功能查找真实的最新新闻，确保新闻内容、来源和URL都是真实可访问的。请严格按要求的JSON格式输出，不要添加任何markdown标记或额外文字。如果无法确认某条新闻的真实URL，url字段填空字符串。';

  const prompt = `请通过联网搜索，查找最新的AI智能硬件领域真实新闻和动态。搜索范围应包括但不限于：科技新闻网站（36kr、极客公园、The Verge、TechCrunch等）、Reddit（r/hardware、r/embedded、r/RTOS等）、Twitter/X上的科技博主动态、小红书上的智能硬件评测、GitHub上的开源项目动态、以及各厂商官方新闻页面。

需要覆盖以下8个分类，每个分类至少1-2条，共返回15条最新新闻：

1. smart-glasses（智能眼镜）：智能眼镜产品、技术动态
2. ai-phone（AI手机）：AI手机产品、功能更新
3. smart-watch（智能手表）：智能手表产品、健康监测技术
4. ai-pc（AI PC）：AI PC产品、芯片技术
5. competitor（竞品动态）：重点关注 Rokid、夸克、华为、苹果、光帆科技 的最新产品和战略动态
6. rtos（RTOS操作系统）：重点关注 Zephyr、FreeRTOS、Linux、RT-Thread、NuttX、OpenVela 等嵌入式/实时操作系统的最新版本发布、技术更新、社区动态
7. ai-ecosystem（AI应用生态）：重点关注 通义千问、火山引擎/豆包、涂鸦智能、小智AI 等AI平台和应用的最新动态、API更新、生态合作
8. other（其他）：其他智能硬件相关新闻

严格按以下JSON数组格式输出，不要输出任何其他内容：
[
  {
    "id": 1,
    "title": "新闻标题",
    "summary": "150-200字的关键摘要，需涵盖核心信息和关键细节",
    "content": "300字以内的详细内容",
    "category": "分类key",
    "date": "YYYY-MM-DD",
    "source": "来源名称",
    "url": "从搜索结果中获取的真实新闻链接"
  }
]

要求：
- category 只能是: smart-glasses, ai-phone, smart-watch, ai-pc, competitor, rtos, ai-ecosystem, other
- 尽量覆盖所有8个分类
- date 必须使用新闻的原始发布日期，不是搜索日期。今天是 ${today}，请搜索最近一周内的新闻
- url 请使用联网搜索找到的真实链接，不要编造URL，找不到就填空字符串""
- 只输出JSON数组，不要有其他文字`;

  // 启用 Kimi 内置联网搜索工具
  const tools = [
    {
      type: 'builtin_function',
      function: { name: '$web_search' }
    }
  ];

  const messages = [
    { role: 'system', content: systemMsg },
    { role: 'user', content: prompt }
  ];

  console.log('正在通过 Kimi API + 联网搜索获取最新新闻...');

  // 循环处理 tool_calls
  let maxRounds = 10;
  while (maxRounds-- > 0) {
    const data = await chat(messages, tools);
    const choice = data.choices[0];

    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      // 模型要求执行联网搜索
      messages.push(choice.message);
      for (const tc of choice.message.tool_calls) {
        console.log(`执行联网搜索: ${tc.function.name}`);
        // 对于 $web_search，原封不动返回 arguments
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: tc.function.name,
          content: tc.function.arguments
        });
      }
      continue;
    }

    // 模型返回最终结果
    let content = choice.message.content.trim();
    content = content.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');

    let news;
    try {
      news = JSON.parse(content);
    } catch (e) {
      console.error('JSON 解析失败:', e.message);
      console.error('原始内容:', content.substring(0, 500));
      process.exit(1);
    }

    if (!Array.isArray(news) || news.length === 0) {
      console.error('返回数据不是有效的新闻数组');
      process.exit(1);
    }

    news.forEach((item, i) => { item.id = i + 1; });

    const output = { updatedAt: new Date().toISOString(), news };
    fs.writeFileSync(NEWS_FILE, JSON.stringify(output, null, 2), 'utf8');
    console.log(`成功更新 ${news.length} 条新闻到 ${NEWS_FILE}`);
    return;
  }

  console.error('超过最大轮次，联网搜索未完成');
  process.exit(1);
}

fetchLatestNews().catch(err => {
  console.error('更新失败:', err);
  process.exit(1);
});

