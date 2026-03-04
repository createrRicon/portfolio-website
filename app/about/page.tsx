import Link from "next/link";
import { portfolioData } from "@/data/content";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-white py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
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

        {/* 页面标题 */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            关于我
          </h1>
          <p className="text-2xl text-gray-400">
            About · Me
          </p>
        </div>

        {/* 基本信息 */}
        <section className="mb-16">
          <div className="bg-surface border border-white/10 rounded-lg p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">{portfolioData.profile.name}</h2>
                <p className="text-xl text-primary mb-4">{portfolioData.profile.nameEn}</p>
                <p className="text-gray-300 mb-2">{portfolioData.profile.title}</p>
                <p className="text-gray-400 mb-4">{portfolioData.profile.experience}</p>
                <p className="text-gray-400">{portfolioData.profile.company}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">教育背景</h3>
                  <p className="text-gray-300">{portfolioData.profile.education}</p>
                </div>

                <div>
                  <h3 className="text-sm text-gray-500 mb-1">联系方式</h3>
                  <div className="space-y-1">
                    <p className="text-gray-300">
                      <span className="text-gray-500">邮箱：</span>
                      {portfolioData.profile.contact.email}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500">电话：</span>
                      {portfolioData.profile.contact.phone}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500">微信：</span>
                      {portfolioData.profile.contact.wechat}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-gray-500 mb-2">掌握技能</h3>
                  <div className="flex flex-wrap gap-2">
                    {portfolioData.profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 设计理念 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">设计理念</h2>

          <div className="bg-surface border border-white/10 rounded-lg p-8 mb-6">
            <p className="text-xl text-gray-300 leading-relaxed">
              {portfolioData.philosophy.tagline}
            </p>
          </div>

          <p className="text-gray-300 mb-8 leading-relaxed">
            {portfolioData.philosophy.description}
          </p>

          <h3 className="text-2xl font-bold mb-4">三个关键词</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {portfolioData.philosophy.keywords.map((keyword, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-lg p-6"
              >
                <h4 className="text-lg font-semibold text-primary mb-2">
                  {keyword.term}
                </h4>
                <p className="text-gray-300">{keyword.description}</p>
              </div>
            ))}
          </div>

          <h3 className="text-2xl font-bold mb-4">设计信条</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-8">
            {portfolioData.philosophy.beliefs.map((belief, idx) => (
              <li key={idx}>{belief}</li>
            ))}
          </ul>

          <h3 className="text-2xl font-bold mb-4">个人特质</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {portfolioData.philosophy.traits.map((trait, idx) => (
              <div
                key={idx}
                className="bg-surface border border-white/10 rounded-lg p-4 text-center"
              >
                <p className="text-gray-300">{trait}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 工作经历 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">工作经历</h2>

          <div className="space-y-6">
            {portfolioData.experience.map((exp, idx) => (
              <div
                key={idx}
                className="bg-surface border border-white/10 rounded-lg p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {exp.company}
                    </h3>
                    <p className="text-primary">{exp.position}</p>
                  </div>
                  <div className="text-gray-500 mt-2 md:mt-0">
                    {exp.period}
                  </div>
                </div>

                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {exp.responsibilities.map((resp, respIdx) => (
                    <li key={respIdx}>{resp}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/projects"
            className="inline-flex items-center px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-lg"
          >
            查看我的作品
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
