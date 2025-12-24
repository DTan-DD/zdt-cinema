import React from "react";

const AdvancedPagination = ({ currentPage, totalPages, onPageChange }) => {
  // Hàm tạo mảng số trang cần hiển thị
  const getPageNumbers = () => {
    const delta = 1; // Số trang hiển thị bên trái/phải trang hiện tại
    const range = [];
    const rangeWithDots = [];
    let l;

    // Luôn hiển thị trang đầu
    range.push(1);

    // Tính toán các trang cần hiển thị
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i);
      }
    }

    // Luôn hiển thị trang cuối
    if (totalPages > 1) {
      range.push(totalPages);
    }
    // Thêm dấu "..." vào những chỗ cần thiết
    range.forEach((i) => {
      if (l) {
        // if (i - l === 2) {
        //   rangeWithDots.push(l + 1);
        // } else
        if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    });
    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center mt-6">
      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* Nút đầu tiên */}
        {/* <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg font-medium transition-all ${
            currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          }`}
          title="Trang đầu"
        >
          Trang đầu
        </button> */}

        {/* Nút trang trước */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg font-medium transition-all ${
            currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          }`}
          title="Trang trước"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Các số trang */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((number, index) => {
            if (number === "...") {
              return (
                <span key={`dots-${index}`} className="px-3 py-2 text-gray-400 font-medium">
                  ...
                </span>
              );
            }

            return (
              <button
                key={number}
                onClick={() => onPageChange(number)}
                className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition-all ${
                  currentPage === number ? "bg-primary text-white shadow-md hover:bg-blue-700" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                }`}
              >
                {number}
              </button>
            );
          })}
        </div>

        {/* Nút trang sau */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg font-medium transition-all ${
            currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          }`}
          title="Trang sau"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Nút cuối cùng */}
        {/* <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg font-medium transition-all ${
            currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          }`}
          title="Trang cuối"
        >
          Trang cuối
        </button> */}
      </nav>
    </div>
  );
};

// Demo component
const PaginationDemo = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = 50; // Thử với 50 trang để xem hiệu ứng

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Demo Phân Trang Chuyên Nghiệp</h1>
          <p className="text-gray-600 mb-2">
            Trang hiện tại: <span className="font-semibold text-blue-600">{currentPage}</span> / {totalPages}
          </p>
          <p className="text-sm text-gray-500">Component này tự động ẩn các trang ở giữa khi có quá nhiều trang, chỉ hiển thị trang đầu, cuối và các trang xung quanh trang hiện tại.</p>
        </div>

        <AdvancedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

        {/* Test với số trang khác nhau */}
        <div className="mt-12 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Test với 10 trang</h2>
            <AdvancedPagination currentPage={5} totalPages={10} onPageChange={(page) => console.log("Chuyển đến trang:", page)} />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Test với 3 trang</h2>
            <AdvancedPagination currentPage={2} totalPages={3} onPageChange={(page) => console.log("Chuyển đến trang:", page)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedPagination;
