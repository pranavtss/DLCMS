import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Trash2, Edit2, Users, Filter, Search } from 'lucide-react';
import CourseForm from './CourseForm';
import { apiFetch, getImageUrl } from '../../utils/api';

const Courses = () => {
  const navigate = useNavigate();
  const currentUserName = localStorage.getItem('userName') || 'Admin';
  const isMasterAdmin = localStorage.getItem('userIsMasterAdmin') === 'true';
  const [showForm, setShowForm] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all-levels');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/courses');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setCourses(data);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (formData) => {
    try {
      const userId = localStorage.getItem('userId');
      
      const response = await apiFetch('/api/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          instructor: formData.instructor,
          category: formData.category,
          level: formData.level,
          duration: formData.duration,
          lessons: formData.lessons,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
          thumbnail: formData.thumbnail,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create course');
      }

      fetchCourses();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      fetchCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Failed to delete course');
    }
  };

  const filteredCourses = [...courses]
    .filter((course) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        course.title?.toLowerCase().includes(query) ||
        course.instructor?.toLowerCase().includes(query) ||
        course.category?.toLowerCase().includes(query);

      const matchesLevel =
        selectedLevel === 'all-levels' ||
        (course.level || '').toLowerCase() === selectedLevel.replace('-', ' ');

      const matchesCategory =
        selectedCategory === 'all' ||
        (course.category || '').toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesLevel && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'popular') {
        return (b.students || 0) - (a.students || 0);
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
  const categories = [
    'All Categories',
    ...Array.from(new Set(courses.map((course) => course.category).filter(Boolean))),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Courses</h1>
          <p className="text-slate-600 mt-1">Create and manage your courses</p>
        </div>
        <div className="text-sm text-slate-500">
          {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-semibold text-sm shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-5 h-5" />
          New Course
        </button>
      </div>

      <CourseForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateCourse}
        defaultInstructor={currentUserName}
        instructorReadOnly={!isMasterAdmin}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <p className="text-slate-500">Loading courses...</p>
        </div>
      )}

      {!loading && courses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(420px,2fr)_170px_170px_170px] gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by title, instructor, or category..."
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
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>
      )}

      {!loading && courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-brand-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No courses yet. Create your first course!
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Get started by creating a new course. Add lessons, materials, and invite learners to join.
          </p>
        </div>
      ) : (
        <>
          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No courses match your search
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Try adjusting your search terms
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="h-40 bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={getImageUrl(course.thumbnail)}
                    alt={course.title}
                    className="w-full h-full object-contain bg-white/90"
                  />
                ) : (
                  <BookOpen className="w-12 h-12 text-white opacity-50" />
                )}
              </div>

              <div className="p-6">
                <div className="flex gap-2 mb-3">
                  <span className="text-xs font-semibold px-3 py-1 bg-brand-100 text-brand-700 rounded-full">
                    {course.category}
                  </span>
                  <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                    {course.level}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>

                <p className="text-sm text-slate-600 mb-4">{course.instructor}</p>

                <div className="text-xs text-slate-500 space-y-1 mb-4">
                  <div className="flex items-center justify-between">
                    <p>Lessons: {Array.isArray(course.lessons) ? course.lessons.length : 0}</p>
                    <div className="flex items-center gap-1 text-brand-600">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">{course.students || 0}</span>
                    </div>
                  </div>
                  <p>Duration: {course.duration} {!isNaN(course.duration) && 'weeks'}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/courses/${course._id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Courses;
