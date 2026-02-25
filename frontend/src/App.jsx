import { Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import AdminDashboard from "./pages/AdminDashboard"
import LearnerDashboard from "./pages/LearnerDashboard"
import HelpCenter from "./pages/HelpCenter"

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Navigate to="/login" replace />} />
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />
			<Route path="/help" element={<HelpCenter />} />
			<Route path="/admin/*" element={<AdminDashboard />} />
			<Route path="/learner/*" element={<LearnerDashboard />} />
		</Routes>
	)
}
