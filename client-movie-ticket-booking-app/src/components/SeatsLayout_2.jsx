import React, { useState, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const ZoomableSeatsLayout_2 = ({ selectedSeats }) => {
  const [scale, setScale] = useState(1);
  const transformRef = useRef();

  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
    ["I", "J"],
  ];

  const renderSeats = (row, count = 9) => (
    <div key={row} className="flex gap-2 mt-2 justify-center">
      {Array.from({ length: count }, (_, i) => {
        const seatId = `${row}${i + 1}`;
        return (
          <button
            key={seatId}
            className={`h-8 w-8 rounded border text-xs font-medium
              border-primary/60 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95
              ${selectedSeats.includes(seatId) && "bg-primary text-white shadow-lg"}
             
              ${!selectedSeats.includes(seatId) && "bg-white hover:bg-gray-50"}
            `}
          >
            {seatId}
          </button>
        );
      })}
    </div>
  );

  // ===== MOBILE LAYOUT =====
  const MobileLayout = () => (
    <div className="relative w-full h-fit">
      <TransformWrapper
        ref={transformRef}
        initialScale={0.8}
        initialPositionX={0}
        initialPositionY={0}
        minScale={0.3}
        maxScale={2.5}
        centerOnInit={true}
        limitToBounds={false}
        onTransformed={(ref) => setScale(ref.state.scale)}
        wheel={{ disabled: true }}
        pinch={{ disabled: true }}
        doubleClick={{ disabled: true }}
        panning={{ disabled: false }}
        velocityAnimation={{
          disabled: false,
          sensitivity: 1,
          animationTime: 400,
        }}
      >
        {(utils) => (
          <>
            {/* Control Panel */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  utils.zoomOut(0.3);
                }}
                className="p-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg active:scale-95 select-none touch-manipulation"
                title="Thu nhỏ"
              >
                <RotateCcw className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4 z-50">
              <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-center">
                <p className="text-xs text-gray-600">Kéo để di chuyển</p>
              </div>
            </div>

            {/* Seats layout */}
            <TransformComponent
              wrapperClass="w-full h-full"
              contentClass="w-full h-full flex items-center justify-center"
              wrapperStyle={{
                width: "100%",
                height: "100%",
                touchAction: "none",
              }}
            >
              <div className="flex flex-col items-center text-xs text-gray-700 bg-white rounded-xl p-6 m-4 shadow-lg min-w-max">
                {/* First row */}
                <div className="mb-6">{groupRows[0].map((row) => renderSeats(row))}</div>

                {/* Other rows in groups */}
                <div className="space-y-6">
                  {groupRows.slice(1).map((group, index) => (
                    <div key={index} className="flex justify-center gap-8">
                      <div className="space-y-2">{renderSeats(group[0])}</div>
                      <div className="space-y-2">{renderSeats(group[1])}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );

  return (
    <div className="relative w-full h-fit bg-primary/10 rounded-2xl overflow-hidden flex items-center justify-center">
      <MobileLayout />{" "}
    </div>
  );
};

export default ZoomableSeatsLayout_2;
