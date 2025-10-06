"use strict";
import mongoose from "mongoose";
import Show from "../models/show.model.js";
import Booking from "../models/booking.model.js";
import Ticket from "../models/ticket.model.js";
import { BadRequestError, PaymentErrorResponse } from "../core/error.response.js";
import { createMomoPayment } from "./payments/paymentMomo.service.js";
import { createVNPayPayment } from "./payments/paymentVNPay.service.js";
import { createZalopayPayment } from "./payments/paymentZalopay.service.js";
import PaymentLog from "../models/paymentLog.model.js";
import { createNotification } from "./notification.service.js";
import { getAdmins } from "../utils/index.js";
import { inngest } from "../inngest/index.js";

export const createBookingV2 = async (req) => {
  // Bắt đầu session cho transaction
  const session = await mongoose.startSession();
  const { userId } = req.auth();
  const { showId, selectedSeats, paymentMethod } = req.body;
  const { origin } = req.headers;
  // Validate input
  if (!showId || !selectedSeats?.length || !paymentMethod) {
    throw new BadRequestError("Missing required fields");
  }
  let booking;
  let paymentLink;

  try {
    // 1. Check seat availability với session
    const isAvailable = await checkSeatAvailability(showId, selectedSeats, session);
    if (!isAvailable) {
      throw new BadRequestError("Seats are not available");
    }

    // 2. Get show details với session
    const showData = await Show.findById(showId).populate("movie").session(session);

    if (!showData) {
      throw new BadRequestError("Show not found");
    }
    // Bắt đầu transaction
    await session.withTransaction(async () => {
      // 3. Reserve seats trước khi tạo booking (optimistic locking)
      const updateResult = await Show.updateOne(
        {
          _id: showId,
          // Kiểm tra ghế vẫn available
          ...selectedSeats.reduce((acc, seat) => {
            acc[`occupiedSeats.${seat}`] = { $exists: false };
            return acc;
          }, {}),
        },
        {
          // Reserve ghế với userId
          ...selectedSeats.reduce((acc, seat) => {
            acc[`occupiedSeats.${seat}`] = userId;
            return acc;
          }, {}),
        },
        { session }
      );

      if (updateResult.matchedCount === 0) {
        throw new BadRequestError("Seats are no longer available");
      }

      // 4. Tạo booking
      const bookingData = {
        user: userId,
        show: showId,
        amount: showData.showPrice * selectedSeats.length,
        bookedSeats: selectedSeats,
        paymentMethod: paymentMethod,
      };

      const [newBooking] = await Booking.create([bookingData], { session });
      booking = newBooking;

      // 5. Tạo tickets
      const ticketData = selectedSeats.map((seat) => ({
        booking: booking._id,
        seat,
      }));
      const tickets = await Ticket.insertMany(ticketData, { session });

      // 6. Cập nhật booking với tickets
      booking.tickets = tickets.map((ticket) => ticket._id);
      await booking.save({ session });
    });

    // Transaction thành công, giờ tạo payment link (bên ngoài transaction)
    paymentLink = await createPaymentLink(booking, paymentMethod, origin);

    // Cập nhật payment link
    booking.paymentLink = paymentLink;
    await booking.save();

    // Run Inngest Schedule Func to check payment status
    await inngest.send({ name: "app/checkpayment", data: { bookingId: booking._id.toString() } });

    // Tạo notification
    const admins = await getAdmins();
    await createNotification({
      type: "BOOKING",
      title: "Có đơn đặt vé mới 🎬",
      message: `Khách hàng vừa đặt vé cho phim ${showData.movie.title}`,
      receiverIds: admins.map((a) => a.id),
      meta: { bookingId: booking._id },
    });

    return {
      redirectUrl: paymentLink,
      bookingId: booking._id,
    };
  } catch (error) {
    console.error("Booking creation failed, rollbacking...", error);

    // Nếu tạo payment link thất bại, rollback booking
    if (booking) {
      await rollbackBooking(booking._id);
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

const createPaymentLink = async (booking, paymentMethod, origin) => {
  const orderId = booking._id.toString();

  try {
    switch (paymentMethod) {
      case "momo":
        const momoResult = await createMomoPayment({
          orderId,
          amount: booking.amount,
          originUrl: origin,
        });
        return momoResult.payUrl;

      case "vnpay":
        const vnpayResult = await createVNPayPayment({
          orderId,
          amount: booking.amount,
          originUrl: origin,
        });
        return vnpayResult;

      case "zalopay":
        const zaloResult = await createZalopayPayment({
          orderId,
          originUrl: origin,
        });
        return zaloResult.paymentLink;

      default:
        throw new BookingError("Invalid payment method");
    }
  } catch (error) {
    throw new PaymentErrorResponse(error.message);
  }
};

// Helper function để rollback booking khi payment thất bại
const rollbackBooking = async (bookingId) => {
  const rollbackSession = await mongoose.startSession();
  try {
    await rollbackSession.withTransaction(async () => {
      // Lấy booking info
      const booking = await Booking.findById(bookingId).session(rollbackSession);
      if (!booking) return;

      // Xóa tickets
      await Ticket.deleteMany({ booking: bookingId }, { session: rollbackSession });

      // Release seats
      const updateFields = {};
      booking.bookedSeats.forEach((seat) => {
        updateFields[`occupiedSeats.${seat}`] = 1;
      });

      await Show.updateOne({ _id: booking.show }, { $unset: updateFields }, { session: rollbackSession });

      // Xóa booking
      await Booking.deleteOne({ _id: bookingId }, { session: rollbackSession });

      // Xóa payment log
      await PaymentLog.deleteOne({ bookingId: bookingId }, { session: rollbackSession });
    });
  } catch (error) {
    console.error("Rollback failed:", error);
    // attach rollback error để middleware logger ghi lại
    error.rollbackError = error;
  } finally {
    await rollbackSession.endSession();
  }
};

// Cập nhật function check availability để support session
const checkSeatAvailability = async (showId, selectedSeats, session = null) => {
  const show = await Show.findById(showId).session(session);
  if (!show) return false;

  // Kiểm tra xem các ghế có bị occupied không
  return selectedSeats.every((seat) => !show.occupiedSeats[seat]);
};

// Payment
export const bookingPayment = async (req) => {
  try {
    const { userId } = req.auth();
    const { paymentMethod } = req.body;
    let { bookingId = null } = req.body;
    const { origin } = req.headers;

    // Check if the user has already made a booking for the same show
    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) {
      throw new BadRequestError("Booking not found");
    }

    if (existingBooking.user.toString() !== userId) {
      throw new AuthFailureError("Unauthorized");
    }

    // Payment method: Momo, VNPay, ZaloPay
    let result;
    let paymentLink;
    const orderId = bookingId;
    if (paymentMethod != existingBooking.paymentMethod) {
      existingBooking.paymentMethod = paymentMethod;
      await existingBooking.save();
      await PaymentLog.findOneAndDelete({ bookingId });

      result = await createPaymentLink(existingBooking, paymentMethod, origin);
      paymentLink = result;
    } else {
      paymentLink = existingBooking.paymentLink;
    }

    return {
      redirectUrl: paymentLink,
    };
  } catch (error) {
    throw error;
  }
};

export const cancelBooking = async (req) => {
  try {
    const { userId } = req.auth();
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new BadRequestError("Booking not found");
    }
    if (booking.user.toString() !== userId) {
      throw new AuthFailureError("Unauthorized");
    }
    if (booking.isPaid) {
      throw new BadRequestError("Cannot cancel a paid booking");
    }

    // Release seats
    const show = await Show.findById(booking.show);
    booking.bookedSeats.forEach((seat) => {
      delete show.occupiedSeats[seat];
    });
    show.markModified("occupiedSeats");
    await show.save();

    // Delete booking
    await Booking.findByIdAndDelete(bookingId);
    // Delete paymentLog
    await PaymentLog.findOneAndDelete({ bookingId: bookingId });

    return { message: "Booking cancelled successfully" };
  } catch (error) {
    console.error("Cancel booking error:", error);
    // next(error);
    throw error;
  }
};

export const getOccupiedSeats = async (req) => {
  const { showId } = req.params;
  const showData = await Show.findById(showId);

  const occupiedSeats = Object.keys(showData.occupiedSeats);

  return { occupiedSeats };
};
