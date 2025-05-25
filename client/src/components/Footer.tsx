import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import Logo from "../assets/logo2copy.png";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full flex items-center justify-between md:w-auto md:order-1">
          <div className="flex items-center space-x-2">
            <img src={Logo} alt="ArtVerse Logo" className="h-10 w-auto" />
            <span className="text-lg font-semibold text-gray-700">
              ArtVerse
            </span>
          </div>

          <div className="flex space-x-4 md:hidden">
            <FaFacebookF className="h-5 w-5 text-gray-500 hover:text-gray-700 transition" />
            <FaInstagram className="h-5 w-5 text-gray-500 hover:text-gray-700 transition" />
            <FaTwitter className="h-5 w-5 text-gray-500 hover:text-gray-700 transition" />
          </div>
        </div>

        <p className="text-sm text-gray-400 text-center md:order-2 md:text-base">
          &copy; {new Date().getFullYear()} ArtVerse. All rights reserved.
        </p>

        <div className="hidden md:flex space-x-4 md:order-3">
          <FaFacebookF className="h-5 w-5 text-gray-500 hover:text-gray-700 transition" />
          <FaInstagram className="h-5 w-5 text-gray-500 hover:text-gray-700 transition" />
          <FaTwitter className="h-5 w-5 text-gray-500 hover:text-gray-700 transition" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
