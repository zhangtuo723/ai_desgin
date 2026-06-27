export default function Home() {
  const posts = [
    { id: 1, title: "如何构建高效的 React 组件", date: "2024-12-15", category: "前端" },
    { id: 2, title: "Tailwind CSS 实战技巧总结", date: "2024-11-28", category: "CSS" },
    { id: 3, title: "我的 2024 年度技术回顾", date: "2024-11-10", category: "随笔" },
    { id: 4, title: "TypeScript 高级类型体操入门", date: "2024-10-22", category: "前端" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 博主信息 */}
      <div className="bg-white px-5 pt-8 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
            B
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Blogger</h1>
            <p className="text-sm text-gray-500 mt-0.5">前端开发者 · 技术博主</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600 leading-relaxed">
          记录技术成长，分享前端、设计与生活点滴。热爱开源，相信文字的力量。
        </p>
        <div className="mt-5 flex gap-3">
          <span className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">React</span>
          <span className="px-3 py-1 text-xs font-medium bg-purple-50 text-purple-600 rounded-full">TypeScript</span>
          <span className="px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-600 rounded-full">Tailwind</span>
        </div>
      </div>

      {/* 最新文章 */}
      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">最新文章</h2>
          <span className="text-xs text-gray-400">共 {posts.length} 篇</span>
        </div>
        <div className="space-y-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {post.category}
                </span>
                <span className="text-xs text-gray-400">{post.date}</span>
              </div>
              <h3 className="text-base font-semibold text-gray-800 leading-snug">
                {post.title}
              </h3>
            </article>
          ))}
        </div>
        <button className="w-full mt-4 py-3 text-sm font-medium text-gray-600 bg-white rounded-2xl border border-gray-100 active:scale-[0.98] transition-transform">
          查看更多文章
        </button>
      </div>

      {/* 底部 */}
      <div className="text-center py-6 text-xs text-gray-400">
        © 2024 My Blog. All rights reserved.
      </div>
    </div>
  );
}
