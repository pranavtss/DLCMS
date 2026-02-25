const SocialButton = ({ label }) => (
  <button className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
      {label[0]}
    </span>
    {label}
  </button>
)

export default SocialButton
