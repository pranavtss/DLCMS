import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '../components/learner/Sidebar';
import MyCourses from '../components/learner/MyCourses';
import BrowseCourses from '../components/learner/BrowseCourses';
import Progress from '../components/learner/Progress';
import Reviews from '../components/learner/Reviews';

const LearnerDashboard = () => {
  const [userName, setUserName] = useState('Learner');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // TODO: Fetch user data from backend/localStorage
  useEffect(() => {
    // Placeholder for fetching user data
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar userName={userName} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Menu Button */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
        </div>
        
        <div className="max-w-7xl mx-auto p-8">
          <Routes>
            <Route index element={<Navigate to="my-courses" replace />} />
            <Route path="my-courses" element={<MyCourses />} />
            <Route path="browse-courses" element={<BrowseCourses />} />
            <Route path="progress" element={<Progress />} />
            <Route path="reviews" element={<Reviews />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default LearnerDashboard;
