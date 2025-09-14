import crypto from "crypto";

export function createMomoSignature(secretKey, rawSignature) {
  return crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
}
