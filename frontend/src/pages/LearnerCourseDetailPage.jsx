import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Users, Star, Download, Play, FileText, Image as ImageIcon, Film, CheckCircle, List, ChevronDown, User } from 'lucide-react';
import { getImageUrl } from '../utils/api';

const getYouTubeVideoId = (url) => {
  if (!url) return null;

  const normalized = String(url).trim();
  const idPattern = /^[a-zA-Z0-9_-]{11}$/;

  if (idPattern.test(normalized)) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace('www.', '');

    if (host === 'youtu.be') {
      const shortId = parsed.pathname.split('/').filter(Boolean)[0];
      return idPattern.test(shortId || '') ? shortId : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const vParam = parsed.searchParams.get('v');
      if (idPattern.test(vParam || '')) return vParam;

      const parts = parsed.pathname.split('/').filter(Boolean);
      const markerIndex = parts.findIndex((part) => ['embed', 'shorts', 'live'].includes(part));
      if (markerIndex >= 0) {
        const candidate = parts[markerIndex + 1];
        return idPattern.test(candidate || '') ? candidate : null;
      }
    }
  } catch {
    // Fall through to regex parsing for non-standard URLs.
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/(?:embed|shorts|live)\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
};

const getYouTubeThumbnail = (url) => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

const getYouTubeThumbnailFallbacks = (videoId) => [
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  `https://img.youtube.com/vi/${videoId}/default.jpg`,
];

const handleYouTubeThumbnailError = (event, videoId) => {
  if (!videoId) return;

  const img = event.currentTarget;
  const fallbacks = getYouTubeThumbnailFallbacks(videoId);
  const index = Number(img.dataset.fallbackIndex || '0');

  if (index < fallbacks.length) {
    img.dataset.fallbackIndex = String(index + 1);
    img.src = fallbacks[index];
    return;
  }

  // Stop retry loop after all known thumbnail variants fail.
  img.onerror = null;
  img.style.display = 'none';
};

const getLessonVideoUrls = (lesson) => {
  if (lesson.videoUrls && lesson.videoUrls.length > 0) {
    return lesson.videoUrls;
  }
  if (lesson.videoUrl) {
    return [lesson.videoUrl];
  }
  return [];
};

const isPresentationMaterial = (material) => {
  const type = String(material?.type || '').toLowerCase();
  const name = String(material?.name || '').toLowerCase();
  const url = String(material?.url || '').toLowerCase();

  if (type.includes('ppt') || type.includes('presentation')) return true;

  return /\.pptx?(\?|#|$)/.test(name) || /\.pptx?(\?|#|$)/.test(url);
};

const isPdfMaterial = (material) => {
  const type = String(material?.type || '').toLowerCase();
  const name = String(material?.name || '').toLowerCase();
  const url = String(material?.url || '').toLowerCase();

  if (type === 'pdf') return true;

  return /\.pdf(\?|#|$)/.test(name) || /\.pdf(\?|#|$)/.test(url);
};

const getOfficeViewerUrl = (sourceUrl) =>
  `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(sourceUrl)}`;

const getPdfViewerUrl = (sourceUrl) =>
  `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(sourceUrl)}`;

const getMaterialHref = (material) => {
  const sourceUrl = getImageUrl(material?.url);
  return sourceUrl || '#';
};

const LearnerCourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLessons, setExpandedLessons] = useState({});
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [completedLessons, setCompletedLessons] = useState({});

  const getCompletedLessonCount = (lessons = [], completedMap = {}) => {
    return lessons.filter((lesson) => Boolean(completedMap[lesson._id])).length;
  };

  const getProgressPercentage = (lessons = [], completedMap = {}) => {
    if (!Array.isArray(lessons) || lessons.length === 0) return 0;
    const completedCount = getCompletedLessonCount(lessons, completedMap);
    return Math.round((completedCount / lessons.length) * 100);
  };

  useEffect(() => {
    fetchCourseDetails();
    checkEnrollmentStatus();
    loadCompletionStatus();
  }, [courseId]);

  const loadCompletionStatus = () => {
    const completed = JSON.parse(localStorage.getItem(`course_${courseId}_completed`) || '{}');
    setCompletedLessons(completed);
  };

  const syncCompletionPercentage = async () => {
    try {
      if (!userId || !course?.lessons?.length) return;

      const completed = JSON.parse(localStorage.getItem(`course_${courseId}_completed`) || '{}');

      for (const lesson of course.lessons) {
        const lessonId = lesson._id;
        const isCompleted = Boolean(completed[lessonId]);

        await fetch('https://dlcms-g6hp.onrender.com/api/enrollments/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, courseId, lessonId, completed: isCompleted })
        });
      }
    } catch (err) {
      console.error('Error syncing completion:', err);
    }
  };

  useEffect(() => {
    syncCompletionPercentage();
  }, [course, courseId]);

  const toggleLessonCompletion = async (lessonId) => {
    const newCompleted = { ...completedLessons, [lessonId]: !completedLessons[lessonId] };
    setCompletedLessons(newCompleted);
    localStorage.setItem(`course_${courseId}_completed`, JSON.stringify(newCompleted));

    try {
      if (!userId) return;

      const response = await fetch('https://dlcms-g6hp.onrender.com/api/enrollments/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          courseId,
          lessonId,
          completed: newCompleted[lessonId]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }
    } catch (err) {
      console.error('Error updating completion:', err);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      if (!userId) {
        setIsEnrolled(false);
        return;
      }

      const response = await fetch(`https://dlcms-g6hp.onrender.com/api/enrollments/user/${userId}`);
      if (!response.ok) {
        setIsEnrolled(false);
        return;
      }

      const enrollments = await response.json();
      const enrolled = enrollments.some(
        (enrollment) => (enrollment.courseId?._id || enrollment.courseId) === courseId
      );
      setIsEnrolled(enrolled);
    } catch (err) {
      console.error('Error checking enrollment:', err);
      setIsEnrolled(false);
    }
  };

  const handleUnenroll = async () => {
    try {
      if (!userId) {
        navigate('/login');
        return;
      }

      setUnenrolling(true);

      const response = await fetch(`https://dlcms-g6hp.onrender.com/api/enrollments/${courseId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to unenroll');
      }

      const data = await response.json();
      
      setCourse(prev => ({
        ...prev,
        students: data.students !== undefined ? data.students : Math.max(0, (prev.students || 0) - 1)
      }));

      setIsEnrolled(false);
      navigate('/learner/my-courses');
    } catch (err) {
      alert('Error unenrolling: ' + err.message);
    } finally {
      setUnenrolling(false);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      const response = await fetch(`https://dlcms-g6hp.onrender.com/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Course not found');
      }
      const data = await response.json();
      setCourse(data);
      if (data.lessons && data.lessons.length > 0) {
        const expanded = {};
        data.lessons.forEach(lesson => {
          expanded[lesson._id] = true;
        });
        setExpandedLessons(expanded);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLesson = (lessonId) => {
    setExpandedLessons(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }));
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'doc':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-green-500" />;
      case 'video':
        return <Film className="w-4 h-4 text-purple-500" />;
      default:
        return <Download className="w-4 h-4 text-slate-500" />;
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
          onClick={() => navigate('/learner/browse-courses')}
          className="flex items-center gap-2 px-4 py-2 text-brand-600 hover:text-brand-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Course not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <button
        onClick={() => navigate('/learner/browse-courses')}
        className="flex items-center gap-2 px-4 py-2 text-brand-600 hover:text-brand-700 font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </button>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-80 bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center p-8">
            {course.thumbnail ? (
              <img 
                src={getImageUrl(course.thumbnail)} 
                alt={course.title}
                className="w-full h-48 object-contain"
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center">
                <BookOpen className="w-24 h-24 text-white opacity-50" />
              </div>
            )}
          </div>
          
          <div className="flex-1 p-8">
            {course.category && (
              <div className="inline-block mb-4">
                <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold uppercase rounded">
                  {course.category}
                </span>
              </div>
            )}
            
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{course.title}</h1>
            
            <p className="text-slate-600 mb-6 leading-relaxed">
              {course.description || 'No description available'}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 mb-6 text-sm text-slate-600">
              {course.instructor && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">{course.instructor}</span>
                </div>
              )}
              {course.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>{course.duration}</span>
                </div>
              )}
              {course.level && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  <span>{course.level}</span>
                </div>
              )}
            </div>

            {isEnrolled && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">PROGRESS</span>
                  <span className="text-sm font-bold text-slate-900">
                    {getProgressPercentage(course.lessons, completedLessons)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${getProgressPercentage(course.lessons, completedLessons)}%`
                    }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              {isEnrolled ? (
                <>
                  <button
                    onClick={() => {
                      const firstLesson = course.lessons?.[0];
                      if (firstLesson) {
                        setExpandedLessons({ [firstLesson._id]: true });
                        document.getElementById(`lesson-${firstLesson._id}`)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold transition-colors"
                  >
                    Continue Learning
                  </button>
                  <button
                    onClick={handleUnenroll}
                    disabled={unenrolling}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold transition-colors disabled:opacity-50"
                  >
                    {unenrolling ? 'Unenrolling...' : 'Unenroll'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/learner/browse-courses')}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold transition-colors"
                >
                  Back to Courses
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Course Content</h2>
          <p className="text-slate-600 text-sm mt-1">
            {course.lessons?.length || 0} {course.lessons?.length === 1 ? 'lesson' : 'lessons'}
          </p>
        </div>

        {!isEnrolled ? (
          <div className="px-6 py-12 text-center text-slate-500">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-base font-medium text-slate-700 mb-1">Content is locked</p>
            <p className="text-sm text-slate-500 mb-5">
              Enroll in this course from Browse Courses to access lessons, videos, and materials.
            </p>
            <button
              onClick={() => navigate('/learner/browse-courses')}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-semibold transition-colors"
            >
              Go to Browse Courses
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson, index) => {
              const videoUrls = getLessonVideoUrls(lesson);
              const youtubeVideoUrls = videoUrls.filter((url) => getYouTubeVideoId(url));
              const isExpanded = expandedLessons[lesson._id];

              return (
                <div
                  key={lesson._id}
                  id={`lesson-${lesson._id}`}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden transition-colors"
                >
                  <div
                    className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-slate-50"
                    onClick={() => toggleLesson(lesson._id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">
                          {lesson.title}
                        </h3>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 bg-slate-50">
                      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
                        {lesson.description && (
                          <div>
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                              <List className="w-5 h-5 text-blue-600" />
                              Notes
                            </h4>
                            <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-blue-500">
                              <div className="text-slate-700 space-y-2">
                                {lesson.description.split('\n').filter(line => line.trim()).map((line, idx) => (
                                  <p key={idx} className="leading-relaxed">{line}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {lesson.materials && lesson.materials.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                              <Download className="w-5 h-5 text-blue-600" />
                              Course Materials
                            </h4>
                            <div className="space-y-2">
                              {lesson.materials.map((material) => {
                                const href = getMaterialHref(material);
                                const isPpt = isPresentationMaterial(material);
                                const isPdf = isPdfMaterial(material);
                                
                                // For PPT files, use an onclick handler to open in Office viewer
                                if (isPpt) {
                                  return (
                                    <button
                                      key={material._id}
                                      onClick={() => {
                                        const sourceUrl = getImageUrl(material?.url);
                                        window.open(getOfficeViewerUrl(sourceUrl), '_blank');
                                      }}
                                      className="w-full text-left flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                                    >
                                      <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded flex items-center justify-center">
                                        {getMaterialIcon(material.type)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                          {material.name}
                                        </p>
                                        <p className="text-xs text-slate-500 uppercase mt-1">
                                          {material.type}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                }

                                // For PDF files, open Google Docs viewer to avoid raw-asset binary downloads.
                                if (isPdf) {
                                  return (
                                    <button
                                      key={material._id}
                                      onClick={() => {
                                        const sourceUrl = getImageUrl(material?.url);
                                        window.open(getPdfViewerUrl(sourceUrl), '_blank');
                                      }}
                                      className="w-full text-left flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                                    >
                                      <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded flex items-center justify-center">
                                        {getMaterialIcon(material.type)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                          {material.name}
                                        </p>
                                        <p className="text-xs text-slate-500 uppercase mt-1">
                                          {material.type}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                }
                                
                                // For other file types, use regular link
                                return (
                                  <a
                                    key={material._id}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                                  >
                                    <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded flex items-center justify-center">
                                      {getMaterialIcon(material.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                        {material.name}
                                      </p>
                                      <p className="text-xs text-slate-500 uppercase mt-1">
                                        {material.type}
                                      </p>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {youtubeVideoUrls.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                              <Play className="w-5 h-5 text-blue-600" />
                              Video Lessons
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {youtubeVideoUrls.map((videoUrl, vidIndex) => {
                                const thumbnail = getYouTubeThumbnail(videoUrl);
                                const videoId = getYouTubeVideoId(videoUrl);
                                
                                return (
                                  <a
                                    key={vidIndex}
                                    href={videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative block rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all border border-slate-200"
                                  >
                                    <>
                                      <img
                                        src={thumbnail}
                                        alt={`Video ${vidIndex + 1}`}
                                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                                        onError={(e) => handleYouTubeThumbnailError(e, videoId)}
                                      />
                                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                          <Play className="w-8 h-8 text-white fill-white ml-1" />
                                        </div>
                                      </div>
                                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded">
                                        Video {vidIndex + 1}
                                      </div>
                                    </>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLessonCompletion(lesson._id);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              completedLessons[lesson._id]
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <CheckCircle className={`w-5 h-5 ${
                              completedLessons[lesson._id] ? 'fill-green-700' : ''
                            }`} />
                            {completedLessons[lesson._id] ? 'Completed' : 'Mark as Complete'}
                          </button>
                        </div>

                        {!lesson.description && youtubeVideoUrls.length === 0 && (!lesson.materials || lesson.materials.length === 0) && (
                          <div className="text-center py-8 text-slate-500">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No content available for this lesson yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
              })
            ) : (
              <div className="px-6 py-12 text-center text-slate-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>No lessons available yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerCourseDetailPage;
