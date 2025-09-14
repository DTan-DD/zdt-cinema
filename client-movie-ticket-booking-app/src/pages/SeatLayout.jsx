import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import { ArrowRightIcon, BadgeDollarSignIcon, ClockIcon, CurrencyIcon, FilmIcon, LocationEditIcon } from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const SeatLayout = () => {
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
              border-primary/60 cursor-pointer ${selectedSeats.includes(seatId) && "bg-primary text-white"}
              ${occupiedSeats.includes(seatId) && "opacity-50"}`}
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

  return show ? (
    <div>
      <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30">
        {/* Available Timing */}
        <div
          className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max
        md:sticky md:top-20"
        >
          <p className="text-lg font-semibold px-6">Thông tin chi tiết</p>
          {/* <div className="mt-5 space-y-1">
            {show.dateTime[date].map((item) => (
              <div
                key={item.time}
                onClick={() => setSelectedTime(item)}
                className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition
            ${selectedTime?.time === item.time ? "bg-primary text-white" : "hover:bg-primary/20"}`}
              >
                <ClockIcon className="w-4 h-4" />
                <p className="text-sm">{isoTimeFormat(item.time)}</p>
              </div>
            ))}
          </div> */}
          {/* info show */}
          <div className="mt-5 space-y-1">
            <div className="flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition">
              <ClockIcon className="w-4 h-4" />
              <p className="text-sm">{isoTimeFormat(show.showDateTime)}</p>
            </div>
            <div className="flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition">
              <BadgeDollarSignIcon className="w-4 h-4" />
              <p className="text-sm">{show.showPrice}</p>
            </div>
            <div className="flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition">
              <LocationEditIcon className="w-4 h-4" />
              <p className="text-sm">{show.cinema.name}</p>
            </div>
            <div className="flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition">
              <FilmIcon className="w-4 h-4" />
              <p className="text-sm">{show.movie.title}</p>
            </div>
            {/* image movie */}
            <div className="flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition">
              <img src={image_base_url + show.movie.backdrop_path} alt={show.movie.title} className="w-12 h-16" />
              {/* <p className="text-sm">{show.movie.title}</p> */}
            </div>
          </div>
        </div>

        {/* Seats Layout */}
        <div className="relative flex flex-1 flex-col items-center max-md:mt-16">
          <BlurCircle top="-100px" left="-100px" />
          <BlurCircle top="0px" left="0px" />
          <h1 className="text-2xl font-semibold mb-4">Select your seat</h1>
          <img src={assets.screenImage} alt="screen" />
          <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>

          <div className="flex flex-col items-center mt-10 text-xs text-gray-300">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6">{groupRows[0].map((row) => renderSeats(row))}</div>
            <div className="grid gap-11 grid-cols-2">
              {groupRows.slice(1).map((group, index) => (
                <div key={index}>{group.map((row) => renderSeats(row))}</div>
              ))}
            </div>
          </div>

          <button
            onClick={bookTickets}
            className="flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full 
          font-medium cursor-pointer active:scale-95"
          >
            Process to Checkout
            <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;
