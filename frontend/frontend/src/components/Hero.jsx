import React from "react";

const Hero = () => {
  return (
    // ✅ Removed Container wrapper — hero must be full-bleed, Container was clipping it
    <section
      className="relative overflow-hidden min-h-[88vh] flex items-center text-white"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay — much darker on left so text is always readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#022016]/95 via-[#04342C]/85 to-[#04342C]/30" />

      {/* ✅ Content — properly centered vertically, padded from left with max-width */}
      <div className="relative z-10 w-full max-w-5xl px-8 md:px-0 md:ml-40 py-24 space-y-6">
        {/* Badge */}
        <span className="inline-block bg-yellow-400 text-green-950 text-xs font-bold px-4 py-1.5 rounded-full tracking-wide">
          ⚡ Fast Delivery Across Nepal
        </span>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
          All grocery items at your doorstep under{" "}
          <span className="text-yellow-300">10 minutes</span>
        </h1>

        {/* Subtext */}
        <p className="text-white/72 text-base md:text-lg leading-relaxed max-w-md">
          Fresh groceries, daily essentials, and household items delivered
          quickly and safely anywhere in Nepal.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3 pt-1">
          <button className="bg-white text-emerald-700 px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition">
            Get Started
          </button>
          <button className="border border-white/35 text-white px-7 py-3.5 rounded-xl font-medium text-sm hover:bg-white/10 transition">
            Explore Products
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-7 pt-3">
          <div>
            <p className="text-2xl font-extrabold text-yellow-300">10 min</p>
            <p className="text-xs text-white/50 mt-1">Avg delivery</p>
          </div>
          <div className="w-px h-10 bg-white/18" />
          <div>
            <p className="text-2xl font-extrabold text-yellow-300">5000+</p>
            <p className="text-xs text-white/50 mt-1">Products</p>
          </div>
          <div className="w-px h-10 bg-white/18" />
          <div>
            <p className="text-2xl font-extrabold text-yellow-300">50K+</p>
            <p className="text-xs text-white/50 mt-1">Happy users</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
