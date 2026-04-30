import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { findUserByUsername, addUser } from '@/data/store';
import { ApiResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ id: string; username: string }>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码长度不能少于6位' });
  }

  const existingUser = await findUserByUsername(username);
  if (existingUser) {
    return res.status(409).json({ success: false, message: '用户名已存在' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await addUser(username, hashedPassword);

  return res.status(201).json({
    success: true,
    data: { id: user.id, username: user.username }
  });
}
