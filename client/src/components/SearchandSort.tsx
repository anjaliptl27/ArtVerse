import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

interface SearchAndSortProps {
  sortOptions: {
    value: string;
    label: string;
  }[];
  filterOptions?: {
    value: string;
    label: string;
  }[];
  placeholder?: string;
  showPriceRange?: boolean;
  showSkillsFilter?: boolean;
}

const SearchAndSort = ({
  placeholder = "Search...",
}: SearchAndSortProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  // Update search term when URL params change
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);

    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }

    // Reset to first page when searching
    params.delete("page");
    setSearchParams(params);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative">
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchAndSort;
