export default function Login() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* 头部 */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">欢迎登录</h1>
          <p className="text-sm text-gray-500">请使用账号密码登录博客后台</p>
        </div>

        {/* 表单 */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">账号</label>
            <input
              type="text"
              placeholder="请输入邮箱或用户名"
              className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              记住我
            </label>
            <a href="#" className="text-blue-600 hover:text-blue-700">忘记密码？</a>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
          >
            登 录
          </button>
        </form>

        {/* 分割线 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-gray-400">其他方式</span>
          </div>
        </div>

        {/* 第三方登录 */}
        <div className="flex justify-center gap-4">
          <button className="w-11 h-11 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center active:scale-95 transition-transform">
            <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.49.49 0 01.177-.554C23.016 18.115 24 16.405 24 14.479c0-3.197-3.098-5.621-7.062-5.621zm-2.36 2.63c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.72 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
            </svg>
          </button>
          <button className="w-11 h-11 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center active:scale-95 transition-transform">
            <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.72 2.03C5.436 2.03 0 7.168 0 13.55c0 3.944 2.114 7.442 5.392 9.63.232.16.37.424.37.706 0 .19-.09.37-.23.49-.75.62-2.04 1.72-2.04 1.72a.49.49 0 00-.13.33c0 .27.22.49.49.49.13 0 .25-.05.34-.14l2.36-2.04c.18-.15.41-.23.65-.2 1.48.21 2.99.26 4.5.26 6.284 0 11.72-5.138 11.72-11.52S18.004 2.03 11.72 2.03zm4.47 6.98c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4.47 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4.47 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
            </svg>
          </button>
        </div>

        <p className="text-center text-xs text-gray-500">
          还没有账号？
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">立即注册</a>
        </p>
      </div>
    </div>
  );
}
