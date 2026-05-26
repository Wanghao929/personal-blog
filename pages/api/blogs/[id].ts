import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { deleteBlog, getBlogById, updateBlog } from '@/data/store';
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
  res: NextApiResponse<ApiResponse<Blog | null>>
) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: '博客ID不能为空' });
  }

  // GET - 获取单篇博客
  if (req.method === 'GET') {
    const blog = await getBlogById(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: '博客不存在' });
    }
    return res.status(200).json({ success: true, data: blog });
  }

  // PUT - 更新博客
  if (req.method === 'PUT') {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    }

    const blog = await getBlogById(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: '博客不存在' });
    }
    if (blog.author !== user.username) {
      return res.status(403).json({ success: false, message: '无权编辑此博客' });
    }

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

    try {
      await updateBlog(id, title, processedContent);
      return res.status(200).json({ success: true, message: '更新成功' });
    } catch (err: any) {
      console.error('更新博客失败:', err);
      return res.status(500).json({ success: false, message: '保存失败，请稍后重试' });
    }
  }

  // DELETE - 删除博客
  if (req.method === 'DELETE') {
    const success = await deleteBlog(id);
    if (!success) {
      return res.status(404).json({ success: false, message: '博客不存在' });
    }
    return res.status(200).json({ success: true, message: '删除成功' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
