import { useState, useEffect } from 'react';
import { Star, BookOpen, Send, CheckCircle } from 'lucide-react';

const Reviews = () => {
  const [completedCourses, setCompletedCourses] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompletedCourses();
    loadMyReviews();
  }, []);

  const loadCompletedCourses = async () => {
    try {
      const enrolledIds = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
      if (enrolledIds.length === 0) {
        setCompletedCourses([]);
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      const allCourses = await response.json();
      
      const completed = allCourses.filter(course => {
        if (!enrolledIds.includes(course._id)) return false;
        
        const totalLessons = course.lessons?.length || 0;
        if (totalLessons === 0) return false;
        
        const completedData = JSON.parse(localStorage.getItem(`course_${course._id}_completed`) || '{}');
        const completedCount = Object.values(completedData).filter(Boolean).length;
        
        return completedCount === totalLessons;
      });
      
      setCompletedCourses(completed);
    } catch (err) {
      console.error('Error loading completed courses:', err);
    }
  };

  const loadMyReviews = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(`http://localhost:5000/api/reviews/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const reviews = await response.json();
      setMyReviews(reviews);
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  const handleRatingClick = (rating) => {
    setNewReview({ ...newReview, rating });
  };

  const handleSubmitReview = async () => {
    if (!selectedCourse || !newReview.rating || !newReview.comment.trim()) {
      alert('Please provide both a rating and a comment');
      return;
    }

    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName') || 'User';

      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse._id,
          userId,
          userName,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit review');
      }

      await loadMyReviews();
      setNewReview({ rating: 0, comment: '' });
      setIsWritingReview(false);
      setSelectedCourse(null);
      alert('Review submitted successfully! Your feedback is private and only visible to administrators.');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete review');

      await loadMyReviews();
      alert('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const handleEditReview = (review) => {
    const course = completedCourses.find(c => c._id === review.courseId._id);
    if (course) {
      setSelectedCourse(course);
      setNewReview({
        rating: review.rating,
        comment: review.comment,
      });
      setIsWritingReview(true);
    }
  };

  const renderStars = (rating, interactive = false, size = 'w-6 h-6') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && handleRatingClick(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`${size} ${
                star <= (interactive ? (hoverRating || newReview.rating) : rating)
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const hasReviewed = (courseId) => {
    return myReviews.some(review => review.courseId?._id === courseId);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Course Reviews</h1>
        <p className="text-slate-600 mt-1">Rate your completed courses and provide feedback</p>
      </div>

      {/* Completed Courses Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Rate Your Completed Courses</h2>
        
        {completedCourses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No completed courses yet. Complete a course to leave a review!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedCourses.map((course) => {
              const reviewed = hasReviewed(course._id);
              const review = myReviews.find(r => r.courseId?._id === course._id);
              
              return (
                <div
                  key={course._id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    <h3 className="font-semibold text-slate-900">{course.title}</h3>
                  </div>
                  
                  {reviewed ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating, false, 'w-5 h-5')}
                        <span className="text-sm text-slate-600">({review.rating}.0)</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
                        >
                          Edit Review
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="text-sm text-red-600 hover:text-red-700 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setIsWritingReview(true);
                      }}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-semibold"
                    >
                      Write Review
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      {isWritingReview && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Review: {selectedCourse.title}</h2>
              <p className="text-sm text-slate-500 mt-1">Your feedback helps us improve our courses</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  {renderStars(newReview.rating, true, 'w-10 h-10')}
                  {newReview.rating > 0 && (
                    <span className="text-2xl font-bold text-teal-600">{newReview.rating}.0</span>
                  )}
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Your Feedback <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Note: Your comments are private and only visible to administrators
                </p>
                <textarea
                  placeholder="Share your thoughts about the course, what you learned, and suggestions for improvement..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  rows="8"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-slate-500 mt-1">{newReview.comment.length}/1000 characters</p>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <p className="text-sm text-teal-800">
                  <strong>Privacy Notice:</strong> Your star rating will be visible to other learners, but your written feedback will only be seen by course administrators. This allows us to maintain your privacy while using your insights to improve course quality.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsWritingReview(false);
                  setSelectedCourse(null);
                  setNewReview({ rating: 0, comment: '' });
                }}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-semibold"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={loading || !newReview.rating || !newReview.comment.trim()}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Reviews Summary */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">My Reviews</h2>
        
        {myReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-linear-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No reviews yet</h3>
            <p className="text-slate-500">
              Complete courses and share your feedback to help us improve
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myReviews.map((review) => (
              <div
                key={review._id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">
                      {review.courseId?.title || 'Course'}
                    </h3>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating, false, 'w-5 h-5')}
                      <span className="text-sm font-semibold text-slate-700">({review.rating}.0)</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-3">
                  Reviewed on {formatDate(review.createdAt)}
                </p>

                <div className="pt-3 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => handleEditReview(review)}
                    className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    Edit
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
