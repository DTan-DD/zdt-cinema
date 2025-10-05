import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const EditShowModal = ({ show, cinemas, isReadOnly, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    showDateTime: "",
    showPrice: "",
    cinema: "",
    isDraft: true,
    isPublished: false,
    movie_release_date: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      const showDate = new Date(show.showDateTime);
      const formattedDateTime = showDate.toISOString().slice(0, 16); // Format for datetime-local input

      setFormData({
        showDateTime: formattedDateTime,
        showPrice: show.showPrice,
        cinema: show.cinema._id,
        isDraft: show.isDraft,
        isPublished: show.isPublished,
        movie_release_date: show.movie.release_date,
      });
    }
  }, [show]);

  const validateForm = () => {
    const newErrors = {};
    const now = new Date();
    const selectedDateTime = new Date(formData.showDateTime);

    // Validate show date time
    if (!formData.showDateTime) {
      newErrors.showDateTime = "Vui lòng chọn thời gian chiếu";
    } else if (selectedDateTime <= now) {
      newErrors.showDateTime = "Thời gian chiếu phải sau thời gian hiện tại";
    }

    // Validate price
    if (!formData.showPrice) {
      newErrors.showPrice = "Vui lòng nhập giá vé";
    } else if (formData.showPrice <= 0) {
      newErrors.showPrice = "Giá vé phải lớn hơn 0";
    } else if (formData.showPrice > 1000000) {
      newErrors.showPrice = "Giá vé không thể vượt quá 1,000,000";
    }

    // Validate cinema
    if (!formData.cinema) {
      newErrors.cinema = "Vui lòng chọn rạp chiếu";
    }

    // Validate publish status
    if (formData.isPublished && formData.isDraft) {
      newErrors.status = "Show không thể vừa là bản nháp vừa được xuất bản";
    }

    if (!formData.isPublished && !formData.isDraft) {
      newErrors.status = "Show phải có ít nhất một trạng thái (Draft hoặc Published)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));

      // Clear related checkbox when one is selected
      if (name === "isDraft" && checked) {
        setFormData((prev) => ({ ...prev, isPublished: false }));
      } else if (name === "isPublished" && checked) {
        setFormData((prev) => ({ ...prev, isDraft: false }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? parseFloat(value) || "" : value,
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updatedShow = {
        _id: show._id,
        // ...show,
        ...formData,
        showDateTime: new Date(formData.showDateTime).toISOString(),
      };

      await onUpdate(updatedShow);
      toast.success("Cập nhật show thành công");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật show");
      setErrors({ submit: `Có lỗi xảy ra khi cập nhật show. Vui lòng thử lại. Error: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-500 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{isReadOnly ? "Thông tin Show" : "Chỉnh sửa Show"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Movie Info (Read-only) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phim</label>
            <div className="p-3 bg-gray-500 rounded border">{show.movie.title}</div>
          </div>

          {/* Cinema Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rạp chiếu *</label>
            {isReadOnly ? (
              <div className="p-3 bg-gray-500 rounded border">{cinemas.find((c) => c._id === formData.cinema)?.name || show.cinema.name}</div>
            ) : (
              <>
                <select
                  name="cinema"
                  value={formData.cinema}
                  onChange={handleInputChange}
                  className={`w-full p-3 bg-gray-500 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cinema ? "border-red-500" : "border-gray-300"}`}
                  required
                >
                  <option value="">Chọn rạp chiếu</option>
                  {cinemas.map((cinema) => (
                    <option key={cinema._id} value={cinema._id}>
                      {cinema.name}
                    </option>
                  ))}
                </select>
                {errors.cinema && <p className="text-red-500 text-xs mt-1">{errors.cinema}</p>}
              </>
            )}
          </div>

          {/* Show DateTime */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian chiếu *</label>
            {isReadOnly ? (
              <div className="p-3 bg-gray-500  rounded border">{formatDateTime(show.showDateTime)}</div>
            ) : (
              <>
                <input
                  type="datetime-local"
                  name="showDateTime"
                  value={formData.showDateTime}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.showDateTime ? "border-red-500" : "border-gray-300"}`}
                  required
                />
                {errors.showDateTime && <p className="text-red-500 text-xs mt-1">{errors.showDateTime}</p>}
              </>
            )}
          </div>

          {/* Show Price */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá vé (VND) *</label>
            {isReadOnly ? (
              <div className="p-3 bg-gray-500 rounded border">{formData.showPrice?.toLocaleString("vi-VN")}</div>
            ) : (
              <>
                <input
                  type="number"
                  name="showPrice"
                  value={formData.showPrice}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.showPrice ? "border-red-500" : "border-gray-300"}`}
                  min="1"
                  max="1000000"
                  // step="1000"
                  required
                />
                {errors.showPrice && <p className="text-red-500 text-xs mt-1">{errors.showPrice}</p>}
              </>
            )}
          </div>

          {/* Status */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái *</label>
            {isReadOnly ? (
              <div className="p-3 bg-gray-500 rounded border">{show.isDraft ? "Bản nháp" : "Đã xuất bản"}</div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" name="isDraft" checked={formData.isDraft} onChange={handleInputChange} className="mr-2" />
                    Bản nháp
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleInputChange} className="mr-2" />
                    Xuất bản
                  </label>
                </div>
                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
              </>
            )}
          </div>

          {/* Bookings Info */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng đặt vé</label>
            <div className="p-3 bg-gray-500 rounded border">{Object.keys(show.occupiedSeats).length} vé đã đặt</div>
            {Object.keys(show.occupiedSeats).length > 0 && <p className="text-amber-300 text-xs mt-1">Show này đã có người đặt vé, chỉ có thể xem thông tin</p>}
          </div>

          {/* Submit Errors */}
          {errors.submit && <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">{errors.submit}</div>}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
              Đóng
            </button>
            {!isReadOnly && (
              <button type="submit" disabled={loading} className={`px-4 py-2 text-white rounded ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}>
                {loading ? "Đang cập nhật..." : "Cập nhật"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditShowModal;
