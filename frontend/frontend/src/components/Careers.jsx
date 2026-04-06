import { Link } from "react-router-dom";
import { Bike, Package, Headphones, TrendingUp, ArrowRight } from "lucide-react";
import Container from "./Container";

const careers = [
  {
    title: "Delivery Rider",
    description:
      "Join our fleet of riders and earn competitive pay with flexible hours. Be your own boss!",
    icon: Bike,
    benefits: ["Flexible Schedule", "Weekly Payouts", "Insurance Coverage"],
    link: "/rider-register",
    cta: "Apply as Rider",
    featured: true,
  },
  {
    title: "Warehouse Associate",
    description:
      "Help us manage inventory and ensure quick order fulfillment at our dark stores.",
    icon: Package,
    benefits: ["Full-time Position", "Growth Opportunities", "Team Environment"],
    link: "/careers/warehouse",
    cta: "View Position",
    featured: false,
  },
  {
    title: "Customer Support",
    description:
      "Be the voice of AI Halo and help customers with their orders and queries.",
    icon: Headphones,
    benefits: ["Remote Work", "Training Provided", "Performance Bonuses"],
    link: "/careers/support",
    cta: "View Position",
    featured: false,
  },
  {
    title: "Operations Manager",
    description:
      "Lead our store operations and drive efficiency across delivery zones.",
    icon: TrendingUp,
    benefits: ["Leadership Role", "Competitive Salary", "Career Growth"],
    link: "/careers/operations",
    cta: "View Position",
    featured: false,
  },
];

const Careers = () => {
  return (
    <section className="py-20 bg-white">
      <Container>
        {/* Heading */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Join Our Team
          </h2>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            Be part of Nepal's fastest growing delivery platform. We're always looking
            for passionate people to join our mission.
          </p>
        </div>

        {/* Careers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {careers.map((career, index) => {
            const Icon = career.icon;
            return (
              <div
                key={index}
                className={`relative rounded-2xl p-6 transition ${
                  career.featured
                    ? "bg-[#0B4E3C] text-white"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {career.featured && (
                  <span className="absolute top-4 right-4 bg-[#F3BE1C] text-[#0B4E3C] text-xs font-bold px-3 py-1 rounded-full">
                    HIRING NOW
                  </span>
                )}

                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-xl mb-5 ${
                    career.featured ? "bg-white/20" : "bg-[#0B4E3C]/10"
                  }`}
                >
                  <Icon
                    className={career.featured ? "text-white" : "text-[#0B4E3C]"}
                    size={28}
                  />
                </div>

                <h3
                  className={`text-xl font-semibold mb-2 ${
                    career.featured ? "text-white" : "text-gray-900"
                  }`}
                >
                  {career.title}
                </h3>
                <p
                  className={`mb-4 ${
                    career.featured ? "text-white/80" : "text-gray-600"
                  }`}
                >
                  {career.description}
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {career.benefits.map((benefit, i) => (
                    <span
                      key={i}
                      className={`text-xs px-3 py-1 rounded-full ${
                        career.featured
                          ? "bg-white/20 text-white"
                          : "bg-white text-gray-600 border"
                      }`}
                    >
                      {benefit}
                    </span>
                  ))}
                </div>

                <Link
                  to={career.link}
                  className={`inline-flex items-center gap-2 font-semibold transition ${
                    career.featured
                      ? "text-[#F3BE1C] hover:gap-3"
                      : "text-[#0B4E3C] hover:gap-3"
                  }`}
                >
                  {career.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <div className="mt-12 bg-gradient-to-r from-[#0B4E3C] to-[#0d6b52] rounded-2xl p-8 md:p-12 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-3">
            Ready to Start Your Journey?
          </h3>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            Whether you want to deliver, manage, or support — there's a place for you at AI Halo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/rider-register"
              className="inline-flex items-center justify-center gap-2 bg-[#F3BE1C] text-[#0B4E3C] px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              <Bike className="w-5 h-5" />
              Become a Rider
            </Link>
            <Link
              to="/careers"
              className="inline-flex items-center justify-center gap-2 bg-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition"
            >
              View All Positions
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Careers;
