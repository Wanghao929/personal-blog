'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; color: string; tx: number; ty: number }>>([]);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        setShowSuccess(true);

        const newParticles = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          color: ['#667eea', '#764ba2', '#f093fb', '#4fd1c5', '#f6ad55'][Math.floor(Math.random() * 5)],
          tx: (Math.random() - 0.5) * 400,
          ty: (Math.random() - 0.5) * 400
        }));
        setParticles(newParticles);

        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(data.message || '登录失败');
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showSuccess && particles.length > 0) {
      const timer = setTimeout(() => setParticles([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, particles]);

  return (
    <div className="min-h-[calc(100vh-40px)] relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 light:from-slate-50 light:via-indigo-50 light:to-white">
      {/* 动态光效 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_20%_80%,rgba(99,102,241,0.3)_0%,transparent_50%)] animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_80%_20%,rgba(118,75,162,0.3)_0%,transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_40%_40%,rgba(236,72,153,0.15)_0%,transparent_40%)] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* 网格纹理 */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1px)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1px)_1px,transparent_1px)', backgroundSize: '50px 50px' }} />

      {/* 漂浮粒子 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white/60 rounded-full animate-float"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${12 + i}s`
            }}
          />
        ))}
      </div>

      {/* 登录卡片 */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
          {/* 顶部渐变条 */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-shimmer bg-[length:200%_100%]" />

          <div className="p-8">
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-8">
              登录博客
            </h2>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-5 text-center border border-red-200 animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
              >
                <span className={`transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}>
                  登录
                </span>
                {loading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </span>
                )}
              </button>
            </form>

            <p className="text-center mt-5 text-gray-500">
              还没有账号?{' '}
              <Link href="/register" className="text-indigo-500 font-medium hover:text-indigo-600">
                立即注册
              </Link>
            </p>

            <div className="mt-5 p-4 bg-indigo-50/50 rounded-xl text-sm text-gray-600 border border-indigo-100">
              <p className="font-medium text-indigo-600 mb-1">测试账号:</p>
              <p>用户名: admin</p>
              <p>密码: admin123</p>
            </div>
          </div>
        </div>
      </div>

      {/* 成功弹窗*** */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
          {/* 粒子效果 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute w-2.5 h-2.5 rounded-full animate-explode"
                style={{
                  background: p.color,
                  left: '50%',
                  top: '45%',
                  '--tx': `${p.tx}px`,
                  '--ty': `${p.ty}px`
                } as React.CSSProperties}
              />
            ))}
          </div>

          <div className="text-center animate-bounce-in">
            <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50 animate-pulse">
              <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-white mb-2">登录成功!</p>
            <p className="text-white/70 text-sm">正在跳转...</p>
          </div>
        </div>
      )}
    </div>
  );
}
