'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string | null; title: string }>({ show: false, id: null, title: '' });
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
      setUsername(JSON.parse(user).username);
    }
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/blogs');
      const data = await res.json();
      if (data.success) {
        setBlogs(data.data);
      }
    } catch (error) {
      console.error('获取博客失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteModal({ show: true, id, title });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/blogs/${deleteModal.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchBlogs();
        setDeleteModal({ show: false, id: null, title: '' });
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    router.push('/login');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-white/70 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* 头部 */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">📝</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              个人博客
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white/90 font-medium">欢迎，{username}</span>
                </div>
                <Link 
                  href="/create" 
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-indigo-500/30"
                >
                  发表博客
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="px-5 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  退出
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-indigo-500/30"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">博客列表</h2>
          <p className="text-white/60">发现精彩内容，分享你的故事</p>
        </div>

        {blogs.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-16 text-center animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-5xl">📭</span>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">暂无博客</h3>
            <p className="text-white/60 mb-6">还没有人发表博客，快来成为第一个吧！</p>
            {isLoggedIn && (
              <Link 
                href="/create" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-indigo-500/30"
              >
                <span>✏️</span> 发表博客
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, index) => (
              <div 
                key={blog.id} 
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-white/60 mb-4 line-clamp-3 leading-relaxed">
                    {blog.content}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 flex items-center justify-center">
                        <span className="text-sm">👤</span>
                      </div>
                      <div>
                        <p className="text-white/90 text-sm font-medium">{blog.author}</p>
                        <p className="text-white/40 text-xs">{formatDate(blog.createdAt)}</p>
                      </div>
                    </div>
                    
                    {isLoggedIn && username === blog.author && (
                      <button
                        onClick={() => handleDeleteClick(blog.id, blog.title)}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-all duration-300 border border-red-500/30"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 卡片顶部渐变装饰 */}
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 删除确认弹窗 */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 w-full max-w-md animate-bounce-in">
            {/* 图标 */}
            <div className="pt-8 pb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            
            {/* 内容 */}
            <div className="px-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">确认删除</h3>
              <p className="text-white/60 mb-2">确定要删除这篇博客吗？</p>
              <p className="text-indigo-400 font-medium truncate">"{deleteModal.title}"</p>
              <p className="text-red-400/60 text-sm mt-2">此操作无法撤销</p>
            </div>
            
            {/* 按钮 */}
            <div className="p-6 flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, id: null, title: '' })}
                disabled={deleting}
                className="flex-1 px-5 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    删除中...
                  </>
                ) : (
                  '确认删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
