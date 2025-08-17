export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50 font-inter text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md shadow-gray-200 p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-6">🌿 Leave System</h1>

        <nav className="space-y-2">
          <a
            href="#"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            📊 <span>Dashboard</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            📝 <span>Apply Leave</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            📅 <span>Calendar</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            ✅ <span>Approvals</span>
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">📊 Dashboard</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <img
              src="https://i.pravatar.cc/40"
              alt="Profile"
              className="w-10 h-10 rounded-full border border-gray-300"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md shadow-gray-200 p-6">
            <h3 className="text-gray-500 text-sm">My Leaves</h3>
            <p className="text-2xl font-semibold">1</p>
          </div>
          <div className="bg-white rounded-xl shadow-md shadow-gray-200 p-6">
            <h3 className="text-gray-500 text-sm">Pending</h3>
            <p className="text-2xl font-semibold">0</p>
          </div>
          <div className="bg-white rounded-xl shadow-md shadow-gray-200 p-6">
            <h3 className="text-gray-500 text-sm">Approved</h3>
            <p className="text-2xl font-semibold">1</p>
          </div>
        </div>

        {/* Apply Leave + Calendar */}
        <div className="grid grid-cols-2 gap-6">
          {/* Apply Leave Form */}
          <div className="bg-white rounded-xl shadow-md shadow-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">📝 Apply Leave</h3>
            <form className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400">
                <option>Annual</option>
                <option>Sick</option>
                <option>Unpaid</option>
              </select>
              <input
                type="text"
                placeholder="Reason (optional)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
              <button className="w-full py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition">
                Submit
              </button>
            </form>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-md shadow-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">📅 Calendar</h3>
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="font-medium text-gray-500">
                  {d}
                </div>
              ))}
              {Array.from({ length: 31 }, (_, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg hover:bg-blue-50 cursor-pointer"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Leaves Section */}
        <div className="bg-white rounded-xl shadow-md shadow-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">📋 My Leaves</h3>
          <div className="flex justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <span>Annual Leave · 18/08/2025 → 19/08/2025</span>
            <span className="text-green-600 font-medium">Approved</span>
          </div>
        </div>
      </main>
    </div>
  )
}
