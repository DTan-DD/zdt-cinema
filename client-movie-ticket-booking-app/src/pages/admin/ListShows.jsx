import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import dateFormat from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
import EditShowModal from "../../components/admin/EditShowModal";
import toast from "react-hot-toast";
import { s } from "framer-motion/client";
import ConfirmDeleteModal from "../../components/admin/ConfirmDeleteModal";
import AdvancedPagination from "../../components/Pagination";

const ListShows = () => {
  const currency = import.meta.env.VITE_CURRENCY;
  const { axios, getToken, user, isCollapsedAdminSidebar } = useAppContext();

  const [shows, setShows] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all"); // all, published, draft
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");
  const [totalPages, setTotalPages] = useState(1);
  const [totalShows, setTotalShows] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToDelete, setShowToDelete] = useState(null);

  // New date search states
  const [searchType, setSearchType] = useState("text"); // "text" or "date"
  const [dateSearchQuery, setDateSearchQuery] = useState("");
  const [dateSearchTerm, setDateSearchTerm] = useState("");

  const getAllShows = async () => {
    try {
      const searchParams = {
        filter,
        sort: sortOrder, // "newest" hoặc "oldest"
        page: currentPage,
        limit: 10,
      };

      // Add appropriate search parameter based on search type
      if (searchType === "text" && searchTerm) {
        searchParams.search = searchTerm;
      } else if (searchType === "date" && dateSearchTerm) {
        searchParams.searchQueryDate = dateSearchTerm;
      }

      const { data } = await axios.get(`/v1/api/admin/all-shows`, {
        params: searchParams,
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setShows(data.metadata.shows);
        setTotalPages(data.metadata.pagination.totalPages);
        setTotalShows(data.metadata.pagination.total);
        // setCurrentPage(1); // Reset to first page when filter changes
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching all shows", error);
      setLoading(false);
    }
  };

  const getAllCinemas = async () => {
    try {
      const { data } = await axios.get("/v1/api/cinemas/all", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setCinemas(data.metadata.cinemas);
      }
    } catch (error) {
      console.error("Error fetching cinemas", error);
    }
  };

  useEffect(() => {
    if (user) {
      getAllShows();
      getAllCinemas();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getAllShows();
    }
  }, [filter, sortOrder, currentPage, searchTerm, dateSearchTerm]);

  useEffect(() => {
    if (user) {
      setCurrentPage(1);
    }
  }, [filter]);

  // Clear search when switching search types
  useEffect(() => {
    if (searchType === "text") {
      setDateSearchQuery("");
      setDateSearchTerm("");
    } else {
      setSearchQuery("");
      setSearchTerm("");
    }
    setCurrentPage(1);
  }, [searchType]);

  const handleEdit = (show) => {
    const showed = show.isPublished && new Date(show.showDateTime) < new Date();
    const hasBookings = Object.keys(show.occupiedSeats).length > 0;
    const isReadOnly = showed || hasBookings;
    setSelectedShow(show);
    setIsReadOnly(isReadOnly);
    setShowEditModal(true);
  };

  const handleConfirmDelete = async () => {
    if (showToDelete) {
      try {
        const { data } = await axios.put(
          `/v1/api/admin/delete-show/${showToDelete._id}`,
          {},
          {
            headers: { Authorization: `Bearer ${await getToken()}` },
          }
        );
        if (data.success) {
          toast.success("Xóa show thành công");
          getAllShows();
          setShowDeleteModal(false);
          setShowToDelete(null);
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra khi xóa show");
      }
    }
  };

  const handleUpdateShow = async (updatedShow) => {
    try {
      const { data } = await axios.put(`/v1/api/admin/update-show/${updatedShow._id}`, updatedShow, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        getAllShows(); // Refresh the list
        setShowEditModal(false);
        setSelectedShow(null);
      }
    } catch (error) {
      console.error("Error updating show", error);
      throw error.response.data.error;
    }
  };

  const getShowStatus = (show) => {
    const now = new Date();
    const showTime = new Date(show.showDateTime);
    const endTime = new Date(showTime.getTime() + show.movie.runtime * 60 * 1000);

    if (show.isDraft) return "Draft";
    if (show.isPublished && now >= showTime && now <= endTime) {
      return "Đang chiếu";
    }
    if (show.isPublished && showTime < now) return "Đã chiếu";
    if (show.isPublished && showTime > now) return "Sắp chiếu";
    return "Unknown";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "text-gray-500";
      case "Sắp chiếu":
        return "text-blue-500";
      case "Đang chiếu":
        return "text-green-500";
      case "Đã chiếu":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    if (searchType === "text") {
      setSearchTerm(searchQuery);
      setDateSearchTerm(""); // Clear date search when doing text search
    } else {
      setDateSearchTerm(dateSearchQuery);
      setSearchTerm(""); // Clear text search when doing date search
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
    setDateSearchQuery("");
    setDateSearchTerm("");
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get today's date in YYYY-MM-DD format for input max/default
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const handleDeleteClick = (show) => {
    setShowToDelete(show);
    setShowDeleteModal(true);
  };

  return !loading ? (
    <div className={`${isCollapsedAdminSidebar ? "ml-15" : "ml-55"} mt-12 transition-all duration-300`}>
      <Title text1="Danh sách" text2="Lịch Chiếu" />

      {/* Filter Controls */}
      <div className="flex items-center justify-between gap-4 mt-6 mb-4">
        <div className="flex gap-4">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="all">Tất cả</option>
            <option value="today">Hôm nay</option>
            <option value="showing">Đang chiếu</option>
            <option value="upcoming">Sắp chiếu</option>
            <option value="showed">Đã chiếu</option>
            <option value="draft">Bản nháp</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>

          <div className="text-sm text-gray-200 flex items-center">Tổng: {totalShows} suất chiếu</div>
        </div>

        {/* Enhanced Search Section */}
        <div className="flex gap-4 items-center">
          {/* Search Type Selector */}
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-3 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="text">Tìm theo tên</option>
            <option value="date">Tìm theo ngày</option>
          </select>

          {/* Search Input - Text */}
          {searchType === "text" && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Tìm kiếm theo tên phim, rạp..."
              className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}

          {/* Search Input - Date */}
          {searchType === "date" && (
            <input
              type="date"
              value={dateSearchQuery}
              onChange={(e) => setDateSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              // max={getTodayDate()}
              className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}

          {/* Search Button */}
          <button onClick={handleSearch} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 cursor-pointer">
            Tìm kiếm
          </button>

          {/* Clear Search Button */}
          {(searchTerm || dateSearchTerm) && (
            <button onClick={handleClearSearch} className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm cursor-pointer">
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Search Result Info */}
      {(searchTerm || dateSearchTerm) && (
        <div className="mb-4 text-sm text-gray-100">
          {searchType === "text" && searchTerm && <span>Kết quả tìm kiếm cho: "{searchTerm}"</span>}
          {searchType === "date" && dateSearchTerm && <span>Kết quả tìm kiếm cho ngày: {new Date(dateSearchTerm).toLocaleDateString("vi-VN")}</span>}
        </div>
      )}

      <div className=" mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Phim</th>
              <th className="p-2 font-medium">Rạp</th>
              <th className="p-2 font-medium">Lịch chiếu</th>
              <th className="p-2 font-medium">Giá</th>
              <th className="p-2 font-medium">Trạng thái</th>
              <th className="p-2 font-medium">Tổng vé</th>
              <th className="p-2 font-medium">Thu nhập</th>
              <th className="p-2 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {shows.map((show) => {
              const showDateTime = new Date(show.showDateTime);
              const showed = show.isPublished && showDateTime < new Date();
              const hasBookings = Object.keys(show.occupiedSeats).length > 0;
              const enableEdit = !showed && !hasBookings;
              const status = getShowStatus(show);
              const diffDays = (new Date() - new Date(show.showDateTime)) / (1000 * 60 * 60 * 24);
              const disableDelete = diffDays < 1 && show.isPublished;

              return (
                <tr key={show._id} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10">
                  <td className="p-2 min-w-45 pl-5">{show.movie.title.length > 40 ? show.movie.title.slice(0, 40) + "..." : show.movie.title}</td>
                  <td className="p-2">{show.cinema.name}</td>
                  <td className="p-2">{dateFormat(show.showDateTime)}</td>
                  <td className="p-2">
                    {currency} {show.showPrice}
                  </td>
                  <td className={`p-2 font-medium ${getStatusColor(status)}`}>{status}</td>
                  <td className="p-2">{Object.keys(show.occupiedSeats).length}/90</td>
                  <td className="p-2">
                    {Object.keys(show.occupiedSeats).length * show.showPrice} {currency}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(show)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">
                        {!enableEdit ? "Xem" : "Sửa"}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(show)}
                        disabled={disableDelete}
                        className={`px-3 py-1 rounded text-xs ${disableDelete ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600"}`}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* No Results Message */}
      {shows.length === 0 && !loading && <div className="text-center py-8 text-gray-500">{searchTerm || dateSearchTerm ? "Không tìm thấy suất chiếu nào." : "Chưa có suất chiếu nào."}</div>}

      {/* Pagination */}
      <AdvancedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Edit Modal */}
      {showEditModal && (
        <EditShowModal
          show={selectedShow}
          cinemas={cinemas}
          isReadOnly={isReadOnly}
          onClose={() => {
            setShowEditModal(false);
            setSelectedShow(null);
          }}
          onUpdate={handleUpdateShow}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Xác nhận xóa suất chiếu"
          message={`Bạn có chắc chắn muốn xóa show "${showToDelete?.movie?.title}", 
          lịch chiếu ${dateFormat(showToDelete?.showDateTime)}, tại rạp "${showToDelete?.cinema?.name}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setShowToDelete(null);
          }}
        />
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default ListShows;
