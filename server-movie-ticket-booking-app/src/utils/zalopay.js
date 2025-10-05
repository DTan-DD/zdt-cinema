import crypto from "crypto";
import axios from "axios";
import config from "../../configs/config.js";

export function createMac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

export async function queryZaloPay(appTransId) {
  const data = {
    app_id: config.zaloPay.app_id,
    app_trans_id: appTransId,
  };

  const dataStr = `${data.app_id}|${data.app_trans_id}|${config.zaloPay.key1}`;
  data.mac = createMac(config.zaloPay.key1, dataStr);

  const res = await axios.post(`${config.zaloPay.endpoint}/v001/tpe/getstatusbyapptransid`, data);
  return res.data; // trả về status từ ZaloPay
}
