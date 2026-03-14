import { Search } from 'lucide-react';

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search...",
  containerClassName = "",
  compact = false,
}) => {
  const containerPadding = compact ? 'p-2' : 'p-6';
  const iconSize = compact ? 'w-4 h-4 left-3' : 'w-5 h-5 left-4';
  const inputPadding = compact ? 'pl-9 py-2' : 'pl-12 py-3';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${containerPadding} ${containerClassName}`}>
      <div className="relative">
        <Search className={`absolute top-1/2 transform -translate-y-1/2 text-slate-400 ${iconSize}`} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full pr-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm ${inputPadding}`}
        />
      </div>
    </div>
  );
};

export default SearchBar;
