import React, { useState, useEffect } from "react";
import Loading from "../../components/Loading";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import Title from "../../components/admin/Title";
import EditCinemaModal from "../../components/admin/EditCinemaModal";
import ConfirmDeleteModal from "../../components/admin/ConfirmDeleteModal";
import CinemaDetailModal from "../../components/admin/CinemaDetailModal";

const ListCinemas = () => {
  const { axios, getToken, user } = useAppContext();

  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [cinemaToDelete, setCinemaToDelete] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCinemas, setTotalCinemas] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const getAllCinemas = async () => {
    try {
      const searchParams = {
        sort: sortOrder,
        page: currentPage,
        limit: 10,
      };

      if (searchTerm) {
        searchParams.search = searchTerm;
      }

      const { data } = await axios.get(`/v1/api/cinemas/all`, {
        params: searchParams,
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setCinemas(data.metadata.cinemas);
        setTotalPages(data.metadata.pagination.totalPages);
        setTotalCinemas(data.metadata.pagination.total);
        setLoading(false);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tải danh sách rạp");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getAllCinemas();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getAllCinemas();
    }
  }, [sortOrder, currentPage, searchTerm]);

  const handleView = (cinema) => {
    setSelectedCinema(cinema);
    setShowDetailModal(true);
  };

  const handleEdit = (cinema) => {
    setSelectedCinema(cinema);
    setShowEditModal(true);
  };

  const handleDeleteClick = (cinema) => {
    setCinemaToDelete(cinema);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (cinemaToDelete) {
      try {
        const { data } = await axios.delete(`/v1/api/cinemas/delete-cinema/${cinemaToDelete._id}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (data.success) {
          toast.success("Xóa rạp chiếu thành công");
          getAllCinemas();
          setShowDeleteModal(false);
          setCinemaToDelete(null);
        }
      } catch (error) {
        console.error("Error deleting cinema", error);
        toast.error("Có lỗi xảy ra khi xóa rạp chiếu");
      }
    }
  };

  const handleUpdateCinema = async (updatedCinema) => {
    try {
      const { data } = await axios.put(`/v1/api/cinemas/update-cinema/${updatedCinema._id}`, updatedCinema, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Cập nhật rạp chiếu thành công");
        getAllCinemas();
        setShowEditModal(false);
        setSelectedCinema(null);
      }
    } catch (error) {
      console.error("Error updating cinema", error);
      toast.error("Có lỗi xảy ra khi cập nhật rạp chiếu");
      throw error;
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
    <>
      <Title text1="Danh sách" text2="Rạp chiếu" />

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mt-6 mb-4">
        <div className="flex gap-4">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            {/* <option value="name">Tên A-Z</option>
            <option value="seats">Số ghế</option> */}
          </select>

          <div className="text-sm text-gray-200 flex items-center">Tổng: {totalCinemas} rạp chiếu</div>
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
            placeholder="Tìm kiếm theo tên rạp..."
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
        <div className="mb-4 text-sm text-gray-600">
          <span>Kết quả tìm kiếm cho: "{searchTerm}"</span>
        </div>
      )}

      <div className="max-w-7xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Hình ảnh</th>
              <th className="p-2 font-medium">Tên rạp</th>
              <th className="p-2 font-medium">Địa chỉ</th>
              <th className="p-2 font-medium">Số điện thoại</th>
              <th className="p-2 font-medium">Số ghế</th>
              <th className="p-2 font-medium">Ngày tạo</th>
              <th className="p-2 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {cinemas.map((cinema) => (
              <tr key={cinema._id} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10">
                <td className="p-2 pl-5">
                  <img
                    src={cinema.image || "/default-cinema-image.jpg"}
                    alt={cinema.name}
                    className="w-16 h-12 object-cover rounded"
                    onError={(e) => {
                      e.target.src = "/default-cinema-image.jpg";
                    }}
                  />
                </td>
                <td className="p-2 max-w-xs">
                  <div className="font-medium">{cinema.name}</div>
                </td>
                <td className="p-2 max-w-xs">
                  <div className="text-sm truncate">{cinema.location}</div>
                </td>
                <td className="p-2">{cinema.phone}</td>
                <td className="p-2">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{cinema.totalSeats} ghế</span>
                </td>
                <td className="p-2">{formatDate(cinema.createdAt)}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button onClick={() => handleView(cinema)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs">
                      Xem
                    </button>
                    <button onClick={() => handleEdit(cinema)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">
                      Sửa
                    </button>
                    {/* <button onClick={() => handleDeleteClick(cinema)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">
                      Xóa
                    </button> */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Results Message */}
      {cinemas.length === 0 && !loading && <div className="text-center py-8 text-gray-500">{searchTerm ? "Không tìm thấy rạp chiếu nào." : "Chưa có rạp chiếu nào."}</div>}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded ${currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50"}`}
            >
              Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-2 rounded ${currentPage === number ? "bg-primary text-white" : "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50"}`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded ${currentPage === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50"}`}
            >
              Sau
            </button>
          </nav>
        </div>
      )}

      {/* Modals */}
      {showEditModal && (
        <EditCinemaModal
          cinema={selectedCinema}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCinema(null);
          }}
          onUpdate={handleUpdateCinema}
        />
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          title="Xác nhận xóa rạp chiếu"
          message={`Bạn có chắc chắn muốn xóa rạp "${cinemaToDelete?.name}"? Hành động này không thể hoàn tác.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setCinemaToDelete(null);
          }}
        />
      )}

      {showDetailModal && (
        <CinemaDetailModal
          cinema={selectedCinema}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCinema(null);
          }}
        />
      )}
    </>
  ) : (
    <Loading />
  );
};

export default ListCinemas;
