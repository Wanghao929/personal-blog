import { Blog, User } from '@/types';

const users: User[] = [
  { id: '1', username: 'admin', password: '$2a$10$8K1p/a0dL1LXMIgoEDFrgOBkP8f0yCkpIzrF6Io7rD0kHsLcVF8S2' }
];

const blogs: Blog[] = [
  {
    id: '1',
    title: '欢迎来到我的博客',
    content: '这是我的第一篇博客文章，欢迎大家来访！',
    author: 'admin',
    createdAt: new Date().toISOString()
  }
];

export const getUsers = () => users;
export const getBlogs = () => blogs;

export const addBlog = (blog: Blog) => {
  blogs.unshift(blog);
  return blog;
};

export const deleteBlog = (id: string) => {
  const index = blogs.findIndex(b => b.id === id);
  if (index !== -1) {
    blogs.splice(index, 1);
    return true;
  }
  return false;
};

export const findUserByUsername = (username: string) => {
  return users.find(u => u.username === username);
};
