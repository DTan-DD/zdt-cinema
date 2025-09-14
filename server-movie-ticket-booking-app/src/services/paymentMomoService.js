import axios from "axios";
import { createMomoSignature } from "../utils/momo.js";

export async function createMomoPayment({ orderId, amount }) {
  const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
  const { MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY } = process.env;

  const requestId = `${orderId}-${Date.now()}`;
  const orderInfo = `Thanh toán đơn hàng #${orderId}`;
  const redirectUrl = "https://www.youtube.com/"; //"http://localhost:3000/payment/success";
  const ipnUrl = "https://a1e18db138be.ngrok-free.app/v1/api/payment/momo/callback";
  const requestType = "payWithMethod";

  const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = createMomoSignature(MOMO_SECRET_KEY, rawSignature);

  const body = {
    partnerCode: MOMO_PARTNER_CODE,
    accessKey: MOMO_ACCESS_KEY,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    requestType,
    extraData: "",
    signature,
    lang: "vi",
  };

  const response = await axios.post(endpoint, body);
  console.log(response.data);
  return response.data; // có payUrl
}
