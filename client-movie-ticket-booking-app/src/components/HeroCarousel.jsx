import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play, Star, Calendar, Clock, ArrowRight } from "lucide-react";

const HeroCarousel = ({ shows = [], image_base_url }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || shows.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shows.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, shows.length]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? shows.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % shows.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (!shows.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading movies...</p>
        </div>
      </div>
    );
  }

  const currentShow = shows[currentIndex];
  const currentMovie = currentShow;

  return (
    <div className="relative h-screen overflow-hidden" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Background Images with Transition */}
      <div className="absolute inset-0">
        {shows.map((show, index) => (
          <div key={show._id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? "opacity-100" : "opacity-0"}`}>
            <img src={image_base_url + show.backdrop_path} alt={show.title} className="w-full h-full object-cover" />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50"></div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-start justify-center gap-6 px-6 md:px-16 lg:px-36 h-full">
        {/* Movie Title */}
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-3xl lg:text-6xl font-bold leading-tight text-white drop-shadow-lg">{currentMovie.title}</h1>

          {currentMovie.tagline && <p className="text-xl md:text-2xl text-gray-200 font-light italic">"{currentMovie.tagline}"</p>}
        </div>

        {/* Movie Info */}
        <div className="flex flex-wrap items-center gap-6 text-gray-200">
          <div className="flex flex-wrap gap-2">
            {currentMovie.genres.slice(0, 3).map((genre, index) => (
              <span key={index} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {genre.name}
              </span>
            ))}
          </div>
        </div>

        {/* Overview */}
        {/* <p className="max-w-2xl text-md md:text-lg text-gray-200 leading-relaxed line-clamp-3">{currentMovie.overview}</p> */}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 mt-18 md:mt-4">
          <button
            onClick={() => navigate(`/movies/${currentShow._id}`)}
            className="flex items-center gap-3 px-4 md:px-6 py-4 bg-primary hover:bg-primary-dull 
                     transition-all duration-300 rounded-full font-semibold text-sm md:text-lg
                     shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <Play className="w-6 h-6" />
            Xem ngay
          </button>

          <button
            onClick={() => navigate("/movies")}
            className="flex items-center gap-2 px-4 md:px-8 py-4 bg-white/20 backdrop-blur-md
                     hover:bg-white/30 transition-all duration-300 rounded-full font-semibold text-sm md:text-lg
                     border border-white/30 hover:border-white/50 text-white"
          >
            Xem thêm
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {shows.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 md:left-8 top-4/5 md:top-1/2 -translate-y-1/2 z-20
                     p-3 bg-transparent hover:bg-black/70 backdrop-blur-sm rounded-full
                     text-white transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 md:right-8 top-4/5 md:top-1/2 -translate-y-1/2 z-20
                     p-3 bg-transparent hover:bg-black/70 backdrop-blur-sm rounded-full
                     text-white transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {shows.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {shows.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${index === currentIndex ? "bg-primary scale-125" : "bg-white/50 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {shows.length > 1 && isAutoPlaying && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/20">
          <div
            className="h-full bg-primary transition-all duration-100 ease-linear"
            style={{
              width: `${((currentIndex + 1) / shows.length) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Movie Counter */}
      {/* {shows.length > 1 && (
        <div
          className="absolute top-8 right-8 z-20 text-white/80 text-sm font-medium
                       bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full"
        >
          {currentIndex + 1} / {shows.length}
        </div>
      )} */}
    </div>
  );
};

export default HeroCarousel;
