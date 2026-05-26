import db from '@/lib/db';
import { Blog, User } from '@/types';

export const getUsers = async (): Promise<User[]> => {
  return db.prepare('SELECT id, username, password FROM users').all() as User[];
};

export const getBlogsByAuthor = async (author: string): Promise<Blog[]> => {
  return db.prepare(
    'SELECT id, title, content, author, createdAt FROM blogs WHERE author = ? ORDER BY createdAt DESC'
  ).all(author) as Blog[];
};

export const addBlog = async (blog: Blog): Promise<Blog> => {
  db.prepare(
    'INSERT INTO blogs (id, title, content, author, createdAt) VALUES (?, ?, ?, ?, ?)'
  ).run(blog.id, blog.title, blog.content, blog.author, blog.createdAt);
  return blog;
};

export const deleteBlog = async (id: string): Promise<boolean> => {
  const result = db.prepare('DELETE FROM blogs WHERE id = ?').run(id);
  return result.changes > 0;
};

export const getBlogById = async (id: string): Promise<Blog | null> => {
  return (db.prepare(
    'SELECT id, title, content, author, createdAt FROM blogs WHERE id = ?'
  ).get(id) as Blog) || null;
};

export const updateBlog = async (id: string, title: string, content: string): Promise<boolean> => {
  const result = db.prepare(
    'UPDATE blogs SET title = ?, content = ? WHERE id = ?'
  ).run(title, content, id);
  return result.changes > 0;
};

export const getLatestImage = async (): Promise<{ filename: string; mimetype: string; data: string } | null> => {
  return (db.prepare(
    'SELECT filename, mimetype, data FROM images ORDER BY id DESC LIMIT 1'
  ).get() as { filename: string; mimetype: string; data: string }) || null;
};

export const addUser = async (username: string, password: string): Promise<User> => {
  const id = Date.now().toString();
  db.prepare(
    'INSERT INTO users (id, username, password) VALUES (?, ?, ?)'
  ).run(id, username, password);
  return { id, username, password };
};

export const findUserByUsername = async (username: string): Promise<User | undefined> => {
  return db.prepare(
    'SELECT id, username, password FROM users WHERE username = ?'
  ).get(username) as User | undefined;
};
