import React from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";

const Movies = () => {
  const { shows } = useAppContext();

  return shows.length > 0 ? (
    <div className="relative mb-60 my-40 px-6 md:px-16 lg:px-40 xl:px-40 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle top="50px" left="50px" />
      <h1 className="text-lg font-medium my-4">Now Showing</h1>
      <div className="flex flex-wrap gap-8 max-sm:justify-center">
        {shows.map((movie) => (
          <MovieCard key={movie._id} movie={movie} />
        ))}
      </div>
    </div>
  ) : (
    <div className=" flex flex-col justify-center items-center h-screen">
      <h1 className="text-3xl text-center font-bold">No movies available</h1>
    </div>
  );
};

export default Movies;
