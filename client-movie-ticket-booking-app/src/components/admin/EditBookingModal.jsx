import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import dateFormat from "../../lib/dateFormat";

const EditBookingModal = ({ booking, onClose, onUpdate }) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const [isPaid, setIsPaid] = useState(booking?.isPaid || false);
  const [formData, setFormData] = useState({
    isPaid: booking?.isPaid || false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      setFormData({
        isPaid: booking.isPaid,
      });
    }
  }, [booking]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onUpdate({
        ...booking,
        isPaid: formData.isPaid,
      });
      toast.success("Cập nhật trạng thái thanh toán thành công!");
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Có lỗi xảy ra khi cập nhật booking");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Booking Information (Read-only) */}
          <div className="mb-6 p-4 bg-gray-400 rounded-lg">
            <h3 className="text-lg font-medium mb-4 text-gray-700">Thông tin Booking</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Mã Booking:</span>
                <p className="font-mono text-xs bg-gray-600 px-2 py-1 rounded inline-block ml-2">{booking.bookingCode}</p>
              </div>

              <div>
                <span className="font-medium text-gray-600">Khách hàng:</span>
                <p className="ml-2">{booking.user.name}</p>
              </div>

              <div>
                <span className="font-medium text-gray-600">Phim:</span>
                <p className="ml-2">{booking.show.movie.title}</p>
              </div>

              <div>
                <span className="font-medium text-gray-600">Rạp:</span>
                <p className="ml-2">{booking.show.cinema.name}</p>
              </div>

              <div>
                <span className="font-medium text-gray-600">Suất chiếu:</span>
                <p className="ml-2">{dateFormat(booking.show.showDateTime)}</p>
              </div>

              <div>
                <span className="font-medium text-gray-600">Ghế đã đặt:</span>
                <p className="ml-2">
                  {Array.isArray(booking.bookedSeats)
                    ? booking.bookedSeats.join(", ")
                    : Object.keys(booking.bookedSeats || {})
                        .map((seat) => booking.bookedSeats[seat])
                        .join(", ")}
                </p>
              </div>

              <div>
                <span className="font-medium text-gray-600">Phương thức thanh toán:</span>
                <p className="ml-2 capitalize">{booking.paymentMethod}</p>
              </div>

              <div>
                <span className="font-medium text-gray-600">Tổng tiền:</span>
                <p className="ml-2 font-semibold text-yellow-300">
                  {booking.amount} {currency}
                </p>
              </div>

              {booking.paymentDate && (
                <div>
                  <span className="font-medium text-gray-600">Ngày thanh toán:</span>
                  <p className="ml-2">{dateFormat(booking.paymentDate)}</p>
                </div>
              )}

              {/* {booking.paymentLink && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Link thanh toán:</span>
                  <a href={booking.paymentLink} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:text-blue-700 underline break-all">
                    {booking.paymentLink}
                  </a>
                </div>
              )} */}
            </div>
          </div>

          {/* Editable Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700">Cập nhật trạng thái</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái thanh toán</label>
                  {isPaid && <p className="text-green-600">Đã thanh toán</p>}
                  {!isPaid && (
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isPaid"
                          disabled={isPaid}
                          checked={formData.isPaid === false}
                          onChange={() => setFormData({ ...formData, isPaid: false })}
                          className="mr-2 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-red-600">Chưa thanh toán</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isPaid"
                          disabled={isPaid}
                          checked={formData.isPaid === true}
                          onChange={() => setFormData({ ...formData, isPaid: true })}
                          className="mr-2 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-green-600">Đã thanh toán</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 bg-primary text-white rounded-md hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={loading}
              >
                Đóng
              </button>

              {!isPaid && (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {loading ? "Đang cập nhật..." : "Cập nhật"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;
