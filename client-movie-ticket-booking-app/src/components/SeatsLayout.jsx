import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const ZoomableSeatsLayout = ({ selectedSeats, occupiedSeats, handleSeatClick, screenImage }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
    ["I", "J"],
  ];

  // Auto-fit on component mount for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // On mobile, start with a smaller scale to fit better
        setScale(0.8);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(window.innerWidth < 768 ? 0.8 : 1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Add boundaries to prevent dragging too far
    const container = containerRef.current;
    const content = contentRef.current;
    if (container && content) {
      const containerRect = container.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

      const maxX = Math.max(0, (contentRect.width * scale - containerRect.width) / 2);
      const maxY = Math.max(0, (contentRect.height * scale - containerRect.height) / 2);

      setPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY)),
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    const container = containerRef.current;
    const content = contentRef.current;
    if (container && content) {
      const containerRect = container.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

      const maxX = Math.max(0, (contentRect.width * scale - containerRect.width) / 2);
      const maxY = Math.max(0, (contentRect.height * scale - containerRect.height) / 2);

      setPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const renderSeats = (row, count = 9) => (
    <div key={row} className="flex gap-2 mt-2 justify-center">
      {Array.from({ length: count }, (_, i) => {
        const seatId = `${row}${i + 1}`;
        return (
          <button
            key={seatId}
            onClick={() => handleSeatClick(seatId)}
            className={`h-8 w-8 rounded border text-xs font-medium
            border-primary/60 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95
            ${selectedSeats.includes(seatId) && "bg-primary text-white shadow-lg"}
            ${occupiedSeats.includes(seatId) && "opacity-50 cursor-not-allowed bg-red-100"}
            ${!selectedSeats.includes(seatId) && !occupiedSeats.includes(seatId) && "bg-white hover:bg-gray-50"}
            `}
          >
            {seatId}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative w-full h-full bg-primary/10 rounded-2xl overflow-hidden">
      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button onClick={handleZoomIn} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200" title="Phóng to">
          <ZoomIn className="w-4 h-4 text-gray-700" />
        </button>
        <button onClick={handleZoomOut} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200" title="Thu nhỏ">
          <ZoomOut className="w-4 h-4 text-gray-700" />
        </button>
        <button onClick={handleReset} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200" title="Đặt lại">
          <RotateCcw className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-lg">
        <span className="text-sm font-medium text-gray-700">{Math.round(scale * 100)}%</span>
      </div>

      {/* Instructions for mobile */}
      <div className="absolute bottom-4 left-4 right-4 z-10 md:hidden">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-center">
          <p className="text-xs text-gray-600">Kéo để di chuyển • Dùng nút zoom để phóng to/thu nhỏ</p>
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Content */}
        <div
          ref={contentRef}
          className="flex flex-col items-center min-h-full p-8 select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        >
          {/* <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Chọn ghế ngồi</h1>
            <p className="text-gray-100">Hãy chọn ghế yêu thích của bạn</p>
          </div> */}

          {/* Screen */}
          {/* <div className="mb-8">
            <div className="w-80 h-12 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-3xl mx-auto shadow-lg">
              <div className="w-full h-full bg-gradient-to-b from-white/20 to-transparent rounded-t-3xl flex items-center justify-center">
                <span className="text-gray-600 font-medium text-sm">MÀN HÌNH CHIẾU</span>
              </div>
            </div>
            <p className="text-gray-200 text-sm text-center mt-2 font-medium">SCREEN</p>
          </div> */}

          {/* Seat Legend */}
          {/* <div className="flex flex-wrap justify-center gap-6 mb-8 p-4 bg-gray-200 rounded-lg">
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
          </div> */}

          {/* Fixed Seats Layout - Always maintain the same structure */}
          <div className="flex flex-col items-center text-xs text-gray-200 w-full max-w-md">
            {/* First group: A, B */}
            <div className="mb-8">{groupRows[0].map((row) => renderSeats(row))}</div>

            {/* Remaining groups arranged in pairs */}
            <div className="space-y-8">
              {groupRows.slice(1).map((group, index) => (
                <div key={index} className="flex justify-center gap-12">
                  <div className="space-y-2">{renderSeats(group[0])}</div>
                  <div className="space-y-2">{renderSeats(group[1])}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo component to show how to use it
const SeatLayoutDemo = () => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const occupiedSeats = ["A1", "A2", "C5", "E7", "G3"]; // Demo occupied seats

  const handleSeatClick = (seatId) => {
    if (occupiedSeats.includes(seatId)) {
      alert("This seat is already booked!");
      return;
    }

    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      alert("You can only select 5 seats!");
      return;
    }

    setSelectedSeats((prev) => (prev.includes(seatId) ? prev.filter((seat) => seat !== seatId) : [...prev, seatId]));
  };

  return (
    <div className="w-full h-screen bg-gray-100">
      <ZoomableSeatsLayout selectedSeats={selectedSeats} occupiedSeats={occupiedSeats} handleSeatClick={handleSeatClick} />

      {/* Selected seats summary */}
      {selectedSeats.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <h4 className="font-medium mb-2">Ghế đã chọn:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map((seat) => (
              <span key={seat} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                {seat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatLayoutDemo;
