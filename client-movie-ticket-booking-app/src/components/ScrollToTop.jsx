import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react"; // Dùng icon từ lucide-react như project của bạn

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Xử lý logic hiển thị khi cuộn xuống
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Hàm cuộn lên đầu trang mượt mà
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      <button
        type="button"
        onClick={scrollToTop}
        className={`
          group flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 ease-in-out
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}
          bg-primary text-white hover:bg-green-600
          hover:shadow-lime-600 hover:-translate-y-1
          border border-white/10 backdrop-blur-sm
        `}
      >
        {/* Icon mũi tên */}
        <ArrowUp className="w-5 h-5 group-hover:animate-bounce" strokeWidth={2.5} />

        {/* Chữ hiển thị */}
        <span className="text-sm font-semibold hidden md:block">TOP</span>
      </button>
    </div>
  );
};

export default ScrollToTop;
