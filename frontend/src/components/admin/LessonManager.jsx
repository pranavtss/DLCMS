import { useState } from 'react';
import { Plus, Trash2, Download, Play, Edit2, Save, X } from 'lucide-react';

const getYouTubeVideoId = (url) => {
  if (!url) return null;
  
  const cleanUrl = url.split('?')[0].split('#')[0];
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const vParam = urlParams.get('v');
  if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
    return vParam;
  }
  
  return null;
};

const getYouTubeThumbnail = (url) => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const LessonManager = ({ courseId, lessons, onLessonAdded, onLessonDeleted, onMaterialDeleted }) => {
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    videoUrlsInput: '',
    description: '',
  });
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    url: '',
    type: 'pdf',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editingLessonData, setEditingLessonData] = useState({
    title: '',
    videoUrlsInput: '',
    description: '',
  });
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [editingMaterialData, setEditingMaterialData] = useState({
    name: '',
    url: '',
    type: 'pdf',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizeVideoUrls = (value) =>
    value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

  const getLessonVideoUrls = (lesson) => {
    if (Array.isArray(lesson.videoUrls) && lesson.videoUrls.length > 0) {
      return lesson.videoUrls;
    }
    if (lesson.videoUrl) {
      return [lesson.videoUrl];
    }
    return [];
  };

  const guessMaterialType = (mimeType) => {
    if (!mimeType) return 'other';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('officedocument') || mimeType.includes('msword')) {
      return 'doc';
    }
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'other';
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!newLesson.title.trim()) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: newLesson.title,
        description: newLesson.description,
        videoUrls: normalizeVideoUrls(newLesson.videoUrlsInput),
      };

      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/lessons`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add lesson');
      }

      const data = await response.json();
      onLessonAdded();
      setNewLesson({ title: '', videoUrlsInput: '', description: '' });
      setShowLessonForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/lessons/${lessonId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete lesson');
      }

      onLessonDeleted();
    } catch (err) {
      alert('Error deleting lesson');
    }
  };

  const handleAddMaterial = async (lessonId) => {
    if (!newMaterial.name.trim() || !newMaterial.url.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/lessons/${lessonId}/materials`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMaterial),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add material');
      }

      onLessonAdded();
      setNewMaterial({ name: '', url: '', type: 'pdf' });
      setSelectedLessonId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMaterial = async () => {
    if (!selectedFile) return;

    // Check file size (100MB limit for educational materials)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (selectedFile.size > MAX_FILE_SIZE) {
      const sizeInMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      setError(`File is too large (${sizeInMB}MB). Maximum size is 100MB.`);
      setUploading(false);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const fileSizeInMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      console.log('📤 Uploading file:', {
        name: selectedFile.name,
        size: `${fileSizeInMB}MB`,
        type: selectedFile.type,
      });
      
      const response = await fetch('http://localhost:5000/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      console.log('Upload response:', {status: response.status, data});

      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }

      const inferredType = guessMaterialType(data.mimeType);

      setNewMaterial((prev) => ({
        ...prev,
        url: `http://localhost:5000${data.url}`,
        name: prev.name || data.originalName || selectedFile?.name || '',
        type: prev.type === 'pdf' ? inferredType : prev.type,
      }));
      setSelectedFile(null);
      console.log('✅ File uploaded successfully');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (lessonId, materialId) => {
    if (!window.confirm('Delete this material?')) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/lessons/${lessonId}/materials/${materialId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete material');
      }

      onMaterialDeleted();
    } catch (err) {
      alert('Error deleting material');
    }
  };

  const handleStartEditLesson = (lesson) => {
    setEditingLessonId(lesson._id);
    setEditingLessonData({
      title: lesson.title || '',
      description: lesson.description || '',
      videoUrlsInput: getLessonVideoUrls(lesson).join('\n'),
    });
  };

  const handleCancelEditLesson = () => {
    setEditingLessonId(null);
    setEditingLessonData({ title: '', videoUrlsInput: '', description: '' });
  };

  const handleUpdateLesson = async (lessonId) => {
    if (!editingLessonData.title.trim()) {
      setError('Lesson title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: editingLessonData.title,
        description: editingLessonData.description,
        videoUrls: normalizeVideoUrls(editingLessonData.videoUrlsInput),
      };

      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/lessons/${lessonId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update lesson');
      }

      onLessonAdded();
      handleCancelEditLesson();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditMaterial = (material) => {
    setEditingMaterialId(material._id);
    setEditingMaterialData({
      name: material.name || '',
      url: material.url || '',
      type: material.type || 'pdf',
    });
  };

  const handleCancelEditMaterial = () => {
    setEditingMaterialId(null);
    setEditingMaterialData({ name: '', url: '', type: 'pdf' });
  };

  const handleUpdateMaterial = async (lessonId, materialId) => {
    if (!editingMaterialData.name.trim() || !editingMaterialData.url.trim()) {
      setError('Material name and URL are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = `http://localhost:5000/api/courses/${courseId}/lessons/${lessonId}/materials/${materialId}`;
      console.log('🔄 Updating material:', {
        courseId,
        lessonId,
        materialId,
        url,
        data: editingMaterialData
      });

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMaterialData),
      });

      if (!response.ok) {
        throw new Error('Failed to update material');
      }

      onMaterialDeleted();
      handleCancelEditMaterial();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Lessons</h3>
        <button
          onClick={() => setShowLessonForm(!showLessonForm)}
          className="flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Lesson
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Add Lesson Form */}
      {showLessonForm && (
        <form onSubmit={handleAddLesson} className="bg-slate-50 p-4 rounded-lg mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Lesson Title
            </label>
            <input
              type="text"
              value={newLesson.title}
              onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
              placeholder="e.g., Introduction to React"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              YouTube Video URLs
            </label>
            <textarea
              value={newLesson.videoUrlsInput}
              onChange={(e) => setNewLesson({ ...newLesson, videoUrlsInput: e.target.value })}
              placeholder="Paste one URL per line"
              rows="2"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={newLesson.description}
              onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
              placeholder="Add notes for this lesson..."
              rows="2"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowLessonForm(false);
                setNewLesson({ title: '', videoUrlsInput: '', description: '' });
              }}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newLesson.title.trim()}
              className="flex-1 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Lesson'}
            </button>
          </div>
        </form>
      )}

      {/* Lessons List */}
      {lessons && lessons.length > 0 ? (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div key={lesson._id} className="border border-slate-200 rounded-lg overflow-hidden">
              <div
                className="w-full flex items-start justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() =>
                  setExpandedLesson(expandedLesson === lesson._id ? null : lesson._id)
                }
              >
                <div className="flex items-start gap-3 flex-1 text-left">
                  {getLessonVideoUrls(lesson).length > 0 && (
                    <Play className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{lesson.title}</h4>
                    {lesson.description && (
                      <p className="text-sm text-slate-700 mt-1">{lesson.description.substring(0, 80)}{lesson.description.length > 80 ? '...' : ''}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditLesson(lesson);
                      setExpandedLesson(lesson._id);
                    }}
                    className="text-slate-500 hover:text-brand-600 p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLesson(lesson._id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lesson Details */}
              {expandedLesson === lesson._id && (
                <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                  {editingLessonId === lesson._id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">
                          Lesson Title
                        </label>
                        <input
                          type="text"
                          value={editingLessonData.title}
                          onChange={(e) =>
                            setEditingLessonData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">
                          Video URLs
                        </label>
                        <textarea
                          value={editingLessonData.videoUrlsInput}
                          onChange={(e) =>
                            setEditingLessonData((prev) => ({
                              ...prev,
                              videoUrlsInput: e.target.value,
                            }))
                          }
                          rows="2"
                          placeholder="Paste one URL per line"
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">
                          Notes
                        </label>
                        <textarea
                          value={editingLessonData.description}
                          onChange={(e) =>
                            setEditingLessonData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          rows="2"
                          placeholder="Add notes for this lesson..."
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEditLesson}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <X className="w-4 h-4 inline-block mr-1" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateLesson(lesson._id)}
                          disabled={loading}
                          className="flex-1 px-3 py-2 bg-brand-600 text-white rounded text-sm hover:bg-brand-700 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4 inline-block mr-1" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Video URLs with Thumbnails */}
                      {getLessonVideoUrls(lesson).length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-slate-700 block mb-2">
                            Video URLs
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {getLessonVideoUrls(lesson).map((url, index) => {
                              const thumbnail = getYouTubeThumbnail(url);
                              const videoId = getYouTubeVideoId(url);
                              
                              return (
                                <a
                                  key={`${lesson._id}-video-${index}`}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative block rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200 hover:border-brand-300"
                                >
                                  {thumbnail ? (
                                    <>
                                      <img
                                        src={thumbnail}
                                        alt={`Video ${index + 1}`}
                                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                                        onError={(e) => {
                                          e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                          <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                                        </div>
                                      </div>
                                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded">
                                        {index + 1}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full aspect-video bg-slate-200 flex items-center justify-center">
                                      <Play className="w-8 h-8 text-slate-400" />
                                    </div>
                                  )}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {lesson.description && (
                        <div>
                          <p className="text-sm text-slate-800">{lesson.description}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Materials Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Materials</label>
                      <button
                        onClick={() => setSelectedLessonId(lesson._id)}
                        className="text-xs px-2 py-1 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors"
                      >
                        Add Material
                      </button>
                    </div>

                    {selectedLessonId === lesson._id && (
                      <div className="bg-white p-3 rounded border border-slate-200 mb-3 space-y-2">
                        <input
                          type="text"
                          value={newMaterial.name}
                          onChange={(e) =>
                            setNewMaterial({ ...newMaterial, name: e.target.value })
                          }
                          placeholder="Material name"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <div className="space-y-1">
                          <input
                            type="file"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="w-full text-sm"
                          />
                          <p className="text-xs text-slate-500">
                            {selectedFile 
                              ? `Selected: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)`
                              : 'Maximum file size: 100MB'
                            }
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleUploadMaterial}
                          disabled={uploading || !selectedFile}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                          {uploading ? 'Uploading...' : 'Upload File'}
                        </button>
                        <input
                          type="url"
                          value={newMaterial.url}
                          onChange={(e) =>
                            setNewMaterial({ ...newMaterial, url: e.target.value })
                          }
                          placeholder="Material URL"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <select
                          value={newMaterial.type}
                          onChange={(e) =>
                            setNewMaterial({ ...newMaterial, type: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="pdf">PDF</option>
                          <option value="doc">Document</option>
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                          <option value="other">Other</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLessonId(null)}
                            className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddMaterial(lesson._id)}
                            disabled={loading || !newMaterial.name.trim()}
                            className="flex-1 px-2 py-1 bg-brand-600 text-white rounded text-xs hover:bg-brand-700 transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      </div>
                    )}

                    {lesson.materials && lesson.materials.length > 0 ? (
                      <div className="space-y-2">
                        {lesson.materials.map((material) => (
                          <div
                            key={material._id}
                            className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-sm"
                          >
                            {editingMaterialId === material._id ? (
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={editingMaterialData.name}
                                  onChange={(e) =>
                                    setEditingMaterialData((prev) => ({
                                      ...prev,
                                      name: e.target.value,
                                    }))
                                  }
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                  placeholder="Material name"
                                />
                                <input
                                  type="url"
                                  value={editingMaterialData.url}
                                  onChange={(e) =>
                                    setEditingMaterialData((prev) => ({
                                      ...prev,
                                      url: e.target.value,
                                    }))
                                  }
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                  placeholder="Material URL"
                                />
                                <select
                                  value={editingMaterialData.type}
                                  onChange={(e) =>
                                    setEditingMaterialData((prev) => ({
                                      ...prev,
                                      type: e.target.value,
                                    }))
                                  }
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                >
                                  <option value="pdf">PDF</option>
                                  <option value="doc">Document</option>
                                  <option value="image">Image</option>
                                  <option value="video">Video</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                            ) : (
                              <div>
                                <a
                                  href={material.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-slate-900 hover:text-brand-600"
                                >
                                  {material.name}
                                </a>
                                <p className="text-xs text-slate-500">{material.type}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              {editingMaterialId === material._id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateMaterial(lesson._id, material._id)}
                                    className="text-brand-600 hover:text-brand-700 p-1"
                                    disabled={loading}
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEditMaterial}
                                    className="text-slate-500 hover:text-slate-700 p-1"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEditMaterial(material)}
                                    className="text-slate-500 hover:text-brand-600 p-1"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <a
                                    href={material.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand-600 hover:text-brand-700 p-1"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                  <button
                                    onClick={() =>
                                      handleDeleteMaterial(lesson._id, material._id)
                                    }
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No materials yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">No lessons yet. Add one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default LessonManager;
