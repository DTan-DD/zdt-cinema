import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import dateFormat from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
import EditBookingModal from "../../components/admin/EditBookingModal";
import toast from "react-hot-toast";
import AdvancedPagination from "../../components/Pagination";

const ListBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY;
  const { axios, getToken, user, isCollapsedAdminSidebar } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all"); // all, paid, unpaid
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const getAllBookings = async () => {
    try {
      const { data } = await axios.get("/v1/api/admin/all-bookings", {
        params: {
          filter,
          sort: sortOrder,
          page: currentPage,
          limit: 10,
          search: searchTerm,
        },
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setBookings(data.metadata.bookings);
        setTotalPages(data.metadata.pagination?.totalPages || 1);
        setTotalBookings(data.metadata.pagination?.total || data.metadata.bookings.length);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching bookings: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getAllBookings();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getAllBookings();
    }
  }, [filter, sortOrder, currentPage, searchTerm]);

  useEffect(() => {
    if (user) {
      setCurrentPage(1);
    }
  }, [filter]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchTerm(searchQuery);
  };

  const handleEdit = (booking) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleUpdateBooking = async (updatedBooking) => {
    try {
      const { data } = await axios.put(
        `/v1/api/admin/update-booking/${updatedBooking._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        getAllBookings(); // Refresh the list
        setShowEditModal(false);
        setSelectedBooking(null);
        toast.success("Cập nhật booking thành công");
      }
    } catch (error) {
      console.error("Error updating booking", error);
      toast.error("Có lỗi xảy ra khi cập nhật booking");
      throw error;
    }
  };

  const getPaymentStatus = (booking) => {
    if (booking.isPaid) {
      return "Đã thanh toán";
    }
    if (!booking.isPaid && !booking.isDeleted) {
      return "Chưa thanh toán";
    }
    if (!booking.isPaid && booking.isDeleted) {
      return "Quá hạn";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Đã thanh toán":
        return "text-green-500";
      case "Chưa thanh toán":
        return "text-red-500";
      case "Quá hạn":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return !loading ? (
    <div className={`${isCollapsedAdminSidebar ? "ml-15" : "ml-55"} mt-12 transition-all duration-300`}>
      <Title text1="Danh sách" text2="Bookings" />

      {/* Filter Controls */}
      <div className="flex justify-between items-center gap-4 mt-6 mb-4">
        <div className="flex gap-4">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="all">Tất cả</option>
            <option value="paid">Đã thanh toán</option>
            <option value="unpaid">Chưa thanh toán</option>
            <option value="expired">Quá hạn</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
          <div className="text-sm text-gray-200 flex items-center">Tổng: {totalBookings} bookings</div>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Tìm kiếm..."
            className="px-4 py-2 border bg-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={handleSearch} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80">
            Tìm kiếm
          </button>
        </div>
      </div>

      <div className=" mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-x-auto text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Booking Code</th>
              <th className="p-2 font-medium">Khách hàng</th>
              <th className="p-2 font-medium">Phim</th>
              <th className="p-2 font-medium">Rạp chiếu</th>
              <th className="p-2 font-medium">Suất chiếu</th>
              {/* <th className="p-2 font-medium">Seats</th> */}
              <th className="p-2 font-medium">Thu nhập</th>
              {/* <th className="p-2 font-medium">Payment Method</th> */}
              <th className="p-2 font-medium">Trạng thái</th>
              {/* <th className="p-2 font-medium">Payment Date</th> */}
              <th className="p-2 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {bookings.map((booking) => {
              const status = getPaymentStatus(booking);

              return (
                <tr key={booking._id} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10">
                  <td className="p-2 min-w-25 pl-5 font-mono text-xs">{booking.bookingCode}</td>
                  <td className="p-2">{booking.user.name.length > 10 ? booking.user.name.slice(0, 10) + " ..." : booking.user.name}</td>
                  <td className="p-2">{booking.show.movie.title.length > 30 ? booking.show.movie.title.slice(0, 30) + " ..." : booking.show.movie.title}</td>
                  <td className="p-2">{booking.show.cinema.name}</td>
                  <td className="p-2">{dateFormat(booking.show.showDateTime)}</td>
                  {/* <td className="p-2">
                    {Array.isArray(booking.bookedSeats)
                      ? booking.bookedSeats.join(", ")
                      : Object.keys(booking.bookedSeats || {})
                          .map((seat) => booking.bookedSeats[seat])
                          .join(", ")}
                  </td> */}
                  <td className="p-2">
                    {booking.amount} {currency}
                  </td>
                  {/* <td className="p-2 capitalize">{booking.paymentMethod}</td> */}
                  <td className={`p-2 font-medium ${getStatusColor(status)}`}>{status}</td>
                  {/* <td className="p-2">{booking.paymentDate ? dateFormat(booking.paymentDate) : "-"}</td> */}
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(booking)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <AdvancedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Edit Modal */}
      {showEditModal && (
        <EditBookingModal
          booking={selectedBooking}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBooking(null);
          }}
          onUpdate={handleUpdateBooking}
        />
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default ListBookings;
