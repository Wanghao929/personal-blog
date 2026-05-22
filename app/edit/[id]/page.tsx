'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AuthGuard } from '../../hooks/AuthGuard';

function EditBlogContent({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [uploading, setUploading] = useState(false);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 加载博客数据
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`/api/blogs/${params.id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setTitle(data.data.title);
          setContent(data.data.content);
        } else {
          alert('博客不存在');
          router.push('/');
        }
      } catch {
        alert('加载失败');
        router.push('/');
      } finally {
        setFetching(false);
      }
    };
    fetchBlog();
  }, [params.id]);

  // 上传图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('仅支持 JPG、PNG、GIF、WebP 格式');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setContent(prev => prev + `![${file.name}](${data.url})\n`);
        setLastUploadedUrl(data.url);
      } else {
        alert(data.message || '上传失败');
      }
    } catch {
      alert('上传失败，请稍后重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/blogs/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });

      const data = await res.json();
      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => router.push('/'), 1500);
      } else {
        alert(data.message || '保存失败');
      }
    } catch {
      alert('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-white/70">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 border border-white/10"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">✏️ 编辑博客</h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 pb-12">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden animate-fade-in">
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    博客标题
                  </span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给博客起个吸引人的标题..."
                  required
                  className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/40 focus:border-amber-500 focus:bg-white/10 outline-none transition-all duration-300 text-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-white/80">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      博客内容 (Markdown)
                    </span>
                  </label>
                  <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    {(['edit', 'split', 'preview'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          mode === m ? 'bg-amber-500 text-white' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {m === 'edit' ? '编辑' : m === 'split' ? '分栏' : '预览'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`flex gap-4 ${mode === 'split' ? 'h-[400px]' : 'h-[400px]'}`}>
                  {(mode === 'edit' || mode === 'split') && (
                    <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-3 py-1.5 bg-amber-500/20 text-amber-300 text-xs font-medium rounded-lg hover:bg-amber-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {uploading ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                              上传中...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              上传图片
                            </>
                          )}
                        </button>
                        <span className="text-xs text-white/30">支持 JPG/PNG/GIF/WebP，最大 5MB</span>
                      </div>
                      {/* 上传后缩略图预览 */}
                      {lastUploadedUrl && (
                        <div className="mb-2">
                          <div className="relative inline-block group">
                            <img
                              src={lastUploadedUrl}
                              alt="已上传图片预览"
                              className="max-h-24 max-w-[200px] rounded-lg border border-white/10 object-cover"
                            />
                            <button
                              onClick={() => setLastUploadedUrl(null)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="在这里使用 Markdown 书写..."
                        required
                        className="flex-1 w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/40 focus:border-amber-500 focus:bg-white/10 outline-none transition-all duration-300 resize-none leading-relaxed font-mono text-sm"
                      />
                    </div>
                  )}

                  {(mode === 'preview' || mode === 'split') && (
                    <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} bg-white/5 border-2 border-white/10 rounded-xl overflow-auto`}>
                      {content ? (
                        <div className="p-5 text-sm leading-relaxed prose prose-invert prose-sm max-w-none
                          prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
                          prose-code:text-emerald-300 prose-code:before:content-none prose-code:after:content-none
                          prose-headings:text-white prose-a:text-amber-400
                          prose-strong:text-white prose-li:text-white/80
                          prose-ol:text-white/80 prose-ul:text-white/80
                          prose-blockquote:border-amber-500/50 prose-blockquote:text-white/70
                          prose-img:rounded-lg prose-img:shadow-lg">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-white/30 text-sm">
                          预览区域
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <span className="text-sm text-white/40">{content.length} 字</span>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="flex-1 px-6 py-3.5 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim() || !content.trim()}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      保存修改
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center animate-bounce-in">
            <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/50">
              <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-white mb-2">保存成功!</p>
            <p className="text-white/70 text-sm">正在跳转...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditBlog({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <EditBlogContent params={params} />
    </AuthGuard>
  );
}
