import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import { ArrowRightIcon, BadgeDollarSignIcon, ClockIcon, CurrencyIcon, FilmIcon, LocationEditIcon } from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import SeatLayoutDemo from "../components/SeatsLayout";

const SeatLayout_2 = () => {
  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
    ["I", "J"],
  ];
  const { id, date, showId } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const { axios, getToken, user, image_base_url } = useAppContext();
  // const navigate = useNavigate();

  const handleSeatClick = (seatId) => {
    // if (!selectedTime) {
    //   return toast("Please select time first!");
    // }
    if (!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
      return toast("You can only select 5 seats!");
    }
    if (occupiedSeats.includes(seatId)) {
      return toast("This seat is already booked!");
    }
    setSelectedSeats((pre) => (pre.includes(seatId) ? pre.filter((seat) => seat !== seatId) : [...pre, seatId]));
  };

  const renderSeats = (row, count = 9) => (
    <div key={row} className="flex gap-2 mt-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              className={`h-8 w-8 rounded border
              border-primary/60 cursor-pointer transition-all duration-200 hover:scale-105 ${selectedSeats.includes(seatId) && "bg-primary text-white shadow-lg"}
              ${occupiedSeats.includes(seatId) && "opacity-50 cursor-not-allowed bg-red-100"}`}
            >
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  );

  const getShow = async () => {
    try {
      // const { data } = await axios.get(`/v1/api/shows/${id}`);
      const { data } = await axios.get(`/v1/api/shows/get-show/${showId}`);
      // console.log(data);
      if (data.success) {
        setShow(data.show);
        console.log(data);
      }
    } catch (error) {
      console.error("Error fetching shows: ", error);
    }
  };

  const getOccupiedSeat = async () => {
    try {
      // const { data } = await axios.get(`/v1/api/bookings/seats/${selectedTime.showId}`);
      const { data } = await axios.get(`/v1/api/bookings/seats/${showId}`);
      // console.log(data);
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching occupied seats: ", error);
    }
  };

  const bookTickets = async () => {
    try {
      if (!user) {
        toast.error("Please login to book tickets");
      }

      // if (!selectedTime || !selectedSeats.length) {
      if (!selectedSeats.length) {
        return toast.error("Please select seats");
      }

      const { data } = await axios.post(
        `/v1/api/bookings/create/`,
        {
          showId: showId,
          selectedSeats,
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      // console.log(data);
      if (data.success) {
        // toast.success("Tickets booked successfully");
        // navigate("/my-bookings");
        window.location.href = data.redirectUrl;
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.error("Error fetching occupied seats: ", error);
    }
  };

  useEffect(() => {
    getShow();
    getOccupiedSeat();
  }, []);

  useEffect(() => {
    if (selectedTime) {
      getOccupiedSeat();
    }
  }, [selectedTime]);

  // Helper function to format runtime
  const formatRuntime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Helper function to format genres
  const formatGenres = (genres) => {
    return genres
      .slice(0, 3)
      .map((genre) => genre.name || genre)
      .join(" • ");
  };

  return show ? (
    <div className="min-h-screen bg-primary/10">
      <div className="flex flex-col lg:flex-row px-4 md:px-8 lg:px-16 xl:px-24 py-28 gap-8">
        {/* Movie Information Sidebar */}
        <div className="w-full lg:w-80 xl:w-96 bg-primary/50 shadow-xl rounded-2xl overflow-hidden lg:sticky lg:top-8 h-fitt">
          {/* Movie Poster Header */}
          <div className="relative h-48 md:h-56 lg:h-64 overflow-hidden">
            <img src={image_base_url + show.movie.backdrop_path} alt={show.movie.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-white text-xl md:text-2xl font-bold leading-tight mb-1">{show.movie.title}</h2>
              {show.movie.tagline && <p className="text-gray-200 text-sm italic">{show.movie.tagline}</p>}
            </div>
          </div>

          {/* Movie Details */}
          <div className="p-6 space-y-6">
            {/* Rating and Runtime */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-semibold">⭐ {show.movie.vote_average}/10</div>
              </div>
              <div className="text-gray-200 text-sm">{formatRuntime(show.movie.runtime)}</div>
            </div>

            {/* Genres */}
            <div>
              <h4 className="text-sm font-semibold text-gray-100 mb-2">Thể loại</h4>
              <p className="text-gray-200 text-sm">{formatGenres(show.movie.genres)}</p>
            </div>

            {/* Overview */}
            <div>
              <h4 className="text-sm font-semibold text-gray-100 mb-2">Tóm tắt</h4>
              <p className="text-gray-200 text-sm leading-relaxed line-clamp-4">{show.movie.overview}</p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Show Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Thông tin suất chiếu</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-100 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Thời gian</p>
                    <p className="text-sm text-blue-600">{isoTimeFormat(show.showDateTime)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <BadgeDollarSignIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Giá vé</p>
                    <p className="text-sm text-green-600 font-semibold">{show.showPrice.toLocaleString()} VNĐ</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <LocationEditIcon className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rạp chiếu</p>
                    <p className="text-sm text-purple-600">{show.cinema.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Seats Summary */}
            {selectedSeats.length > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h4 className="text-sm font-semibold text-gray-100 mb-2">Ghế đã chọn</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seat) => (
                    <span key={seat} className="px-2 py-1 bg-primary text-white text-xs rounded-full">
                      {seat}
                    </span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tổng tiền:</span>
                    <span className="font-semibold text-primary">{(show.showPrice * selectedSeats.length).toLocaleString()} VNĐ</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seats Layout */}
        <div className="flex-1 bg-primary/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="relative flex flex-col items-center p-8">
            <BlurCircle top="-100px" left="-100px" />
            <BlurCircle top="0px" left="0px" />

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-100 mb-2">Chọn ghế ngồi</h1>
              <p className="text-gray-100">Hãy chọn ghế yêu thích của bạn</p>
            </div>

            {/* Screen */}
            <div className="mb-8">
              <img src={assets.screenImage} alt="screen" className="mx-auto" />
              <p className="text-gray-200 text-sm text-center mt-2 font-medium">MÀN HÌNH CHIẾU</p>
            </div>

            {/* Seat Legend */}
            <div className="flex flex-wrap justify-center gap-6 mb-8 p-4 bg-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border border-gray-400 rounded bg-white"></div>
                <span className="text-sm text-gray-600">Trống</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded text-white flex items-center justify-center text-xs">✓</div>
                <span className="text-sm text-gray-600">Đã chọn</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-200 border border-red-300 rounded opacity-50"></div>
                <span className="text-sm text-gray-600">Đã đặt</span>
              </div>
            </div>

            {/* Seats Grid */}
            {/* <div className="flex flex-col items-center text-xs text-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-4 mb-8">{groupRows[0].map((row) => renderSeats(row))}</div>
              <div className="grid gap-12 md:gap-8 grid-cols-2">
                {groupRows.slice(1).map((group, index) => (
                  <div key={index} className="space-y-2">
                    {group.map((row) => renderSeats(row))}
                  </div>
                ))}
              </div>
            </div> */}

            <SeatLayoutDemo />

            {/* Book Button */}
            <button
              onClick={bookTickets}
              disabled={selectedSeats.length === 0}
              className={`flex items-center gap-2 mt-12 px-8 py-4 text-sm font-semibold rounded-full transition-all duration-200 transform 
                ${selectedSeats.length > 0 ? "bg-primary hover:bg-primary-dull text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              Tiến hành thanh toán
              <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout_2;
