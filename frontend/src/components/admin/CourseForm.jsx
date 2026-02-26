import { X, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

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
  const [newLesson, setNewLesson] = useState({
    title: '',
    videoUrlsInput: '',
    description: '',
    materials: [],
  });
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    url: '',
    type: 'pdf',
  });
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(null);

  const normalizeVideoUrls = (value) =>
    value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

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
      
      const response = await fetch('http://localhost:5000/api/uploads', {
        method: 'POST',
        body: formDataUpload,
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

  const handleAddLesson = () => {
    if (newLesson.title.trim()) {
      const lessonPayload = {
        title: newLesson.title,
        description: newLesson.description,
        videoUrls: normalizeVideoUrls(newLesson.videoUrlsInput),
        materials: newLesson.materials,
      };

      setFormData((prev) => ({
        ...prev,
        lessons: [...prev.lessons, lessonPayload],
      }));
      setNewLesson({
        title: '',
        videoUrlsInput: '',
        description: '',
        materials: [],
      });
      setSelectedLessonIndex(null);
    }
  };

  const handleRemoveLesson = (index) => {
    setFormData((prev) => ({
      ...prev,
      lessons: prev.lessons.filter((_, i) => i !== index),
    }));
    setSelectedLessonIndex(null);
  };

  const handleAddMaterial = () => {
    if (newMaterial.name.trim() && newMaterial.url.trim()) {
      if (selectedLessonIndex !== null) {
        setFormData((prev) => {
          const updatedLessons = [...prev.lessons];
          updatedLessons[selectedLessonIndex].materials.push({ ...newMaterial });
          return { ...prev, lessons: updatedLessons };
        });
      } else {
        setNewLesson((prev) => ({
          ...prev,
          materials: [...prev.materials, { ...newMaterial }],
        }));
      }
      setNewMaterial({ name: '', url: '', type: 'pdf' });
    }
  };

  const handleRemoveMaterial = (lessonIndex, materialIndex) => {
    setFormData((prev) => {
      const updatedLessons = [...prev.lessons];
      updatedLessons[lessonIndex].materials = updatedLessons[lessonIndex].materials.filter(
        (_, i) => i !== materialIndex
      );
      return { ...prev, lessons: updatedLessons };
    });
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Create New Course</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
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

          {/* Description */}
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

          {/* Course Image Upload */}
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

          {/* Instructor */}
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

          {/* Category */}
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

          {/* Level */}
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
            {/* Duration */}
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

          {/* Lessons Section */}
          <div className="border-t border-slate-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Course Lessons</h3>

            {/* Add Lesson Form */}
            <div className="bg-slate-50 p-4 rounded-lg mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                  placeholder="e.g., Introduction to React"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  YouTube Video URLs
                </label>
                <textarea
                  value={newLesson.videoUrlsInput}
                  onChange={(e) => setNewLesson({ ...newLesson, videoUrlsInput: e.target.value })}
                  placeholder="Paste one URL per line"
                  rows="2"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newLesson.description}
                  onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                  placeholder="Add notes for this lesson..."
                  rows="2"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Materials for New Lesson */}
              {selectedLessonIndex === null && (
                <div className="bg-white p-3 rounded border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Lesson Materials (Optional)</p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      placeholder="Material name (e.g., Slides, Code)"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="url"
                      value={newMaterial.url}
                      onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                      placeholder="Material URL"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <select
                      value={newMaterial.type}
                      onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="pdf">PDF</option>
                      <option value="doc">Document</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="other">Other</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddMaterial}
                      disabled={!newMaterial.name || !newMaterial.url}
                      className="w-full px-3 py-1 bg-brand-500 text-white text-sm rounded hover:bg-brand-600 disabled:opacity-50 transition-colors"
                    >
                      Add Material
                    </button>
                  </div>

                  {newLesson.materials.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {newLesson.materials.map((mat, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-brand-50 p-2 rounded text-sm">
                          <div>
                            <p className="font-medium text-slate-900">{mat.name}</p>
                            <p className="text-slate-500 text-xs">{mat.type}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewLesson((prev) => ({
                              ...prev,
                              materials: prev.materials.filter((_, i) => i !== idx),
                            }))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddLesson}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors disabled:opacity-50"
                disabled={!newLesson.title}
              >
                <Plus className="w-4 h-4" />
                Add Lesson
              </button>
            </div>

            {/* Lessons List */}
            {formData.lessons.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  {formData.lessons.length} lesson{formData.lessons.length !== 1 ? 's' : ''} added
                </p>
                {formData.lessons.map((lesson, lessonIdx) => (
                  <div key={lessonIdx} className="bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{lesson.title}</h4>
                        {lesson.videoUrls && lesson.videoUrls.length > 0 && (
                          <p className="text-xs text-slate-500">Videos: {lesson.videoUrls.length}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLesson(lessonIdx)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {lesson.materials.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-brand-300">
                        <p className="text-xs font-medium text-slate-600 mb-1">Materials:</p>
                        {lesson.materials.map((mat, matIdx) => (
                          <div key={matIdx} className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-600">{mat.name} ({mat.type})</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(lessonIdx, matIdx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
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
