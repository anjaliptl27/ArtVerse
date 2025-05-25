import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/logo2copy.png";
import {
  FaShoppingCart,
  FaRegHeart,
  FaUser,
  FaBars,
  FaTimes,
  FaPaintBrush,
  FaPalette,
  FaGraduationCap,
  FaHome
} from "react-icons/fa";

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"artist" | "buyer" | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") as "artist" | "buyer" | null;

    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setUserRole(null);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="sticky top-0 z-50 bg-gray-50">
      {/* Navigation Bar */}
      <nav className={`bg-white transition-all duration-300 ${scrolled ? "shadow-lg" : "shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <img
                  className="h-12 w-auto"
                  src={Logo}
                  alt="ArtVerse"
                />
                <span className="ml-2 text-xl font-bold text-gray-800 hidden sm:block">
                  ArtVerse
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              <Link
                to="/home"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
               
                Home
              </Link>
              <Link
                to="/artworks"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
               
                Artworks
              </Link>
              <Link
                to="/artists"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
               
                Artists
              </Link>
              <Link
                to="/courses"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                
                Courses
              </Link>
              {userRole === "artist" && (
                <Link
                  to="/artist-dashboard"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </div>

            {/* Desktop Right side buttons */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  {userRole === "buyer" && (
                    <>
                      <Link
                        to="/wishlist"
                        className="p-2 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors relative"
                      >
                        <FaRegHeart className="h-5 w-5" />
                      </Link>
                      <Link
                        to="/cart"
                        className="p-2 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors relative"
                      >
                        <FaShoppingCart className="h-5 w-5" />
                      </Link>
                    </>
                  )}
                  <Link
                    to={userRole === "artist" ? "/artist-profile" : "/buyer-profile"}
                    className="p-2 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <FaUser className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="ml-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              {isAuthenticated && (
                <div className="flex items-center space-x-4 mr-4">
                  {userRole === "buyer" && (
                    <>
                      <Link
                        to="/wishlist"
                        className="p-2 rounded-full text-gray-600 hover:text-indigo-600"
                      >
                        <FaRegHeart className="h-5 w-5" />
                      </Link>
                      <Link
                        to="/cart"
                        className="p-2 rounded-full text-gray-600 hover:text-indigo-600"
                      >
                        <FaShoppingCart className="h-5 w-5" />
                      </Link>
                    </>
                  )}
                  <Link
                    to={userRole === "artist" ? "/artist-profile" : "/buyer-profile"}
                    className="p-2 rounded-full text-gray-600 hover:text-indigo-600"
                  >
                    <FaUser className="h-5 w-5" />
                  </Link>
                </div>
              )}
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none transition-colors"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <FaTimes className="block h-6 w-6" />
                ) : (
                  <FaBars className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`sm:hidden fixed inset-y-0 right-0 w-full max-w-xs z-50 transform ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          } transition-transform duration-300 ease-in-out`}
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleMobileMenu}></div>
          <div className="relative flex flex-col w-full max-w-xs h-full bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center">
                <img
                  className="h-8 w-auto"
                  src={Logo}
                  alt="ArtVerse"
                />
                <span className="ml-2 text-lg font-bold text-gray-800">
                  ArtVerse
                </span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-4">
                <Link
                  to="/home"
                  onClick={toggleMobileMenu}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-base font-medium transition-colors"
                >
                  <FaHome className="mr-3 text-gray-500" />
                  Home
                </Link>
                <Link
                  to="/artworks"
                  onClick={toggleMobileMenu}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-base font-medium transition-colors"
                >
                  <FaPalette className="mr-3 text-gray-500" />
                  Artworks
                </Link>
                <Link
                  to="/artists"
                  onClick={toggleMobileMenu}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-base font-medium transition-colors"
                >
                  <FaPaintBrush className="mr-3 text-gray-500" />
                  Artists
                </Link>
                <Link
                  to="/courses"
                  onClick={toggleMobileMenu}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-base font-medium transition-colors"
                >
                  <FaGraduationCap className="mr-3 text-gray-500" />
                  Courses
                </Link>
                {userRole === "artist" && (
                  <Link
                    to="/artist-dashboard"
                    onClick={toggleMobileMenu}
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-base font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
              </nav>
            </div>
            
            <div className="px-4 py-6 border-t border-gray-200">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={toggleMobileMenu}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={toggleMobileMenu}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;