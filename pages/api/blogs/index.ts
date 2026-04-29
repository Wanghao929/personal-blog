import type { NextApiRequest, NextApiResponse } from 'next';
import { getBlogs, addBlog } from '@/data/store';
import { ApiResponse, Blog } from '@/types';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Blog[]>>
) {
  if (req.method === 'GET') {
    const blogs = getBlogs();
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

    addBlog(newBlog);
    return res.status(201).json({ success: true, data: [newBlog] });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
