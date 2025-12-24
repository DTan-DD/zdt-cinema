import React from "react";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <footer className="px-6 mt-20 md:px-16 lg:px-36 w-full text-gray-300">
      <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500 pb-14">
        <div className="md:max-w-96">
          <img alt="" className="w-36 h-auto" src={assets.logo} />
          <p className="mt-6 text-sm">
            🎬 DiTi Cinema là hệ thống rạp chiếu phim hiện đại, được phát triển với mục tiêu mang đến trải nghiệm giải trí đẳng cấp và tiện lợi cho người dùng. Hiện tại, DiTi Cinema có các chi nhánh
            trải dài khắp TP. Hồ Chí Minh, bao gồm Quận 1, Quận 3, Quận 7, Thủ Đức và Bình Thạnh — giúp khán giả dễ dàng lựa chọn rạp gần nhất để thưởng thức những bộ phim mới nhất.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <img src={assets.googlePlay} alt="google play" className="h-9 w-auto" />
            <img src={assets.appStore} alt="app store" className="h-9 w-auto" />
          </div>
        </div>
        <div className="flex-1 flex items-start md:justify-end gap-10 md:gap-40">
          <div>
            <h2 className="font-semibold mb-3 text-white">DiTi Team</h2>
            <ul className="text-sm space-y-2">
              <li>
                <a href="#">Trang chủ</a>
              </li>
              <li>
                <a href="#">Giới thiệu</a>
              </li>
              <li>
                <a href="#">Liên hệ</a>
              </li>
              <li>
                <a href="#">Điều khoản</a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-semibold mb-3 text-white">Liên hệ với chúng tôi</h2>
            <div className="text-sm space-y-2">
              <p>Phone: +84-775-658-079</p>
              <p>Email: tan.ddd03979@gmail.com</p>
            </div>
            <h2 className="font-semibold mt-5 mb-3 text-white">Liên kết trang web</h2>
            <div className="text-sm space-y-2">
              <p>
                DiTi Shop:{" "}
                <a href="https://ditishop.vercel.app" target="_blank" className="hover:text-amber-300">
                  https://ditishop.vercel.app
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="pt-4 text-center text-sm pb-5">Copyright {new Date().getFullYear()} © DuyTan. All Right Reserved.</p>
    </footer>
  );
};

export default Footer;
