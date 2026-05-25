'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AuthGuard } from '../hooks/AuthGuard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function AiContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 复制成功提示
  const handleCopy = useCallback(async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {}
  }, []);

  // 停止生成
  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setThinking(false);
    setLoading(false);
  }, []);

  // 发送消息
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError('');
    const userMessage: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setThinking(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = localStorage.getItem('token')!;
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ messages: newMessages }),
        signal: controller.signal
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '请求失败');
      }

      // 流式读取，正确处理跨 chunk 的 SSE 数据
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let firstToken = true;
      let buffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // 最后一段可能不完整，保留到下次处理
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                if (firstToken) {
                  setThinking(false);
                  firstToken = false;
                }
                assistantContent += delta;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
              }
            } catch {
              // 跳过无法解析的行
            }
          }
        }
      }
      setThinking(false);
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // 用户主动中断，不算错误
        setThinking(false);
      } else {
        setError(e.message || '对话失败');
        setThinking(false);
        // 移除残留的空 assistant 消息
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && last.content === '') {
            return prev.slice(0, -1);
          }
          return prev;
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [messages, loading]);

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = () => {
    setError('');
    // 找到最后一条用户消息重新发送
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // 移除最后的 assistant 消息（可能为空或部分内容）
      setMessages(prev => {
        const updated = [...prev];
        while (updated.length && updated[updated.length - 1].role === 'assistant') {
          updated.pop();
        }
        return updated;
      });
      setTimeout(() => sendMessage(lastUserMsg.content), 100);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 light:from-slate-50 light:via-indigo-50 light:to-white flex flex-col">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 light:bg-indigo-100 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 light:bg-purple-100 rounded-full blur-3xl" />
      </div>

      {/* 头部 */}
      <header className="relative z-10 max-w-4xl w-full mx-auto px-6 py-4 flex-shrink-0">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 light:from-emerald-600 light:to-teal-700 bg-clip-text text-transparent">
              AI 助手
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-white/10 light:bg-slate-100 text-white/70 light:text-slate-600 text-sm font-medium rounded-lg hover:bg-white/20 light:hover:bg-slate-200 transition-all duration-300 border border-white/10 light:border-slate-300"
              >
                清空对话
              </button>
            )}
            <Link
              href="/"
              className="px-4 py-2 bg-white/10 light:bg-slate-200/80 text-white light:text-slate-700 font-medium rounded-lg hover:bg-white/20 light:hover:bg-slate-300/60 transition-all duration-300 border border-white/20 light:border-slate-300 text-sm"
            >
              返回首页
            </Link>
          </div>
        </div>
      </header>

      {/* 对话区域 */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-6 flex-1 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 light:from-emerald-100 light:to-teal-100 flex items-center justify-center mb-6 border border-emerald-500/20 light:border-emerald-300">
              <span className="text-5xl">💬</span>
            </div>
            <h2 className="text-2xl font-semibold text-white light:text-slate-800 mb-3">你好，我是 AI 助手</h2>
            <p className="text-white/50 light:text-slate-500 text-center max-w-md mb-8">
              基于通义千问大模型，可以帮你写作、解答问题、头脑风暴等
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
              {[
                { icon: '✍️', text: '帮我写一篇博客' },
                { icon: '💡', text: '给我一些创意灵感' },
                { icon: '📝', text: '帮我润色一段文字' },
                { icon: '🤔', text: '解答我的疑问' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(item.text)}
                  className="p-4 bg-white/5 light:bg-white light:shadow-sm light:border-slate-200 hover:bg-white/10 light:hover:bg-slate-50 rounded-xl border border-white/10 hover:border-emerald-500/30 light:hover:border-emerald-300 transition-all duration-300 text-left group"
                >
                  <span className="text-xl mb-2 block">{item.icon}</span>
                  <span className="text-white/70 light:text-slate-600 text-sm group-hover:text-white/90 light:group-hover:text-slate-800 transition-colors">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeInUp_0.3s_ease-out]`}>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">🤖</span>
                      </div>
                    )}
                    <span className="text-white/40 light:text-slate-400 text-xs">
                      {msg.role === 'user' ? '你' : 'AI 助手'}
                    </span>
                    {/* 复制按钮 - AI 消息且非空 */}
                    {msg.role === 'assistant' && msg.content && (
                      <button
                        onClick={() => handleCopy(msg.content, i)}
                        className="ml-auto opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity text-white/30 light:text-slate-400 hover:text-white/70 light:hover:text-slate-600 p-1"
                        title="复制"
                      >
                        {copiedIdx === i ? (
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl group ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md'
                      : 'bg-white/10 light:bg-slate-100 text-white/90 light:text-slate-700 border border-white/10 light:border-slate-200 rounded-bl-md'
                  }`}>
                    {msg.role === 'assistant' && msg.content === '' && thinking ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-emerald-400/70 text-xs animate-pulse">正在思考中...</span>
                      </div>
                    ) : msg.role === 'assistant' ? (
                      <div className="text-sm leading-relaxed break-words prose prose-invert light:prose-slate prose-sm max-w-none
                        prose-pre:bg-black/30 light:prose-pre:bg-slate-200 prose-pre:border prose-pre:border-white/10 light:prose-pre:border-slate-300 prose-pre:rounded-lg
                        prose-code:text-emerald-300 light:prose-code:text-emerald-700 prose-code:before:content-none prose-code:after:content-none
                        prose-headings:text-white light:prose-headings:text-slate-800 prose-a:text-emerald-400 light:prose-a:text-emerald-600
                        prose-strong:text-white light:prose-strong:text-slate-800 prose-li:text-white/80 light:prose-li:text-slate-600
                        prose-ol:text-white/80 light:prose-ol:text-slate-600 prose-ul:text-white/80 light:prose-ul:text-slate-600
                        prose-blockquote:border-emerald-500/50 light:prose-blockquote:border-emerald-300 prose-blockquote:text-white/70 light:prose-blockquote:text-slate-600">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                        {i === messages.length - 1 && loading && (
                          <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 align-middle animate-[blink_1s_step-end_infinite]" />
                        )}
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* 输入区域 */}
      <div className="relative z-10 max-w-4xl w-full mx-auto px-6 pb-6 flex-shrink-0">
        {error && (
          <div className="mb-3 bg-red-500/10 light:bg-red-50 text-red-400 light:text-red-600 px-4 py-2.5 rounded-lg text-center border border-red-500/20 light:border-red-200 text-sm flex items-center justify-center gap-3">
            <span>{error}</span>
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-500/20 light:bg-red-100 hover:bg-red-500/30 light:hover:bg-red-200 rounded-md text-red-300 light:text-red-600 text-xs font-medium transition-colors"
            >
              重试
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <div className="flex-1 bg-white/5 light:bg-slate-100 backdrop-blur-xl rounded-xl border border-white/10 light:border-slate-300 focus-within:border-emerald-500/50 transition-all duration-300">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题，按 Enter 发送..."
              rows={1}
              className="w-full px-4 py-3 bg-transparent text-white light:text-slate-800 placeholder-white/40 light:placeholder-slate-400 outline-none resize-none text-sm leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          {loading ? (
            <button
              onClick={handleStop}
              className="px-5 py-3 bg-red-500/80 hover:bg-red-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30 flex items-center gap-2 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              停止
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-emerald-500/30 flex items-center gap-2 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-white/30 light:text-slate-400 text-xs mt-2 text-center">
          基于通义千问大模型，回复内容仅供参考
        </p>
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function AiPage() {
  return (
    <AuthGuard>
      <AiContent />
    </AuthGuard>
  );
}
