import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Edit2, Save, X, Upload, Image as ImageIcon } from 'lucide-react';
import LessonManager from '../components/admin/LessonManager';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
};

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editedCourse, setEditedCourse] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    duration: '',
    instructor: '',
    status: 'active',
    thumbnail: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Course not found');
      }
      const data = await response.json();
      setCourse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditCourse = () => {
    setEditedCourse({
      title: course.title || '',
      description: course.description || '',
      category: course.category || '',
      level: course.level || '',
      duration: course.duration || '',
      instructor: course.instructor || '',
      status: course.status || 'active',
      thumbnail: course.thumbnail || ''
    });
    setImagePreview(course.thumbnail || '');
    setIsEditingCourse(true);
  };

  const handleCancelEditCourse = () => {
    setIsEditingCourse(false);
    setEditedCourse({
      title: '',
      description: '',
      category: '',
      level: '',
      duration: '',
      instructor: '',
      status: 'active',
      thumbnail: ''
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    
    try {
      setUploadingImage(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', imageFile);
      
      console.log('Uploading image:', imageFile.name, imageFile.size);
      
      const response = await fetch('http://localhost:5000/api/uploads', {
        method: 'POST',
        body: formDataUpload,
      });
      
      const data = await response.json();
      console.log('Image upload response:', {status: response.status, data});
      
      if (!response.ok) throw new Error(data.message || 'Failed to upload image');
      
      setEditedCourse(prev => ({ ...prev, thumbnail: data.url }));
      console.log('Image uploaded successfully');
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setEditedCourse(prev => ({ ...prev, thumbnail: '' }));
  };

  const handleUpdateCourse = async () => {
    try {
      setUpdateLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editedCourse.title,
          description: editedCourse.description,
          category: editedCourse.category,
          level: editedCourse.level,
          duration: editedCourse.duration,
          instructor: editedCourse.instructor,
          status: editedCourse.status,
          thumbnail: editedCourse.thumbnail
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update course');
      }

      await fetchCourseDetails();
      setIsEditingCourse(false);
    } catch (err) {
      alert('Error updating course: ' + err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-500">Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="py-8">
        <button
          onClick={() => navigate('/admin/courses')}
          className="flex items-center gap-2 px-4 py-2 text-brand-600 hover:text-brand-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error || 'Course not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/courses')}
          className="flex items-center gap-2 px-4 py-2 text-brand-600 hover:text-brand-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {isEditingCourse ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">
                      Course Title
                    </label>
                    <input
                      type="text"
                      value={editedCourse.title}
                      onChange={(e) => setEditedCourse({ ...editedCourse, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">
                      Description
                    </label>
                    <textarea
                      value={editedCourse.description}
                      onChange={(e) => setEditedCourse({ ...editedCourse, description: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">
                      Course Image
                    </label>
                    
                    {imagePreview && (
                      <div className="mb-3 relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Course preview" 
                          className="w-48 h-32 object-cover rounded border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-2 items-center">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded hover:bg-slate-50">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Choose Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                      
                      {imageFile && !editedCourse.thumbnail && (
                        <button
                          type="button"
                          onClick={handleImageUpload}
                          disabled={uploadingImage}
                          className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50 text-sm"
                        >
                          {uploadingImage ? 'Uploading...' : 'Upload Image'}
                        </button>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-2">
                      Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">
                        Category
                      </label>
                      <select
                        value={editedCourse.category}
                        onChange={(e) => setEditedCourse({ ...editedCourse, category: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="Programming">Programming</option>
                        <option value="Design">Design</option>
                        <option value="Business">Business</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">
                        Level
                      </label>
                      <select
                        value={editedCourse.level}
                        onChange={(e) => setEditedCourse({ ...editedCourse, level: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={editedCourse.duration}
                      onChange={(e) => setEditedCourse({ ...editedCourse, duration: e.target.value })}
                      placeholder="e.g., 8 weeks"
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{course.title}</h1>
                  <p className="text-slate-600 mb-4">{course.description}</p>

                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-100 text-brand-700">
                      {course.category}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                      {course.level}
                    </span>
                    {course.duration && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                        {course.duration}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Course Image and Edit Button */}
            <div className="flex-shrink-0 ml-6 flex flex-col items-center gap-3">
              {course.thumbnail ? (
                <img 
                  src={getImageUrl(course.thumbnail)} 
                  alt={course.title}
                  className="w-32 h-32 object-cover rounded-lg border border-slate-200"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white opacity-50" />
                </div>
              )}
              {!isEditingCourse && (
                <button
                  onClick={handleStartEditCourse}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Course
                </button>
              )}
            </div>
          </div>

          {/* Course Info Grid */}
          {isEditingCourse ? (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    Instructor
                  </label>
                  <input
                    type="text"
                    value={editedCourse.instructor}
                    onChange={(e) => setEditedCourse({ ...editedCourse, instructor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    Status
                  </label>
                  <select
                    value={editedCourse.status}
                    onChange={(e) => setEditedCourse({ ...editedCourse, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEditCourse}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4 inline-block mr-1" />
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCourse}
                  disabled={updateLoading}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline-block mr-1" />
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Instructor
                </p>
                <p className="text-lg font-semibold text-slate-900">{course.instructor}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Lessons
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {course.lessons && Array.isArray(course.lessons) ? course.lessons.length : 0}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Status
                </p>
                <p className={`text-lg font-semibold ${
                  course.status === 'active' ? 'text-green-600' : 
                  course.status === 'draft' ? 'text-amber-600' : 
                  'text-slate-600'
                }`}>
                  {course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'Active'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lesson Manager */}
      <LessonManager
        courseId={courseId}
        lessons={course.lessons || []}
        onLessonAdded={fetchCourseDetails}
        onLessonDeleted={fetchCourseDetails}
        onMaterialDeleted={fetchCourseDetails}
      />
    </div>
  );
};

export default CourseDetailPage;
