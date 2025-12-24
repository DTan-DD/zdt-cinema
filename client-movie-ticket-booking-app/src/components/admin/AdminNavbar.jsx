import { useState, useEffect, useRef } from "react";
import { Bell, Calendar, Clock } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const AdminNavbar = () => {
  const { user, notifications, unreadCount, markAllAsSeen } = useAppContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [latestNotification, setLatestNotification] = useState(null);
  const [showMarquee, setShowMarquee] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [shownNotifications, setShownNotifications] = useState(new Set());
  const dropdownRef = useRef(null);
  const calendarRef = useRef(null);

  // Cập nhật thời gian mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Theo dõi thông báo mới và hiển thị chạy chữ
  useEffect(() => {
    if (notifications.length > 0) {
      const newest = notifications[0];
      const userId = user?.id;
      const isUnread = !newest.readBy || !userId || !newest.readBy.includes(userId);

      // Chỉ hiển thị nếu chưa từng hiển thị thông báo này trong session
      if (unreadCount > 0 && isUnread && !shownNotifications.has(newest._id)) {
        setLatestNotification(newest);
        setShowMarquee(true);
        // Đánh dấu đã hiển thị
        setShownNotifications((prev) => new Set(prev).add(newest._id));
      }
    }
  }, [notifications, user, shownNotifications]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
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
      // setShowMarquee(false);
    }
  };

  // Xử lý khi animation chạy xong
  const handleAnimationEnd = () => {
    setShowMarquee(false);
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

  const formatDateTime = () => {
    const date = currentTime.getDate().toString().padStart(2, "0");
    const month = (currentTime.getMonth() + 1).toString().padStart(2, "0");
    const year = currentTime.getFullYear();
    const hours = currentTime.getHours().toString().padStart(2, "0");
    const minutes = currentTime.getMinutes().toString().padStart(2, "0");

    return {
      dateStr: `${date}/${month}/${year}`,
      timeStr: `${hours}:${minutes}`,
    };
  };

  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Kiểm tra ngày hiện tại
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = isCurrentMonth ? today.getDate() : null;

    const days = [];

    // Thêm ô trống cho những ngày trước ngày đầu tiên của tháng
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Thêm các ngày trong tháng
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return { days, todayDate };
  };

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCalendarMonth(new Date());
  };

  const { dateStr, timeStr } = formatDateTime();
  const { days: calendarDays, todayDate } = generateCalendarDays();
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  return (
    <>
      <div className="bg-background fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-10 h-16 border-b border-gray-300/30">
        <a href="/">
          <img src={assets?.logo} alt="logo" className="w-36 h-auto" />
        </a>

        {/* Center Section - Marquee Notification */}
        <div className="flex-1 mx-4 md:mx-8 overflow-hidden">
          {showMarquee && latestNotification ? (
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-2 rounded-lg border border-blue-500/30">
              <span className="text-lg">{getNotificationIcon(latestNotification.type)}</span>
              <div className="flex-1 overflow-hidden">
                <div className="whitespace-nowrap animate-marquee-once inline-block" onAnimationEnd={handleAnimationEnd}>
                  <span className="font-semibold text-blue-400">THÔNG BÁO MỚI: </span>
                  <span className="text-gray-200">
                    {latestNotification.title} - {latestNotification.message}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-white font-semibold text-lg hidden md:block">Trang quản trị rạp chiếu phim DiTi Cinema</div>
          )}
        </div>

        {/* Right Section - Date, Time & Actions */}
        <div className="flex items-center gap-3">
          {/* Date & Time */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-gray-100">{timeStr}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Calendar className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-gray-100">{dateStr}</span>
            </div>
          </div>

          {/* Calendar Icon */}
          <div className="relative" ref={calendarRef}>
            <button onClick={() => setShowCalendar(!showCalendar)} className="p-2 hover:bg-primary cursor-pointer rounded-full transition-colors" title="Xem lịch">
              <Calendar className="w-6 h-6 text-gray-100" />
            </button>

            {/* Calendar Dropdown */}
            {showCalendar && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <button onClick={handlePrevMonth} className="p-1 hover:text-white hover:bg-primary text-lg text-gray-800 rounded-full transition-colors">
                      ←
                    </button>
                    <h3 className="font-semibold text-gray-800 text-center">
                      {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                    </h3>
                    <button onClick={handleNextMonth} className="p-1 hover:text-white hover:bg-primary text-lg text-gray-800 rounded-full transition-colors">
                      →
                    </button>
                  </div>
                  <button onClick={handleToday} className="w-full mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Hôm nay
                  </button>
                </div>
                <div className="p-4">
                  {/* Days of week */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                      <div key={index} className={`text-center py-2 text-sm rounded ${day === todayDate ? "bg-blue-500 text-white font-bold" : day ? "text-gray-700" : ""}`}>
                        {day || ""}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

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
      </div>
    </>
  );
};

export default AdminNavbar;
