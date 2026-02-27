import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Trash2, Edit2 } from 'lucide-react';
import CourseForm from './CourseForm';

const Courses = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/courses');
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
      
      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create course');
      }

      // Refresh courses list
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
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Courses</h1>
          <p className="text-slate-600 mt-1">Create and manage your courses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-semibold text-sm shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-5 h-5" />
          New Course
        </button>
      </div>

      {/* Course Form Modal */}
      <CourseForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateCourse}
      />

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-slate-500">Loading courses...</p>
        </div>
      )}

      {/* Courses List or Empty State */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Course Image */}
              <div className="h-40 bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-white opacity-50" />
              </div>

              {/* Course Content */}
              <div className="p-6">
                {/* Category & Level */}
                <div className="flex gap-2 mb-3">
                  <span className="text-xs font-semibold px-3 py-1 bg-brand-100 text-brand-700 rounded-full">
                    {course.category}
                  </span>
                  <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                    {course.level}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>

                {/* Instructor */}
                <p className="text-sm text-slate-600 mb-4">{course.instructor}</p>

                {/* Stats */}
                <div className="text-xs text-slate-500 space-y-1 mb-4">
                  <p>Lessons: {Array.isArray(course.lessons) ? course.lessons.length : 0}</p>
                  <p>Duration: {course.duration} {!isNaN(course.duration) && 'weeks'}</p>
                </div>

                {/* Actions */}
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
    </div>
  );
};

export default Courses;
