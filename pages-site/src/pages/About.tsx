export default function About() {
  const skills = [
    "React", "Vue", "TypeScript", "Node.js", "Tailwind CSS", "Next.js"
  ];

  const experiences = [
    { year: "2022 - 至今", title: "高级前端工程师", company: "某知名互联网公司" },
    { year: "2020 - 2022", title: "前端开发工程师", company: "某科技创业公司" },
    { year: "2018 - 2020", title: "初级前端工程师", company: "某软件外包公司" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部资料卡 */}
      <div className="bg-white px-5 pt-8 pb-6 border-b border-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            B
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Blogger</h1>
          <p className="mt-1 text-sm text-gray-500">热爱代码，更热爱生活</p>
          <div className="mt-4 flex gap-4">
            <a href="#" className="text-sm text-blue-600 font-medium">GitHub</a>
            <a href="#" className="text-sm text-blue-600 font-medium">Twitter</a>
            <a href="#" className="text-sm text-blue-600 font-medium">Email</a>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-5">
        {/* 个人简介 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3">关于我</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            我是一名前端开发者，专注于构建用户体验优秀的 Web 应用。从业 6 年，喜欢钻研新技术，也乐于通过博客分享学习心得。业余时间喜欢摄影、阅读和徒步旅行。
          </p>
        </section>

        {/* 技能标签 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3">技术栈</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* 工作经历 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-4">工作经历</h2>
          <div className="space-y-4">
            {experiences.map((exp, index) => (
              <div key={index} className="relative pl-4 border-l-2 border-blue-100">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-xs text-gray-400">{exp.year}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{exp.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{exp.company}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 底部 */}
      <div className="text-center py-6 text-xs text-gray-400">
        © 2024 My Blog. All rights reserved.
      </div>
    </div>
  );
}