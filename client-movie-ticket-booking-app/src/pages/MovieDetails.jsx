import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { Heart, PlayCircleIcon, StarIcon } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [show, setShow] = useState(null);

  const { axios, getToken, user, image_base_url, shows, favoriteMovies, fetchFavoriteMovies } = useAppContext();

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/v1/api/shows/${id}`);
      // console.log(data);
      if (data.success) {
        setShow(data);
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
      // console.log(data);
      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Error favoriting movie", error);
    }
  };

  useEffect(() => {
    getShow();
  }, [id]);

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col gap-8 max-w-6xl md:flex-row mx-auto">
        <img src={image_base_url + show.movie.poster_path} alt="" className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover" />
        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">ENGLISH</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">{show.movie.title}</h1>
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {show.movie.vote_average.toFixed(1)} User Rating
          </div>

          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">{show.movie.overview}</p>

          <p>
            {timeFormat(show.movie.runtime)} * {show.movie.genres.map((genre) => genre.name).join(", ")} * {show.movie.release_date.split("-")[0]}
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button
              className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-400 hover:bg-gray-900
            transition rounded-md font-medium cursor-pointer active:scale-95"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </button>
            <a
              href="#dateSelect"
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md
            font-medium cursor-pointer active:scale-95"
            >
              Buy Tickets
            </a>
            <button onClick={handleFavorite} className="bg-gray-700 rounded-full p-2.5 transition cursor-pointer active:scale-95">
              <Heart className={`w-5 h-5 ${favoriteMovies.find((movie) => movie._id === show.movie._id) ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <p className="text-lg font-medium mt-20">Your Favorite Cast</p>
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
          <div className="flex items-center gap-6 w-max px-6">
            {show.movie.casts.slice(0, 12).map((cast, index) => (
              <div key={index} className="flex flex-col items-center text-center transition-transform hover:scale-105">
                <img src={image_base_url + cast.profile_path} alt={cast.name} className="rounded-full h-20 md:h-24 aspect-square object-cover shadow-md hover:shadow-lg transition-shadow" />
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
      <DateSelect dateTime={show.dateTime} id={id} />

      <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {shows.slice(0, 4).map((movie, index) => (
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
          Show more
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
