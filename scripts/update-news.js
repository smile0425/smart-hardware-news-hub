/**
 * 自动更新新闻数据脚本
 * 通过 Kimi API 搜索最新 AI 智能硬件新闻并更新 news.json
 */

const fs = require('fs');
const path = require('path');

const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_API_KEY = process.env.KIMI_API_KEY;
const NEWS_FILE = path.join(__dirname, '..', 'data', 'news.json');

async function fetchLatestNews() {
  if (!KIMI_API_KEY) {
    console.error('未设置 KIMI_API_KEY 环境变量');
    process.exit(1);
  }

  const today = new Date().toISOString().split('T')[0];

  const prompt = `请搜索最新的AI智能硬件领域新闻和动态。

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
    "url": "原始新闻链接"
  }
]

要求：
- category 只能是: smart-glasses, ai-phone, smart-watch, ai-pc, competitor, rtos, ai-ecosystem, other
- 尽量覆盖所有8个分类
- date 使用最近的真实日期，今天是 ${today}
- url 必须是真实可访问的新闻链接
- 只输出JSON数组，不要有其他文字`;

  console.log('正在通过 Kimi API 获取最新新闻...');

  const resp = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'moonshot-v1-32k',
      messages: [
        { role: 'system', content: '你是一个专业的AI智能硬件和嵌入式技术新闻编辑。请严格按要求的JSON格式输出，不要添加任何markdown标记或额外文字。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 8192
    })
  });


  if (!resp.ok) {
    const err = await resp.text();
    console.error('Kimi API 调用失败:', resp.status, err);
    process.exit(1);
  }

  const data = await resp.json();
  let content = data.choices[0].message.content.trim();

  // 清理可能的 markdown 代码块标记
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

  // 重新编号
  news.forEach((item, i) => { item.id = i + 1; });

  const output = { updatedAt: new Date().toISOString(), news: news };
  fs.writeFileSync(NEWS_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`成功更新 ${news.length} 条新闻到 ${NEWS_FILE}`);
}

fetchLatestNews().catch(err => {
  console.error('更新失败:', err);
  process.exit(1);
});
