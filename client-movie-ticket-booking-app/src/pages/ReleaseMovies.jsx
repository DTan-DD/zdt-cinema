import React, { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import axios from "axios";
import toast from "react-hot-toast";
import Loading from "../components/Loading";

const UpcomingMovies = () => {
  const [upcomingShows, setUpcomingShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUpcomingShows = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get("/v1/api/shows/upcoming");
      if (data.success) {
        setUpcomingShows(data.metadata.movies);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingShows();
  }, []);

  return !isLoading ? (
    upcomingShows.length > 0 ? (
      <div className="relative mb-60 my-40 px-6 md:px-16 lg:px-40 xl:px-40 overflow-hidden min-h-[80vh]">
        <BlurCircle top="150px" left="0px" />
        <BlurCircle top="50px" left="50px" />
        <h1 className="text-lg font-medium my-4">Các phim đang chiếu</h1>
        <div className="flex flex-wrap gap-8 max-sm:justify-center">
          {upcomingShows.map((movie) => (
            <MovieCard key={movie._id} movie={movie} isReleased={false} />
          ))}
        </div>
      </div>
    ) : (
      <div className=" flex flex-col justify-center items-center h-screen">
        <h1 className="text-3xl text-center font-bold">Không có phim nào</h1>
      </div>
    )
  ) : (
    <Loading />
  );
};

export default UpcomingMovies;
