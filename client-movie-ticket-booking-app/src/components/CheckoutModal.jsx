import React, { useState, useEffect } from "react";
import { X, CreditCard, Smartphone, Wallet, User, Mail, Clock, MapPin, Film, Ticket } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import dateFormat from "../lib/dateFormat";
import ZoomableSeatsLayout_2 from "./SeatsLayout_2";
import { assets } from "../assets/assets";

const CheckoutModal = ({ isOpen, onClose, show, selectedSeats, onConfirmBooking, onCancelBooking, image_base_url, isLoading = false }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const { user } = useUser();
  const location = useLocation();
  const [enableCancel, setEnableCancel] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith("/my-bookings")) {
      setEnableCancel(true);
    } else {
      setEnableCancel(false);
    }
  }, [location]);

  const paymentMethods = [
    {
      id: "momo",
      name: "MoMo",
      icon: Smartphone,
      color: "bg-pink-500",
      description: "Thanh toán qua ví MoMo",
    },
    {
      id: "zalopay",
      name: "ZaloPay",
      icon: Wallet,
      color: "bg-blue-500",
      description: "Thanh toán qua ví ZaloPay",
    },
    {
      id: "vnpay",
      name: "VNPay",
      icon: CreditCard,
      color: "bg-red-500",
      description: "Thanh toán qua VNPay",
    },
  ];

  const totalPrice = show?.showPrice * selectedSeats?.length || 0;

  const handleConfirmBooking = () => {
    if (!selectedPaymentMethod) {
      return toast.error("Vui lòng chọn phương thức thanh toán");
    }

    if (selectedSeats.length === 0) {
      return toast.error("Vui lòng chọn ít nhất một ghế");
    }

    // Call the parent component's booking function with payment method
    onConfirmBooking(selectedPaymentMethod);
  };

  const handleCancelBooking = () => {
    onCancelBooking();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Xác nhận đặt vé</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Movie & Show Info */}
            <div className="space-y-6">
              {/* Movie Info */}
              <div className="bg-gray-50 rounded-xl p-6">
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
                      <div className="text-gray-500">{dateFormat(show?.showDateTime)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Seats */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Ghế đã chọn ({selectedSeats?.length} ghế)
                </h3>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {selectedSeats?.map((seat) => (
                    <div key={seat} className="bg-primary text-white px-3 py-2 rounded-lg text-center text-sm font-medium">
                      {seat}
                    </div>
                  ))}
                </div>

                {/* Price Summary */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Giá vé ({selectedSeats?.length} ghế):</span>
                    <span className="text-gray-800">{(show?.showPrice * selectedSeats?.length).toLocaleString()} VNĐ</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span className="text-gray-800">Tổng cộng:</span>
                    <span className="text-primary">{totalPrice.toLocaleString()} VNĐ</span>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="bg-green-50 rounded-xl p-6">
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
            </div>

            {/* Right Column - Payment Method */}
            <div className="space-y-6 relative">
              {enableCancel && (
                <>
                  <div className="mb-8">
                    <img src={assets.screenImage} alt="screen" className="mx-auto" />
                    <p className="text-gray-600 text-sm text-center mt-2 font-medium">MÀN HÌNH CHIẾU</p>
                  </div>
                  <ZoomableSeatsLayout_2 selectedSeats={selectedSeats} />
                </>
              )}

              <div className="bg-yellow-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Chọn phương thức thanh toán
                </h3>

                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedPaymentMethod === method.id ? "border-primary bg-primary/10 shadow-lg" : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${method.color} text-white`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="text-left flex-1">
                            <h4 className="font-semibold text-gray-800">{method.name}</h4>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                          {selectedPaymentMethod === method.id && (
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Security Note */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 text-center">🔒 Thanh toán của bạn được bảo mật bằng công nghệ mã hóa SSL 256-bit</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex  gap-4">
                <button onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={!selectedPaymentMethod || isLoading}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedPaymentMethod && !isLoading ? "bg-primary text-white hover:bg-primary-dull shadow-lg hover:shadow-xl" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </div>
                  ) : (
                    "Xác nhận thanh toán"
                  )}
                </button>
                {enableCancel && (
                  <button onClick={handleCancelBooking} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                    Hủy đơn hàng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
