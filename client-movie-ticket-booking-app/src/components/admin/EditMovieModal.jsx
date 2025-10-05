import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const EditMovieModal = ({ movie, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    trailer: movie?.trailer || "",
    status: movie?.status || "upcoming",
    isFeatured: movie?.isFeatured || false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (movie) {
      setFormData({
        trailer: movie.trailer || "",
        status: movie.status || "upcoming",
        isFeatured: movie.isFeatured || false,
      });
    }
  }, [movie]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateYouTubeURL = (url) => {
    if (!url) return true; // Empty URL is valid
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.trailer && !validateYouTubeURL(formData.trailer)) {
      toast.error("Vui lòng nhập URL YouTube hợp lệ");
      return;
    }

    setLoading(true);
    try {
      const updatedMovie = {
        ...movie,
        ...formData,
      };
      await onUpdate(updatedMovie);
    } catch (error) {
      console.error("Error updating movie:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!movie) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Chỉnh sửa phim</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {/* Movie Info Display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-4">
            <img src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`} alt={movie.title} className="w-20 h-28 object-cover rounded" />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-primary">{movie.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{movie.tagline}</p>
              <div className="text-sm text-gray-500">
                <p>
                  <strong>Phát hành:</strong> {new Date(movie.release_date).toLocaleDateString("vi-VN")}
                </p>
                <p>
                  <strong>Thời lượng:</strong> {movie.runtime} phút
                </p>
                <p>
                  <strong>Điểm đánh giá:</strong> ⭐ {movie.vote_average.toFixed(1)}/10
                </p>
                <p>
                  <strong>Thể loại:</strong> {movie.genres.map((g) => g.name).join(", ")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trailer URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link Trailer YouTube</label>
            <input
              type="url"
              name="trailer"
              value={formData.trailer}
              onChange={handleInputChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Nhập URL YouTube trailer của phim (có thể để trống)</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái phim</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 bg-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="upcoming">Sắp chiếu</option>
              <option value="now_showing">Đang chiếu</option>
              <option value="ended">Đã kết thúc</option>
            </select>
          </div>

          {/* Is Featured */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700">
              <span className="font-medium">Phim nổi bật</span>
              <span className="block text-xs text-gray-500">Đánh dấu để hiển thị phim này ở vị trí nổi bật</span>
            </label>
          </div>

          {/* Current Trailer Preview */}
          {formData.trailer && validateYouTubeURL(formData.trailer) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Xem trước trailer</label>
              <div className="aspect-video w-full max-w-md">
                <iframe src={formData.trailer.replace("watch?v=", "embed/")} className="w-full h-full rounded" allowFullScreen></iframe>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={loading} className={`px-6 py-2 rounded-md text-white font-medium ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary/80"}`}>
              {loading ? "Đang cập nhật..." : "Cập nhật"}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMovieModal;
