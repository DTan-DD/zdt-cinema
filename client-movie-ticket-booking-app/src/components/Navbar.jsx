// components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";
import SearchModal from "./SearchModal";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const { favoriteMovies } = useAppContext();

  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const navigationLinks = [
    { path: "/", label: "Trang chủ" },
    { path: "/movies", label: "Phim" },
    { path: "/theaters", label: "Rạp chiếu" },
    { path: "/releases", label: "Sắp ra mắt" },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5">
        {/* Logo */}
        <Link to="/" className="max-md:flex-1">
          <img src={assets.logo} alt="Logo" className="w-32 md:w-48 h-auto" />
        </Link>

        {/* Navigation Menu */}
        <NavigationMenu isOpen={isOpen} onClose={closeMenu} navigationLinks={navigationLinks} favoriteMovies={favoriteMovies} />

        {/* Right Side Actions */}
        <div className="flex items-center gap-8">
          <SearchIcon className=" w-6 h-6 cursor-pointer hover:text-primary transition-colors" onClick={openSearch} />

          {!user ? <LoginButton onClick={openSignIn} /> : <UserMenu onNavigate={navigate} />}
        </div>

        {/* Mobile Menu Toggle */}
        <MenuIcon className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer" onClick={toggleMenu} />
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  );
};

// Navigation Menu Component
const NavigationMenu = ({ isOpen, onClose, navigationLinks, favoriteMovies }) => (
  <div
    className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg
      z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 min-md:px-8 py-3
      max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 
      md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 
      ${isOpen ? "max-md:w-full" : "max-md:w-0"}`}
  >
    <XIcon className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer" onClick={onClose} />

    {navigationLinks.map((link) => (
      <NavLink key={link.path} to={link.path} onClick={onClose}>
        {link.label}
      </NavLink>
    ))}

    {favoriteMovies.length > 0 && (
      <NavLink to="/favorite" onClick={onClose}>
        Yêu thích
      </NavLink>
    )}
  </div>
);

// Navigation Link Component
const NavLink = ({ to, onClick, children }) => (
  <Link
    to={to}
    onClick={() => {
      scrollTo(0, 0);
      onClick();
    }}
  >
    {children}
  </Link>
);

// Login Button Component
const LoginButton = ({ onClick }) => (
  <button onClick={onClick} className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer">
    Login
  </button>
);

// User Menu Component
const UserMenu = ({ onNavigate }) => (
  <UserButton>
    <UserButton.MenuItems>
      <UserButton.Action
        label="My Bookings"
        labelIcon={<TicketPlus width={15} />}
        onClick={() => {
          scrollTo(0, 0);
          onNavigate("/my-bookings");
        }}
      />
    </UserButton.MenuItems>
  </UserButton>
);

export default Navbar;
