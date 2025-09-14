"use strict";

import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { createMomoPayment } from "../services/paymentMomoService.js";
import { createVNPayPayment } from "../services/paymentVNPayService.js";
import { createZalopayPayment } from "../services/paymentZalopayService.js";

// Func to check avilability of seat
const checkSeatAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats;

    const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats[seat]);

    return !isAnySeatTaken;
  } catch (error) {
    console.error(error.massage);
    return false;
  }
};

export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { showId, selectedSeats } = req.body;
    const { origin } = req.headers;
    // Check if the seat is available for the selected show
    const isAvailable = await checkSeatAvailability(showId, selectedSeats);
    if (!isAvailable) {
      return res.status(400).json({ success: false, message: "Seats is not available" });
    }

    // Get  the show details
    const showData = await Show.findById(showId).populate("movie");

    // Create a new booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
    });

    selectedSeats.map((seat) => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified("occupiedSeats");

    await showData.save();

    // Stripe Gateway Initialization
    // const result = await createMomoPayment({ orderId: booking._id, amount: booking.amount * 1000 });
    // const result = await createVNPayPayment({ orderId: booking._id.toString(), amount: booking.amount });
    const result = await createZalopayPayment({ orderId: booking._id.toString(), originUrl: origin });
    console.log("test payment: ", result);

    booking.paymentLink = result.paymentLink;
    await booking.save();

    // Run Inngest Scheduler Function to check payment status after 10 minutes
    await inngest.send({
      name: "app/checkpayment",
      data: {
        bookingId: booking._id.toString(),
      },
    });

    // res.status(200).json({ success: true, redirectUrl: result.payUrl });
    // res.status(200).json({ success: true, redirectUrl: result });
    res.status(200).json({ success: true, redirectUrl: result.paymentLink });
  } catch (error) {
    console.error(error);
    console.error(error.massage);
    res.status(500).json({ success: false, message: error.massage });
  }
};

export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);

    const occupiedSeats = Object.keys(showData.occupiedSeats);

    res.status(200).json({ success: true, occupiedSeats });
  } catch (error) {}
};
