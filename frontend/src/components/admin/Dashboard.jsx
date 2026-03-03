import { useState, useEffect } from 'react';
import { BookOpen, Users, Star, TrendingUp, Clock, AlertCircle, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalUsers: 0,
    totalEnrollments: 0,
    totalReviews: 0,
    learners: 0,
    admins: 0,
    averageRating: 0
  });
  const [recentReviews, setRecentReviews] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [coursesRes, usersRes, enrollmentsRes, reviewsRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/courses'),
        fetch('http://localhost:5000/api/admin/users'),
        fetch('http://localhost:5000/api/enrollments/all'),
        fetch('http://localhost:5000/api/admin/reviews')
      ]);

      let coursesData = [];
      let usersData = [];
      let enrollmentsData = [];
      let reviewsData = [];

      if (coursesRes.ok) coursesData = await coursesRes.json();
      if (usersRes.ok) usersData = await usersRes.json();
      if (enrollmentsRes.ok) enrollmentsData = await enrollmentsRes.json();
      if (reviewsRes.ok) reviewsData = await reviewsRes.json();

      const learnerCount = usersData.filter(u => u.role === 'Learner').length;
      const adminCount = usersData.filter(u => u.role === 'Admin').length;
      const avgRating = reviewsData.length > 0
        ? (reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length).toFixed(1)
        : 0;

      setStats({
        totalCourses: coursesData.length,
        totalUsers: usersData.length,
        totalEnrollments: enrollmentsData.length,
        totalReviews: reviewsData.length,
        learners: learnerCount,
        admins: adminCount,
        averageRating: avgRating
      });

      const recent = reviewsData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentReviews(recent);

      const courseEnrollmentMap = {};
      enrollmentsData.forEach(enrollment => {
        const courseId = enrollment.courseId?._id || enrollment.courseId;
        courseEnrollmentMap[courseId] = (courseEnrollmentMap[courseId] || 0) + 1;
      });

      const topCoursesData = coursesData
        .map(course => ({
          ...course,
          enrollmentCount: courseEnrollmentMap[course._id] || 0
        }))
        .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
        .slice(0, 5);

      setTopCourses(topCoursesData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`text-lg ${star <= rating ? '⭐' : '☆'}`}>
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  const handleSyncEnrollmentCounts = async () => {
    try {
      setSyncing(true);
      const response = await fetch('http://localhost:5000/api/admin/sync-enrollment-counts', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync enrollment counts');
      }

      const result = await response.json();
      alert(`✅ ${result.message}\n\nCourses updated: ${result.coursesUpdated}/${result.totalCourses}`);
      
      await loadDashboardData();
    } catch (err) {
      console.error('Error syncing enrollment counts:', err);
      alert('❌ Failed to sync enrollment counts: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Overview of your learning management system</p>
        </div>
        <button
          onClick={handleSyncEnrollmentCounts}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Enrollment Counts'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalCourses}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
              <p className="text-xs text-slate-500 mt-1">{stats.learners} learners, {stats.admins} admins</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Enrollments</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalEnrollments}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Reviews</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalReviews}</p>
              <p className="text-xs text-slate-500 mt-1">Avg: {stats.averageRating} ⭐</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Reviews</h2>
          
          {recentReviews.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review._id} className="border-b border-slate-200 pb-3 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {review.courseId?.title || 'Course'}
                      </p>
                      <p className="text-xs text-slate-500">
                        by {review.userId?.name || review.userName}
                      </p>
                    </div>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className="text-sm font-semibold text-slate-700">({review.rating}.0)</span>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Courses by Enrollment</h2>
          
          {topCourses.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No courses created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topCourses.map((course, index) => (
                <div key={course._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-teal-600 text-white text-xs font-bold rounded-full">
                        {index + 1}
                      </span>
                      <p className="font-medium text-slate-900 text-sm truncate">{course.title}</p>
                    </div>
                    <p className="text-xs text-slate-600">{course.instructor}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-lg font-bold text-slate-900">{course.enrollmentCount}</p>
                    <p className="text-xs text-slate-500">
                      {course.enrollmentCount === 1 ? 'enrollment' : 'enrollments'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl shadow-sm border border-teal-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">System Overview</h3>
            <p className="text-sm text-slate-700">
              Your DLCMS is running smoothly with <strong>{stats.totalCourses}</strong> courses, 
              <strong> {stats.totalUsers}</strong> users, and <strong> {stats.totalEnrollments}</strong> active enrollments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
