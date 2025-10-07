import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { Heart, PlayCircleIcon, StarIcon, TicketIcon, X } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const MovieDetails = ({ isReleased = true }) => {
  const navigate = useNavigate();
  const { id, status } = useParams();
  const [show, setShow] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { axios, getToken, user, image_base_url, shows, favoriteMovies, fetchFavoriteMovies } = useAppContext();
  if (status === "upcoming") isReleased = false;

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/v1/api/shows/${id}`);
      if (data.success) {
        setShow(data.metadata);
      }
    } catch (error) {
      console.error("Error fetching shows: ", error);
    }
  };

  const handleFavorite = async () => {
    try {
      if (!user) return toast.error("Please login to favorite movies");

      const { data } = await axios.post(
        "/v1/api/users/update-favorite",
        {
          movieId: id,
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Error favoriting movie", error);
    }
  };

  // Function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(show?.movie?.trailer);
  const isLongText = show?.movie?.overview.length > 500;
  const toggleTrailer = () => {
    setShowTrailer(!showTrailer);
  };

  useEffect(() => {
    setExpanded(false);
  }, [id]);

  useEffect(() => {
    getShow();
  }, [id]);

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col gap-8 max-w-6xl md:flex-row mx-auto">
        <img src={image_base_url + show.movie.poster_path} alt={show.movie.title} className="max-md:mx-auto rounded-xl h-104 max-w-76 object-cover" />

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary uppercase tracking-wider text-sm font-medium">ENGLISH</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">{show.movie.title}</h1>

          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            <span className="font-medium">{show.movie.vote_average.toFixed(1)}</span>
            <span className="text-gray-400">User Rating</span>
          </div>

          <motion.div animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: "easeInOut" }} className={`overflow-hidden ${!expanded && isLongText ? "line-clamp-5" : ""}`}>
            <p className="text-gray-400 mt-2 text-sm leading-relaxed">{show.movie.overview}</p>
          </motion.div>

          {isLongText && (
            <button onClick={() => setExpanded(!expanded)} className="mt-2 text-left text-blue-500 text-sm hover:underline">
              {expanded ? "Ẩn bớt" : "Hiển thị thêm"}
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2 text-gray-300 text-sm">
            <span className="bg-gray-800 px-2 py-1 rounded">{timeFormat(show.movie.runtime)}</span>
            <span>•</span>
            <span>{show.movie.genres.map((genre) => genre.name).join(", ")}</span>
            <span>•</span>
            <span>{show.movie.release_date.split("-")[0]}</span>
          </div>

          <div className="flex items-center flex-wrap gap-4 mt-6">
            <button
              onClick={toggleTrailer}
              disabled={!videoId}
              className={`flex items-center gap-2 px-5 md:px-7 py-3 text-sm transition rounded-md font-medium cursor-pointer active:scale-95 ${
                videoId ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              <PlayCircleIcon className="w-5 h-5" />
              {videoId ? "Trailer" : "Không có trailer"}
            </button>

            {isReleased && (
              <a
                href="#dateSelect"
                className="flex items-center gap-2 px-5 md:px-7 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md
              font-medium cursor-pointer active:scale-95 text-white"
              >
                <TicketIcon className="w-5 h-5" />
                Đặt vé
              </a>
            )}

            <button onClick={handleFavorite} className="bg-gray-700 hover:bg-gray-600 rounded-full p-2.5 transition cursor-pointer active:scale-95">
              <Heart className={`w-5 h-5 ${favoriteMovies.find((movie) => movie._id === show.movie._id) ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Trailer Section - Centered and Full Width */}
      {showTrailer && videoId && (
        <div className="max-w-7xl mx-auto md:px-4 px-0 space-y-6 mt-10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-white">Trailer</h3>
            <button onClick={toggleTrailer} className="p-2 hover:bg-gray-700 rounded-full transition-colors" aria-label="Close trailer">
              <X className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
          </div>

          <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1`}
              title={`${show.movie.title} Trailer`}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      <p className="text-lg font-medium mt-20">Các diễn viên</p>
      <div className="relative mt-8 pb-4">
        {/* Nút trái */}
        <button
          onClick={() => {
            document.getElementById("cast-list").scrollBy({ left: -200, behavior: "smooth" });
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/150 hover:bg-white rounded-full p-2 shadow"
        >
          ←
        </button>

        <div id="cast-list" className="overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center gap-6 w-max px-0 md:px-6">
            {show.movie.casts.slice(0, 12).map((cast, index) => (
              <div key={index} className="flex flex-col items-center text-center transition-transform hover:scale-105">
                <img src={image_base_url + cast.profile_path} alt={cast.name} className="rounded-full h-16 md:h-24 aspect-square object-cover shadow-md hover:shadow-lg transition-shadow" />
                <p className="font-medium text-xs md:text-sm mt-3 line-clamp-1">{cast.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Nút phải */}
        <button
          onClick={() => {
            document.getElementById("cast-list").scrollBy({ left: 200, behavior: "smooth" });
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/150 hover:bg-white rounded-full p-2 shadow"
        >
          →
        </button>
      </div>

      {/* Booking */}
      {Object.keys(show.dateTime).length > 0 ? <DateSelect dateTime={show.dateTime} id={id} /> : <p className="text-lg font-medium mt-20">Hiện không có lịch chiếu cho phim này</p>}

      <p className="text-lg font-medium mt-20 mb-8">Bạn cũng có thể thích</p>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {shows
          .filter((movie) => movie._id !== id)
          .slice(0, 4)
          .map((movie, index) => (
            <MovieCard key={index} movie={movie} />
          ))}
      </div>
      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate("/movies");
            scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md 
          font-medium cursor-pointer"
        >
          Xem thêm
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
