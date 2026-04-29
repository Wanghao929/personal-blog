'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Tesseract from 'tesseract.js';
import { AuthGuard } from '../hooks/AuthGuard';

interface OcrResult {
  text: string;
  pages: number;
}

function OcrContent() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<'text' | 'scan'>('text');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 释放 Object URL 防止内存泄漏
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') {
      setError('请上传 PDF 文件');
      return;
    }
    setFile(f);
    setError('');
    setOcrResult(null);
    setProgress(0);
    const newUrl = URL.createObjectURL(f);
    setPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return newUrl;
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  // 文字模式：用后端 pdf-parse 提取
  const handleTextMode = async (base64: string) => {
    setProgressLabel('正在提取文字...');
    setProgress(30);
    const token = localStorage.getItem('token')!;
    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ file: base64 })
    });
    const data = await res.json();
    if (data.success) {
      setOcrResult(data.data);
    } else {
      throw new Error(data.message || '提取失败');
    }
  };

  // 扫描模式：前端 pdfjs 渲染图片 + tesseract.js OCR
  const handleScanMode = async (fileData: File) => {
    setProgressLabel('正在加载 PDF...');
    setProgress(5);

    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

    const arrayBuffer = await fileData.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
      setProgressLabel(`正在识别第 ${i}/${numPages} 页...`);
      setProgress(Math.round((i - 1) / numPages * 90) + 5);

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imageDataUrl = canvas.toDataURL('image/png');

      const result = await Tesseract.recognize(imageDataUrl, 'chi_sim+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pageProgress = ((i - 1) + m.progress) / numPages;
            setProgress(Math.round(pageProgress * 90) + 5);
          }
        }
      });

      fullText += result.data.text + '\n\n';
    }

    setOcrResult({ text: fullText.trim(), pages: numPages });
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setOcrResult(null);
    setProgress(0);

    try {
      if (mode === 'text') {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            await handleTextMode(base64);
          } catch (e: any) {
            setError(e.message || '提取失败');
          } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        try {
          await handleScanMode(file);
        } catch (e: any) {
          setError(e.message || '识别失败');
        } finally {
          setLoading(false);
        }
      }
    } catch {
      setError('文件读取失败');
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setOcrResult(null);
    setError('');
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

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
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 border border-white/10"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              PDF 文字识别
            </h1>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            返回首页
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：上传与预览 */}
          <div className="space-y-6">
            {/* 上传区域 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden animate-fade-in">
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  上传 PDF 文件
                </h2>

                {/* 识别模式切换 */}
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setMode('text')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'text'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    文字型 PDF
                  </button>
                  <button
                    onClick={() => setMode('scan')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'scan'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    扫描件 PDF
                  </button>
                </div>

                <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/50 text-xs">
                    {mode === 'text'
                      ? '文字型模式：直接提取 PDF 内嵌文字，速度快'
                      : '扫描件模式：将 PDF 渲染为图片后用 OCR 识别，支持中英文，速度较慢'}
                  </p>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${dragOver
                      ? 'border-indigo-400 bg-indigo-500/10'
                      : 'border-white/20 hover:border-indigo-400/50 hover:bg-white/5'
                    }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-3xl">📄</span>
                  </div>
                  <p className="text-white/70 mb-1">拖拽 PDF 文件到此处，或点击选择</p>
                  <p className="text-white/40 text-sm">支持 .pdf 格式，最大 20MB</p>
                </div>

                {file && (
                  <div className="mt-4 flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">📑</span>
                      <div className="min-w-0">
                        <p className="text-white/90 font-medium truncate">{file.name}</p>
                        <p className="text-white/40 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-white/40 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={!file || loading}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        识别中...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        开始识别
                      </>
                    )}
                  </button>
                  {file && (
                    <button
                      onClick={handleReset}
                      disabled={loading}
                      className="px-5 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/10 disabled:opacity-50"
                    >
                      重置
                    </button>
                  )}
                </div>

                {error && (
                  <div className="mt-4 bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-center border border-red-500/20">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* PDF 预览 */}
            {previewUrl && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden animate-fade-in">
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    PDF 预览
                  </h2>
                  <div className="rounded-lg overflow-hidden border border-white/10 bg-black/30" style={{ height: '500px' }}>
                    <iframe
                      src={previewUrl}
                      className="w-full h-full"
                      title="PDF 预览"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：识别结果 */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden animate-fade-in">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  识别结果
                </h2>
                {ocrResult && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/50">{ocrResult.pages} 页</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(ocrResult.text)}
                      className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 text-sm font-medium rounded-lg hover:bg-indigo-500/30 transition-all duration-300 border border-indigo-500/30 flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      复制
                    </button>
                  </div>
                )}
              </div>

              {/* 进度条 */}
              {loading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/60 text-sm">{progressLabel}</span>
                    <span className="text-indigo-400 text-sm font-medium">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {ocrResult ? (
                <div className="rounded-lg border border-white/10 bg-black/30 p-5 max-h-[700px] overflow-y-auto">
                  <pre className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap break-words font-sans">
                    {ocrResult.text || '（未识别到文字内容）'}
                  </pre>
                </div>
              ) : loading ? (
                <div className="rounded-lg border border-white/10 bg-black/30 p-16 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-white/60">{progressLabel || '正在识别 PDF 内容...'}</p>
                  <p className="text-white/40 text-sm mt-2">
                    {mode === 'scan' ? '扫描件识别较慢，请耐心等待' : '这可能需要几秒到几十秒'}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/30 p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-4xl">🔤</span>
                  </div>
                  <p className="text-white/50">上传 PDF 文件并点击识别后</p>
                  <p className="text-white/50">识别结果将显示在这里</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OcrPage() {
  return (
    <AuthGuard>
      <OcrContent />
    </AuthGuard>
  );
}
