import { useState, useEffect } from "react";
import { MapPin, Phone, Clock, Star, ChevronDown, Calendar, Users } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const CinemaInfoPage = () => {
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [cinemas, setCinemas] = useState([]);
  const [shows, setShows] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCinemas();
  }, []);

  useEffect(() => {
    if (selectedCinema) {
      fetchCinemaShows(selectedCinema._id);
    }
  }, [selectedCinema]);

  const handleShowtimeClick = (show, showTime) => {
    if (!show) {
      return toast("Please select showtime!");
    }
    navigate(`/movies/${show.slug}/shows/${showTime.showCode}`);
    scrollTo(0, 0);
  };

  const fetchCinemas = async () => {
    try {
      // Replace with your actual API
      const { data } = await axios.get("/v1/api/cinemas/all");

      setCinemas(data.metadata.cinemas);
      if (data.metadata.cinemas.length > 0) {
        setSelectedCinema(data.metadata.cinemas[0]);
      }
    } catch (error) {
      // console.error("Error fetching cinemas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCinemaShows = async (cinemaId) => {
    try {
      // Replace with your actual API
      const { data } = await axios.get(`/v1/api/shows/cinema/${cinemaId}`);
      setShows(data.metadata.movies);
    } catch (error) {
      // console.error("Error fetching shows:", error);
    }
  };

  const formatRuntime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get all unique dates from shows and sort them
  const getAvailableDates = (shows) => {
    const dateSet = new Set();
    shows.forEach((show) => {
      show.showtimes.forEach((showtime) => {
        dateSet.add(showtime.date);
      });
    });
    const dates = Array.from(dateSet);
    const sortedDates = dates.sort((a, b) => new Date(a) - new Date(b));

    // Set first available date as default
    if (sortedDates.length > 0 && !selectedDate) {
      setSelectedDate(sortedDates[0]);
    }

    return sortedDates;
  };

  // Filter shows by selected date
  const getShowsForDate = (shows, date) => {
    if (!date) return [];

    return shows
      .map((show) => ({
        ...show,
        showtimes: show.showtimes.filter((showtime) => showtime.date === date),
      }))
      .filter((show) => show.showtimes.length > 0);
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    const [month, day, year] = dateString.split("/");
    const date = new Date(`${year}-${month}-${day}`);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return { label: "Hôm nay", date: `${day}/${month}` };
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return { label: "Mai", date: `${day}/${month}` };
    } else {
      const weekday = date.toLocaleDateString("vi-VN", { weekday: "short" });
      return { label: weekday, date: `${day}/${month}` };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading cinema information...</p>
        </div>
      </div>
    );
  }

  if (!selectedCinema) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">No cinema data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <img src={selectedCinema.image} alt={selectedCinema.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-16">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{selectedCinema.name}</h1>
            <div className="flex flex-wrap items-center gap-6 text-gray-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="max-w-md">{selectedCinema.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                <a href={`tel:${selectedCinema.phone}`} className="hover:text-primary transition">
                  {selectedCinema.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-16 py-12">
        {/* Cinema Selector */}
        <div className="mb-12">
          <label className="block text-white font-semibold mb-3">Chọn rạp chiếu:</label>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full md:w-96 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-left text-white flex items-center justify-between transition"
            >
              <span>{selectedCinema.name}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 md:w-96 bg-gray-800 border border-gray-600 rounded-lg mt-1 shadow-xl z-50">
                {cinemas.map((cinema) => (
                  <button
                    key={cinema._id}
                    onClick={() => {
                      setSelectedCinema(cinema);
                      setSelectedDate("");
                      setShowDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition first:rounded-t-lg last:rounded-b-lg ${
                      selectedCinema._id === cinema._id ? "bg-primary text-white" : "text-gray-300"
                    }`}
                  >
                    <div className="font-medium">{cinema.name}</div>
                    <div className="text-sm text-gray-400 truncate">{cinema.address}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cinema Info Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* About Cinema */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4">Giới thiệu rạp</h2>
            <p className="text-gray-300 leading-relaxed mb-6">{selectedCinema.description}</p>

            {selectedCinema.features && (
              <div className="grid sm:grid-cols-2 gap-4">
                {selectedCinema.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
                    <div className="text-primary mt-1">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold text-white">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cinema Stats */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Thông tin rạp</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="w-5 h-5" />
                    <span>Tổng ghế ngồi</span>
                  </div>
                  <span className="text-white font-semibold">{selectedCinema.totalSeats || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Star className="w-5 h-5" />
                    <span>Đánh giá</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-semibold">4.8</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedCinema.facilities && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Tiện ích</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCinema.facilities.map((facility, index) => (
                    <span key={index} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Showtimes Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Lịch chiếu phim</h2>

          {/* Date Selector */}
          {shows.length > 0 && (
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {getAvailableDates(shows).map((date, index) => {
                const displayDate = formatDateDisplay(date);
                const isSelected = selectedDate === date;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition ${isSelected ? "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                  >
                    <div className="text-center">
                      <div className="text-sm">{displayDate.label}</div>
                      <div className="font-bold">{displayDate.date}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Movies and Showtimes */}
          <div className="space-y-8">
            {shows.length > 0 ? (
              getShowsForDate(shows, selectedDate).map((show) => (
                <div key={show._id} className="bg-gray-800 rounded-xl overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0">
                        <img
                          src={`https://image.tmdb.org/t/p/w300${show.movie.poster_path}`}
                          alt={show.movie.title}
                          className="w-24 h-36 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = "/placeholder-movie.jpg";
                          }}
                        />
                      </div>

                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-white mb-2">{show.movie.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm mb-4">
                          <span>{formatRuntime(show.movie.runtime)}</span>
                          <span>•</span>
                          <span>{show.movie.genres?.map((g) => g.name).join(", ")}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {show.showtimes?.map((showtime, index) => (
                            <button
                              onClick={() => handleShowtimeClick(show, showtime)}
                              key={index}
                              className="bg-gray-700 hover:bg-primary hover:text-white transition-all duration-300 rounded-lg p-4 text-left group transform hover:scale-105"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-lg text-white group-hover:text-white">{showtime.time}</div>
                                <div className="text-xs text-primary group-hover:text-white font-semibold bg-primary/20 group-hover:bg-white/20 px-2 py-1 rounded">{showtime.format}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                {shows.length === 0 ? (
                  <>
                    <p className="text-lg">Hiện tại chưa có lịch chiếu</p>
                    <p>Vui lòng quay lại sau hoặc chọn rạp khác</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg">Không có suất chiếu nào trong ngày này</p>
                    <p>Vui lòng chọn ngày khác</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinemaInfoPage;
