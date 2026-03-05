import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, TrendingUp, Award, Target } from 'lucide-react';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
};

const Progress = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    averageProgress: 0,
  });

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        navigate('/login');
        return;
      }

      const [activeResponse, completedResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/enrollments/user/${userId}`),
        fetch(`http://localhost:5000/api/enrollments/completed/${userId}`),
      ]);

      if (!activeResponse.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const activeEnrollments = await activeResponse.json();
      let combinedEnrollments = [...activeEnrollments];

      if (completedResponse.ok) {
        const completedEnrollments = await completedResponse.json();
        const existingIds = new Set(combinedEnrollments.map(e => e._id));

        completedEnrollments.forEach(enrollment => {
          if (!existingIds.has(enrollment._id)) {
            combinedEnrollments.push(enrollment);
            existingIds.add(enrollment._id);
          }
        });
      }

      setEnrollments(combinedEnrollments);

      const totalCourses = combinedEnrollments.length;
      const completedCourses = combinedEnrollments.filter(e => e.completionPercentage === 100).length;
      const inProgressCourses = totalCourses - completedCourses;
      
      let totalLessons = 0;
      let completedLessons = 0;
      
      combinedEnrollments.forEach(enrollment => {
        const course = enrollment.courseId;
        if (course && course.lessons) {
          totalLessons += course.lessons.length;
          const completedLessonsMap = enrollment.completedLessons || {};
          const completed = Object.values(completedLessonsMap).filter(Boolean).length;
          completedLessons += completed;
        }
      });

      const averageProgress = totalCourses > 0
        ? Math.round(combinedEnrollments.reduce((sum, e) => sum + (e.completionPercentage || 0), 0) / totalCourses)
        : 0;

      setStats({
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalLessons,
        completedLessons,
        averageProgress,
      });
    } catch (err) {
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const inProgressCourses = enrollments.filter(e => e.completionPercentage < 100);
  const completedCourses = enrollments.filter(e => e.completionPercentage === 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Learning Progress</h1>
        <p className="text-slate-600 mt-2 text-lg">Track your learning journey and achievements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Courses */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Total Courses</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalCourses}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completedCourses}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">In Progress</p>
              <p className="text-3xl font-bold text-orange-600">{stats.inProgressCourses}</p>
              <p className="text-xs text-slate-500 mt-1">lessons</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Average Progress */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Average Progress</p>
              <p className="text-3xl font-bold text-purple-600">{stats.averageProgress}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Overall Progress</h2>
            <p className="text-blue-100 text-lg">
              {stats.completedLessons} of {stats.totalLessons} lessons completed
            </p>
          </div>
          <div className="w-20 h-20 bg-white/20 rounded-full hidden sm:flex items-center justify-center">
            <Award className="w-10 h-10" />
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-white rounded-full transition-all duration-500 shadow-xl"
            style={{
              width: `${stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0}%`,
            }}
          />
        </div>
        <p className="text-right mt-3 font-bold text-lg">
          {stats.totalLessons > 0
            ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
            : 0}%
        </p>
      </div>

      {/* Main Content */}
      {enrollments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">No courses enrolled yet</h3>
          <p className="text-slate-600 max-w-md mx-auto mb-8 text-lg">
            Start your learning journey by enrolling in courses that interest you!
          </p>
          <button
            onClick={() => navigate('/learner/browse-courses')}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <>
          {/* In Progress Courses */}
          {inProgressCourses.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">In Progress</h2>
              <div className="space-y-4">
                {inProgressCourses.map((enrollment) => {
                  const course = enrollment.courseId;
                  if (!course) return null;

                  const completedLessonsMap = enrollment.completedLessons || {};
                  const completedCount = Object.values(completedLessonsMap).filter(Boolean).length;
                  const totalLessons = course.lessons?.length || 0;
                  const progress = enrollment.completionPercentage || 0;

                  return (
                    <div
                      key={enrollment._id}
                      className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-200"
                      onClick={() => navigate(`/learner/courses/${course._id}`)}
                    >
                      <div className="flex gap-6">
                        <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                          {course.thumbnail ? (
                            <img
                              src={getImageUrl(course.thumbnail)}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-10 h-10 text-white" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-xl text-slate-900 mb-1">
                                {course.title}
                              </h3>
                              <p className="text-sm text-slate-600">{course.instructor}</p>
                            </div>
                            <span className="px-4 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full whitespace-nowrap">
                              {totalLessons} Lessons
                            </span>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-slate-700 font-medium">
                                {completedCount} of {totalLessons} lessons completed
                              </span>
                              <span className="font-bold text-slate-900">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-full ${getProgressColor(progress)} rounded-full transition-all duration-500`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-slate-600">
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {course.duration}
                            </span>
                            <span className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              {course.level}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Courses */}
          {completedCourses.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Completed Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedCourses.map((enrollment) => {
                  const course = enrollment.courseId;
                  if (!course) return null;

                  return (
                    <div
                      key={enrollment._id}
                      className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:border-green-200"
                      onClick={() => navigate(`/learner/courses/${course._id}`)}
                    >
                      <div className="h-40 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center overflow-hidden relative">
                        {course.thumbnail ? (
                          <img
                            src={getImageUrl(course.thumbnail)}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="w-14 h-14 text-white opacity-40" />
                        )}
                        <div className="absolute top-3 right-3 bg-green-500 text-white p-2.5 rounded-full shadow-lg">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 text-lg">
                          {course.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">{course.instructor}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-green-600 font-bold">
                            <CheckCircle className="w-4 h-4" />
                            100% Complete
                          </span>
                          <span className="text-slate-600">{course.lessons?.length || 0} lessons</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Progress;
