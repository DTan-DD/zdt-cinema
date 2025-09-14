import express from "express";
import { momoCheckout, momoCallback, vnpayCheckout, vnpayCallback, zalopayCallback } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/momo", momoCheckout);
router.post("/momo/callback", momoCallback);

router.post("/vnpay", vnpayCheckout);
router.get("/vnpay/callback", vnpayCallback);

router.post("/zalopay", momoCheckout);
router.post("/zalopay/callback", zalopayCallback);

export default router;
