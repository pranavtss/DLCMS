import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap } from 'lucide-react';

const MyCourses = () => {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // TODO: Fetch enrolled courses from backend
  useEffect(() => {
    // Placeholder for fetching enrolled courses
    setEnrolledCourses([]);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">My Courses</h1>
          <p className="text-slate-600 mt-1">Your enrolled courses and progress</p>
        </div>
        <button
          onClick={() => navigate('/learner/browse-courses')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <BookOpen className="w-5 h-5 text-slate-700" />
          <span className="font-medium text-slate-700">Browse Courses</span>
        </button>
      </div>

      {/* Empty State */}
      {enrolledCourses.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-12 h-12 text-slate-400" />
          </div>
          <p className="text-slate-600 text-lg mb-6">
            You haven't enrolled in any courses yet.
          </p>
          <button
            onClick={() => navigate('/learner/browse-courses')}
            className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            Browse Courses
          </button>
        </div>
      )}

      {/* Course List */}
      {enrolledCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="h-40 bg-gradient-to-br from-brand-500 to-brand-700"></div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{course.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{course.progress}% Complete</span>
                  <button className="text-sm text-brand-600 font-medium hover:text-brand-700">
                    Continue →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
