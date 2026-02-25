const TopBar = () => (
  <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-semibold text-white">
          D
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">DLCMS</p>
          <p className="text-xs text-slate-500">Digital Learning CMS</p>
        </div>
      </div>
      <a href="/help" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
        Help Center
      </a>
    </div>
  </header>
)

export default TopBar
