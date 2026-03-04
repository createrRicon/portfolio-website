import Link from "next/link";
import { portfolioData } from "@/data/content";
import { notFound } from "next/navigation";

export default function ProjectPage({ params }: { params: { id: string } }) {
  const project = portfolioData.projects.find((p) => p.id === params.id);

  if (!project) {
    notFound();
  }

  const projectIndex = portfolioData.projects.findIndex((p) => p.id === params.id);
  const prevProject = projectIndex > 0 ? portfolioData.projects[projectIndex - 1] : null;
  const nextProject = projectIndex < portfolioData.projects.length - 1
    ? portfolioData.projects[projectIndex + 1]
    : null;

  return (
    <main className="min-h-screen bg-background text-white py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <Link
          href="/projects"
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
          返回列表
        </Link>

        {/* 项目标题 */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {project.trackNumber}
              </span>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {project.title}
              </h1>
              <p className="text-xl text-gray-400">{project.subtitle}</p>
            </div>
          </div>

          {/* 标签和年份 */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-primary/10 rounded-full text-sm text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="text-gray-500">{project.year}</span>
          </div>
        </div>

        {/* 项目概述 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            项目概述
          </h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            {project.overview}
          </p>
        </section>

        {/* 项目背景 */}
        {project.background && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              项目背景
            </h2>
            <div className="space-y-4">
              {project.background.market && (
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">市场背景</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {project.background.market.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {project.background.projectInitiation && (
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">项目立项</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {project.background.projectInitiation.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 设计挑战 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            设计挑战
          </h2>
          <div className="grid gap-4">
            {project.challenges.map((challenge, idx) => (
              <div
                key={idx}
                className="bg-surface border border-white/10 rounded-lg p-4"
              >
                <p className="text-gray-300">{challenge}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 设计策略 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            设计策略
          </h2>
          <div className="space-y-3">
            {project.strategy.map((item, idx) => (
              <div key={idx} className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-300 flex-1">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 设计方案 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </span>
            设计方案
          </h2>
          <div className="space-y-3">
            {project.solution.map((item, idx) => (
              <div key={idx} className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-300 flex-1">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 项目结果 */}
        {project.results && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              项目结果
            </h2>
            <div className="grid gap-3">
              {project.results.map((result, idx) => (
                <div
                  key={idx}
                  className="bg-green-500/5 border border-green-500/20 rounded-lg p-4"
                >
                  <p className="text-gray-300">{result}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 项目复盘 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </span>
            项目复盘
          </h2>

          {project.review.ifAgain && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-yellow-500 mb-3">如果重来</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                {project.review.ifAgain.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-green-500 mb-3">我学到了</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              {project.review.learned.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 项目导航 */}
        <div className="flex justify-between items-center pt-8 border-t border-white/10">
          {prevProject ? (
            <Link
              href={`/projects/${prevProject.id}`}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
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
                <path d="M15 19l-7-7 7-7" />
              </svg>
              <div>
                <div className="text-sm">上一个项目</div>
                <div className="font-medium">{prevProject.title}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextProject ? (
            <Link
              href={`/projects/${nextProject.id}`}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <div className="text-right">
                <div className="text-sm">下一个项目</div>
                <div className="font-medium">{nextProject.title}</div>
              </div>
              <svg
                className="w-5 h-6 ml-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </main>
  );
}
