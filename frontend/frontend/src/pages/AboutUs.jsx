import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  Target,
  Eye,
  Truck,
  Shield,
  Clock,
  Heart,
  Users,
  Zap,
  MapPin,
} from "lucide-react";

const AboutUs = () => {
  // const teamMembers = [
  //   {
  //     name: "Rajesh Sharma",
  //     role: "Founder & CEO",
  //     description: "Visionary leader with 10+ years in logistics and technology.",
  //     initial: "RS",
  //     color: "bg-[#0B4E3C]",
  //   },
  //   {
  //     name: "Priya Adhikari",
  //     role: "CTO",
  //     description: "Tech enthusiast driving AI-powered delivery solutions.",
  //     initial: "PA",
  //     color: "bg-blue-600",
  //   },
  //   {
  //     name: "Anish Thapa",
  //     role: "Head of Operations",
  //     description: "Ensures seamless logistics from warehouse to doorstep.",
  //     initial: "AT",
  //     color: "bg-purple-600",
  //   },
  //   {
  //     name: "Sita Gurung",
  //     role: "Head of Marketing",
  //     description: "Connecting AI Halo with communities across Nepal.",
  //     initial: "SG",
  //     color: "bg-orange-500",
  //   },
  // ];

  const values = [
    {
      icon: Truck,
      title: "Fast Delivery",
      description:
        "Getting your essentials to you in record time, every single day.",
      color: "text-[#0B4E3C]",
      bg: "bg-[#0B4E3C]/10",
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description:
        "Ensuring every product is handled with care and every transaction is secure.",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: Clock,
      title: "Reliability",
      description: "Consistent service you can count on, rain or shine.",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: Heart,
      title: "Customer First",
      description: "Your satisfaction is at the heart of everything we do.",
      color: "text-red-500",
      bg: "bg-red-50",
    },
  ];

  const stats = [
    { value: "50K+", label: "Happy Customers" },
    { value: "500+", label: "Active Riders" },
    { value: "100+", label: "Store Partners" },
    { value: "1M+", label: "Deliveries Done" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Banner */}
      <section className="relative bg-[#0B4E3C] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#F3BE1C] rounded-full blur-3xl"></div>
        </div>
        <div className="relative container mx-auto px-4 md:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
            <Zap className="w-4 h-4 text-[#F3BE1C]" />
            Nepal's Fastest Growing Delivery Platform
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            About <span className="text-[#F3BE1C]">AI Halo</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            We're on a mission to revolutionize delivery in Nepal with
            AI-powered logistics, making everyday essentials accessible to
            everyone, everywhere.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-10">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-[#0B4E3C]">
                  {stat.value}
                </p>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              AI Halo was born from a simple idea: everyone deserves fast,
              reliable access to their daily essentials. Founded in Kathmandu,
              we started as a small delivery service and have grown into Nepal's
              leading AI-powered delivery platform, connecting thousands of
              customers with their favorite stores and products.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mt-4">
              Our intelligent routing system, powered by cutting-edge AI,
              ensures the fastest delivery times while our team of dedicated
              riders brings warmth and reliability to every doorstep across the
              country.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Mission */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#0B4E3C]/10 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-[#0B4E3C]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Mission
              </h3>
              <p className="text-gray-600 leading-relaxed">
                To empower communities across Nepal with fast, affordable, and
                reliable delivery services driven by artificial intelligence. We
                strive to bridge the gap between stores and customers, making
                daily essentials accessible to everyone regardless of location.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#F3BE1C]/10 rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-[#F3BE1C]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Vision
              </h3>
              <p className="text-gray-600 leading-relaxed">
                To become South Asia's most trusted and innovative delivery
                platform, setting new standards for speed, efficiency, and
                customer satisfaction. We envision a future where AI-powered
                logistics transform how people receive their daily needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AI Halo?
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Our core values drive everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div
                    className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-5`}
                  >
                    <Icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[#0B4E3C] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F3BE1C] rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative container mx-auto px-4 md:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-[#F3BE1C]" />
            <span className="text-white/70 text-sm">
              Based in Kathmandu, Nepal
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to experience AI Halo?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
            Join thousands of happy customers and get your essentials delivered
            in minutes.
          </p>
          <a
            href="/products"
            className="inline-flex items-center gap-2 bg-[#F3BE1C] text-gray-900 px-8 py-3.5 rounded-xl font-bold hover:bg-[#e5b218] transition-colors text-lg"
          >
            Start Shopping
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
