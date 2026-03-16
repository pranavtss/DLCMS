import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Filter, Clock, Users, Star, Search } from 'lucide-react';
import { getImageUrl } from '../../utils/api';

const BrowseCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
    const [courseRatings, setCourseRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseEnrollmentCounts, setCourseEnrollmentCounts] = useState({});
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchCourses();
    fetchAllRatings();
    loadEnrolledCourses();
    loadEnrollmentCounts();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadEnrolledCourses = async () => {
    try {
      if (!userId) {
        setEnrolledCourses([]);
        return;
      }

      const response = await fetch(`https://dlcms-g6hp.onrender.com/api/enrollments/user/${userId}`);
      if (!response.ok) {
        setEnrolledCourses([]);
        return;
      }

      const enrollments = await response.json();
      const enrolled = enrollments
        .map((enrollment) => enrollment.courseId?._id || enrollment.courseId)
        .filter(Boolean);

      setEnrolledCourses(enrolled);
    } catch (err) {
      console.error('Error loading enrollments:', err);
      setEnrolledCourses([]);
    }
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.includes(courseId);
  };

  const loadEnrollmentCounts = async () => {
    try {
      const response = await fetch('https://dlcms-g6hp.onrender.com/api/enrollments/all');
      if (!response.ok) {
        setCourseEnrollmentCounts({});
        return;
      }

      const enrollments = await response.json();
      const counts = {};
      enrollments.forEach((enrollment) => {
        if (enrollment.status !== 'enrolled') return;
        const courseId = enrollment.courseId?._id || enrollment.courseId;
        if (!courseId) return;
        counts[courseId] = (counts[courseId] || 0) + 1;
      });

      setCourseEnrollmentCounts(counts);
    } catch (err) {
      console.error('Error loading enrollment counts:', err);
      setCourseEnrollmentCounts({});
    }
  };

  const getRegisteredCount = (course) => {
    return courseEnrollmentCounts[course._id] ?? course.students ?? 0;
  };

  const handleEnroll = async (course) => {
    try {
      if (!userId) {
        navigate('/login');
        return;
      }

      const response = await fetch('https://dlcms-g6hp.onrender.com/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, courseId: course._id }),
      });

      if (!response.ok && response.status !== 409) {
        throw new Error('Failed to enroll');
      }

      const enrollmentData = response.status === 409 ? null : await response.json();

      setEnrolledCourses((prev) => (prev.includes(course._id) ? prev : [...prev, course._id]));
      setCourseEnrollmentCounts((prev) => ({
        ...prev,
        [course._id]: enrollmentData?.students ?? prev[course._id] ?? getRegisteredCount(course),
      }));
      setCourses((prev) =>
        prev.map((item) =>
          item._id === course._id
            ? {
                ...item,
                students:
                  enrollmentData?.students !== undefined
                    ? enrollmentData.students
                    : (item.students || 0) + 1,
              }
            : item
        )
      );

      navigate('/learner/my-courses');
    } catch (err) {
      console.error('Error enrolling:', err);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://dlcms-g6hp.onrender.com/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      setCourses(data);
      setFilteredCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchCourses(),
      fetchAllRatings(),
      loadEnrolledCourses(),
      loadEnrollmentCounts(),
    ]);
  };

  useEffect(() => {
    let result = [...courses];

    if (searchQuery) {
      result = result.filter(course =>
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLevel !== 'all' && selectedLevel !== 'all-levels') {
      result = result.filter(course =>
        course.level?.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((course) =>
        course.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popular':
        default:
          return getRegisteredCount(b) - getRegisteredCount(a);
      }
    });

    setFilteredCourses(result);
  }, [courses, searchQuery, selectedLevel, selectedCategory, sortBy]);

  const fetchAllRatings = async () => {
    try {
      // Derive ratings from course data instead of admin-only reviews endpoint
      const ratingsMap = {};
      courses.forEach(course => {
        const courseId = course._id;
        if (!courseId) return;
        const rating = course.rating || 0;
        const reviewsCount = course.reviews || 0;
        if (reviewsCount > 0) {
          ratingsMap[courseId] = {
            total: rating * reviewsCount,
            count: reviewsCount,
            average: rating.toFixed(1),
          };
        }
      });

      setCourseRatings(ratingsMap);
    } catch (err) {
      console.error('Error fetching ratings:', err);
    }
  };

  const getCourseRating = (courseId) => {
    const rating = courseRatings[courseId];
    if (!rating) return { average: null, count: 0 };
    return { average: rating.average, count: rating.count };
  };

  const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
  const categories = [
    'All Categories',
    ...Array.from(
      new Set(
        courses
          .map((course) => course.category)
          .filter(Boolean)
      )
    ),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Browse Courses</h1>
          <p className="text-slate-600 mt-1">Discover and enroll in new courses</p>
        </div>
        <div className="text-sm text-slate-500">
          {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} available
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(420px,2fr)_170px_170px_170px] gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title, instructor, or keyword..."
              className="w-full h-11 pl-12 pr-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full h-11 pl-12 pr-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-white"
            >
              {levels.map((level) => (
                <option key={level} value={level.toLowerCase().replace(' ', '-')}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-11 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-white"
          >
            {categories.map((category) => (
              <option
                key={category}
                value={category === 'All Categories' ? 'all' : category}
              >
                {category}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full h-11 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-white"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest First</option>
            <option value="rating">Highest Rated</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {filteredCourses.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-brand-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {courses.length === 0 ? 'No courses available yet' : 'No courses match your filters'}
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {courses.length === 0
              ? "We're working on adding exciting new courses. Check back soon to start your learning journey!"
              : 'Try adjusting your search or filters to find more courses.'}
          </p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="h-48 bg-slate-200 animate-pulse"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCourses.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              onClick={() => navigate(`/learner/courses/${course._id}`)}
              className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-brand-300 transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-48 bg-gradient-to-br from-brand-500 to-brand-700 overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                {course.thumbnail ? (
                  <img src={getImageUrl(course.thumbnail)} alt={course.title} className="w-full h-full object-contain bg-white/90" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
                {course.level && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-slate-700 rounded-full">
                      {course.level}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-3 py-1 bg-brand-100 text-brand-700 rounded-full">
                    {course.category || 'General'}
                  </span>
                  {course.isNew && (
                    <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-full">
                      New
                    </span>
                  )}
                </div>

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

                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
                  {(() => {
                    const { average, count } = getCourseRating(course._id);
                    return average ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold text-slate-900">
                          {average}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({count})
                        </span>
                      </div>
                    ) : null;
                  })()}

                  <div className="flex items-center gap-1 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{getRegisteredCount(course)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{course.duration ? `${course.duration}${!isNaN(course.duration) ? ' weeks' : ''}` : 'N/A'}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  {isEnrolled(course._id) ? (
                    <button
                      disabled
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm shadow-sm cursor-default"
                    >
                      Enrolled
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnroll(course);
                      }}
                      className="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-semibold text-sm shadow-sm hover:shadow transition-all group-hover:scale-105"
                    >
                      Enroll
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseCourses;
