import React, { useEffect, useState } from "react";
import BlurCircle from "./BlurCircle";
import { BuildingIcon, CalendarIcon, CheckCircleIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, InfoIcon, MapPinIcon, TicketIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const DateSelect = ({ dateTime, id }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const onBookHandler = () => {
    if (!selectedShow) {
      return toast("Please select showtime!");
    }
    navigate(`/movies/${id}/${selectedDate}/${selectedShow}`);
    scrollTo(0, 0);
  };

  useEffect(() => {}, [selectedDate, selectedShow]);

  function useVisibleDates() {
    const [visible, setVisible] = useState(5);

    useEffect(() => {
      function handleResize() {
        if (window.innerWidth < 640) {
          setVisible(2); // mobile
        } else if (window.innerWidth < 1024) {
          setVisible(3); // tablet
        } else {
          setVisible(5); // desktop
        }
      }
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return visible;
  }

  // Get sorted dates array
  const sortedDates = Object.keys(dateTime).sort((a, b) => new Date(a) - new Date(b));
  const visibleDates = useVisibleDates(); // Number of dates to show at once

  // Navigation handlers for date slider
  const handlePrevDates = () => {
    setCurrentDateIndex(Math.max(0, currentDateIndex - 1));
  };

  const handleNextDates = () => {
    setCurrentDateIndex(Math.min(sortedDates.length - visibleDates, currentDateIndex + 1));
  };

  // Get visible dates based on current index
  const getVisibleDates = () => {
    return sortedDates.slice(currentDateIndex, currentDateIndex + visibleDates);
  };

  // Format date display
  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return { label: "Today", date: date.getDate(), month: date.toLocaleDateString("en-US", { month: "short" }) };
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return { label: "Tomorrow", date: date.getDate(), month: date.toLocaleDateString("en-US", { month: "short" }) };
    } else {
      return {
        label: date.toLocaleDateString("vi-VN", { weekday: "short" }),
        date: date.getDate(),
        month: date.toLocaleDateString("vi-VN", { month: "short" }),
      };
    }
  };

  // Get cinema info with show counts
  const getCinemaShowInfo = (cinema) => {
    const totalShows = cinema.times.length;
    const availableShows = cinema.times.filter((t) => t.availableSeats > 0).length;
    return { totalShows, availableShows };
  };

  return (
    <div id="dateSelect" className="pt-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-primary/10 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <BlurCircle top="-100px" left="-100px" />
          <BlurCircle top="100px" left="0px" />

          {/* Header */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-200 mb-2">Chọn suất chiếu</h2>
            <p className="text-gray-200">Hãy chọn ngày và giờ yêu thích của bạn</p>
          </div>

          <div className="p-6 lg:p-8">
            {/* Date Selection */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Chọn ngày chiếu
                </h3>
                <div className="text-sm text-gray-100">Hiện có {sortedDates.length} ngày</div>
              </div>

              <div className="relative">
                <div className="flex items-center gap-4">
                  {/* Previous Button */}
                  <button
                    onClick={handlePrevDates}
                    disabled={currentDateIndex === 0}
                    className={`p-2 rounded-full border-2 transition-all duration-200 ${
                      currentDateIndex === 0 ? "border-gray-200 text-gray-200 cursor-not-allowed" : "border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary"
                    }`}
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>

                  {/* Date Grid */}
                  <div className="flex-1 overflow-hidden">
                    <div className="grid grid-cols-2 grid-rows-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {getVisibleDates().map((date) => {
                        const dateInfo = formatDateDisplay(date);
                        return (
                          <button
                            onClick={() => {
                              setSelectedDate(date);
                              setSelectedShow(null);
                            }}
                            key={date}
                            className={`relative group p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                              selectedDate === date ? "bg-primary text-white border-primary shadow-lg" : "border-gray-200 hover:border-primary/50 hover:bg-primary/5"
                            }`}
                          >
                            <div className="text-center">
                              <div className={`text-xs font-medium mb-1 ${selectedDate === date ? "text-white/80" : "text-gray-100"}`}>{dateInfo.label}</div>
                              <div className={`text-xl font-bold ${selectedDate === date ? "text-white" : "text-gray-200"}`}>{dateInfo.date}</div>
                              <div className={`text-xs ${selectedDate === date ? "text-white/80" : "text-gray-100"}`}>{dateInfo.month}</div>
                            </div>
                            {selectedDate === date && (
                              <div className="absolute -top-1 -right-1">
                                <div className="bg-white text-primary rounded-full p-1">
                                  <CheckCircleIcon className="w-4 h-4" />
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNextDates}
                    disabled={currentDateIndex >= sortedDates.length - visibleDates}
                    className={`p-2 rounded-full border-2 transition-all duration-200 ${
                      currentDateIndex >= sortedDates.length - visibleDates
                        ? "border-gray-200 text-gray-200 cursor-not-allowed"
                        : "border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary"
                    }`}
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Cinema & Time Selection */}
            {selectedDate && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                    <BuildingIcon className="w-5 h-5 text-primary" />
                    Hãy chọn rạp và suất chiếu
                  </h3>
                  <div className="text-sm text-gray-100">
                    {formatDateDisplay(selectedDate).label}, {formatDateDisplay(selectedDate).month} {formatDateDisplay(selectedDate).date}
                  </div>
                </div>

                <div className="grid gap-6 lg:gap-8">
                  {Object.entries(dateTime[selectedDate]).map(([cinemaId, cinema]) => {
                    const showInfo = getCinemaShowInfo(cinema);
                    return (
                      <div key={cinemaId} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-1">{cinema.cinemaName}</h4>
                            <p className="text-sm text-orange-600">
                              Hiện có {showInfo.totalShows} suất chiếu
                              {/* {showInfo.availableShows !== showInfo.totalShows && <span className="text-orange-600 ml-2">• {showInfo.totalShows - showInfo.availableShows} filling fast</span>} */}
                            </p>
                          </div>
                          <div className="text-right">
                            <MapPinIcon className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {cinema.times.map((t) => {
                            const showTime = new Date(t.time);
                            const isSelected = selectedShow === t.showId;
                            const isAlmostFull = t.availableSeats < 10;
                            const isFull = t.availableSeats === 0;

                            return (
                              <button
                                key={t.showId}
                                onClick={() => setSelectedShow(t.showId)}
                                disabled={isFull}
                                className={`relative p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                                  isFull
                                    ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                                    : isSelected
                                    ? "bg-primary text-white border-primary shadow-lg"
                                    : isAlmostFull
                                    ? "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300"
                                    : "border-gray-300 bg-white text-gray-700 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className="text-center">
                                  <div className="font-semibold">
                                    {showTime.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                  {/* <div className="text-xs mt-1 opacity-75">{isFull ? "Full" : `${t.availableSeats} seats`}</div> */}
                                </div>

                                {isSelected && (
                                  <div className="absolute -top-1 -right-1">
                                    <div className="bg-white text-primary rounded-full p-1">
                                      <CheckIcon className="w-3 h-3" />
                                    </div>
                                  </div>
                                )}

                                {isAlmostFull && !isFull && !isSelected && (
                                  <div className="absolute -top-1 -right-1">
                                    <div className="bg-orange-500 text-white rounded-full px-1.5 py-0.5 text-xs">!</div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Book Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-100">
                  {selectedDate && selectedShow ? (
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      Sẵn sàng để đặt vé
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <InfoIcon className="w-4 h-4 text-gray-200" />
                      Hãy chọn suất chiếu bạn yêu thích
                    </div>
                  )}
                </div>

                <button
                  onClick={onBookHandler}
                  disabled={!selectedShow}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform ${
                    selectedShow ? "bg-primary text-white hover:bg-primary/90 hover:scale-105 shadow-lg hover:shadow-xl active:scale-95" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TicketIcon className="w-5 h-5" />
                    Đặt vé ngay
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateSelect;
