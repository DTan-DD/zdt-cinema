"use strict";

import Show from "../models/show.model.js";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import Movie from "../models/movie.model.js";
import { startOfDay, endOfDay, subDays } from "date-fns";
import Cinema from "../models/cinema.model.js";
import { BadRequestError } from "../core/error.response.js";

// API to check if user is admin
export const isAdmin = async (req, res) => {
  return { isAdmin: true };
};

// API to get dashboard data

export const getDashboardData = async (req, res) => {
  // ===== 1. Query param timeRange (mặc định 7 ngày) =====
  const timeRange = parseInt(req.query.timeRange) || 7;
  const startDate = startOfDay(subDays(new Date(), timeRange - 1));
  const endDate = endOfDay(new Date());

  // ===== 2. Base data =====
  const bookings = await Booking.find({
    createdAt: { $gte: startDate, $lte: endDate },
  });
  const paidBookings = bookings.filter((b) => b.isPaid);

  const shows = await Show.find({
    showDateTime: { $gte: new Date() },
  }).populate("movie");

  const totalUser = await User.countDocuments();

  // ===== 3. Today stats =====
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const todayBookingsDocs = await Booking.find({
    createdAt: { $gte: todayStart, $lte: todayEnd },
  });
  const todayBookings = todayBookingsDocs.length;
  const todayRevenue = todayBookingsDocs.filter((b) => b.isPaid).reduce((sum, b) => sum + b.amount, 0);

  // ===== 4. Pending payments =====
  const pendingPaymentsDocs = bookings.filter((b) => !b.isPaid);
  const pendingPayments = pendingPaymentsDocs.length;
  const pendingPaymentAmount = pendingPaymentsDocs.reduce((sum, b) => sum + b.amount, 0);

  // ===== 5. Occupancy rate =====
  let totalSeatsBooked = 0;
  let totalSeats = 0;
  shows.forEach((show) => {
    const bookedSeats = Object.values(show.occupiedSeats || {}).flat().length;
    totalSeatsBooked += bookedSeats;
    totalSeats += 100; // giả định 100 ghế / show, nếu bạn có schema cinema thì thay vào
  });
  const occupancyRate = totalSeats ? ((totalSeatsBooked / totalSeats) * 100).toPrecision(2) : 0;

  // ===== 6. Growth so với ngày trước =====
  const yesterdayStart = startOfDay(subDays(new Date(), 1));
  const yesterdayEnd = endOfDay(subDays(new Date(), 1));
  const yesterdayBookings = await Booking.find({
    createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
  });

  const bookingsGrowth = yesterdayBookings.length ? ((todayBookings - yesterdayBookings.length) / yesterdayBookings.length) * 100 : 0;

  const yesterdayRevenue = yesterdayBookings.filter((b) => b.isPaid).reduce((sum, b) => sum + b.amount, 0);

  const revenueGrowth = yesterdayRevenue ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

  const showsGrowth = 0; // TODO: so sánh số show mới
  const usersGrowth = 0; // TODO: so sánh số user mới

  // ===== 7. Charts data theo timeRange =====
  const revenueChart = [];
  const bookingChart = [];
  for (let i = timeRange - 1; i >= 0; i--) {
    const dayStart = startOfDay(subDays(new Date(), i));
    const dayEnd = endOfDay(subDays(new Date(), i));
    const dayBookings = bookings.filter((b) => b.createdAt >= dayStart && b.createdAt <= dayEnd);
    const dayRevenue = dayBookings.filter((b) => b.isPaid).reduce((sum, b) => sum + b.amount, 0);

    revenueChart.push({
      date: dayStart.toISOString().slice(0, 10),
      revenue: dayRevenue,
    });
    bookingChart.push({
      date: dayStart.toISOString().slice(0, 10),
      bookings: dayBookings.length,
    });
  }

  // ===== 8. Business insights =====
  // Top movies
  // 1. Lấy booking đã thanh toán trong khoảng timeRange, populate show.movie
  const paidBookings2 = await Booking.find({
    isPaid: true,
    createdAt: { $gte: startDate, $lte: endDate },
  }).populate({
    path: "show",
    populate: { path: "movie", select: "title" },
  });

  // 2. Gom stats theo movieId
  const movieStats = {};
  paidBookings2.forEach((b) => {
    const movieId = b.show?.movie?._id;
    if (!movieId) return;

    if (!movieStats[movieId]) {
      movieStats[movieId] = {
        title: b.show.movie.title,
        bookings: 0,
        revenue: 0,
      };
    }

    movieStats[movieId].bookings += 1;
    movieStats[movieId].revenue += b.amount;
  });

  // 3. Convert sang array + sort theo doanh thu giảm dần
  const topMovies = Object.values(movieStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Shows by status
  const showsByStatus = {
    draft: shows.filter((s) => s.isDraft).length,
    upcoming: shows.filter((s) => s.showDateTime > new Date()).length,
    showing: shows.filter((s) => s.showDateTime <= new Date() && !s.isDeleted).length,
    showed: await Show.countDocuments({
      showDateTime: { $lt: new Date() },
    }),
  };

  // Recent bookings
  const recentBookings = await Booking.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("user", "name")
    .populate({
      path: "show",
      populate: { path: "movie", select: "title" },
    });

  // ===== 9. Response =====
  const dashboardData = {
    // existing
    totalUser,
    totalBookings: paidBookings.length,
    activeShows: shows,
    totalRevenue: paidBookings.reduce((t, b) => t + b.amount, 0),

    // new
    todayBookings,
    todayRevenue,
    pendingPayments,
    pendingPaymentAmount,
    occupancyRate,
    bookingsGrowth,
    revenueGrowth,
    showsGrowth,
    usersGrowth,

    // charts
    revenueChart,
    bookingChart,

    // insights
    topMovies,
    showsByStatus,
    recentBookings,
  };

  return { dashboardData };
};

// API to get all shows from dbs
export const getAllShows = async (req, res) => {
  const { filter = "all", sort = "newest", page = 1, limit = 10, search = "", searchQueryDate } = req.query;

  const now = new Date();
  let query = {};

  // --- search ---
  if (search) {
    // movie name
    const movies = await Movie.find({
      title: { $regex: search, $options: "i" },
    }).select("_id");
    const movieIds = movies.map((movie) => movie._id);

    // cinema name
    const cinemas = await Cinema.find({
      name: { $regex: search, $options: "i" },
    }).select("_id");
    const cinemaIds = cinemas.map((cinema) => cinema._id);

    query.$or = [{ movie: { $in: movieIds } }, { cinema: { $in: cinemaIds } }];
  }

  if (searchQueryDate) {
    const searchDate = new Date(searchQueryDate);
    const nextDay = new Date(searchDate);
    nextDay.setDate(searchDate.getDate() + 1);

    query.showDateTime = {
      $gte: searchDate,
      $lt: nextDay,
    };
  }

  // --- filter ---
  switch (filter) {
    case "showing":
      query = {
        isDeleted: false,
        isPublished: true,
        showDateTime: { $lte: now },
        $expr: {
          $gte: [{ $add: ["$showDateTime", { $multiply: ["$runtime", 60000] }] }, now],
        },
      };
      break;
    case "today": // đang chiếu (cùng ngày hôm nay)
      (query.isDeleted = false), (query.isPublished = true);
      query.showDateTime = { $gte: new Date(now.setHours(0, 0, 0, 0)), $lte: new Date(now.setHours(23, 59, 59, 999)) };
      break;
    case "showed": // đã chiếu
      (query.isDeleted = false), (query.isPublished = true);
      query.showDateTime = { $lt: now };
      break;
    case "draft": // nháp
      (query.isDeleted = false), (query.isDraft = true);
      break;
    case "upcoming": // sắp chiếu
      (query.isDeleted = false), (query.isPublished = true);
      query.showDateTime = { $gt: now };
      break;
    default: // tất cả
      query.isDeleted = false;
      break;
  }

  // --- sort ---
  let sortOption = { showDateTime: -1 }; // default newest
  if (sort === "oldest") sortOption = { showDateTime: 1 };

  // --- pagination ---
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [shows, total] = await Promise.all([
    Show.find(query) //
      .select("+isDraft +isPublished") // 👈 thêm dòng này
      .populate("movie cinema")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit)),
    Show.countDocuments(query),
  ]);

  return { shows, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } };
};

// API to get all bookings
export const getAllBookings = async (req, res) => {
  const { filter = "all", sort = "newest", page = 1, limit = 10, search = "" } = req.query;

  const now = new Date();
  let query = {};

  // --- Xử lý search tốt hơn ---
  if (search) {
    // Tìm user có name phù hợp với search trước
    const users = await User.find({
      name: { $regex: search, $options: "i" },
    }).select("_id");

    const userIds = users.map((user) => user._id);

    query.$or = [
      { bookingCode: { $regex: search, $options: "i" } },
      { user: { $in: userIds } }, // Tìm booking của các user có tên phù hợp
    ];
  }

  // --- Filter theo trạng thái ---
  if (filter !== "all") {
    switch (filter) {
      case "paid":
        query.isPaid = true;
        break;
      case "unpaid":
        query.isPaid = false;
        query.isDeleted = false;
        break;
      case "expired":
        query.isDeleted = true;
        query.isPaid = false;
        break;
    }
  }

  // --- Sort ---
  let sortOption = { createdAt: -1 };
  if (sort === "oldest") sortOption = { createdAt: 1 };
  if (sort === "showTime-asc") sortOption = { "show.startTime": 1 };
  if (sort === "showTime-desc") sortOption = { "show.startTime": -1 };

  // --- Pagination ---
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // --- Query với populate ---
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate("user", "name email") // chỉ lấy name và email
      .populate({
        path: "show",
        populate: [
          { path: "movie", select: "title " },
          { path: "cinema", select: "name " },
        ],
      })
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(), // thêm lean() để tối ưu performance
    Booking.countDocuments(query),
  ]);

  return { bookings, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } };
};

export const getAllUsers = async (req, res) => {
  const { filter = "all", sort = "newest", page = 1, limit = 10, search = "" } = req.query;

  const now = new Date();
  let query = {};

  // --- Xử lý search tốt hơn ---
  if (search) {
    query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
  }

  // --- Sort ---
  let sortOption = { createdAt: -1 };
  if (sort === "oldest") sortOption = { createdAt: 1 };

  // --- Pagination ---
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // --- Query với populate ---
  const [users, total] = await Promise.all([
    User.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)).lean(), // thêm lean() để tối ưu performance
    User.countDocuments(query),
  ]);

  return { users, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } };
};

// API to update show
export const updateShow = async (req, res) => {
  const { showId } = req.params;
  const { cinema, showDateTime, showPrice, isPublished, isDraft } = req.body;
  let { movie_release_date } = req.body;

  // validate input
  if (!cinema || typeof cinema !== "string") {
    throw new BadRequestError("Cinema is required and must be a string");
  }
  if (!showDateTime || isNaN(new Date(showDateTime).getTime())) {
    throw new BadRequestError("Show time is required and must be a valid date");
  }
  if (new Date(showDateTime) < new Date()) {
    throw new BadRequestError("Show time must be in the future");
  }
  if (typeof showPrice !== "number" || showPrice <= 0) {
    throw new BadRequestError("Show price must be a positive number");
  }

  // find show
  const show = await Show.findById(showId);
  if (!show) {
    throw new BadRequestError("Show not found");
  }

  // check showDateTime
  if (show.showDateTime < new Date()) {
    throw new BadRequestError("Show time must be in the future");
  }

  // check showDateTime with movie release date
  if (!movie_release_date) {
    const movie = await Movie.findById(show.movie);
    if (!movie) {
      throw new BadRequestError("Movie not found");
    }
    movie_release_date = movie.release_date;
  }

  if (!movie_release_date || isNaN(new Date(movie_release_date).getTime())) {
    throw new BadRequestError("Movie release date is required and must be a valid date");
  }

  if (new Date(showDateTime) < new Date(movie_release_date)) {
    throw new BadRequestError("Show time must be on or after movie release date");
  }

  // update fields
  show.cinema = cinema;
  show.showDateTime = new Date(showDateTime);
  show.showPrice = showPrice;
  show.isPublished = isPublished;
  show.isDraft = isDraft;

  await show.save();

  return { show };
};

// API update booking
export const updateBooking = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new BadRequestError("Booking not found");
  }
  if (booking.isPaid) {
    throw new BadRequestError("Booking is paid");
  }
  booking.isPaid = true;
  await booking.save();
  return { booking };
};

// API update movies
export const updateMovie = async (req, res) => {
  const { movieId } = req.params;
  const { status, trailer, isFeatured } = req.body;
  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new BadRequestError("Movie not found");
  }
  movie.status = status;
  movie.trailer = trailer;
  movie.isFeatured = isFeatured;
  await movie.save();
  return { movie };
};

// API deleted show
export const deleteShow = async (req, res) => {
  const { showId } = req.params;
  const show = await Show.findById(showId);
  if (!show) {
    throw new BadRequestError("Show not found");
  }
  show.isDeleted = true;
  await show.save();
  return { show };
};

// API deleted booking
export const deleteBooking = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new BadRequestError("Booking not found");
  }
  booking.isDeleted = true;
  await booking.save();
  return { booking };
};

// API deleted movie
export const deleteMovie = async (req, res) => {
  const { movieId } = req.params;
  console.log(movieId);
  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new BadRequestError("Movie not found");
  }
  movie.isDeleted = true;
  await movie.save();
  return { movie };
};
