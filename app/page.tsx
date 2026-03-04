"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const Scene = dynamic(() => import("@/components/3d/Scene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-400">加载中...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      {/* 3D 场景背景 */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>

      {/* 内容层 */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {/* 主标题 */}
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white">
            龚力康
          </h1>
          <p className="text-2xl md:text-3xl text-primary font-medium">
            UI/UX Designer
          </p>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            关系设计师 — 在复杂系统中寻找并设计联系
          </p>
        </div>

        {/* CTA 按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/projects"
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-lg"
          >
            查看作品
          </Link>
          <Link
            href="/about"
            className="px-8 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors font-medium text-lg"
          >
            关于我
          </Link>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center text-gray-400">
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
            <span className="text-sm mt-2">向下滚动</span>
          </div>
        </div>
      </div>
    </main>
  );
}
