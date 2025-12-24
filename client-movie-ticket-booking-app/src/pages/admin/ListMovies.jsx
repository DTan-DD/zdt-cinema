import React, { useState, useEffect } from "react";
import Loading from "../../components/Loading";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import Title from "../../components/admin/Title";
import EditMovieModal from "../../components/admin/EditMovieModal";
import ConfirmDeleteModal from "../../components/admin/ConfirmDeleteModal";
import AdvancedPagination from "../../components/Pagination";

const ListMovies = () => {
  const { axios, getToken, user, isCollapsedAdminSidebar } = useAppContext();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all"); // all, upcoming, now_showing, ended, featured
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState(null);

  const getAllMovies = async () => {
    try {
      const searchParams = {
        filter,
        sort: sortOrder,
        page: currentPage,
        limit: 10,
      };

      if (searchTerm) {
        searchParams.search = searchTerm;
      }

      const { data } = await axios.get(`/v1/api/admin/all-movies`, {
        params: searchParams,
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setMovies(data.metadata.movies);
        setTotalPages(data.metadata.pagination.totalPages);
        setTotalMovies(data.metadata.pagination.total);
        setLoading(false);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tải danh sách phim");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getAllMovies();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getAllMovies();
    }
  }, [filter, sortOrder, currentPage, searchTerm]);

  useEffect(() => {
    if (user) {
      setCurrentPage(1);
    }
  }, [filter]);

  const handleEdit = (movie) => {
    setSelectedMovie(movie);
    setShowEditModal(true);
  };

  const handleDeleteClick = (movie) => {
    setMovieToDelete(movie);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (movieToDelete) {
      try {
        const { data } = await axios.put(
          `/v1/api/admin/delete-movie/${movieToDelete._id}`,
          {},
          {
            headers: { Authorization: `Bearer ${await getToken()}` },
          }
        );
        if (data.success) {
          toast.success("Xóa show thành công");
          getAllMovies();
          setShowDeleteModal(false);
          setMovieToDelete(null);
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra khi xóa phim");
      }
    }
  };

  const handleUpdateMovie = async (updatedMovie) => {
    try {
      const { data } = await axios.put(`/v1/api/admin/update-movie/${updatedMovie._id}`, updatedMovie, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Cập nhật phim thành công");
        getAllMovies(); // Refresh the list
        setShowEditModal(false);
        setSelectedMovie(null);
      }
    } catch (error) {
      console.error("Error updating movie", error);
      toast.error("Có lỗi xảy ra khi cập nhật phim");
      throw error;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "upcoming":
        return "Sắp chiếu";
      case "now_showing":
        return "Đang chiếu";
      case "ended":
        return "Đã kết thúc";
      default:
        return "Không rõ";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "text-blue-500";
      case "now_showing":
        return "text-green-500";
      case "ended":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchTerm(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return !loading ? (
    <div className={`${isCollapsedAdminSidebar ? "ml-15" : "ml-55"} mt-12 transition-all duration-300`}>
      <Title text1="Danh sách" text2="Phim" />

      {/* Filter Controls */}
      <div className="flex items-center justify-between gap-4 mt-6 mb-4">
        <div className="flex gap-4">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="all">Tất cả</option>
            <option value="upcoming">Sắp chiếu</option>
            <option value="now_showing">Đang chiếu</option>
            <option value="ended">Đã kết thúc</option>
            <option value="featured">Phim nổi bật</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            {/* <option value="rating">Điểm cao nhất</option>
            <option value="title">Tên A-Z</option> */}
          </select>

          <div className="text-sm text-gray-200 flex items-center">Tổng: {totalMovies} phim</div>
        </div>

        {/* Search Section */}
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Tìm kiếm theo tên phim..."
            className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button onClick={handleSearch} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 cursor-pointer">
            Tìm kiếm
          </button>

          {searchTerm && (
            <button onClick={handleClearSearch} className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm cursor-pointer">
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Search Result Info */}
      {searchTerm && (
        <div className="mb-4 text-sm text-gray-100">
          <span>Kết quả tìm kiếm cho: "{searchTerm}"</span>
        </div>
      )}

      <div className=" mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Poster</th>
              <th className="p-2 font-medium">Tên phim</th>
              <th className="p-2 font-medium">Ngày phát hành</th>
              <th className="p-2 font-medium">Thời lượng</th>
              <th className="p-2 font-medium">Điểm đánh giá</th>
              <th className="p-2 font-medium">Trạng thái</th>
              <th className="p-2 font-medium">Nổi bật</th>
              <th className="p-2 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {movies.map((movie) => (
              <tr key={movie._id} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10">
                <td className="p-2 pl-5">
                  <img
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title}
                    className="w-12 h-16 object-cover rounded"
                    onError={(e) => {
                      e.target.src = "/default-movie-poster.jpg"; // Fallback image
                    }}
                  />
                </td>
                <td className="p-2 max-w-xs">
                  <div className="font-medium">{movie.title}</div>
                  <div className="text-xs text-yellow-500 truncate">{movie.tagline}</div>
                </td>
                <td className="p-2">{formatDate(movie.release_date)}</td>
                <td className="p-2">{movie.runtime} phút</td>
                <td className="p-2">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>
                </td>
                <td className={`p-2 font-medium ${getStatusColor(movie.status)}`}>{getStatusText(movie.status)}</td>
                <td className="p-2">
                  <div className="flex justify-center">{movie.isFeatured ? <span className="text-yellow-500 text-lg">🌟</span> : <span className="text-gray-300">-</span>}</div>
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(movie)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">
                      Sửa
                    </button>
                    <button onClick={() => handleDeleteClick(movie)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Results Message */}
      {movies.length === 0 && !loading && <div className="text-center py-8 text-gray-500">{searchTerm ? "Không tìm thấy phim nào." : "Chưa có phim nào."}</div>}

      {/* Pagination */}
      <AdvancedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Edit Modal */}
      {showEditModal && (
        <EditMovieModal
          movie={selectedMovie}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMovie(null);
          }}
          onUpdate={handleUpdateMovie}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Xác nhận xóa phim"
          message={`Bạn có chắc chắn muốn xóa phim "${movieToDelete?.title}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setMovieToDelete(null);
          }}
        />
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default ListMovies;
