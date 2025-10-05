import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const AdminNavbar = () => {
  const { user, notifications, unreadCount, markAllAsSeen } = useAppContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đánh dấu tất cả là đã đọc khi click vào bell
  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);

    // Nếu có thông báo chưa đọc và đang mở dropdown, đánh dấu tất cả
    if (!showDropdown && unreadCount > 0) {
      await markAllAsSeen();
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      BOOKING: "🎫",
      SHOWTIME: "🎬",
      PROMOTION: "🎁",
      SYSTEM: "📢",
      default: "🔔",
    };
    return icons[type] || icons.default;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const isRead = (notification) => {
    const userId = user?.id;
    return notification.readBy && userId && notification.readBy.includes(userId);
  };

  return (
    <div className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-gray-300/30">
      <a href="/">
        <img src={assets?.logo} alt="logo" className="w-36 h-auto" />
      </a>

      {/* Notification Bell */}
      <div className="relative" ref={dropdownRef}>
        <button onClick={handleBellClick} className="relative p-2 hover:bg-primary cursor-pointer rounded-full transition-colors">
          <Bell className="w-6 h-6 text-gray-100" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-800">Thông báo</h3>
              {/* <span className="text-xs text-gray-500">{unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}</span> */}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 max-h-96">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Bell className="w-12 h-12 mb-2 opacity-30" />
                  <p className="text-sm">Không có thông báo</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif._id} className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!isRead(notif) ? "bg-blue-50/50" : ""}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{getNotificationIcon(notif.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm text-gray-900 truncate">{notif.title}</h4>
                          {/* <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif._id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                            title="Xóa"
                          >
                            <X className="w-3.5 h-3.5 text-gray-600" />
                          </button> */}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatTime(notif.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-center text-gray-800">Bảng thông báo</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNavbar;
