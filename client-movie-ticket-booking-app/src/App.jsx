import React from "react";
import Navbar from "./components/Navbar";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import MyBookings from "./pages/MyBookings";
import Favorite from "./pages/Favorite";
import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer";
import Layout from "./pages/admin/Layout";
import Dashboard from "./pages/admin/Dashboard";
import AddShows from "./pages/admin/AddShows";
import ListShows from "./pages/admin/ListShows";
import ListBookings from "./pages/admin/ListBookings";
import SeatLayout from "./pages/SeatLayout";
import { useAppContext } from "./context/AppContext";
import { SignIn } from "@clerk/clerk-react";
import Loading from "./components/Loading";
import UpcomingMovies from "./pages/ReleaseMovies";
import CinemaInfoPage from "./pages/CinemaInfo";
import SearchPage from "./pages/SearchPage";
import AddMovies from "./pages/admin/AddMovies";
import ListMovies from "./pages/admin/ListMovies";
import ListCinemas from "./pages/admin/ListCinema";
import ListUsers from "./pages/admin/ListUser";
import ScrollToTop from "./components/ScrollToTop";

const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith("/admin");
  const { user } = useAppContext();

  return (
    <>
      <Toaster />
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:status" element={<UpcomingMovies />} />
        <Route path="/movies/:slug/:id" element={<MovieDetails />} />
        {/* <Route path="/movies/:id/" element={<MovieDetails />} /> */}
        <Route path="/movies/:slug/shows/:showCode" element={<SeatLayout />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/theaters" element={<CinemaInfoPage />} />
        <Route path="/search" element={<SearchPage />} />
        {/* check isPaid in MyBookings */}
        <Route path="/loading/:nextUrl" element={<Loading />} />

        <Route path="/payment/success" element={<MyBookings />} />
        <Route path="/favorite" element={<Favorite />} />
        <Route
          path="/admin/*"
          element={
            user ? (
              <Layout />
            ) : (
              <div className="min-h-screen flex items-center justify-center">
                <SignIn fallbackRedirectUrl={"/admin"} />
              </div>
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="add-movies" element={<AddMovies />} />
          <Route path="add-shows" element={<AddShows />} />
          <Route path="list-movies" element={<ListMovies />} />
          <Route path="list-shows" element={<ListShows />} />
          <Route path="list-bookings" element={<ListBookings />} />
          <Route path="list-cinemas" element={<ListCinemas />} />
          <Route path="list-users" element={<ListUsers />} />
        </Route>
      </Routes>
      {!isAdminRoute && <ScrollToTop />}
      {!isAdminRoute && <Footer />}
    </>
  );
};

export default App;
