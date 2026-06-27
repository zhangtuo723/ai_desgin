import { useState } from "react";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);

  const menuItems = [
    { label: "账号与安全", icon: "🔐", arrow: true },
    { label: "隐私设置", icon: "🛡️", arrow: true },
    { label: "通用设置", icon: "⚙️", arrow: true },
    { label: "帮助与反馈", icon: "💬", arrow: true },
    { label: "关于我们", icon: "ℹ️", arrow: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">设置</h1>
        <span className="text-sm text-gray-400">v1.0.0</span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 用户卡片 */}
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
            U
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-gray-900">User</p>
            <p className="text-sm text-gray-500 mt-0.5">user@example.com</p>
          </div>
          <span className="text-gray-300 text-lg">›</span>
        </div>

        {/* 快捷开关 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-lg">🌙</span>
              <span className="text-sm text-gray-800">深色模式</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                darkMode ? "bg-emerald-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  darkMode ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-lg">🔔</span>
              <span className="text-sm text-gray-800">消息通知</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                notifications ? "bg-emerald-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifications ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">▶️</span>
              <span className="text-sm text-gray-800">自动播放</span>
            </div>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                autoPlay ? "bg-emerald-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  autoPlay ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* 菜单列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, index) => (
            <div
              key={item.label}
              className={`px-4 py-3.5 flex items-center justify-between ${
                index !== menuItems.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-gray-800">{item.label}</span>
              </div>
              {item.arrow && <span className="text-gray-300 text-lg">›</span>}
            </div>
          ))}
        </div>

        {/* 退出登录 */}
        <button className="w-full bg-white rounded-2xl py-3.5 text-sm font-medium text-red-500 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
          退出登录
        </button>
      </div>

      {/* 底部 */}
      <div className="text-center py-6 text-xs text-gray-400">
        © 2024 My App. All rights reserved.
      </div>
    </div>
  );
}
