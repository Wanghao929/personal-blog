import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: '缺少图片ID' });
  }

  try {
    const pool = require('@/lib/db').default;
    const [rows] = await pool.execute(
      'SELECT filename, mimetype, data FROM images WHERE id = ?',
      [Number(id)]
    );
    
    const images = rows as any[];
    if (images.length === 0) {
      // 如果没有找到对应 ID，返回最新图片作为兜底
      const [latest] = await pool.execute(
        'SELECT filename, mimetype, data FROM images ORDER BY id DESC LIMIT 1'
      );
      const latestImages = latest as any[];
      if (latestImages.length === 0) {
        return res.status(404).json({ error: '图片不存在' });
      }
      const image = latestImages[0];
      const buffer = Buffer.from(image.data, 'base64');
      res.setHeader('Content-Type', image.mimetype);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.send(buffer);
    }

    const image = images[0];
    const buffer = Buffer.from(image.data, 'base64');
    
    res.setHeader('Content-Type', image.mimetype);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: '获取图片失败' });
  }
}
