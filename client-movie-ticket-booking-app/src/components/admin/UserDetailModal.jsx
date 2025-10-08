import { Calendar, Mail, X } from "lucide-react";

const UserDetailModal = ({ user, onClose }) => {
  if (!user) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Chi tiết người dùng</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={user.image || "/default-avatar.png"}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="text-sm font-medium text-gray-500">ID Người dùng</label>
              <p className="mt-1 text-gray-800 font-mono text-sm">{user._id}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="text-sm font-medium text-gray-500">Họ và tên</label>
              <p className="mt-1 text-gray-800 text-lg font-medium">{user.name}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Mail size={16} />
                Email
              </label>
              <p className="mt-1 text-gray-800">{user.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar size={16} />
                  Ngày tạo
                </label>
                <p className="mt-1 text-gray-800 text-sm">{formatDate(user.createdAt)}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar size={16} />
                  Cập nhật lần cuối
                </label>
                <p className="mt-1 text-gray-800 text-sm">{formatDate(user.updatedAt)}</p>
              </div>
            </div>

            {user.status && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {user.status === "active" ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
