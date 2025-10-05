import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import Loading from "../components/Loading";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchPage() {
  const query = useQuery().get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchMovies = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data } = await axios.get(`/v1/api/movies/search?search=${query}`);
      setResults(data.metadata.movies || []);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchMovies();
  }, [query]);

  return (
    <>
      {loading ? (
        <div className="flex flex-col justify-center items-center h-screen">
          <Loading />
        </div>
      ) : results.length !== 0 ? (
        <div className="relative mb-60 my-40 px-6 md:px-16 lg:px-40 xl:px-40 overflow-hidden min-h-[80vh]">
          <BlurCircle top="150px" left="0px" />
          <BlurCircle top="50px" left="50px" />
          <h1 className="text-lg font-medium my-4">
            Kết quả tìm kiếm cho "{query}": {results.length} phim
          </h1>
          <div className="flex flex-wrap gap-8 max-sm:justify-center">
            {results.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-screen">
          <h1 className="text-3xl text-center font-bold">Không tìm thấy phim nào</h1>
        </div>
      )}
    </>
  );
}
