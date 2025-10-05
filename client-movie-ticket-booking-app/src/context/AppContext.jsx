"use strict";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
// import { useNotificationSocket } from "../hooks/useNotificationSocket";
import { useRef } from "react";
import io from "socket.io-client";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
const BASE_URL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [shows, setShows] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch notifications từ API
  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`/v1/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const notifs = response.data.metadata.data;
        setNotifications(notifs);

        // Đếm số thông báo chưa đọc
        const userId = user?.id;
        if (userId) {
          const unread = notifs.filter((n) => !n.isSeen).length;
          setUnreadCount(unread);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Socket.IO connection
  useEffect(() => {
    const initSocket = async () => {
      const token = await getToken({ template: "myJwtTemplate" });
      socketRef.current = io(BASE_URL, {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 10000,
        reconnectionAttempts: 5,
      });

      // Kết nối thành công
      socketRef.current.on("connect", () => {
        console.log("Socket connected:");
      });

      // Lắng nghe thông báo mới
      socketRef.current.on("notification:new", (notification) => {
        console.log("New notification received:", notification);

        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      // Xử lý lỗi
      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });
    };

    // Fetch notifications ban đầu
    fetchNotifications();

    // Khởi tạo socket
    if (user?.id) {
      initSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user?.id]);

  const markAllAsSeen = async () => {
    try {
      console.log("markAllAsSeen");
      const token = await getToken();
      const response = await axios.post(
        `/v1/api/notifications/mask-all-seen`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error mask notifications:", error);
    }
  };

  const markAsRead = async (type) => {
    try {
      let typeNotif = "";
      console.log("markAllAsRead");
      if (!type || (type !== "bookings" && type !== "shows")) return;
      switch (type) {
        case "bookings":
          typeNotif = "BOOKING";
          break;
        case "shows":
          typeNotif = "SHOWTIME";
          break;
        default:
          return;
      }
      const token = await getToken();
      const response = await axios.post(
        `/v1/api/notifications/mask-read/${typeNotif}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const notifs = response.data.metadata.data;
        setNotifications(notifs);
      }
    } catch (error) {
      console.error("Error mask notifications:", error);
    }
  };

  const fetchIsAdmin = async () => {
    try {
      const { data } = await axios.get("v1/api/admin/is-admin", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setIsAdmin(data.metadata.isAdmin);

      if (!data.metadata.isAdmin && location.pathname.startsWith("/admin")) {
        navigate("/");
        toast.error("YOu are not authorized to access admin dashboard");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFavoriteMovies = async () => {
    try {
      const { data } = await axios.get("v1/api/users/favorites", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setFavoriteMovies(data.metadata.movies);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchShows = async () => {
    try {
      const { data } = await axios.get("/v1/api/shows/all");
      if (data.success) {
        setShows(data.metadata.shows);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (user) {
      fetchIsAdmin();
      fetchFavoriteMovies();
    }
  }, [user]);

  const value = {
    axios, //
    fetchIsAdmin,
    user,
    getToken,
    navigate,
    isAdmin,
    shows,
    favoriteMovies,
    fetchFavoriteMovies,
    image_base_url,
    notifications,
    unreadCount,
    setUnreadCount,
    markAllAsSeen,
    markAsRead,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
