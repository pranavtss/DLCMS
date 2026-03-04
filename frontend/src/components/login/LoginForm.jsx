import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const LoginForm = () => {
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    remember: false,
  })
  const [message, setMessage] = useState("")

  const handleGoogleLogin = async (response) => {
    try {
      const apiResponse = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await apiResponse.json()

      if (!apiResponse.ok) {
        setMessage(data.message || "Google login failed.")
        return
      }

      localStorage.setItem("userId", data.userId || data.id || "")
      localStorage.setItem("userName", data.name || "User")
      localStorage.setItem("userRole", data.role)
      localStorage.setItem("authToken", data.token || "")

      const target = data.role === "Admin" ? "/admin" : "/learner"
      navigate(target)
    } catch (error) {
      setMessage("Google login failed. Please check your internet and backend server.")
    }
  }

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!googleClientId || !googleButtonRef.current) {
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onerror = () => {
      setMessage("Google Sign-In failed to load. Please check your internet connection.")
    }
    script.onload = () => {
      if (!window.google || !googleButtonRef.current) return

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleLogin,
      })

      googleButtonRef.current.innerHTML = ""
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
      })
    }

    document.body.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

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
      console.log(`📧 Sending login request to: ${API_URL}/api/auth/login`)
      console.log('📝 Credentials:', { email: formState.email.toLowerCase(), password: '***' })
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formState.email.toLowerCase(), password: formState.password }),
      })
      
      console.log('✓ Response status:', response.status)
      const data = await response.json()
      console.log('✓ Response data:', data)
      
      if (!response.ok) {
        console.error('❌ Login failed:', data.message)
        setMessage(data.message || "Login failed.")
        return
      }
      
      console.log('✅ Login successful, storing data...')
      localStorage.setItem('userId', data.userId || data.id || '')
      localStorage.setItem('userName', data.name || 'User')
      localStorage.setItem('userRole', data.role)
      localStorage.setItem('authToken', data.token || '')
      
      console.log('✅ Redirecting to:', data.role === "Admin" ? "/admin" : "/learner")
      const target = data.role === "Admin" ? "/admin" : "/learner"
      navigate(target)
    } catch (error) {
      console.error('❌ Fetch error:', error)
      setMessage(`Login failed. Cannot reach server at ${API_URL}. Make sure backend is running.`)
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

      <div className="mt-4">
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <div className="flex justify-center">
            <div ref={googleButtonRef} />
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500">
            Google login is not configured. Set VITE_GOOGLE_CLIENT_ID in frontend/.env.local and restart the frontend server.
          </p>
        )}
      </div>

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
