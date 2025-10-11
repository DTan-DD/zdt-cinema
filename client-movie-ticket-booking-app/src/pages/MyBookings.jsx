import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat";
import dateFormat from "../lib/dateFormat";
import { useAppContext } from "../context/AppContext";
import { Link } from "react-router-dom";
import CheckoutModal from "../components/CheckoutModal";
import BookingDetailsModal from "../components/BookingDetailsModal";
import { toast } from "react-hot-toast";

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY;
  const { axios, getToken, user, image_base_url } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get("/v1/api/users/bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setBookings(data.metadata.bookings);
      }
    } catch (error) {
      console.error("Error fetching bookings: ", error);
    }
    setIsLoading(false);
  };

  const openCheckout = (booking) => {
    if (!user) {
      return toast.error("Vui lòng đăng nhập để đặt vé");
    }

    setSelectedBooking(booking);
    setIsCheckoutOpen(true);
  };

  const openDetails = (booking) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const cancelBooking = async () => {
    try {
      const { data } = await axios.post(
        `/v1/api/bookings/cancel/${selectedBooking._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      if (data.success) {
        setIsCheckoutOpen(false);
        toast.success(data.metadata.message);
        getMyBookings();
      } else {
        setIsCheckoutOpen(false);
        toast.error(data.metadata.message);
      }
    } catch (error) {
      console.error("Error booking tickets: ", error);
    }
  };

  const payTickets = async (paymentMethod) => {
    try {
      setIsBookingLoading(true);

      if (!user) {
        toast.error("Please login to book tickets");
        return;
      }

      if (!paymentMethod) {
        toast.error("Please select payment method");
        return;
      }

      const { data } = await axios.post(
        `/v1/api/bookings/payment/`,
        {
          paymentMethod: paymentMethod, // Include payment method in request
          bookingId: selectedBooking._id,
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        setIsCheckoutOpen(false);
        // toast.success(data.metadata.message);
        window.location.href = data.metadata.redirectUrl;
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.error("Error booking tickets: ", error);
      toast.error("Có lỗi xảy ra khi thanh toán");
    } finally {
      setIsBookingLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getMyBookings();
    }
  }, [user]);

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <div>
        <BlurCircle bottom="0px" left="600px" />
      </div>
      <h1 className="text-lg font-semibold mb-4">My bookings</h1>

      {bookings.map((item, index) => (
        <div
          key={index}
          className="flex flex-col md:flex-row justify-between bg-primary/8 border
        border-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
        >
          <div className="flex flex-col md:flex-row">
            <img
              src={image_base_url + item.show.movie.poster_path}
              alt=""
              className="md:max-w-45 aspect-video h-auto object-cover
            object-bottom rounded"
            />
            <div className="flex flex-col p-4">
              <p className="text-lg font-semibold">{item.show.movie.title}</p>
              {/* <p className="text-sm text-gray-400">{timeFormat(item.show.movie.runtime)}</p> */}
              <p className="text-sm text-gray-400 mt-auto">Suất chiếu: {dateFormat(item.show.showDateTime)}</p>
            </div>
          </div>

          <div className="flex flex-col max-md:flex-row md:items-end md:text-right justify-between p-4 w-full md:w-3/10">
            <div className="text-sm">
              <p className="text-2xl font-semibold mb-3">
                {item.amount}
                {currency}
              </p>

              <p>
                <span className="text-gray-400">Số ghế: </span>
                {item.bookedSeats.join(", ")}
              </p>
              <p className={`${item.isPaid ? "text-green-500" : "text-red-500"} max-md:hidden`}>
                <span className="text-gray-400">Trạng thái: </span>
                {item.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {!item.isPaid ? (
                <button
                  onClick={() => openCheckout(item)}
                  className="bg-primary px-4 py-3 md:py-1.5 mb-3 text-sm rounded-full
              font-medium cursor-pointer text-white hover:bg-primary-dull transition-colors"
                >
                  Thanh toán
                </button>
              ) : (
                <button
                  onClick={() => openDetails(item)}
                  className="bg-green-500 px-4 py-3 md:py-1.5 mt-3 text-sm rounded-full
              font-medium cursor-pointer text-white hover:bg-green-600 transition-colors"
                >
                  Chi tiết
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Checkout Modal for unpaid bookings */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        show={selectedBooking?.show}
        selectedSeats={selectedBooking?.bookedSeats}
        onConfirmBooking={(paymentMethod) => {
          payTickets(paymentMethod);
        }}
        onCancelBooking={() => cancelBooking()}
        image_base_url={image_base_url}
        isLoading={isBookingLoading}
      />

      {/* Details Modal for paid bookings */}
      <BookingDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} booking={selectedBooking} image_base_url={image_base_url} />
    </div>
  ) : (
    <Loading />
  );
};

export default MyBookings;
