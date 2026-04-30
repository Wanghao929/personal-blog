import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { PDFParse } from 'pdf-parse';
import { ApiResponse } from '@/types';

const JWT_SECRET = 'your-secret-key-change-in-production';
const MAX_BUFFER_SIZE = 20 * 1024 * 1024; // 20MB
const OCR_TIMEOUT_MS = 60_000; // 60秒超时

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

function getUserFromToken(req: NextApiRequest): { id: string; username: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as { id: string; username: string };
  } catch {
    return null;
  }
}

function isValidBase64(str: string): boolean {
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('PDF解析超时，请尝试较小的文件')), ms)
    ),
  ]);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ text: string; pages: number }>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 认证校验
  const user = getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  try {
    const { file } = req.body;

    if (!file || typeof file !== 'string') {
      return res.status(400).json({ success: false, message: '请提供PDF文件数据' });
    }

    // 校验 base64 格式
    if (!isValidBase64(file)) {
      return res.status(400).json({ success: false, message: '文件数据格式错误' });
    }

    const buffer = Buffer.from(file, 'base64');

    // 二次校验解码后大小
    if (buffer.length > MAX_BUFFER_SIZE) {
      return res.status(400).json({ success: false, message: '文件大小超过20MB限制' });
    }

    if (buffer.length === 0) {
      return res.status(400).json({ success: false, message: '文件内容为空' });
    }

    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await withTimeout(parser.getText(), OCR_TIMEOUT_MS);

    return res.status(200).json({
      success: true,
      data: {
        text: textResult.text,
        pages: textResult.total
      }
    });
  } catch (error) {
    const message = error instanceof Error && error.message.includes('超时')
      ? error.message
      : 'PDF解析失败，请确认文件格式正确';
    console.error('PDF解析失败:', error);
    return res.status(500).json({ success: false, message });
  }
}
