import { Inngest } from "inngest";
import User from "../models/user.model.js";
import { db } from "../../dbs/init.mongodb.js";
import Show from "../models/show.model.js";
import Booking from "../models/booking.model.js";
import sendEmail from "../../configs/nodeMailer.config.js";
import PaymentLog from "../models/paymentLog.model.js";
import { sendEmail_V2 } from "../../configs/sendEmail.config.js";
import { getAdmins } from "../utils/index.js";
import { createNotification } from "../services/notification.service.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest function to save user data to database
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
  }, //
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.create(userData);
    // Tạo notification
    const admins = await getAdmins();
    await createNotification({
      type: "USER",
      title: "Có khách hàng mới đăng ký",
      message: `Khách hàng ${userData.name} vừa đăng ký với email ${userData.email}.`,
      receiverIds: admins.map((a) => a.id),
      meta: { user: userData },
    });
  }
);

// Inngest function to delete user data from database
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" }, //
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await db.connect(); // đảm bảo connect xong mới query

    try {
      const { id } = event.data;
      await User.findByIdAndDelete(id);
      return { status: "deleted", id };
    } catch (err) {
      console.error("Delete user error:", err);
      throw err;
    }
  }
);

// Inngest function to update user data to database
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
  }, //
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.findByIdAndUpdate(id, userData);
  }
);

// Inngest Function to cancel booking and release seats of show after 30 minutes of booking created if payment is not made
const releaseSeatsAndDeleteBooking = inngest.createFunction({ id: "release-seats-and-delete-booking" }, { event: "app/checkpayment" }, async ({ event, step }) => {
  const tenMinutesLater = new Date(Date.now() + 5 * 60 * 1000);
  await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

  await step.run("check-payment-status", async () => {
    const bookingId = event.data.bookingId;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.warn(`[Inngest] Booking ${bookingId} not found.`);
      return; // hoặc throw nếu cần
    }
    // If payment is not made, release seats and delete booking
    if (!booking.isPaid) {
      const show = await Show.findById(booking.show);
      booking.bookedSeats.forEach((seat) => {
        delete show.occupiedSeats[seat];
      });
      show.markModified("occupiedSeats");
      await show.save();
      booking.isDeleted = true;
      booking.paymentLink = "";
      await booking.save();
      // await Booking.findByIdAndDelete(bookingId);
      // await PaymentLog.findOneAndDelete({ bookingId: bookingId });
    }
  });
});

// Inngest function to send email when user books a show
const sendBookingConfirmationEmail = inngest.createFunction({ id: "send-booking-confirmation-email" }, { event: "app/show.booked" }, async ({ event, step }) => {
  const { bookingId } = event.data;

  const booking = await Booking.findById(bookingId)
    .populate({
      path: "show",
      populate: { path: "movie", model: "movie" },
    })
    .populate("user");

  await sendEmail_V2({
    to: booking.user.email,
    subject: `Thư xác nhận vé cho bộ phim: "${booking.show.movie.title}" đã được thanh toán!`,
    body: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>Xin chào ${booking.user.name},</h2>
      <p>
        Vé cho bộ phim: 
        <strong style="color: #F84565;">"${booking.show.movie.title}"</strong> 
        đã được xác nhận.
      </p>

      <p>
        <strong>Ngày:</strong> 
        ${new Date(booking.show.showDateTime).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
        <br/>
        <strong>Giờ:</strong> 
        ${new Date(booking.show.showDateTime).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
      </p>

      <p>Hãy tận hưởng bộ phim yêu thích cùng DiTi Cinema! 🍿</p>
      <p>
        Cảm ơn bạn đã lựa chọn DiTi Cinema!<br/>
        — DiTi Cinema Team
      </p>
    </div>
  `,
  });
});

// Inngest function to send reminder
const sendShowReminders = inngest.createFunction(
  { id: "send-show-reminder" },
  { cron: "0 */8 * * *" }, // every 8 hours
  async ({ step }) => {
    const now = new Date();
    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const windowStart = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    // Prepare reminder tasks
    const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
      const shows = await Show.find({
        showDateTime: { $gte: windowStart, $lte: in8Hours },
      }).populate("movie");

      const tasks = [];
      for (const show of shows) {
        if (!show.movie || !show.occupiedSeats) continue;

        const userIds = [...new Set(Object.values(show.occupiedSeats))];
        if (userIds.length === 0) continue;

        const users = await User.find({ _id: { $in: userIds } }).select("name email");

        for (const user of users) {
          tasks.push({
            userEmail: user.email,
            userName: user.name,
            movieTitle: show.movie.title,
            showDateTime: show.showDateTime,
          });
        }
      }
      return tasks;
    });

    if (reminderTasks.length === 0) return { sent: 0, message: "No shows to send reminder" };

    // Send reminder emails
    const results = await step.run("send-all-reminder", async () => {
      return await Promise.allSettled(
        reminderTasks.map(async (task) => {
          sendEmail({
            to: task.userEmail,
            subject: `Reminder: Your show "${task.movieTitle}" starts soon!`,
            body: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2>Hi ${task.userName},</h2>
              <h3>
                Your show 
                <strong style="color: #F84565;">"${task.movieTitle}"</strong> 
                starts soon!
              </h3>

              <p>
                is scheduled for <strong>Date:</strong> 
                ${new Date(task.showDateTime).toLocaleDateString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })}
                <br/>
                <strong>Time:</strong> 
                ${new Date(task.showDateTime).toLocaleTimeString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })}
              </p>

              <p>It starts in approximately <strong>8 hours</strong> - make sure you're ready to be there!</p>
              <p>
                Hãy tận hưởng bộ phim yêu thích cùng DiTi Cinema!<br/>
                — DiTi Cinema Team
              </p>
            </div>`,
          });
        })
      );
    });

    const sent = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - sent;
    return { sent, failed, message: `Sent ${sent} reminder emails, failed to send ${failed}` };
  }
);

// Inngest function to send notifications when a new show is added
const sendNewShowNotifications = inngest.createFunction({ id: "send-new-show-notifications" }, { event: "app/show.created" }, async ({ event }) => {
  const { movieTitle } = event.data;
  const users = await User.findOne({});

  for (const user of users) {
    const userEmail = user.email;
    const userName = user.name;

    const subject = `🎬 New show added: ${movieTitle}`;
    const body = `
        <div style="font-family: Arial, sans-serif; padding: 20px ; line-height: 1.6; color: #333;">
          <h2>Xin chào ${userName},</h2>
          <h3>
            Có một show mới vừa được thêm: <strong style="color: #F84565;">${movieTitle}</strong> 
          </h3>
          <p>Hãy ghé DiTi Cinema để xem ngay!</p>
          <br/>
          <p>
            Hãy tận hưởng bộ phim yêu thích cùng DiTi Cinema!<br/>
            — DiTi Cinema Team
          </p>
      `;
    await sendEmail({
      to: userEmail,
      subject,
      body,
    });
  }

  return { sent: users.length, message: `Sent ${users.length} notification emails` };
});

// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation, //
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendShowReminders,
  sendNewShowNotifications,
];
