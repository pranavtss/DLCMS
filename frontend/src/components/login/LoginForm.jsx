import { useState } from "react"
import { useNavigate } from "react-router-dom"

const LoginForm = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    remember: false,
  })
  const [message, setMessage] = useState("")

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formState.email || !formState.password) {
      setMessage("Please enter your email and password.")
      return
    }
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formState.email, password: formState.password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.message || "Login failed.")
        return
      }
      const target = data.role === "Admin" ? "/admin" : "/learner"
      navigate(target)
    } catch (error) {
      setMessage("Login failed. Please try again.")
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
        <p className="text-sm text-slate-500">Login to manage your learning journey</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Email Address
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
            <span className="text-slate-400">@</span>
            <input
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
        </label>

        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Password
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
            <span className="text-slate-400">•••</span>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formState.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-xs font-semibold text-brand-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <label className="flex items-center gap-2">
            <input
              name="remember"
              type="checkbox"
              checked={formState.remember}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300"
            />
            Keep me logged in
          </label>
          <button type="button" className="font-semibold text-brand-600">
            Forgot?
          </button>
        </div>

        <button className="w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
          Sign In to DLCMS
        </button>

        {message && (
          <p className="rounded-2xl bg-brand-50 px-4 py-3 text-xs text-brand-700">{message}</p>
        )}
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account?{" "}
        <span className="font-semibold text-brand-600 cursor-pointer" onClick={() => navigate("/register")}>
          Create an account
        </span>
      </p>
    </div>
  )
}

export default LoginForm
