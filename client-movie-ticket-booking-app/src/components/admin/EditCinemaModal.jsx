import React, { useState, useEffect } from "react";

const EditCinemaModal = ({ cinema, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    phone: "",
    image: "",
    description: "",
    totalSeats: 50,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cinema) {
      setFormData({
        _id: cinema._id,
        name: cinema.name || "",
        location: cinema.location || "",
        phone: cinema.phone || "",
        image: cinema.image || "",
        description: cinema.description || "",
        totalSeats: cinema.totalSeats || 50,
      });
    }
  }, [cinema]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên rạp là bắt buộc";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Địa chỉ là bắt buộc";
    }

    // if (!formData.phone.trim()) {
    //   newErrors.phone = "Số điện thoại là bắt buộc";
    // } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ""))) {
    //   newErrors.phone = "Số điện thoại không hợp lệ";
    // }

    if (formData.totalSeats < 1 || formData.totalSeats > 500) {
      newErrors.totalSeats = "Số ghế phải từ 1 đến 500";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalSeats" ? parseInt(value) || 0 : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onUpdate(formData);
    } catch (error) {
      console.error("Error updating cinema:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{cinema ? "Chỉnh sửa rạp chiếu" : "Thêm rạp chiếu mới"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={loading}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên rạp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full text-black px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.name ? "border-red-500" : "border-gray-300"}`}
                placeholder="Nhập tên rạp chiếu"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full text-black px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.location ? "border-red-500" : "border-gray-300"}`}
                placeholder="Nhập địa chỉ rạp"
              />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-black border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.phone ? "border-red-500" : "border-gray-300"}`}
                placeholder="0901234567"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số ghế <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="totalSeats"
                value={formData.totalSeats}
                onChange={handleChange}
                min="1"
                max="500"
                className={`w-full px-3 py-2 text-black border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.totalSeats ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.totalSeats && <p className="text-red-500 text-xs mt-1">{errors.totalSeats}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Hình ảnh</label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/image.jpg"
              />
              {formData.image && (
                <div className="mt-2">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-32 h-24 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 text-black py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nhập mô tả về rạp chiếu..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50">
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCinemaModal;
