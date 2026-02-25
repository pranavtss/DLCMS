const HelpCenter = () => (
  <div className="min-h-screen bg-slate-50">
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
        <a href="/login" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
          Back to Login
        </a>
      </div>
    </header>

    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-semibold text-slate-900">Help Center</h1>
        <p className="mt-2 text-sm text-slate-500">Get support and learn how to use DLCMS effectively.</p>

        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Getting Started</h2>
            <p className="mt-2 text-sm text-slate-600">
              Welcome to DLCMS! Create a learner account to access courses and learning materials, or contact your
              administrator for admin access.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Learner Guide</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li>• Enroll in available courses from your dashboard</li>
              <li>• Access learning materials and track your progress</li>
              <li>• Join live sessions when scheduled by instructors</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Admin Guide</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li>• Create and manage courses from your admin dashboard</li>
              <li>• Upload learning content and materials</li>
              <li>• Monitor learner progress and generate reports</li>
              <li>• Host live sessions with integrated video conferencing</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Contact Support</h2>
            <p className="mt-2 text-sm text-slate-600">
              Email: support@dlcms.local<br />
              Available: Monday - Friday, 9 AM - 5 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default HelpCenter
