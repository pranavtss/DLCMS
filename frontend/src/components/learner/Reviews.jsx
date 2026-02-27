import { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageSquare, Filter, BookOpen } from 'lucide-react';

const Reviews = () => {
  const [completedCourses, setCompletedCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    content: '',
    wouldRecommend: true
  });
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
  }, []);

  const handleRatingClick = (rating) => {
    setNewReview({ ...newReview, rating });
  };

  const handleSubmitReview = () => {
    if (!selectedCourse || !newReview.rating || !newReview.title.trim() || !newReview.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const review = {
      id: Date.now(),
      courseId: selectedCourse.id,
      courseName: selectedCourse.title,
      ...newReview,
      createdAt: new Date().toISOString(),
      userName: localStorage.getItem('userName') || 'User'
    };

    setReviews([review, ...reviews]);
    setNewReview({ rating: 0, title: '', content: '', wouldRecommend: true });
    setIsWritingReview(false);
    setSelectedCourse(null);
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Course Reviews</h1>
        <p className="text-slate-600 mt-1">Rate and review your completed courses</p>
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
              const existingReview = reviews.find(r => r.courseId === course.id);
              return (
                <div
                  key={course.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-brand-300 transition-colors"
                >
                  <h3 className="font-semibold text-slate-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-slate-600 mb-3">Completed {course.completedDate}</p>
                  
                  {existingReview ? (
                    <div className="flex items-center gap-2 text-sm">
                      {renderStars(existingReview.rating, false, 'w-4 h-4')}
                      <span className="text-green-600 font-semibold">✓ Reviewed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setIsWritingReview(true);
                      }}
                      className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-semibold"
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
              <p className="text-sm text-slate-500 mt-1">Share your experience with this course</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Overall Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  {renderStars(newReview.rating, true, 'w-10 h-10')}
                  {newReview.rating > 0 && (
                    <span className="text-2xl font-bold text-brand-600">{newReview.rating}.0</span>
                  )}
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Review Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Summarize your experience..."
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  maxLength={100}
                />
                <p className="text-xs text-slate-500 mt-1">{newReview.title.length}/100 characters</p>
              </div>

              {/* Review Content */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Your Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Share details about your experience, what you learned, and what could be improved..."
                  value={newReview.content}
                  onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                  rows="8"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-slate-500 mt-1">{newReview.content.length}/1000 characters</p>
              </div>

              {/* Recommendation */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="recommend"
                  checked={newReview.wouldRecommend}
                  onChange={(e) => setNewReview({ ...newReview, wouldRecommend: e.target.checked })}
                  className="w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <label htmlFor="recommend" className="flex items-center gap-2 cursor-pointer">
                  <ThumbsUp className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    I would recommend this course to others
                  </span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsWritingReview(false);
                  setSelectedCourse(null);
                  setNewReview({ rating: 0, title: '', content: '', wouldRecommend: true });
                }}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-semibold"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Reviews */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">My Reviews</h2>
        
        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-12 h-12 text-brand-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No reviews yet</h3>
            <p className="text-slate-500">
              Complete courses and share your feedback to help other learners
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-1">{review.courseName}</h3>
                    <div className="flex items-center gap-3">
                      {renderStars(review.rating, false, 'w-5 h-5')}
                      <span className="text-sm text-slate-500">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                  {review.wouldRecommend && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <ThumbsUp className="w-3 h-3" />
                      Recommended
                    </div>
                  )}
                </div>

                <h4 className="font-semibold text-slate-900 mb-2">{review.title}</h4>
                <p className="text-slate-600 leading-relaxed">{review.content}</p>

                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm text-slate-500">By {review.userName}</span>
                  <div className="flex gap-2">
                    <button className="text-sm text-slate-600 hover:text-brand-600 transition-colors font-semibold">
                      Edit
                    </button>
                    <button className="text-sm text-slate-600 hover:text-red-600 transition-colors font-semibold">
                      Delete
                    </button>
                  </div>
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
