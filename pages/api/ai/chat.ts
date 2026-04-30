import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  // JWT 认证
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  try {
    jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Token 无效' });
  }

  if (!QWEN_API_KEY) {
    return res.status(500).json({ success: false, message: '未配置 QWEN_API_KEY' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: '消息不能为空' });
  }

  // 消息大小限制
  const totalChars = messages.reduce((sum: number, m: any) => sum + (m.content?.length || 0), 0);
  if (totalChars > 10000) {
    return res.status(400).json({ success: false, message: '消息内容过长，请缩短后重试' });
  }

  try {
    const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Qwen API error:', response.status, errText);
      return res.status(response.status).json({ success: false, message: 'AI 服务请求失败' });
    }

    // 流式转发
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
    } catch (e) {
      console.error('Stream read error:', e);
    }

    res.end();
  } catch (error: any) {
    console.error('AI chat error:', error);
    return res.status(500).json({ success: false, message: 'AI 服务异常' });
  }
}
