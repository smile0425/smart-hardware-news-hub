const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Kimi API 配置
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_API_KEY = process.env.KIMI_API_KEY || '';

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// AI 搜索代理接口
app.post('/api/ai-search', async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: '请输入搜索内容' });
  }
  if (!KIMI_API_KEY) {
    return res.status(500).json({ error: '未配置 KIMI_API_KEY 环境变量' });
  }

  try {
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: '你是AI智能硬件新闻中心的搜索助手。用户会输入关于智能硬件（智能眼镜、AI手机、智能手表、AI PC等）的问题。请用简洁、专业的中文回答，重点关注最新的行业动态和产品信息。回答控制在300字以内。'
          },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Kimi API error:', response.status, errText);
      return res.status(502).json({ error: 'AI 服务暂时不可用，请稍后重试' });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '未获取到回答';
    res.json({ answer });
  } catch (err) {
    console.error('AI search error:', err);
    res.status(500).json({ error: 'AI 搜索出错，请稍后重试' });
  }
});

app.listen(PORT, () => {
  console.log(`服务已启动: http://localhost:${PORT}`);
});
