import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import Container from "./Container";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: "About Us", link: "/about" },
      { name: "Careers", link: "/careers" },
      { name: "Blog", link: "/blog" },
      { name: "Press", link: "/press" },
    ],
    support: [
      { name: "Help Center", link: "/help" },
      { name: "Contact Us", link: "/contact" },
      { name: "FAQs", link: "/faqs" },
      { name: "Track Order", link: "/track" },
    ],
    legal: [
      { name: "Privacy Policy", link: "/privacy" },
      { name: "Terms of Service", link: "/terms" },
      { name: "Refund Policy", link: "/refunds" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, link: "https://facebook.com" },
    { icon: Instagram, link: "https://instagram.com" },
    { icon: Twitter, link: "https://twitter.com" },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <Container>
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <Link to="/" className="text-2xl font-bold text-white">
                AI Halo
              </Link>
              <p className="mt-4 text-gray-400 max-w-sm">
                Nepal's fastest delivery platform. Get groceries, essentials, and more
                delivered to your doorstep in minutes.
              </p>

              {/* Contact Info */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone className="w-5 h-5 text-[#F3BE1C]" />
                  <span>+977 1234567890</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5 text-[#F3BE1C]" />
                  <span>support@aihalo.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-5 h-5 text-[#F3BE1C]" />
                  <span>Kathmandu, Nepal</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-4 mt-6">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-[#0B4E3C] transition"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.link}
                      className="text-gray-400 hover:text-white transition"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.link}
                      className="text-gray-400 hover:text-white transition"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.link}
                      className="text-gray-400 hover:text-white transition"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} AI Halo. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white transition">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-white transition">
                Terms
              </Link>
              <Link to="/cookies" className="hover:text-white transition">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
