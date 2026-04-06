import React from "react";
import Container from "./Container";
import {
  Truck,
  ShoppingBasket,
  Smartphone,
  Home,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

const services = [
  {
    title: "10-Minute Delivery",
    desc: "Get your orders delivered lightning fast, right at your doorstep.",
    icon: Truck,
  },
  {
    title: "Groceries & Essentials",
    desc: "Fresh vegetables, fruits, and daily essentials available 24/7.",
    icon: ShoppingBasket,
  },
  {
    title: "Electronics",
    desc: "Phones, chargers, accessories, and gadgets delivered instantly.",
    icon: Smartphone,
  },
  {
    title: "Home Needs",
    desc: "Cleaning supplies, kitchen items, and home essentials.",
    icon: Home,
  },
  {
    title: "Easy Payments",
    desc: "Cash on delivery, cards, wallets — pay your way.",
    icon: CreditCard,
  },
  {
    title: "Safe & Reliable",
    desc: "Hygienic packaging and trusted delivery partners.",
    icon: ShieldCheck,
  },
];

const Services = () => {
  return (
    <section className="py-20 text-black">
      <Container>
        {/* Heading */}
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-black">Our Services</h2>
          <p className="text-black-200 mt-3 max-w-xl mx-auto">
            Everything you need, delivered faster than ever.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="bg-white/10 backdrop-blur rounded-xl p-6 text-black hover:bg-white/20 transition border"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-[#F3BE1C] rounded-lg mb-4">
                  <Icon className="text-[#0B4E3C]" size={24} />
                </div>

                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-white-200 text-sm">{service.desc}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default Services;
