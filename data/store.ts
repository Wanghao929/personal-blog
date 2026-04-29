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
