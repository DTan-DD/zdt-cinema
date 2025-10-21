// components/SearchModal.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";

const SearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  // Debounce search function
  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && !searchQuery.trim()) {
      toast.error("Please enter a movie name to search");
      closeModal();
      return;
    }

    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      closeModal();
      scrollTo(0, 0);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    // debounceSearch(query);
  };

  // Clear search and close modal
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Close modal and reset state
  const closeModal = () => {
    clearSearch();
    onClose();
  };

  // Close search modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} aria-label="Close search modal" />

      {/* Search Container */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
        {/* Search Header */}
        <div className="p-6 border-b border-gray-200">
          <form className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm phim, diễn viên, thể loại..."
              className="w-full pl-12 pr-12 py-3 text-lg border border-gray-300 text-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              autoFocus
            />
            {searchQuery && (
              <button type="button" onClick={clearSearch} className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600" aria-label="Clear search">
                <XIcon className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>

        {/* Search Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Nhấn Enter để tìm kiếm</span>
            <span>ESC để đóng</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
