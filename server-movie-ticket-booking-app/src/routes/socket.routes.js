"use strict";
import express from "express";
import { getIO } from "../../socket.js";

const socketRouter = express.Router();

socketRouter.post("/emit", (req, res) => {
  console.log("📡 [Socket API] Received emit request");
  if (req.headers["x-api-key"] !== process.env.EMIT_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { channel, event, data } = req.body;
  if (!channel || !event) {
    return res.status(400).json({ error: "Missing channel or event" });
  }

  const io = getIO(); // lấy instance thật
  io.to(channel).emit(event, data);

  console.log(`📡 [Socket API] Emitted "${event}" to ${channel}`);
  res.json({ ok: true });
});

export default socketRouter;
