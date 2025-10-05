import React from "react";
import HeroSection from "../components/HeroSection";
import FeatureSection from "../components/FeatureSection";
import TrailersSection from "../components/TrailersSection";
import HeroCarousel from "../components/HeroCarousel";
import { useAppContext } from "../context/AppContext";

const Home = () => {
  const { shows, image_base_url } = useAppContext();
  const showSlides = shows.slice(0, 5);

  return (
    <>
      {/* <HeroSection /> */}
      <HeroCarousel shows={showSlides} image_base_url={image_base_url} />
      <FeatureSection />
      <TrailersSection shows={showSlides} image_base_url={image_base_url} />
    </>
  );
};

export default Home;
