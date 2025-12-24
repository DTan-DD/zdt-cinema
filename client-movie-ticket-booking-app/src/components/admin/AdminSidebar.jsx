import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, PlusCircle, ShoppingBag, UserIcon, PlusSquare, MonitorIcon, List, ChevronLeft, ChevronRight, ShoppingCart, Film } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

const AdminSidebar = ({ assets }) => {
  const { user, notifications, markAsRead, handleCollapseAdminSidebar } = useAppContext();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState({
    bookings: 0,
    movies: 0,
    shows: 0,
    dashboard: 0,
    cinemas: 0,
    users: 0,
  });

  // Fetch notification counts theo từng category
  useEffect(() => {
    if (notifications && user?.id) {
      const counts = {
        bookings: 0,
        movies: 0,
        shows: 0,
        dashboard: 0,
        cinemas: 0,
        users: 0,
      };

      notifications.forEach((notif) => {
        // Phân loại notification theo type hoặc category
        if (!notif.isRead && notif.type === "BOOKING") {
          counts.bookings++;
        } else if (!notif.isRead && notif.type === "MOVIE") {
          counts.movies++;
        } else if (!notif.isRead && notif.type === "SHOWTIME") {
          counts.shows++;
        } else if (!notif.isRead && notif.type === "SYSTEM") {
          counts.dashboard++;
        } else if (!notif.isRead && notif.type === "CINEMA") {
          counts.cinemas++;
        } else if (!notif.isRead && notif.type === "USER") {
          counts.cinemas++;
        }
      });

      setNotificationCounts(counts);
    }
  }, [notifications, user?.id]);

  // Mark notification as read khi click vào menu
  const handleMenuClick = async (category) => {
    // Have noti unread?
    if (notificationCounts[category] === 0) return;

    await markAsRead(category);
  };

  const adminNavLinks = [
    {
      name: "Tổng quan",
      path: "/admin",
      icon: LayoutDashboard,
      category: "dashboard",
      badge: notificationCounts.dashboard,
    },
    {
      name: "Thêm phim",
      path: "/admin/add-movies",
      icon: PlusCircle,
      category: "movies",
    },
    {
      name: "Danh sách phim",
      path: "/admin/list-movies",
      icon: Film,
      category: "movies",
      badge: notificationCounts.movies,
    },
    {
      name: "Thêm suất chiếu",
      path: "/admin/add-shows",
      icon: PlusSquare,
      category: "shows",
    },
    {
      name: "Danh sách chiếu",
      path: "/admin/list-shows",
      icon: List,
      category: "shows",
      badge: notificationCounts.shows,
    },
    {
      name: "Đơn hàng",
      path: "/admin/list-bookings",
      icon: ShoppingCart,
      category: "bookings",
      badge: notificationCounts.bookings,
    },
    {
      name: "Rạp chiếu",
      path: "/admin/list-cinemas",
      icon: MonitorIcon,
      category: "cinemas",
      badge: notificationCounts.cinemas,
    },
    {
      name: "Người dùng",
      path: "/admin/list-users",
      icon: UserIcon,
      category: "users",
      badge: notificationCounts.users,
    },
  ];

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    handleCollapseAdminSidebar();
  };

  return (
    <div
      className={`fixed top-1/10 left-0 z-50  h-[calc(100vh-64px)] flex flex-col border-r border-gray-300/20 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? "w-20" : "w-60"}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => handleCollapse()}
        className="absolute -right-3 top-8 bg-gray-800 border border-gray-700 rounded-full p-1.5 shadow-lg hover:bg-gray-700 transition-all duration-200 z-10 hover:scale-110"
        aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-300" /> : <ChevronLeft className="w-4 h-4 text-gray-300" />}
      </button>

      {/* User Profile Section */}
      <div className={`flex flex-col items-center pt-8 pb-6 transition-all duration-300 ${isCollapsed ? "px-2" : "px-6"}`}>
        <div className="relative">
          <img
            src={user?.imageUrl || assets?.profile}
            alt="profile"
            className={`rounded-full object-cover border-2 border-gray-700 transition-all duration-300 ${isCollapsed ? "h-10 w-10" : "h-16 w-16"}`}
          />
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
        </div>

        {!isCollapsed && (
          <div className="mt-3 text-center">
            <p className="font-semibold text-gray-200 text-base">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Administrator</p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
        <div className="space-y-1">
          {adminNavLinks.map((link, index) => (
            <NavLink
              key={index}
              to={link.path}
              end
              onClick={() => link.category && handleMenuClick(link.category)}
              className={({ isActive }) => `
                group relative flex items-center gap-3 rounded-lg transition-all duration-200
                ${isCollapsed ? "justify-center px-3 py-3" : "px-4 py-3"}
                ${isActive ? "bg-primary/15 text-primary" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"}
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Icon với badge */}
                  <div className="relative flex-shrink-0">
                    <link.icon className="w-5 h-5 transition-all duration-200" />

                    {/* Badge đỏ cho notification */}
                    {link.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse shadow-sm">
                        {link.badge > 9 ? "9+" : link.badge}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  {!isCollapsed && <span className="flex-1 font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">{link.name}</span>}

                  {/* Badge number bên phải */}
                  {!isCollapsed && link.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[24px] text-center shadow-sm flex-shrink-0">{link.badge}</span>
                  )}

                  {/* Active indicator */}
                  {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-primary rounded-l" />}

                  {/* Tooltip khi collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-gray-200 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-700 pointer-events-none">
                      {link.name}
                      {link.badge > 0 && <span className="ml-2 bg-red-500 rounded-full px-2 py-0.5 text-xs text-white">{link.badge}</span>}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;
