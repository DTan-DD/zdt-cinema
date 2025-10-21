import React, { useEffect, useState } from "react";
// import { dummyShowsData } from "../../assets/assets";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { CheckIcon, DeleteIcon, StarIcon } from "lucide-react";
import { kConverter } from "../../lib/KConverter";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const AddShows = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showPrice, setShowPrice] = useState("");
  const [addingShow, setAddingShow] = useState(false);

  // New state structure for cinema and shows selection
  const [cinemaShowsData, setCinemaShowsData] = useState({});
  const [selectedCinema, setSelectedCinema] = useState("");
  const [dateTimeInput, setDateTimeInput] = useState("");

  const fetchNowPlayingMovies = async () => {
    try {
      // const { data } = await axios.get("/v1/api/shows/now-playing", {
      const { data } = await axios.get("/v1/api/shows/movies", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setNowPlayingMovies(data.metadata.movies);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tải danh sách phim");
    }
  };

  const fetchCinemas = async () => {
    try {
      const { data } = await axios.get("/v1/api/cinemas/all");
      if (data.success) {
        setCinemas(data.metadata.cinemas);
      }
    } catch (error) {
      console.error("Error fetching cinemas: ", error);
    }
  };

  const handleAddShowTime = () => {
    if (!selectedCinema || !dateTimeInput) {
      toast.error("Please select a cinema and datetime");
      return;
    }

    const [date, time] = dateTimeInput.split("T");
    if (!date || !time) return;

    setCinemaShowsData((prev) => {
      const cinemaData = prev[selectedCinema] || {};
      const dateData = cinemaData[date] || [];

      if (!dateData.includes(time)) {
        return {
          ...prev,
          [selectedCinema]: {
            ...cinemaData,
            [date]: [...dateData, time].sort(),
          },
        };
      }
      return prev;
    });

    // Clear datetime input after adding
    setDateTimeInput("");
  };

  const handleRemoveTime = (cinemaId, date, time) => {
    setCinemaShowsData((prev) => {
      const cinemaData = { ...prev[cinemaId] };
      const updatedTimes = cinemaData[date].filter((t) => t !== time);

      if (updatedTimes.length === 0) {
        delete cinemaData[date];
      } else {
        cinemaData[date] = updatedTimes;
      }

      if (Object.keys(cinemaData).length === 0) {
        const { [cinemaId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [cinemaId]: cinemaData,
      };
    });
  };

  const handleRemoveCinema = (cinemaId) => {
    setCinemaShowsData((prev) => {
      const { [cinemaId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async () => {
    try {
      setAddingShow(true);

      if (!selectedMovie || Object.keys(cinemaShowsData).length === 0 || !showPrice) {
        toast.error("Please fill in all required fields!");
        return;
      }

      // Transform data to match backend format
      const cinemasInput = Object.entries(cinemaShowsData).map(([cinemaId, dates]) => {
        const shows = Object.entries(dates).map(([date, times]) => ({
          date,
          times,
        }));

        return {
          cinemaId,
          shows,
        };
      });

      const payload = {
        movieId: selectedMovie,
        showPrice: Number(showPrice),
        cinemasInput,
      };

      const { data } = await axios.post("/v1/api/shows/add", payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        toast.success(data.message);
        // Reset form
        setSelectedMovie(null);
        setCinemaShowsData({});
        setShowPrice("");
        setSelectedCinema("");
        setDateTimeInput("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error adding show: ", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAddingShow(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNowPlayingMovies();
      fetchCinemas();
    }
  }, [user]);

  return nowPlayingMovies.length > 0 ? (
    <>
      <Title text1="Danh sách" text2="Shows" />

      {/* Movies Grid */}
      <p className="mt-10 text-lg font-medium">Danh sách phim</p>
      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {nowPlayingMovies.map((movie) => (
            <div
              key={movie._id}
              className="max-w-40 relative cursor-pointer group-hover:not-hover:opacity-40 
            hover:-translate-y-1 transition duration-300"
              onClick={() => setSelectedMovie(movie._id)}
            >
              <div className="relative rounded-lg overflow-hidden">
                <img src={image_base_url + movie.poster_path} alt="" className="brightness-90 object-cover w-full" />
                <div
                  className="text-sm flex items-center justify-between p-2 bg-black/70 w-full
                absolute bottom-0 left-0"
                >
                  <p className="flex items-center gap-1 text-sm text-gray-400 ">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />
                    {movie.vote_average.toFixed(1)}
                  </p>
                  <p className="text-gray-300">{kConverter(movie.vote_count)} Votes</p>
                </div>
              </div>
              {selectedMovie === movie._id && (
                <div className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded bg-primary">
                  <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
              <p className="font-medium truncate">{movie.title}</p>
              <p className="text-sm text-gray-400">{movie.release_date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Show Price Input */}
      <div className="mt-8">
        <label htmlFor="" className="block text-sm font-medium mb-2">
          Giá vé
        </label>
        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
          <p className="text-gray-400 text-sm">{currency}</p>
          <input type="number" className="outline-none bg-transparent" min={0} value={showPrice} onChange={(e) => setShowPrice(e.target.value)} placeholder="Nhập giá vé" />
        </div>
      </div>

      {/* Cinema and DateTime Selection */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Chọn rạp chiếu</label>

          <div className="space-y-3">
            {/* Cinema Dropdown */}
            <select
              className="w-full md:w-auto border border-gray-600  text-white rounded-lg px-3 py-2 outline-none bg-transparent"
              value={selectedCinema}
              onChange={(e) => setSelectedCinema(e.target.value)}
            >
              <option value="" className="bg-transparent text-black" disabled>
                Chọn rạp chiếu
              </option>
              {cinemas.map((c) => (
                <option key={c._id} value={c._id} className="bg-transparent text-black">
                  {c.name}
                </option>
              ))}
            </select>

            {/* DateTime Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="datetime-local"
                className="border border-gray-600 rounded-lg px-3 py-2 outline-none bg-transparent"
                value={dateTimeInput}
                onChange={(e) => setDateTimeInput(e.target.value)}
              />
              <button className="bg-primary/80 text-white px-4 py-2 text-sm rounded-lg hover:bg-primary transition-colors" onClick={handleAddShowTime}>
                Thêm suất chiếu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Display Selected Shows by Cinema */}
      {Object.keys(cinemaShowsData).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">Các suất chiếu đã chọn:</h2>
          <div className="space-y-4">
            {Object.entries(cinemaShowsData).map(([cinemaId, dates]) => {
              const cinema = cinemas.find((c) => c._id === cinemaId);
              return (
                <div key={cinemaId} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-primary">{cinema?.name}</h3>
                    <button onClick={() => handleRemoveCinema(cinemaId)} className="text-red-500 hover:text-red-700 text-sm">
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(dates).map(([date, times]) => (
                      <div key={date} className="flex flex-col sm:flex-row gap-2">
                        <div className="font-medium text-sm min-w-[100px]">{date}</div>
                        <div className="flex flex-wrap gap-2">
                          {times.map((time) => (
                            <div key={time} className="border border-primary/50 px-3 py-1 rounded flex items-center gap-2 text-sm">
                              <span>{time}</span>
                              <button onClick={() => handleRemoveTime(cinemaId, date, time)} className="text-red-500 hover:text-red-700">
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Before Submit */}
      {selectedMovie && Object.keys(cinemaShowsData).length > 0 && showPrice && (
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="font-medium mb-2">Summary</h3>
          <div className="text-sm space-y-1 text-gray-300">
            <p>Movie: {nowPlayingMovies.find((m) => m._id === selectedMovie)?.title}</p>
            <p>
              Price: {currency} {showPrice}
            </p>
            <p>Total Cinemas: {Object.keys(cinemaShowsData).length}</p>
            <p>Total Shows: {Object.values(cinemaShowsData).reduce((total, dates) => total + Object.values(dates).reduce((sum, times) => sum + times.length, 0), 0)}</p>
          </div>
        </div>
      )}

      {/* Add Show Button */}
      <button
        onClick={handleSubmit}
        disabled={addingShow || !selectedMovie || Object.keys(cinemaShowsData).length === 0 || !showPrice}
        className={`px-8 py-2 mt-6 rounded transition-all ${
          addingShow || !selectedMovie || Object.keys(cinemaShowsData).length === 0 || !showPrice
            ? "bg-gray-600 cursor-not-allowed opacity-50"
            : "bg-primary text-white hover:bg-primary/80 cursor-pointer"
        }`}
      >
        {addingShow ? "Đang thêm..." : "Thêm suất chiếu"}
      </button>
    </>
  ) : (
    <Loading />
  );
};

export default AddShows;
