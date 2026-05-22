import pool from '@/lib/db';
import { Blog, User } from '@/types';

export const getUsers = async (): Promise<User[]> => {
  const [rows] = await pool.execute('SELECT id, username, password FROM users');
  return rows as User[];
};


export const getBlogsByAuthor = async (author: string): Promise<Blog[]> => {
  const [rows] = await pool.execute(
    'SELECT id, title, content, author, createdAt FROM blogs WHERE author = ? ORDER BY createdAt DESC',
    [author]
  );
  return rows as Blog[];
};

function toMySQLDatetime(isoStr: string): string {
  return new Date(isoStr).toISOString().slice(0, 19).replace('T', ' ');
}

export const addBlog = async (blog: Blog): Promise<Blog> => {
  await pool.execute(
    'INSERT INTO blogs (id, title, content, author, createdAt) VALUES (?, ?, ?, ?, ?)',
    [blog.id, blog.title, blog.content, blog.author, toMySQLDatetime(blog.createdAt)]
  );
  return blog;
};

export const deleteBlog = async (id: string): Promise<boolean> => {
  const [result] = await pool.execute('DELETE FROM blogs WHERE id = ?', [id]);
  return (result as any).affectedRows > 0;
};

export const getBlogById = async (id: string): Promise<Blog | null> => {
  const [rows] = await pool.execute(
    'SELECT id, title, content, author, createdAt FROM blogs WHERE id = ?',
    [id]
  );
  const blogs = rows as Blog[];
  return blogs.length > 0 ? blogs[0] : null;
};

export const updateBlog = async (id: string, title: string, content: string): Promise<boolean> => {
  const [result] = await pool.execute(
    'UPDATE blogs SET title = ?, content = ? WHERE id = ?',
    [title, content, id]
  );
  return (result as any).affectedRows > 0;
};

export const getLatestImage = async (): Promise<{ filename: string; mimetype: string; data: string } | null> => {
  const [rows] = await pool.execute(
    'SELECT filename, mimetype, data FROM images ORDER BY id DESC LIMIT 1'
  );
  const images = rows as any[];
  return images.length > 0 ? images[0] : null;
};

export const addUser = async (username: string, password: string): Promise<User> => {
  const id = Date.now().toString();
  await pool.execute(
    'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
    [id, username, password]
  );
  return { id, username, password };
};

export const findUserByUsername = async (username: string): Promise<User | undefined> => {
  const [rows] = await pool.execute(
    'SELECT id, username, password FROM users WHERE username = ?',
    [username]
  );
  const users = rows as User[];
  return users[0];
};
