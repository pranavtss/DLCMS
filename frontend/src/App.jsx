import { Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import AdminDashboard from "./pages/AdminDashboard"
import LearnerDashboard from "./pages/LearnerDashboard"
import HelpCenter from "./pages/HelpCenter"

const getAuthState = () => ({
	token: localStorage.getItem("authToken"),
	role: localStorage.getItem("userRole"),
})

const getDashboardPath = (role) => (role === "Admin" ? "/admin" : "/learner")

const ProtectedRoute = ({ children }) => {
	const { token } = getAuthState()

	return token ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
	const { token, role } = getAuthState()

	if (token) {
		return <Navigate to={getDashboardPath(role)} replace />
	}

	return children
}

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Navigate to="/login" replace />} />
			<Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
			<Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
			<Route path="/help" element={<HelpCenter />} />
			<Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
			<Route path="/learner/*" element={<ProtectedRoute><LearnerDashboard /></ProtectedRoute>} />
		</Routes>
	)
}
