import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteBlog } from '@/data/store';
import { ApiResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: '博客ID不能为空' });
  }

  const success = await deleteBlog(id);

  if (!success) {
    return res.status(404).json({ success: false, message: '博客不存在' });
  }

  return res.status(200).json({ success: true, message: '删除成功' });
}
