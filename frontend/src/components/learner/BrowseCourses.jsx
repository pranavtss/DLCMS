import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Filter, Clock, Users, Star } from 'lucide-react';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
};

const BrowseCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
    loadEnrolledCourses();
  }, []);

  const loadEnrolledCourses = () => {
    const enrolled = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
    setEnrolledCourses(enrolled);
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.includes(courseId);
  };

  const handleEnroll = async (course) => {
    try {
      const enrolled = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
      if (!enrolled.includes(course._id)) {
        enrolled.push(course._id);
        localStorage.setItem('enrolledCourses', JSON.stringify(enrolled));
        setEnrolledCourses(enrolled);
      }
      navigate('/learner/my-courses');
    } catch (err) {
      console.error('Error enrolling:', err);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/courses');
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
          return (b.students || 0) - (a.students || 0);
      }
    });

    setFilteredCourses(result);
  }, [courses, searchQuery, selectedLevel, sortBy]);

  const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Browse Courses</h1>
          <p className="text-slate-600 mt-1">Discover and enroll in new courses</p>
        </div>
        <div className="text-sm text-slate-500">
          {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} available
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses by title, instructor, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-white"
            >
              {levels.map((level) => (
                <option key={level} value={level.toLowerCase().replace(' ', '-')}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-white"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest First</option>
            <option value="rating">Highest Rated</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
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

      {/* Loading State */}
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

      {/* Course Grid */}
      {filteredCourses.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              onClick={() => navigate(`/learner/courses/${course._id}`)}
              className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-brand-300 transition-all duration-300 cursor-pointer"
            >
              {/* Course Image */}
              <div className="relative h-48 bg-gradient-to-br from-brand-500 to-brand-700 overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                {course.thumbnail ? (
                  <img src={getImageUrl(course.thumbnail)} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
                {/* Level Badge */}
                {course.level && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-slate-700 rounded-full">
                      {course.level}
                    </span>
                  </div>
                )}
              </div>

              {/* Course Content */}
              <div className="p-6">
                {/* Category */}
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

                {/* Title */}
                <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>

                {/* Instructor */}
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

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-slate-900">
                      {course.rating || '4.5'}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({course.reviews || '0'})
                    </span>
                  </div>

                  {/* Students */}
                  <div className="flex items-center gap-1 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{course.students || '0'}</span>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{course.duration || 'N/A'}</span>
                  </div>
                </div>

                {/* Enroll Button */}
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
