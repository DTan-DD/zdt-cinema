import { StarIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import timeFormat from "../lib/timeFormat";
import { useAppContext } from "../context/AppContext";

const MovieCard = ({ movie, isReleased = true }) => {
  const navigate = useNavigate();
  const { image_base_url } = useAppContext();

  return (
    <div
      className="flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1
    transition duration-300 w-66"
    >
      <img
        onClick={() => {
          navigate(`/movies/${movie._id}/${isReleased ? "now-showing" : "upcoming"}`);
          scrollTo(0, 0);
        }}
        src={image_base_url + movie.backdrop_path}
        alt=""
        className="rounded-lg w-full h-52 object-right-bottom object-cover  cursor-pointer"
      />

      <p className="font-semibold mt-2 truncate">{movie.title}</p>

      <p className="text-sm text-gray-400 mt-2">
        {new Date(movie.release_date).getFullYear()} •{" "}
        {movie.genres
          .slice(0, 2)
          .map((genre) => genre.name)
          .join(" | ")}{" "}
        • {timeFormat(movie.runtime)}
      </p>

      {!isReleased && <p className="text-sm text-gray-200 mt-2">Ngày ra mắt: {movie.release_date}</p>}

      <div className="flex items-center justify-between mt-4 pb-3">
        {isReleased ? (
          <button
            onClick={() => {
              navigate(`/movies/${movie._id}/${isReleased ? "now-showing" : "upcoming"}`);
              scrollTo(0, 0);
            }}
            className="px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full
        font-medium cursor-pointer"
          >
            Đặt vé
          </button>
        ) : (
          <button
            onClick={() => {
              navigate(`/movies/${movie._id}/upcoming`);
              scrollTo(0, 0);
            }}
            className="px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full
        font-medium cursor-pointer"
          >
            Chi tiết
          </button>
        )}

        {isReleased && (
          <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
            <StarIcon className="w-4 h-4 fill-primary text-primary" />
            {movie.vote_average.toFixed(1)}
          </p>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
