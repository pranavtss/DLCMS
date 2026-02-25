import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Clock, BarChart3 } from 'lucide-react';

const Progress = () => {
  const [userName, setUserName] = useState('User');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get user data from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
    // TODO: Fetch enrolled courses with progress from backend
    // For now, using empty array
    setEnrolledCourses([]);
  }, []);

  // Calculate overall stats
  const totalCourses = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(c => c.progress === 100).length;
  const totalHours = enrolledCourses.reduce((sum, c) => sum + (c.hoursSpent || 0), 0);
  const overallProgress = totalCourses > 0 
    ? Math.round(enrolledCourses.reduce((sum, c) => sum + c.progress, 0) / totalCourses)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Progress</h1>
        <p className="text-slate-600 mt-1">Track your learning journey</p>
      </div>

      {/* Overall Progress Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Overall Progress</h2>
          <span className="text-3xl font-bold text-brand-600">{overallProgress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 mb-3">
          <div 
            className="bg-brand-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
        <p className="text-slate-600 text-sm">
          {enrolledCourses.reduce((sum, c) => sum + (c.lessonsCompleted || 0), 0)} of{' '}
          {enrolledCourses.reduce((sum, c) => sum + (c.totalLessons || 0), 0)} lessons completed across {totalCourses} courses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 text-sm">Courses Enrolled</span>
            <BookOpen className="w-6 h-6 text-brand-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalCourses}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 text-sm">Courses Completed</span>
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{completedCourses}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 text-sm">Total Hours</span>
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalHours}h</p>
        </div>
      </div>

      {/* Individual Course Progress */}
      {enrolledCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
          <p className="text-slate-600 text-lg mb-2">Enroll in courses to start tracking your progress.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Course Progress & Time Spent</h2>
          <div className="space-y-6">
            {enrolledCourses.map((course) => (
              <div key={course.id} className="border-b border-slate-200 last:border-0 pb-6 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg">{course.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.lessonsCompleted || 0} of {course.totalLessons || 0} lessons
                      </p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold text-blue-600">{course.hoursSpent || 0}h</span> spent
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-brand-600 ml-4">
                    {course.progress || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-brand-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress || 0}%` }}
                  ></div>
                </div>
                {/* Time breakdown */}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>Last activity: {course.lastActivity || 'N/A'}</span>
                  <span>•</span>
                  <span>Avg. daily: {course.avgDailyTime || '0'}min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Info Footer */}
      <div className="mt-8 text-center text-slate-500 text-sm">
        <p>Learning progress for <span className="font-semibold text-slate-700">{userName}</span></p>
      </div>
    </div>
  );
};

export default Progress;
