"use strict";
import { Schema, model } from "mongoose";

const DOCUMENT_NAME = "idempotencyKey";
const COLLECTION_NAME = "idempotencyKeys";

const IdempotencyKeySchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true, // mỗi key chỉ dùng 1 lần
      index: true,
    },
    response: {
      type: Object, // lưu lại response JSON
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // TTL 600s = 10 phút (tự động xoá key sau 10p)
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: COLLECTION_NAME,
  }
);

const IdempotencyKey = model(DOCUMENT_NAME, IdempotencyKeySchema);
export default IdempotencyKey;
