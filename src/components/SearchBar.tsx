import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Search, X } from 'lucide-react';
import { Quote } from '../types';

interface SearchBarProps {
  quotes: Quote[];
  onSearch: (results: Quote[]) => void;
}

export interface SearchBarRef {
  clear: () => void;
  hasSearchTerm: () => boolean;
}

export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({ quotes, onSearch }, ref) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout>();

  useImperativeHandle(ref, () => ({
    clear: () => {
      setSearchTerm('');
      onSearch([]);
    },
    hasSearchTerm: () => searchTerm.length > 0
  }));

  const handleSearch = (term: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      const results = quotes.filter(quote => {
        const searchTermLower = term.toLowerCase();
        return quote.text.toLowerCase().includes(searchTermLower) ||
               quote.source?.toLowerCase().includes(searchTermLower);
      });

      onSearch(results);
    }, 300);
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder="البحث"
          className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              onSearch([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';