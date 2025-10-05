import React from "react";
import { X, MapPin, Phone, Calendar, Users } from "lucide-react";

const CinemaDetailModal = ({ cinema, onClose }) => {
  if (!cinema) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative">
          {cinema.image ? (
            <img src={cinema.image} alt={cinema.name} className="w-full h-64 object-cover" />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-6xl font-bold">{cinema.name.charAt(0)}</span>
            </div>
          )}

          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-16rem)]">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{cinema.name}</h2>

          <div className="space-y-4">
            {/* Location */}
            {cinema.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Địa chỉ</h3>
                  <p className="text-gray-700">{cinema.location}</p>
                </div>
              </div>
            )}

            {/* Phone */}
            {cinema.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Số điện thoại</h3>
                  <a href={`tel:${cinema.phone}`} className="text-purple-600 hover:text-purple-700 hover:underline">
                    {cinema.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Total Seats */}
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Sức chứa</h3>
                <p className="text-gray-700">{cinema.totalSeats || 50} ghế</p>
              </div>
            </div>

            {/* Description */}
            {cinema.description && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Mô tả</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{cinema.description}</p>
              </div>
            )}

            {/* Timestamps */}
            {(cinema.createdAt || cinema.updatedAt) && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="text-sm text-gray-500 space-y-1">
                    {cinema.createdAt && <p>Tạo lúc: {formatDate(cinema.createdAt)}</p>}
                    {cinema.updatedAt && <p>Cập nhật: {formatDate(cinema.updatedAt)}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button onClick={onClose} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CinemaDetailModal;
