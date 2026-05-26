import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getBlogsByAuthor, addBlog } from '@/data/store';
import { ApiResponse, Blog } from '@/types';
import db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function getUserFromToken(req: NextApiRequest): { id: string; username: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as { id: string; username: string };
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Blog[]>>
) {
  if (req.method === 'GET') {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(200).json({ success: true, data: [] });
    }
    const blogs = await getBlogsByAuthor(user.username);
    return res.status(200).json({ success: true, data: blogs });
  }

  if (req.method === 'POST') {
    const { title, content, author } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    }

    try {
      // 检查是否有新上传的图片，如果有则将 Markdown 图片链接替换为实际 base64 数据
      let processedContent = content;
      const imageMarker = '/api/upload/image?id=';
      if (content.includes(imageMarker)) {
        const idMatches = content.match(new RegExp(`${imageMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)`, 'g'));
        if (idMatches) {
          for (const match of idMatches) {
            const imgId = match.split('=')[1];
            const image = db.prepare(
              'SELECT mimetype, data FROM images WHERE id = ?'
            ).get(Number(imgId)) as { mimetype: string; data: string } | undefined;
            if (image) {
              processedContent = processedContent.replace(
                match,
                `data:${image.mimetype};base64,${image.data}`
              );
            }
          }
        }
      }

      const newBlog: Blog = {
        id: Date.now().toString(),
        title,
        content: processedContent,
        author: author || '匿名',
        createdAt: new Date().toISOString()
      };
      await addBlog(newBlog);
      return res.status(201).json({ success: true, data: [newBlog] });
    } catch (err: any) {
      console.error('发表博客失败:', err);
      return res.status(500).json({ success: false, message: '保存失败，请稍后重试' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
