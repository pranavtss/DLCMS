import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/learner/Sidebar';
import MyCourses from '../components/learner/MyCourses';
import BrowseCourses from '../components/learner/BrowseCourses';
import Progress from '../components/learner/Progress';

const LearnerDashboard = () => {
  const [userName, setUserName] = useState('Learner');

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
      <Sidebar userName={userName} />
      
      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Routes>
            <Route index element={<Navigate to="my-courses" replace />} />
            <Route path="my-courses" element={<MyCourses />} />
            <Route path="browse-courses" element={<BrowseCourses />} />
            <Route path="progress" element={<Progress />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default LearnerDashboard;
