import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import Dashboard from '../components/admin/Dashboard';
import Courses from '../components/admin/Courses';
import Users from '../components/admin/Users';
import Reports from '../components/admin/Reports';
import CourseDetailPage from './CourseDetailPage';

const AdminDashboard = () => {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:courseId" element={<CourseDetailPage />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
