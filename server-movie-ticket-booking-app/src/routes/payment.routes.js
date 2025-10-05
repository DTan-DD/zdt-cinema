"use strict";
import express from "express";
import paymentController from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/momo/callback", paymentController.momoCallback);
router.get("/vnpay/callback", paymentController.vnpayCallback);
router.post("/zalopay/callback", paymentController.zalopayCallback);

export default router;
