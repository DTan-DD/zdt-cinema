import crypto from "crypto";

export function createMac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}
