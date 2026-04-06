import React from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Services from "../components/Services";
import FeaturedProducts from "../components/FeaturedProducts";
import Careers from "../components/Careers";
import Footer from "../components/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Header & Hero Section */}
      <div>
        <Header />
        <Hero />
      </div>

      {/* Services Section */}
      <Services />

      {/* Featured Products Section */}
      <FeaturedProducts />

      {/* Careers Section */}
      <Careers />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
