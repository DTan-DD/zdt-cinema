import { momoCallback } from "../services/payments/paymentMomo.service.js";
import { vnpayCallbackService } from "../services/payments/paymentVNPay.service.js";
import { zalopayCallbackService } from "../services/payments/paymentZalopay.service.js";
import { logError } from "../utils/index.js";

class PaymentController {
  momoCallback = async (req, res) => {
    try {
      const momoResponse = await momoCallback(req, res);
      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error("Momo payment error:", error);
      logError(error, req, res, next);

      return res.status(500).json({ success: false, message: "Tạo thanh toán thất bại" });
    }
  };

  vnpayCallback = async (req, res, next) => {
    try {
      const result = await vnpayCallbackService(req, res);

      return res.json(result);
    } catch (error) {
      console.error("VNPay payment error:", error);
      logError(error, req, res, next);
      res.json({
        RspCode: "99",
        Message: "Unknown error",
      });
    }
  };

  zalopayCallback = async (req, res, next) => {
    try {
      const { data, mac } = req.body;
      const result = await zalopayCallbackService(data, mac);

      return res.json(result);
    } catch (error) {
      console.error("ZaloPay payment error:", error);
      logError(error, req, res, next);

      res.json({
        return_code: 0,
        return_message: "error",
      });
    }
  };
}

export default new PaymentController();
