import { useEffect } from "react";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react"; // nếu bạn dùng Clerk React SDK

export function useNotificationSocket(onNotification) {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const socket = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    // đăng ký userId với server
    socket.emit("register", user.id);

    // lắng nghe noti realtime
    socket.on("notification", (notif) => {
      // console.log("🔔 New notification:", notif);
      if (onNotification) onNotification(notif);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);
}
