import TopBar from "../components/login/TopBar"
import SidePanel from "../components/login/SidePanel"
import LoginForm from "../components/login/LoginForm"

const Login = () => (
  <div className="min-h-screen bg-slate-50">
    <TopBar />
    <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
      <SidePanel />
      <LoginForm />
    </div>
  </div>
)

export default Login
