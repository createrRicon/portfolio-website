import Link from "next/link";
import { portfolioData } from "@/data/content";

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-background text-white py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-16">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            返回首页
          </Link>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            作品集
          </h1>
          <p className="text-xl text-gray-400">
            Track List · 项目列表
          </p>
        </div>

        {/* 项目列表 */}
        <div className="space-y-6">
          {portfolioData.projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block group"
            >
              <div className="relative bg-surface border border-white/10 rounded-lg p-6 hover:border-primary/50 transition-all hover:transform hover:scale-[1.02]">
                {/* Track 编号 */}
                <div className="absolute top-6 right-6 text-6xl font-bold text-white/5 group-hover:text-primary/20 transition-colors">
                  {project.trackNumber}
                </div>

                {/* 播放图标 */}
                <div className="absolute top-6 left-6 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg
                    className="w-5 h-5 text-primary ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>

                {/* 项目信息 */}
                <div className="ml-16">
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h2>
                  <p className="text-lg text-gray-400 mb-3">
                    {project.subtitle}
                  </p>
                  <p className="text-gray-300 mb-4">
                    {project.description}
                  </p>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-300 group-hover:bg-white/10 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 年份 */}
                <div className="absolute bottom-6 right-6 text-sm text-gray-500">
                  {project.year}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 底部信息 */}
        <div className="mt-20 text-center text-gray-500">
          <p>更多项目持续更新中...</p>
        </div>
      </div>
    </main>
  );
}
