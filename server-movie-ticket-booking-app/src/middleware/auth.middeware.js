"use strict";
import { clerkClient } from "@clerk/express";
import { jwtVerify, createRemoteJWKSet } from "jose";

/**
 * Xác thực token Clerk, trả về user object + role
 */
const JWKS = createRemoteJWKSet(new URL("https://smooth-pug-94.clerk.accounts.dev/.well-known/jwks.json"));
export async function verifyClerkToken(token) {
  if (!token) throw new Error("Missing token");
  // Verify session bằng Clerk
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: "https://smooth-pug-94.clerk.accounts.dev",
  });
  if (!payload) throw new Error("Invalid session");
  // Lấy user từ Clerk
  const user = await clerkClient.users.getUser(payload.sub);
  if (!user) throw new Error("User not found");

  return {
    userId: payload.sub,
    isAdmin: user.privateMetadata?.role === "admin",
    user: payload,
  };
}

export const protectAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { isAdmin } = await verifyClerkToken(token);

    if (!isAdmin) {
      return res.status(401).json({ success: false, message: "Unauthorized " });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

export function protectSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const { userId, isAdmin } = await verifyClerkToken(token);

      socket.userId = userId;
      socket.isAdmin = isAdmin;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });
}
