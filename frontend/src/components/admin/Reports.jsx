import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Users, CheckCircle, Clock, Download, Funnel, Trophy } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import SearchBar from '../common/SearchBar';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courseStats, setCourseStats] = useState({
    totalLearners: 0,
    totalLessons: 0,
    averageCompletion: 0,
    completedCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('progress-desc');
  const [activeStatusLabel, setActiveStatusLabel] = useState(null);
  const [activeProgressLabel, setActiveProgressLabel] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateStats = (courseData, enrollmentData) => {
    const totalLessons = courseData?.lessons?.length || 0;
    const totalLearners = enrollmentData.length;

    if (totalLearners === 0) {
      return {
        totalLearners: 0,
        totalLessons,
        averageCompletion: 0,
        completedCount: 0,
      };
    }

    let sumCompletion = 0;
    let completedCount = 0;

    enrollmentData.forEach((enrollment) => {
      const completion = enrollment.completionPercentage || 0;
      sumCompletion += completion;
      if (completion === 100) {
        completedCount += 1;
      }
    });

    const averageCompletion = Math.round(sumCompletion / totalLearners);

    return {
      totalLearners,
      totalLessons,
      averageCompletion,
      completedCount,
    };
  };

  const getEnrollmentProgress = (enrollment) => {
    const completedLessonsMap = enrollment.completedLessons || {};
    const completedLessons = Object.values(completedLessonsMap).filter(Boolean).length;
    const totalLessons = courseStats.totalLessons || 0;
    const progress =
      enrollment.completionPercentage ||
      (totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0);

    return {
      progress,
      completedLessons,
      totalLessons,
      isCompleted: progress === 100,
      isNotStarted: progress === 0,
    };
  };

  const getStatus = (progress) => {
    if (progress === 100) return 'completed';
    if (progress === 0) return 'not-started';
    return 'in-progress';
  };

  const progressDistribution = useMemo(() => {
    const buckets = [
      { label: '0%', value: 0, color: '#ef4444' },
      { label: '1-25%', value: 0, color: '#f97316' },
      { label: '26-50%', value: 0, color: '#eab308' },
      { label: '51-75%', value: 0, color: '#22c55e' },
      { label: '76-99%', value: 0, color: '#06b6d4' },
      { label: '100%', value: 0, color: '#6366f1' },
    ];

    enrollments.forEach((enrollment) => {
      const { progress } = getEnrollmentProgress(enrollment);
      if (progress === 0) buckets[0].value += 1;
      else if (progress <= 25) buckets[1].value += 1;
      else if (progress <= 50) buckets[2].value += 1;
      else if (progress <= 75) buckets[3].value += 1;
      else if (progress < 100) buckets[4].value += 1;
      else buckets[5].value += 1;
    });

    return buckets;
  }, [enrollments, courseStats.totalLessons]);

  const progressDistributionTotal = useMemo(
    () => progressDistribution.reduce((sum, segment) => sum + segment.value, 0),
    [progressDistribution]
  );

  const activeProgressSegment = useMemo(() => {
    if (!activeProgressLabel) return null;
    return progressDistribution.find((segment) => segment.label === activeProgressLabel) || null;
  }, [activeProgressLabel, progressDistribution]);

  const statusSummary = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    enrollments.forEach((enrollment) => {
      const { progress } = getEnrollmentProgress(enrollment);
      if (progress === 100) completed += 1;
      else if (progress === 0) notStarted += 1;
      else inProgress += 1;
    });

    return [
      { label: 'Completed', value: completed, color: '#10b981' },
      { label: 'In Progress', value: inProgress, color: '#3b82f6' },
      { label: 'Not Started', value: notStarted, color: '#f59e0b' },
    ];
  }, [enrollments, courseStats.totalLessons]);

  const statusSummaryTotal = useMemo(
    () => statusSummary.reduce((sum, segment) => sum + segment.value, 0),
    [statusSummary]
  );

  const activeStatusSegment = useMemo(() => {
    if (!activeStatusLabel) return null;
    return statusSummary.find((segment) => segment.label === activeStatusLabel) || null;
  }, [activeStatusLabel, statusSummary]);

  const colorWithAlpha = (hex, alpha) => {
    const normalized = hex.replace('#', '');
    const full = normalized.length === 3
      ? normalized.split('').map((char) => char + char).join('')
      : normalized;

    const r = Number.parseInt(full.slice(0, 2), 16);
    const g = Number.parseInt(full.slice(2, 4), 16);
    const b = Number.parseInt(full.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const buildPieGradient = (segments, activeLabel = null) => {
    const total = segments.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      return 'conic-gradient(#e2e8f0 0 100%)';
    }

    let cursor = 0;
    const parts = segments.map((segment) => {
      const start = cursor;
      const portion = (segment.value / total) * 100;
      cursor += portion;
      const isActive = !activeLabel || activeLabel === segment.label;
      const segmentColor = isActive ? segment.color : colorWithAlpha(segment.color, 0.2);
      return `${segmentColor} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });

    return `conic-gradient(${parts.join(', ')})`;
  };

  const handleProgressToggle = (label) => {
    setActiveProgressLabel((prev) => (prev === label ? null : label));
  };

  const handleStatusToggle = (label) => {
    setActiveStatusLabel((prev) => (prev === label ? null : label));
  };

  const filteredEnrollments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const result = enrollments.filter((enrollment) => {
      const name = (enrollment.userId?.name || 'Learner').toLowerCase();
      const email = (enrollment.userId?.email || '').toLowerCase();
      const { progress } = getEnrollmentProgress(enrollment);
      const status = getStatus(progress);

      const matchesQuery =
        normalizedQuery.length === 0 ||
        name.includes(normalizedQuery) ||
        email.includes(normalizedQuery);
      const matchesStatus = statusFilter === 'all' || statusFilter === status;

      return matchesQuery && matchesStatus;
    });

    result.sort((a, b) => {
      const aProgress = getEnrollmentProgress(a).progress;
      const bProgress = getEnrollmentProgress(b).progress;
      const aName = a.userId?.name || '';
      const bName = b.userId?.name || '';

      if (sortBy === 'progress-asc') return aProgress - bProgress;
      if (sortBy === 'name-asc') return aName.localeCompare(bName);
      if (sortBy === 'name-desc') return bName.localeCompare(aName);
      return bProgress - aProgress;
    });

    return result;
  }, [enrollments, searchQuery, statusFilter, sortBy, courseStats.totalLessons]);

  const topPerformer = useMemo(() => {
    if (enrollments.length === 0) return null;
    const ranked = [...enrollments].sort(
      (a, b) => getEnrollmentProgress(b).progress - getEnrollmentProgress(a).progress
    );
    const candidate = ranked[0];
    if (!candidate) return null;
    return {
      name: candidate.userId?.name || 'Learner',
      email: candidate.userId?.email || '-',
      progress: getEnrollmentProgress(candidate).progress,
    };
  }, [enrollments, courseStats.totalLessons]);

  const downloadPdf = () => {
    if (!course) return;
    const escapeHtml = (value) =>
      String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const rows = filteredEnrollments
      .map((enrollment) => {
        const meta = getEnrollmentProgress(enrollment);
        return `
          <tr>
            <td>${escapeHtml(enrollment.userId?.name || 'Learner')}</td>
            <td>${escapeHtml(enrollment.userId?.email || '-')}</td>
            <td>${escapeHtml(formatDate(enrollment.enrolledAt || enrollment.createdAt))}</td>
            <td>${meta.completedLessons} / ${meta.totalLessons}</td>
            <td>${meta.progress}%</td>
            <td>${escapeHtml(getStatus(meta.progress))}</td>
          </tr>
        `;
      })
      .join('');

    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) return;

    const generatedOn = new Date().toLocaleString('en-US');
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Course Report - ${escapeHtml(course.title || 'Course')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            .meta { margin-bottom: 16px; font-size: 13px; color: #475569; }
            .chips { margin-bottom: 16px; font-size: 13px; }
            .chips span { display: inline-block; margin-right: 8px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 999px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background: #f8fafc; }
            @page { size: A4 landscape; margin: 12mm; }
          </style>
        </head>
        <body>
          <h1>Course Report</h1>
          <div class="meta">
            <div><strong>Course:</strong> ${escapeHtml(course.title || '-')}</div>
            <div><strong>Instructor:</strong> ${escapeHtml(course.instructor || '-')}</div>
            <div><strong>Generated:</strong> ${escapeHtml(generatedOn)}</div>
          </div>
          <div class="chips">
            <span>Learners: ${courseStats.totalLearners}</span>
            <span>Lessons: ${courseStats.totalLessons}</span>
            <span>Avg Completion: ${courseStats.averageCompletion}%</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Learner</th>
                <th>Email</th>
                <th>Enrolled On</th>
                <th>Lessons Completed</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="6">No learners found for current filters.</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const loadCourseReport = async (courseId) => {
    if (!courseId) return;
    try {
      setLoadingCourse(true);

      const [courseRes, enrollmentsRes] = await Promise.all([
        apiFetch(`/api/admin/courses/${courseId}`),
        apiFetch(`/api/enrollments/course/${courseId}`),
      ]);

      const courseData = courseRes.ok ? await courseRes.json() : null;
      const enrollmentData = enrollmentsRes.ok ? await enrollmentsRes.json() : [];

      setCourse(courseData);
      setEnrollments(enrollmentData);
      setCourseStats(calculateStats(courseData, enrollmentData));
    } catch (error) {
      console.error('Error loading course report:', error);
    } finally {
      setLoadingCourse(false);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/api/admin/courses');
        const data = res.ok ? await res.json() : [];
        setCourses(data);

        if (data.length > 0) {
          const firstId = data[0]._id;
          setSelectedCourseId(firstId);
          await loadCourseReport(firstId);
        }
      } catch (error) {
        console.error('Error loading courses for reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCourseChange = async (event) => {
    const courseId = event.target.value;
    setSelectedCourseId(courseId);
    await loadCourseReport(courseId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white px-3 sm:px-5 py-3 sm:py-4 shadow-sm flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Course Reports</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            View learners enrolled in a course and how many lessons they have completed.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl shadow-sm border border-slate-200 px-2 sm:px-4 py-1.5 sm:py-2 flex-shrink-0">
          <span className="text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap\">Select course</span>
          <select
            value={selectedCourseId}
            onChange={handleCourseChange}
            className="min-w-[140px] sm:min-w-[220px] rounded-lg border border-slate-300 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white\"
          >
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {course && (
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Learners enrolled</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{courseStats.totalLearners}</p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 sm:w-6 h-5 sm:h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Lessons in course</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{courseStats.totalLessons}</p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Average completion</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{courseStats.averageCompletion}%</p>
                <p className="text-xs text-slate-500 mt-1">
                  {courseStats.completedCount} learner
                  {courseStats.completedCount === 1 ? '' : 's'} completed the course
                </p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-4">Completion Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] md:grid-cols-[220px,minmax(260px,1fr)] items-start gap-3 sm:gap-6 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4 min-h-[260px]">
            <div className="h-[220px] flex items-center justify-center">
              <div
                className="relative w-44 h-44 rounded-full border border-slate-200 shadow-sm transition-all"
                style={{
                  background: buildPieGradient(statusSummary, activeStatusLabel),
                  transform: activeStatusLabel ? 'scale(1.03)' : 'scale(1)',
                }}
                aria-label="Completion status pie chart"
              >
                <div
                  className="absolute inset-5 sm:inset-7 rounded-full bg-white border border-slate-100 flex flex-col items-center justify-center text-center shadow-inner cursor-pointer"
                  onClick={() => setActiveStatusLabel(null)}
                  title="Clear selection"
                >
                  <p className="text-xs uppercase tracking-widest text-slate-500">Learners</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">
                    {activeStatusSegment ? activeStatusSegment.value : statusSummaryTotal}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeStatusSegment
                      ? `${Math.round((activeStatusSegment.value / (statusSummaryTotal || 1)) * 100)}% • ${activeStatusSegment.label}`
                      : '100% • Total'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-1 sm:space-y-2 flex-1 h-full">
              {statusSummary.map((segment) => {
                const isActive = activeStatusLabel === segment.label;
                const isDimmed = activeStatusLabel && !isActive;
                return (
                <button
                  type="button"
                  key={segment.label}
                  onClick={() => handleStatusToggle(segment.label)}
                  className={`w-full flex items-center justify-between text-xs sm:text-sm rounded-lg px-2 py-1 sm:py-1.5 transition-colors ${
                    isActive ? 'bg-white border border-slate-300 shadow-sm' : 'border border-transparent hover:bg-white/80'
                  } ${isDimmed ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full ring-2 ring-white" style={{ backgroundColor: segment.color }} />
                    <span className="text-slate-700">{segment.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {segment.value}
                    <span className="text-slate-500 font-normal ml-1">
                      ({statusSummaryTotal > 0 ? Math.round((segment.value / statusSummaryTotal) * 100) : 0}%)
                    </span>
                  </span>
                </button>
              );})}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-4">Progress Distribution</h3>
          <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] md:grid-cols-[220px,minmax(260px,1fr)] items-start gap-3 sm:gap-6 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4 min-h-[260px]">
            <div className="h-[180px] sm:h-[220px] flex items-center justify-center">
              <div
                className="relative w-40 sm:w-44 h-40 sm:h-44 rounded-full border border-slate-200 shadow-sm transition-all"
                style={{
                  background: buildPieGradient(progressDistribution, activeProgressLabel),
                  transform: activeProgressLabel ? 'scale(1.03)' : 'scale(1)',
                }}
                aria-label="Progress distribution pie chart"
              >
                <div
                  className="absolute inset-5 sm:inset-7 rounded-full bg-white border border-slate-100 flex flex-col items-center justify-center text-center shadow-inner cursor-pointer"
                  onClick={() => setActiveProgressLabel(null)}
                  title="Clear selection"
                >
                  <p className="text-xs uppercase tracking-widest text-slate-500">Learners</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">
                    {activeProgressSegment ? activeProgressSegment.value : progressDistributionTotal}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeProgressSegment
                      ? `${Math.round((activeProgressSegment.value / (progressDistributionTotal || 1)) * 100)}% • ${activeProgressSegment.label}`
                      : '100% • Total'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-1 sm:space-y-2 flex-1 h-full">
              {progressDistribution.map((segment) => {
                const isActive = activeProgressLabel === segment.label;
                const isDimmed = activeProgressLabel && !isActive;
                return (
                <button
                  type="button"
                  key={segment.label}
                  onClick={() => handleProgressToggle(segment.label)}
                  className={`w-full flex items-center justify-between text-xs sm:text-sm rounded-lg px-2 py-1 sm:py-1.5 transition-colors ${
                    isActive ? 'bg-white border border-slate-300 shadow-sm' : 'border border-transparent hover:bg-white/80'
                  } ${isDimmed ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full ring-2 ring-white" style={{ backgroundColor: segment.color }} />
                    <span className="text-slate-700">{segment.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {segment.value}
                    <span className="text-slate-500 font-normal ml-1">
                      ({progressDistributionTotal > 0 ? Math.round((segment.value / progressDistributionTotal) * 100) : 0}%)
                    </span>
                  </span>
                </button>
              );})}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-3 rounded-2xl border border-slate-200 bg-white p-2 sm:p-3 shadow-sm">
        <SearchBar
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search learner by name or email"
          compact
          containerClassName="shadow-none border-slate-200"
        />

        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 sm:px-3 py-1.5 sm:py-2">
          <Funnel className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-500 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="text-xs sm:text-sm bg-transparent outline-none flex-1"
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In progress</option>
            <option value="not-started">Not started</option>
          </select>
        </div>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 flex-1 sm:flex-none"
        >
          <option value="progress-desc">Sort: Progress high to low</option>
          <option value="progress-asc">Sort: Progress low to high</option>
          <option value="name-asc">Sort: Name A-Z</option>
          <option value="name-desc">Sort: Name Z-A</option>
        </select>

        <button
          type="button"
          onClick={downloadPdf}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-slate-900 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium hover:bg-slate-700 transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          <span className="hidden xs:inline">Download PDF</span>
          <span className="inline xs:hidden">PDF</span>
        </button>
      </div>

      {topPerformer && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 sm:w-5 h-4 sm:h-5 text-amber-800" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">Top performer: {topPerformer.name}</p>
              <p className="text-xs text-slate-600 truncate">{topPerformer.email}</p>
            </div>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-amber-900 flex-shrink-0">{topPerformer.progress}% complete</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Learner progress for this course</h2>
            {course && (
              <p className="text-xs text-slate-500 mt-1">
                {course.instructor && <>Instructor: {course.instructor} • </>}
                Created on {formatDate(course.createdAt)}
              </p>
            )}
          </div>
          {loadingCourse && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              Updating...
            </div>
          )}
        </div>

        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No learners found for the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Learner
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    Enrolled on
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Lessons
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((enrollment) => {
                  const { completedLessons, totalLessons, progress, isCompleted, isNotStarted } =
                    getEnrollmentProgress(enrollment);

                  return (
                    <tr key={enrollment._id}>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-slate-900 text-xs sm:text-sm">
                        {enrollment.userId?.name || 'Learner'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-slate-600 hidden sm:table-cell text-xs sm:text-sm">
                        {enrollment.userId?.email || '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-slate-600 hidden lg:table-cell text-xs sm:text-sm">
                        {formatDate(enrollment.enrolledAt || enrollment.createdAt)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-right text-slate-700 text-xs sm:text-sm">
                        {completedLessons} / {totalLessons}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-right text-slate-700 text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2 justify-end">
                          <span>{progress}%</span>
                          <div className="w-16 sm:w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isCompleted
                                  ? 'bg-emerald-500'
                                  : progress >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-right text-xs sm:text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isNotStarted
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {isCompleted ? 'Completed' : isNotStarted ? 'Not started' : 'In progress'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
