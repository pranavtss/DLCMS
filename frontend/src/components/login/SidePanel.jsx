const SidePanel = () => (
  <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-sky-50 to-emerald-100 p-8 shadow-soft">
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold text-slate-900">
        Elevate your learning
        <span className="block">experience.</span>
      </h1>
      <p className="text-sm text-slate-600 sm:text-base">
        Access world-class resources, track your progress, and join a community of lifelong learners.
      </p>
    </div>

    <div className="mt-8 overflow-hidden rounded-2xl bg-teal-700 p-6 shadow-lg">
      <div className="flex items-center justify-center">
        <img
          src="/learning-illustration.png"
          alt="Learning together"
          className="h-auto w-full max-w-md rounded-xl object-cover"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextElementSibling.style.display = 'flex'
          }}
        />
        <div className="hidden h-64 w-full items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white">
          <div className="text-center">
            <p className="text-sm opacity-75">Place your image at:</p>
            <p className="font-semibold">/public/learning-illustration.png</p>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-6 flex items-center gap-3 text-xs text-slate-600">
      <div className="flex -space-x-2">
        {["A", "B", "C"].map((letter) => (
          <div
            key={letter}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-teal-600 text-[10px] font-semibold text-white"
          >
            {letter}
          </div>
        ))}
      </div>
      Joined by 10,000+ learners today
    </div>
  </div>
)

export default SidePanel
