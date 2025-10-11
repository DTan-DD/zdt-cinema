import React from "react";
import { X, CheckCircle, Smartphone, Wallet, CreditCard, User, Mail, Clock, MapPin, Film, Ticket, Calendar } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import { assets } from "../assets/assets";
import ZoomableSeatsLayout_2 from "./SeatsLayout_2";

const BookingDetailsModal = ({ isOpen, onClose, booking, image_base_url }) => {
  const { user } = useUser();

  if (!isOpen || !booking) return null;

  const { show, bookedSeats, amount, isPaid, paymentMethod, paymentDate } = booking;

  // Payment method icons mapping
  const getPaymentMethodInfo = (method) => {
    const methodMap = {
      momo: {
        name: "MoMo",
        icon: Smartphone,
        color: "bg-pink-500",
      },
      zalopay: {
        name: "ZaloPay",
        icon: Wallet,
        color: "bg-blue-500",
      },
      vnpay: {
        name: "VNPay",
        icon: CreditCard,
        color: "bg-red-500",
      },
    };

    return (
      methodMap[method] || {
        name: method || "Unknown",
        icon: CreditCard,
        color: "bg-gray-500",
      }
    );
  };

  const paymentInfo = getPaymentMethodInfo(paymentMethod);
  const PaymentIcon = paymentInfo.icon;

  // Format payment date
  const formatPaymentDate = (dateString) => {
    if (!dateString) return "Không xác định";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Chi tiết đặt vé</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className=" p-3 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Movie & Show Info */}
            <div className="space-y-6">
              {/* Movie Info */}
              <div className="bg-gray-50 rounded-xl p-1 md:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Film className="w-5 h-5" />
                  Thông tin phim
                </h3>

                <div className="flex gap-4">
                  <img src={image_base_url + show?.movie?.poster_path} alt={show?.movie?.title} className="w-20 h-28 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-2">{show?.movie?.title}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {Math.floor(show?.movie?.runtime / 60)}h {show?.movie?.runtime % 60}m
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{show?.cinema?.name}</span>
                      </div>
                      <div className="text-gray-500">Suất chiếu: {formatPaymentDate(show?.showDateTime)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booked Seats */}
              <div className="bg-blue-50 rounded-xl p-3 md:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Ghế đã đặt ({bookedSeats?.length} ghế)
                </h3>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {bookedSeats?.map((seat) => (
                    <div key={seat} className="bg-green-500 text-white px-3 py-2 rounded-lg text-center text-sm font-medium">
                      {seat}
                    </div>
                  ))}
                </div>

                {/* Price Summary */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Giá vé:</span>
                    <span className="text-gray-800">{show?.showPrice.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span className="text-gray-800">Tổng cộng:</span>
                    <span className="text-green-600">{amount?.toLocaleString()} VNĐ</span>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="bg-green-50 rounded-xl p-3 md:p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Thông tin khách hàng
                  </h3>

                  <div className="space-y-2">
                    {user.fullName && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{user.fullName}</span>
                      </div>
                    )}
                    {user.primaryEmailAddress && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{user.primaryEmailAddress.emailAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-green-50 rounded-xl p-3 md:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Trạng thái thanh toán
                </h3>

                <div className="space-y-4">
                  {/* Payment Status Badge */}
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                    <CheckCircle className="w-4 h-4" />
                    {isPaid ? "Đã thanh toán thành công" : "Chưa thanh toán"}
                  </div>

                  {/* Payment Method */}
                  {isPaid && paymentMethod && (
                    <div className="p-2 md:p-4 bg-white rounded-lg border border-green-200">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${paymentInfo.color} text-white`}>
                          <PaymentIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">Phương thức thanh toán</h4>
                          <p className="text-sm text-gray-600">{paymentInfo.name}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Date */}
                  {isPaid && paymentDate && (
                    <div className="p-2 md:p-4 bg-white rounded-lg border border-green-200">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">Thời gian thanh toán</h4>
                          <p className="text-sm text-gray-600">{formatPaymentDate(paymentDate)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Booking ID */}
                  <div className="p-2 md:p-4 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                        <Ticket className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">Mã đặt vé</h4>
                        <p className="text-sm text-gray-600 font-mono">#{booking.bookingCode?.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Payment Information */}
            <div className="space-y-6 relative">
              <div className="mb-8">
                <img src={assets.screenImage} alt="screen" className="mx-auto" />
                <p className="text-gray-600 text-sm text-center mt-2 font-medium">MÀN HÌNH CHIẾU</p>
              </div>
              <ZoomableSeatsLayout_2 selectedSeats={bookedSeats} />

              {/* Payment Status */}
              <div className="bg-green-50 rounded-xl p-3 md:p-6">
                {/* Success Message */}
                {isPaid && (
                  <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-200">
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-medium">Cảm ơn bạn đã đặt vé!</p>
                      <p className="text-sm text-green-600 mt-1">Vé của bạn đã được xác nhận và sẵn sàng sử dụng.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  Đóng
                </button>
                {/* {isPaid && (
                  <button onClick={() => window.print()} className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dull transition-colors font-medium">
                    In vé
                  </button>
                )} */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
