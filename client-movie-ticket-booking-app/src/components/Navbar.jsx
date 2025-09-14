import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketCheckIcon, TicketPlus, TicketPlusIcon, TrendingUpIcon, XIcon } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";
import { debounce } from "lodash";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const { favoriteMovies, axios, image_base_url } = useAppContext();

  // Debounce search function
  const debounceSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await axios.get(`/v1/api/movies/search?q=${encodeURIComponent(query)}`);
        if (data.success) {
          setSearchResults(data.movies || []);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [axios]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debounceSearch(query);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Add to search history
      const newHistory = [searchQuery, ...searchHistory.filter((item) => item !== searchQuery)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));

      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Handle movie click
  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Handle history item click
  const handleHistoryClick = (historyItem) => {
    setSearchQuery(historyItem);
    debounceSearch(historyItem);
  };

  // Load search history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Close search modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isSearchOpen]);

  return (
    <>
      <div
        className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6
      md:px-16 lg:px-36 py-5"
      >
        <Link to="/" className="max-md:flex-1">
          <img src={assets.logo} alt="" className="w-36 h-auto" />
        </Link>

        <div
          className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg
        z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 min-md:px-8 py-3
        max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 
        md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 
        ${isOpen ? "max-md:w-full" : "max-md:w-0"}`}
        >
          <XIcon className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer" onClick={() => setIsOpen(!isOpen)} />
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/"
          >
            Home
          </Link>
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/movies"
          >
            Movies
          </Link>
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/"
          >
            Theaters
          </Link>
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/"
          >
            Releases
          </Link>
          {favoriteMovies.length > 0 && (
            <Link
              onClick={() => {
                scrollTo(0, 0);
                setIsOpen(false);
              }}
              to="/favorite"
            >
              Favorites
            </Link>
          )}
        </div>

        <div className="flex items-center gap-8">
          <SearchIcon className="max-md:hidden w-6 h-6 cursor-pointer hover:text-primary transition-colors" onClick={() => setIsSearchOpen(true)} />
          {!user ? (
            <button
              onClick={openSignIn}
              className="px-4 py-1 sm:px-7 sm:py-2 bg-primary
          hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
            >
              Login
            </button>
          ) : (
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action label="My Bookings" labelIcon={<TicketPlus width={15} />} onClick={() => navigate("/my-bookings")} />
              </UserButton.MenuItems>
            </UserButton>
          )}
        </div>

        <MenuIcon className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer" onClick={() => setIsOpen(!isOpen)} />
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}></div>

          {/* Search Container */}
          <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
            {/* Search Header */}
            <div className="p-6 border-b border-gray-200">
              <form onSubmit={handleSearchSubmit} className="relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Tìm kiếm phim, diễn viên, thể loại..."
                  className="w-full pl-12 pr-12 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                )}
              </form>
            </div>

            {/* Search Content */}
            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                // Loading State
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600">Đang tìm kiếm...</span>
                </div>
              ) : searchQuery ? (
                // Search Results
                <div className="p-2">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="px-4 py-2 text-sm text-gray-500 font-medium">Kết quả tìm kiếm ({searchResults.length})</div>
                      {searchResults.map((movie) => (
                        <div key={movie._id} onClick={() => handleMovieClick(movie._id)} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                          <img src={movie.poster_path ? image_base_url + movie.poster_path : assets.defaultMoviePoster} alt={movie.title} className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{movie.title}</h4>
                            <p className="text-sm text-gray-600 truncate">
                              {movie.release_date && new Date(movie.release_date).getFullYear()}
                              {movie.genres && movie.genres.length > 0 && (
                                <span className="ml-2">
                                  {movie.genres
                                    .slice(0, 2)
                                    .map((g) => g.name || g)
                                    .join(", ")}
                                </span>
                              )}
                            </p>
                            {movie.vote_average && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="text-sm text-gray-600">{movie.vote_average}/10</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Không tìm thấy kết quả nào</p>
                      <p className="text-sm text-gray-400 mt-1">Hãy thử với từ khóa khác</p>
                    </div>
                  )}
                </div>
              ) : (
                // Default State - Show search history and suggestions
                <div className="p-2">
                  {searchHistory.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-sm text-gray-500 font-medium">Tìm kiếm gần đây</div>
                      {searchHistory.map((item, index) => (
                        <div key={index} onClick={() => handleHistoryClick(item)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{item}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 my-2"></div>
                    </>
                  )}

                  <div className="px-4 py-2 text-sm text-gray-500 font-medium">Gợi ý tìm kiếm</div>
                  {["Phim hành động", "Phim kinh dị", "Phim hài", "Phim tình cảm", "Marvel", "Disney"].map((suggestion, index) => (
                    <div key={index} onClick={() => handleHistoryClick(suggestion)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                      <TrendingUpIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
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
      )}
    </>
  );
};

export default Navbar;
