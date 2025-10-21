import { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { CheckIcon, DeleteIcon, StarIcon } from "lucide-react";
import { kConverter } from "../../lib/KConverter";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const AddMovies = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();

  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [addingShow, setAddingShow] = useState(false);

  const fetchNowPlayingMovies = async () => {
    try {
      const { data } = await axios.get("/v1/api/shows/now-playing", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setNowPlayingMovies(data.metadata.movies);
      }
    } catch (error) {
      console.error("Error fetching movies: ", error);
    }
  };

  const handleSubmit = async () => {
    try {
      setAddingShow(true);
      if (!selectedMovie) {
        toast.error("Please select a movie");
        return;
      }

      const payload = {
        movieId: selectedMovie,
      };
      const { data } = await axios.post("/v1/api/movies/add-movie", payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        toast.success("Thêm phim thành công");
        // Reset form
        setSelectedMovie(null);
        fetchNowPlayingMovies();
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
    }
  }, [user]);

  return nowPlayingMovies.length > 0 ? (
    <>
      <Title text1="Danh sách" text2="Phim chưa thêm" />

      {/* Movies Grid */}
      <p className="mt-10 text-lg font-medium">Danh sách phim</p>
      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {nowPlayingMovies.map((movie) => (
            <div
              key={movie.id}
              className="max-w-40 relative cursor-pointer group-hover:not-hover:opacity-40 
            hover:-translate-y-1 transition duration-300"
              onClick={() => setSelectedMovie(movie.id)}
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
              {selectedMovie === movie.id && (
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

      {/* Add Show Button */}
      <button
        onClick={handleSubmit}
        disabled={addingShow || !selectedMovie}
        className={`px-8 py-2 mt-6 rounded transition-all ${addingShow || !selectedMovie ? "bg-gray-600 cursor-not-allowed opacity-50" : "bg-primary text-white hover:bg-primary/80 cursor-pointer"}`}
      >
        {addingShow ? "Đang thêm..." : "Thêm phim"}
      </button>
    </>
  ) : (
    <Loading />
  );
};

export default AddMovies;
