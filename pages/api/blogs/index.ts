import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getBlogsByAuthor, addBlog } from '@/data/store';
import { ApiResponse, Blog } from '@/types';

const JWT_SECRET = 'your-secret-key-change-in-production';

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

    const newBlog: Blog = {
      id: Date.now().toString(),
      title,
      content,
      author: author || '匿名',
      createdAt: new Date().toISOString()
    };
    await addBlog(newBlog);
    return res.status(201).json({ success: true, data: [newBlog] });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
