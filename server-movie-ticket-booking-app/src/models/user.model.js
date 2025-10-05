"use strict";
import { Schema, model } from "mongoose";

const DOCUMENT_NAME = "user";
const COLLECTION_NAME = "users";

const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

const User = model(DOCUMENT_NAME, userSchema);
export default User;
