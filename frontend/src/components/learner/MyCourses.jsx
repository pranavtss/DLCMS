import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Clock } from 'lucide-react';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
};

const MyCourses = () => {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      const enrolledIds = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
      if (enrolledIds.length === 0) {
        setEnrolledCourses([]);
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      const allCourses = await response.json();
      const enrolled = allCourses.filter(course => enrolledIds.includes(course._id));
      setEnrolledCourses(enrolled);
    } catch (err) {
      console.error('Error loading enrolled courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (courseId, totalLessons) => {
    if (!totalLessons) return 0;
    const completed = JSON.parse(localStorage.getItem(`course_${courseId}_completed`) || '{}');
    const completedCount = Object.values(completed).filter(Boolean).length;
    return Math.round((completedCount / totalLessons) * 100);
  };

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

      {/* Course Grid */}
      {enrolledCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {enrolledCourses.map((course) => (
            <div
              key={course._id}
              onClick={() => navigate(`/learner/courses/${course._id}`)}
              className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-brand-300 transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-48 bg-gradient-to-br from-brand-500 to-brand-700 overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                {course.thumbnail ? (
                  <img src={getImageUrl(course.thumbnail)} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
                {course.instructor && (
                  <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                    <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-brand-700">
                        {course.instructor.charAt(0)}
                      </span>
                    </div>
                    <span>{course.instructor}</span>
                  </div>
                )}
                
                {/* Progress Bar */}
                {course.lessons && course.lessons.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600">PROGRESS</span>
                      <span className="text-xs font-bold text-slate-900">
                        {calculateProgress(course._id, course.lessons.length)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${calculateProgress(course._id, course.lessons.length)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {course.duration && (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>{course.duration} {!isNaN(course.duration) && 'weeks'}</span>
                    </>
                  )}
                  {course.level && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{course.level}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {enrolledCourses.length === 0 && !loading && (
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
    </div>
  );
};

export default MyCourses;
