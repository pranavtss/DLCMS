import { useState } from "react"
import { useNavigate } from "react-router-dom"
import TopBar from "../components/login/TopBar"

const Register = () => {
  const navigate = useNavigate()
  const [role, setRole] = useState("Learner")
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [message, setMessage] = useState("")

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formState.name || !formState.email || !formState.password) {
      setMessage("Please fill in all fields.")
      return
    }
    
    try {
      console.log('📝 Sending registration request...')
      console.log('  Name:', formState.name)
      console.log('  Email:', formState.email)
      console.log('  Role:', role)
      
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formState, role }),
      })
      
      console.log('✓ Response status:', response.status)
      const data = await response.json()
      console.log('✓ Response data:', data)
      
      if (!response.ok) {
        console.error('❌ Registration failed:', data.message)
        setMessage(data.message || "Registration failed.")
        return
      }
      
      console.log('✅ Registration successful, storing data...')
      // Store user data in localStorage
      localStorage.setItem('userId', data.userId || data.id || '')
      localStorage.setItem('userName', data.name || 'User')
      localStorage.setItem('userRole', data.role)
      
      console.log('✅ Redirecting to:', data.role === "Admin" ? "/admin" : "/learner")
      const target = data.role === "Admin" ? "/admin" : "/learner"
      navigate(target)
    } catch (error) {
      console.error('❌ Fetch error:', error)
      setMessage("Registration failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar />
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-soft sm:p-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Create your account</h2>
            <p className="text-sm text-slate-500">Join DLCMS as a learner.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Full Name
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                <input
                  name="name"
                  type="text"
                  value={formState.name}
                  onChange={handleChange}
                  placeholder="Alex Morgan"
                  className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
            </label>

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
                <input
                  name="password"
                  type="password"
                  value={formState.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
            </label>

            <button className="w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
              Create account
            </button>

            {message && (
              <p className="rounded-2xl bg-brand-50 px-4 py-3 text-xs text-brand-700">{message}</p>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account? <span className="font-semibold text-brand-600" onClick={() => navigate("/login")}>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
