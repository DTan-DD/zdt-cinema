import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import BlurCircle from "./BlurCircle";
import { PlayCircleIcon } from "lucide-react";

const TrailersSection = ({ shows = [] }) => {
  const [currentTrailer, setCurrentTrailer] = useState(shows[0]);

  useEffect(() => {
    for (let i = 0; i < shows.length; i++) {
      if (shows[i].trailer) {
        setCurrentTrailer(shows[i]);
        break;
      }
    }
  }, [shows]);

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Get YouTube thumbnail URL
  const getYouTubeThumbnail = (videoUrl) => {
    const videoId = getYouTubeVideoId(videoUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
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

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
      <p className="to-gray-300 font-medium text-lg max-w-[960px] mx-auto">Trailers</p>

      <div className="relative mt-6 max-w-[960px] mx-auto">
        <BlurCircle top="-100px" right="-100px" />
        <div className="relative mt-6 aspect-video w-full">
          <ReactPlayer src={currentTrailer?.trailer} controls className="absolute top-0 left-0" width="100%" height="100%" />
        </div>
      </div>

      <div className="group flex items-center gap-4 md:gap-8 mt-8 max-w-3xl mx-auto">
        {shows.map(
          (show) =>
            show.trailer && (
              <div
                key={show._id}
                className="relative group-hover:not-hover:opacity-50 hover:-translate-y-1
    duration-300 transition max-md:h-60 md:max-h-60 cursor-pointer"
                onClick={() => setCurrentTrailer(show)}
              >
                <img src={getYouTubeThumbnail(show.trailer) || show.image} alt="Trailer" className="rounded-lg w-full h-full object-cover brightness-75" />
                <PlayCircleIcon
                  strokeWidth={1.6}
                  className="absolute top-1/2 left-1/2 w-5 md:w-8 h5 md:h-1/2 transform -translate-x-1/2
      -translate-y-1/2"
                />
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default TrailersSection;
