import { useState, useEffect } from 'react';
import { Star, MessageSquare, User, Calendar, Trash2, ArrowLeft, BookOpen, X } from 'lucide-react';
import SearchBar from '../common/SearchBar';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
};

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadReviews();
    loadCourses();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/reviews');
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(data);
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete review');

      await loadReviews();
      alert('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedCourse = courses.find(c => c._id === selectedCourseId) || null;
  const courseReviews = selectedCourseId
    ? reviews.filter(r => (r.courseId?._id || r.courseId) === selectedCourseId)
    : [];

  const filteredReviews = filter === 'all' 
    ? courseReviews 
    : courseReviews.filter(r => r.rating === parseInt(filter));

  const averageRating = courseReviews.length > 0
    ? (courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: courseReviews.filter(r => r.rating === rating).length,
    percentage: courseReviews.length > 0 
      ? Math.round((courseReviews.filter(r => r.rating === rating).length / courseReviews.length) * 100)
      : 0
  }));

  const getCourseStats = (courseId) => {
    const statsReviews = reviews.filter(r => (r.courseId?._id || r.courseId) === courseId);
    if (statsReviews.length === 0) {
      return { average: '0.0', count: 0 };
    }
    const average = (statsReviews.reduce((sum, r) => sum + r.rating, 0) / statsReviews.length).toFixed(1);
    return { average, count: statsReviews.length };
  };

  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {!selectedCourseId ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900">Courses</h1>
            <p className="text-slate-600 mt-1">Select a course to view its reviews</p>
          </div>

          {courses.length > 0 && (
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title, instructor, or description..."
              containerClassName="mb-8"
            />
          )}

          {courses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses found</h3>
              <p className="text-slate-500">Create courses to start receiving reviews</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses match your search</h3>
              <p className="text-slate-500">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const stats = getCourseStats(course._id);
                return (
                  <button
                    key={course._id}
                    type="button"
                    onClick={() => {
                      setFilter('all');
                      setSelectedCourseId(course._id);
                    }}
                    className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left hover:shadow-lg hover:border-teal-300 transition-all"
                  >
                    {/* Course Image */}
                    <div className="relative h-48 bg-gradient-to-br from-teal-500 to-teal-700 overflow-hidden">
                      {course.thumbnail ? (
                        <img 
                          src={getImageUrl(course.thumbnail)} 
                          alt={course.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 line-clamp-2 group-hover:text-teal-600 transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        {stats.count > 0 ? (
                          <>
                            {renderStars(Math.round(stats.average))}
                            <span className="text-sm font-semibold text-slate-700">{stats.average}</span>
                            <span className="text-xs text-slate-500">({stats.count})</span>
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">No reviews yet</span>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded">
                          View Reviews
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setSelectedCourseId(null)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-700 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to courses
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900">Course Reviews</h1>
            <p className="text-slate-600 mt-1">Monitor and manage learner feedback</p>
            {selectedCourse && (
              <p className="text-sm text-slate-500 mt-2">{selectedCourse.title}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Reviews</p>
                  <p className="text-3xl font-bold text-slate-900">{courseReviews.length}</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-slate-900">{averageRating}</p>
                    <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {renderStars(Math.round(averageRating))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm text-slate-600 mb-3">Rating Distribution</p>
              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 w-6">{rating}★</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Filter by rating:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    filter === 'all'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {[5, 4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setFilter(rating.toString())}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      filter === rating.toString()
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {rating} ★
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No reviews yet</h3>
              <p className="text-slate-500">
                Reviews will appear here once learners complete courses
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{review.userId?.name || review.userName || 'Anonymous'}</span>
                          <span className="text-slate-400">({review.userId?.email || 'No email'})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      {renderStars(review.rating)}
                      <span className="text-lg font-bold text-slate-900">({review.rating}.0)</span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{review.comment}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-semibold">
                        Private feedback - admin only
                      </span>
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

export default ReviewsManagement;
