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

  const prompt = `请搜索最新的AI智能硬件领域新闻，包括智能眼镜、AI手机、智能手表、AI PC等品类。

请返回10条最新新闻，严格按以下JSON数组格式输出，不要输出任何其他内容：
[
  {
    "id": 1,
    "title": "新闻标题",
    "summary": "50字以内的摘要",
    "content": "200字以内的详细内容",
    "category": "分类key",
    "date": "YYYY-MM-DD",
    "source": "来源名称",
    "url": "原始新闻链接"
  }
]

要求：
- category 只能是: smart-glasses, ai-phone, smart-watch, ai-pc, other
- 尽量覆盖所有分类
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
        { role: 'system', content: '你是一个专业的AI智能硬件新闻编辑。请严格按要求的JSON格式输出，不要添加任何markdown标记或额外文字。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4096
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

  fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2), 'utf8');
  console.log(`成功更新 ${news.length} 条新闻到 ${NEWS_FILE}`);
}

fetchLatestNews().catch(err => {
  console.error('更新失败:', err);
  process.exit(1);
});
