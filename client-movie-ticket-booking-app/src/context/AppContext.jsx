"use strict";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
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
  const broadcastChannelRef = useRef(null);
  const timeoutIdRef = useRef(null); // 👈 Thêm ref cho timeout
  const [isCollapsedAdminSidebar, setIsCollapsedAdminSidebar] = useState(false);

  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  let cachedToken = null;
  let lastTokenTime = 0;

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

  // 👉 Hàm lấy token luôn đảm bảo còn hạn
  async function getValidClerkToken() {
    const now = Date.now();
    const tokenAge = now - lastTokenTime;

    if (cachedToken && tokenAge < 1700_000) {
      return cachedToken;
    }

    const token = await getToken({ template: "myJwtTemplate" });
    // console.log("Refreshed token");
    cachedToken = token;
    lastTokenTime = now;
    return token;
  }

  // 👉 Socket.IO connection với Broadcast Channel
  useEffect(() => {
    // Khai báo các handler functions trước
    let messageHandler = null;
    let requestHandler = null;

    const initSocket = async () => {
      // Tạo Broadcast Channel
      broadcastChannelRef.current = new BroadcastChannel("socket_management");
      let shouldCreateSocket = true;

      messageHandler = (msg) => {
        if (msg.type === "SOCKET_EXISTS" && msg.userId === user?.id) {
          // Đã có socket trong tab khác, không tạo mới
          // console.log("✅ Socket already exists in another tab, skipping creation");
          shouldCreateSocket = false;
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
          }
        }

        if (msg.type === "SOCKET_CREATED" && msg.userId === user?.id) {
          // Tab khác vừa tạo socket, không tạo nữa
          // console.log("✅ Another tab just created socket, skipping creation");
          shouldCreateSocket = false;
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
          }
        }
      };

      broadcastChannelRef.current.addEventListener("message", messageHandler);

      // Yêu cầu thông tin từ các tab khác
      broadcastChannelRef.current.postMessage({
        type: "SOCKET_INIT_REQUEST",
        userId: user?.id,
      });

      // Đợi 150ms để nhận phản hồi từ tab khác
      timeoutIdRef.current = setTimeout(async () => {
        if (shouldCreateSocket && user?.id) {
          // console.log("🔄 Creating new socket connection...");

          // Cleanup socket cũ nếu có
          if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
          }

          const token = await getValidClerkToken();
          const socket = io(BASE_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 500,
            reconnectionDelayMax: 2000,
            reconnectionAttempts: 30,
          });
          socketRef.current = socket;

          socket.on("connect", () => {
            // console.log("✅ Socket connected:", socket.id);
            // Thông báo cho các tab khác biết đã tạo socket
            if (broadcastChannelRef.current) {
              broadcastChannelRef.current.postMessage({
                type: "SOCKET_CREATED",
                userId: user?.id,
              });
            }
          });

          socket.on("notification:new", (notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          });

          socket.on("reconnect_attempt", async () => {
            const token = await getValidClerkToken();
            socket.auth = { token };
          });

          socket.on("connect_error", async (error) => {
            // console.log("❌ Socket connection error:", error);
            const newToken = await getValidClerkToken();
            socket.auth = { token: newToken };
            socket.connect();
          });

          socket.on("disconnect", async (reason) => {
            // console.log("⚠️ Socket disconnected:", reason);
            if (reason === "io server disconnect" || reason === "transport close") {
              const newToken = await getValidClerkToken();
              socket.auth = { token: newToken };
              socket.connect();
            }
          });
        }
      }, 150);

      // Handler cho các SOCKET_INIT_REQUEST từ tab khác
      requestHandler = (msg) => {
        if (msg.type === "SOCKET_INIT_REQUEST" && msg.userId === user?.id) {
          // Nếu tab này đã có socket, thông báo cho tab mới biết
          if (socketRef.current && socketRef.current.connected) {
            broadcastChannelRef.current.postMessage({
              type: "SOCKET_EXISTS",
              userId: user?.id,
            });
          }
        }
      };

      broadcastChannelRef.current.addEventListener("message", requestHandler);
    };

    if (user?.id) {
      initSocket();
    }

    return () => {
      // Cleanup timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      // Cleanup broadcast channel
      if (broadcastChannelRef.current) {
        if (messageHandler) {
          broadcastChannelRef.current.removeEventListener("message", messageHandler);
        }
        if (requestHandler) {
          broadcastChannelRef.current.removeEventListener("message", requestHandler);
        }
        broadcastChannelRef.current.close();
      }

      // Chỉ disconnect socket nếu đây là tab cuối cùng
      // Có thể thêm logic kiểm tra tab count ở đây nếu muốn
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, [user?.id]);

  // Các hàm còn lại giữ nguyên
  const markAllAsSeen = async () => {
    try {
      // console.log("markAllAsSeen");
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
      // console.log("markAllAsRead");
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
        toast.error("You are not authorized to access admin dashboard");
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
      fetchNotifications();
    }
  }, [user]);

  const handleCollapseAdminSidebar = () => setIsCollapsedAdminSidebar(!isCollapsedAdminSidebar);

  const value = {
    axios,
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
    socket: socketRef.current,
    handleCollapseAdminSidebar,
    isCollapsedAdminSidebar,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
