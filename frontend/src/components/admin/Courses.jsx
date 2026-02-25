import { Plus, BookOpen } from 'lucide-react';

const Courses = () => {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Courses</h1>
          <p className="text-slate-600 mt-1">Create and manage your courses</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-semibold text-sm shadow-sm hover:shadow transition-all">
          <Plus className="w-5 h-5" />
          New Course
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-12 h-12 text-brand-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses yet. Create your first course!</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Get started by creating a new course. Add lessons, materials, and invite learners to join.
        </p>
      </div>
    </div>
  );
};

export default Courses;
