const SidePanel = () => (
  <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-sky-50 to-emerald-100 p-8 shadow-soft">
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold text-slate-900">
        Elevate your learning experience.
      </h1>
      <p className="text-sm text-slate-600 sm:text-base">
        Access world-class resources, track your progress, and join a community of lifelong learners.
      </p>
    </div>

    <div className="mt-8 overflow-hidden rounded-2xl bg-teal-700 p-6 shadow-lg">
      <div className="flex items-center justify-center">
        <img
          src="/images/learning-illustration.png"
          alt="Learning together"
          className="h-72 w-full rounded-xl object-cover"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextElementSibling.style.display = 'flex'
          }}
        />
        <div className="hidden h-64 w-full items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white">
          <div className="text-center">
            <p className="text-sm opacity-75">Learning illustration</p>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-6 text-xs text-slate-600">
      Start your journey to success today
    </div>
  </div>
)

export default SidePanel
