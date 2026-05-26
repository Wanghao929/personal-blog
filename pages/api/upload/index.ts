import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function verifyToken(req: NextApiRequest): { id: string; username: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as { id: string; username: string };
  } catch {
    return null;
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  // JWT 认证
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      req.on('data', (chunk: Buffer) => {
        if (chunks.reduce((sum, c) => sum + c.length, 0) + chunk.length > MAX_FILE_SIZE) {
          reject(new Error('文件过大'));
          return;
        }
        chunks.push(chunk);
      });

      req.on('end', () => {
        try {
          const body = Buffer.concat(chunks);
          
          // 解析 multipart/form-data
          const boundary = req.headers['content-type']?.split('boundary=')[1];
          if (!boundary) {
            reject(new Error('无效的请求格式'));
            return;
          }

          const boundaryBuffer = Buffer.from('--' + boundary);
          
          // 找到文件部分
          let startIndex = body.indexOf(boundaryBuffer);
          if (startIndex === -1) {
            reject(new Error('未找到图片数据'));
            return;
          }

          // 找到 Content-Type 头的位置
          const contentTypeIndex = body.indexOf('Content-Type:', startIndex);
          if (contentTypeIndex === -1) {
            reject(new Error('未找到 Content-Type'));
            return;
          }

          // 解析 mimetype
          const headerSlice = body.slice(contentTypeIndex, body.indexOf(boundaryBuffer, contentTypeIndex));
          const headerStr = headerSlice.toString('utf-8');
          const mimetypeMatch = headerStr.match(/Content-Type:\s*(.+)/i);
          const mimetype = mimetypeMatch?.[1]?.trim() || 'image/jpeg';
          
          if (!ALLOWED_TYPES.includes(mimetype)) {
            reject(new Error('不支持的图片格式'));
            return;
          }

          // 找到头结束后二进制数据的起始位置（\r\n\r\n）
          const headerEndIndex = body.indexOf('\r\n\r\n', contentTypeIndex);
          if (headerEndIndex === -1) {
            reject(new Error('无效的文件格式'));
            return;
          }
          
          const dataStartIndex = headerEndIndex + 4;
          
          // 找到下一个 boundary 作为数据结束
          const nextBoundaryIndex = body.indexOf(boundaryBuffer, dataStartIndex);
          if (nextBoundaryIndex === -1) {
            reject(new Error('未找到文件数据'));
            return;
          }
          
          // 提取二进制图片数据，去掉末尾的 \r\n
          let dataEndIndex = nextBoundaryIndex - 2;
          if (body[dataEndIndex - 1] === 0x0d && body[dataEndIndex] === 0x0a) {
            dataEndIndex -= 2;
          }
          
          const imageBuffer = body.slice(dataStartIndex, dataEndIndex);
          const base64Data = imageBuffer.toString('base64');
          
          const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${mimetype.split('/')[1]}`;
          
          const result = db.prepare(
            'INSERT INTO images (filename, mimetype, data) VALUES (?, ?, ?)'
          ).run(filename, mimetype, base64Data);
          const imageId = result.lastInsertRowid;

          res.status(200).json({ 
            success: true,
            id: imageId,
            url: `/api/upload/image?id=${imageId}`
          });
        } catch (e) {
          reject(e);
        }
      });

      req.on('error', reject);
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || '上传失败' });
  }
}
