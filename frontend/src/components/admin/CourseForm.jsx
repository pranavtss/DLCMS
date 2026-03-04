import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { apiFetch } from '../../utils/api';

const CourseForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    category: '',
    level: 'Beginner',
    duration: '',
    lessons: [],
    thumbnail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
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
      
      console.log('Uploading course image:', imageFile.name, imageFile.size);
      
      const response = await apiFetch('/api/uploads', {
        method: 'POST',
        body: formDataUpload,
        _skipHeaders: true, // Don't set Content-Type, let browser set it for multipart
        _noAutoLogout: true // Don't auto-logout on 403
      });
      
      const data = await response.json();
      console.log('Course image upload response:', {status: response.status, data});
      
      if (!response.ok) throw new Error(data.message || 'Failed to upload image');
      
      setFormData(prev => ({ ...prev, thumbnail: data.url }));
      setError('');
      console.log('Course image uploaded successfully');
    } catch (err) {
      console.error('Course image upload error:', err);
      setError('Failed to upload image: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, thumbnail: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        instructor: '',
        category: '',
        level: 'Beginner',
        duration: '',
        lessons: [],
        thumbnail: '',
      });
      setImageFile(null);
      setImagePreview('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Create New Course</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Course Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., React for Beginners"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your course..."
              rows="3"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Course Image
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
              {imagePreview || formData.thumbnail ? (
                <div className="relative">
                  <img
                    src={imagePreview || formData.thumbnail}
                    alt="Course preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="mt-2">
                    <label htmlFor="course-image" className="cursor-pointer">
                      <span className="text-brand-600 hover:text-brand-700 font-medium">
                        Upload an image
                      </span>
                      <input
                        id="course-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
              {imageFile && !formData.thumbnail && (
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={uploadingImage}
                  className="mt-3 w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Instructor Name
            </label>
            <input
              type="text"
              name="instructor"
              value={formData.instructor}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              <option value="">Select a category</option>
              <option value="Programming">Programming</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="Marketing">Marketing</option>
              <option value="Photography">Photography</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Level
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g., 8 weeks"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.category}
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
