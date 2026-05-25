'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AuthGuard } from '../hooks/AuthGuard';

function CreateBlogContent() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [uploading, setUploading] = useState(false);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 上传图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('仅支持 JPG、PNG、GIF、WebP 格式');
      return;
    }

    // 验证文件大小 (5MB)
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
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        // 在内容末尾插入 Markdown 图片语法
        const imageMarkdown = `![${file.name}](${data.url})\n`;
        setContent(prev => prev + imageMarkdown);
        // 保存上传后的预览链接
        setLastUploadedUrl(data.url);
      } else {
        alert(data.message || '上传失败');
      }
    } catch {
      alert('上传失败，请稍后重试');
    } finally {
      setUploading(false);
      // 清空 input 以便重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          author: user.username
        })
      });

      const data = await res.json();

      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        alert(data.message || '发表失败');
      }
    } catch {
      alert('发表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 light:from-slate-50 light:via-indigo-50 light:to-white">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 light:bg-indigo-100 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/10 light:bg-purple-100 rounded-full blur-3xl" />
      </div>

      {/* 头部 */}
      <header className="relative z-10 max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/')} 
              className="w-10 h-10 rounded-xl bg-white/10 light:bg-slate-200/80 hover:bg-white/20 light:hover:bg-slate-300/60 flex items-center justify-center transition-all duration-300 border border-white/10 light:border-slate-300"
            >
              <svg className="w-5 h-5 text-white light:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white light:text-slate-800">✍️ 发表博客</h1>
          </div>
        </div>
      </header>

      {/* 表单 */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 pb-12">
        <div className="bg-white/5 light:bg-white light:shadow-md light:border-slate-200 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden animate-fade-in">
          {/* 顶部渐变条 */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 标题输入 */}
              <div>
                <label className="block text-sm font-medium text-white/80 light:text-slate-700 mb-3">
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
                  className="w-full px-5 py-4 bg-white/5 light:bg-slate-100 border-2 border-white/10 light:border-slate-300 rounded-xl text-white light:text-slate-800 placeholder-white/40 light:placeholder-slate-400 focus:border-indigo-500 focus:bg-white/10 light:focus:bg-white outline-none transition-all duration-300 text-lg"
                />
              </div>

              {/* 内容输入 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-white/80 light:text-slate-700">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      博客内容 (Markdown)
                    </span>
                  </label>
                  {/* 模式切换 */}
                  <div className="flex bg-white/5 light:bg-slate-200/80 rounded-lg p-1 border border-white/10 light:border-slate-300">
                    {(['edit', 'split', 'preview'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          mode === m
                            ? 'bg-indigo-500 text-white'
                            : 'text-white/60 light:text-slate-500 hover:text-white light:hover:text-slate-800'
                        }`}
                      >
                        {m === 'edit' ? '编辑' : m === 'split' ? '分栏' : '预览'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 编辑器区域 */}
                <div className={`flex gap-4 ${mode === 'split' ? 'h-[400px]' : 'h-[400px]'}`}>
                  {/* 左侧：编辑区 */}
                  {(mode === 'edit' || mode === 'split') && (
                    <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
                      {/* 工具栏 */}
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
                          className="px-3 py-1.5 bg-indigo-500/20 light:bg-indigo-100 text-indigo-300 light:text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-500/30 light:hover:bg-indigo-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {uploading ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
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
                        <span className="text-xs text-white/30 light:text-slate-400">支持 JPG/PNG/GIF/WebP，最大 5MB</span>
                      </div>
                      {/* 上传后缩略图预览 */}
                      {lastUploadedUrl && (
                        <div className="mb-2">
                          <div className="relative inline-block group">
                            <img
                              src={lastUploadedUrl}
                              alt="已上传图片预览"
                              className="max-h-24 max-w-[200px] rounded-lg border border-white/10 light:border-slate-300 object-cover"
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
                        placeholder={`在这里使用 Markdown 书写...\n\n支持的语法：\n- **粗体**、*斜体*\n- # 标题\n- - 列表\n- [链接](url)\n- \`代码\``}
                        required
                        className="flex-1 w-full px-5 py-4 bg-white/5 light:bg-slate-100 border-2 border-white/10 light:border-slate-300 rounded-xl text-white light:text-slate-800 placeholder-white/40 light:placeholder-slate-400 focus:border-indigo-500 focus:bg-white/10 light:focus:bg-white outline-none transition-all duration-300 resize-none leading-relaxed font-mono text-sm"
                      />
                    </div>
                  )}

                  {/* 右侧：预览区 */}
                  {(mode === 'preview' || mode === 'split') && (
                    <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} bg-white/5 light:bg-slate-100 border-2 border-white/10 light:border-slate-300 rounded-xl overflow-auto`}>
                      {content ? (
                        <div className="p-5 text-sm leading-relaxed prose prose-invert light:prose-slate prose-sm max-w-none
                          prose-pre:bg-black/30 light:prose-pre:bg-slate-200 prose-pre:border prose-pre:border-white/10 light:prose-pre:border-slate-300 prose-pre:rounded-lg
                          prose-code:text-emerald-300 light:prose-code:text-emerald-700 prose-code:before:content-none prose-code:after:content-none
                          prose-headings:text-white light:prose-headings:text-slate-800 prose-a:text-indigo-400 light:prose-a:text-indigo-600
                          prose-strong:text-white light:prose-strong:text-slate-800 prose-li:text-white/80 light:prose-li:text-slate-600
                          prose-ol:text-white/80 light:prose-ol:text-slate-600 prose-ul:text-white/80 light:prose-ul:text-slate-600
                          prose-blockquote:border-indigo-500/50 light:prose-blockquote:border-indigo-300 prose-blockquote:text-white/70 light:prose-blockquote:text-slate-600
                          prose-img:rounded-lg prose-img:shadow-lg">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-white/30 light:text-slate-400 text-sm">
                          预览区域
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 字数统计 */}
              <div className="flex justify-end gap-4">
                <span className="text-sm text-white/40 light:text-slate-400">
                  {content.length} 字
                </span>
                {mode !== 'preview' && (
                  <span className="text-sm text-indigo-400/60">
                    支持 Markdown 语法
                  </span>
                )}
              </div>

              {/* 按钮组 */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="flex-1 px-6 py-3.5 bg-white/10 light:bg-slate-100 text-white light:text-slate-700 font-medium rounded-xl hover:bg-white/20 light:hover:bg-slate-200 transition-all duration-300 border border-white/10 light:border-slate-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !title.trim() || !content.trim()}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      发表中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      发表博客
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 提示卡片 */}
        <div className="mt-6 p-4 bg-indigo-500/10 light:bg-indigo-50 rounded-xl border border-indigo-500/20 light:border-indigo-200 animate-fade-in">
          <p className="text-indigo-300/80 light:text-indigo-700 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            支持 Markdown 语法 + 图片上传：**粗体**、*斜体*、# 标题、- 列表、`代码`、引用、![图片](url)
          </p>
        </div>
      </main>

      {/* 成功弹窗 */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center animate-bounce-in">
            <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/50">
              <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-white mb-2">发表成功!</p>
            <p className="text-white/70 text-sm">正在跳转...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateBlog() {
  return (
    <AuthGuard>
      <CreateBlogContent />
    </AuthGuard>
  );
}
