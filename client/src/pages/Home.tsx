import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import bgArtverse from "../assets/bg-artverse.png";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import {
  FaArrowRight,
  FaChevronDown,
  FaChevronUp,
  FaUserTie,
} from "react-icons/fa";
import ArtworkCard from "../components/ArtworkCard";
import CourseCard from "../components/CourseCard";
import ArtistCard from "../components/ArtistCard";

interface IArtworkImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

interface Artwork {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: IArtworkImage[];
  artistId: {
    _id: string;
    profile: {
      name: string;
      avatar?: string;
    };
  };
  createdAt: string;
  tags?: string[];
  stats: {
    views: number;
    likes: number;
  };
  category: string;
  status: string;
  isWishlisted?: boolean;
  isInCart?: boolean;
}

interface Resource {
  name: string;
  url: string;
  _id?: string;
}

interface Lesson {
  title: string;
  youtubeUrl: string;
  duration?: number;
  resources?: Resource[];
  _id: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  artistId: {
    _id: string;
    profile: {
      name: string;
      avatar?: string;
    };
  };
  price: number;
  thumbnail: IArtworkImage;
  isApproved: boolean;
  status: "draft" | "published" | "rejected";
  rejectionReason?: string;
  lessons: Lesson[];
  students: string[];
  createdAt: string;
  updatedAt: string;
  category?: string;
  averageRating?: number;
}

interface ArtistProfile {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  portfolio?: string[];
  socialMedia?: {
    platform: string;
    url: string;
  }[];
  commissionRates?: {
    type: string;
    price: number;
    description?: string;
  }[];
}

interface Artist {
  _id: string;
  profile: ArtistProfile;
  role: string;
  createdAt: string;
}

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"artist" | "buyer" | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [artworkList, setArtworkList] = useState<Artwork[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
  const navigate = useNavigate();

  // Check auth status on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") as "artist" | "buyer" | null;

    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  useEffect(() => {
    const fetchFeaturedArtworks = async () => {
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_SERVER_URL
          }/api/artworks?featured=true&limit=4`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setArtworkList(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching featured artworks:", error);
      }
    };

    fetchFeaturedArtworks();
  }, []);

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/courses`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setFeaturedCourses(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching featured courses:", error);
      }
    };

    fetchFeaturedCourses();
  }, []);

  useEffect(() => {
    const fetchFeaturedArtists = async () => {
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_SERVER_URL
          }/api/users/artists?featured=true&limit=4`
        );
        if (Array.isArray(response.data)) {
          setFeaturedArtists(response.data);
        }
      } catch (error) {
        console.error("Error fetching featured artists:", error);
      }
    };

    fetchFeaturedArtists();
  }, []);

  const toggleWishlist = async (artworkId: string) => {
    try {
      const artwork = artworkList.find((a) => a._id === artworkId);
      if (!artwork) return;

      setArtworkList((prev) =>
        prev.map((art) =>
          art._id === artworkId
            ? { ...art, isWishlisted: !art.isWishlisted }
            : art
        )
      );

      const isRemoving = artwork.isWishlisted;

      if (isRemoving) {
        await axios.delete(
          `${import.meta.env.VITE_SERVER_URL}/api/wishlist/${artworkId}`,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/wishlist`,
          {
            itemId: artworkId,
            itemType: "artwork",
          },
          { withCredentials: true }
        );
      }

      toast.success(
        isRemoving ? "Removed from wishlist" : "Added to wishlist!"
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        toast.error("Please login to manage wishlist");
        navigate("/login");
      } else {
        toast.error("Failed to update wishlist");
      }

      setArtworkList((prev) =>
        prev.map((art) =>
          art._id === artworkId
            ? { ...art, isWishlisted: !art.isWishlisted }
            : art
        )
      );
    }
  };

  const addToCart = async (artworkId: string) => {
    try {
      setArtworkList((prev) =>
        prev.map((artwork) =>
          artwork._id === artworkId ? { ...artwork, isInCart: true } : artwork
        )
      );

      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/cart`,
        {
          itemId: artworkId,
          itemType: "artwork",
        },
        { withCredentials: true }
      );

      toast.success("Added to cart!");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        toast.error("Please login to add to cart");
        navigate("/login");
      } else {
        toast.error("Failed to add to cart");
      }
      setArtworkList((prev) =>
        prev.map((artwork) =>
          artwork._id === artworkId ? { ...artwork, isInCart: false } : artwork
        )
      );
    }
  };

  const handleEnrollClick = (course: Course) => {
    if (!isAuthenticated) {
      toast.info("Please login to enroll in courses");
      navigate("/login");
      return;
    }
    // You can implement your enrollment logic here or navigate to course details
    navigate(`/courses/${course._id}`);
  };

  const handleCommissionClick = (artistId: string) => {
    // Handle commission click in home page
    navigate(`/artists/${artistId}/commission`);
  };

  // Toggle FAQ item
  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // FAQ data
  const faqs = [
    {
      question: "How do I purchase artwork on ArtVerse?",
      answer:
        "Browse our collection, select the artwork you love, and click 'Add to Cart'. Proceed to checkout to complete your purchase.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, PayPal, and bank transfers for your convenience.",
    },
    {
      question: "How long does shipping take?",
      answer:
        "Shipping times vary by location. Typically, orders are delivered within 5-10 business days. See our shipping page for details.",
    },
    {
      question: "Can I return or exchange artwork?",
      answer:
        "Yes, we offer a 14-day return policy for most items. Custom or commissioned works may have different policies.",
    },
    {
      question: "How do I become a featured artist?",
      answer:
        "Create an artist account, upload your portfolio, and our team will review your work for potential featuring opportunities.",
    },
  ];


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-indigo-900">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-60"
            src={bgArtverse}
            alt="ArtVerse background"
          />
          <div className="absolute inset-0 " aria-hidden="true" />
        </div>
        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Discover and Collect Unique Art
          </h1>
          <p className="mt-6 text-xl text-indigo-100 max-w-3xl mx-auto">
            ArtVerse connects art lovers with talented artists from around the
            world.
            {!isAuthenticated && " Join us to start your art collection today!"}
          </p>
          <div className="mt-10">
            <Link
              to={isAuthenticated ? "/artworks" : "/signup"}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50"
            >
              {isAuthenticated ? "Browse Artworks" : "Get Started"}
            </Link>
            {userRole === "artist" && (
              <Link
                to="/upload-artwork"
                className="ml-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-500 bg-opacity-60 hover:bg-opacity-70"
              >
                Upload Your Art
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Why Choose ArtVerse?
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              We provide everything you need to discover, collect, and create
              art
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-indigo-50 p-6 rounded-lg">
              <div className="text-indigo-600 text-2xl mb-4">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Buy, sell and commission unique Art
              </h3>
              <p className="text-gray-600">
                Discover and purchase original artworks or prints, or request
                custom pieces from talented artists. Artists can showcase their
                work and accept commissions seamlessly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-indigo-50 p-6 rounded-lg">
              <div className="text-indigo-600 text-2xl mb-4">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Learn and Teach Art
              </h3>
              <p className="text-gray-600">
                Explore curated art courses or become an instructor. From
                beginner to expert, ArtVerse helps you grow and share your
                artistic skills.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-indigo-50 p-6 rounded-lg">
              <div className="text-indigo-600 text-2xl mb-4">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No listing fee
              </h3>
              <p className="text-gray-600">
                Showcase and sell your art or accept commissions without paying
                to list. ArtVerse only takes a small share after you make a sale
                — you earn more, stress less.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Artworks Section - Mobile Grid */}
      <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Featured <span className="text-indigo-600">Artworks</span>
            </h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500">
              Curated collection from our talented artists
            </p>
          </div>
          <Link
            to="/artworks"
            className="text-indigo-600 hover:text-indigo-500 flex items-center text-sm sm:text-base"
          >
            View all <FaArrowRight className="ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {artworkList.slice(0, 4).map((artwork) => (
            <ArtworkCard
              key={artwork._id}
              artwork={artwork}
              onWishlistToggle={toggleWishlist}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      </div>

      {/* Featured Courses Section - Mobile Optimized */}
      <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Popular <span className="text-indigo-600">Courses</span>
            </h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500">
              Learn from the best artists in the industry
            </p>
          </div>
          <Link
            to="/courses"
            className="text-indigo-600 hover:text-indigo-500 flex items-center text-sm sm:text-base"
          >
            View all <FaArrowRight className="ml-1" />
          </Link>
        </div>

        {featuredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onEnroll={handleEnrollClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-10">
            <p className="text-gray-500 text-sm sm:text-base">
              No featured courses available at the moment
            </p>
          </div>
        )}
      </div>

      {/* Featured Artists Section - Mobile Grid */}
      <div className="bg-gray-50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Meet Our <span className="text-indigo-600">Talented Artists</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
              Discover and connect with artists from around the world
            </p>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {featuredArtists.map((artist) => (
              <ArtistCard
                key={artist._id}
                artist={artist}
                onCommissionClick={handleCommissionClick}
              />
            ))}
          </div>

          <div className="mt-8 sm:mt-12 text-center">
            <Link
              to="/artists"
              className="inline-flex items-center px-6 py-2 sm:px-8 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 transition-colors"
            >
              View all artists <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Commission CTA Section - Mobile Stacked */}
      <div className="bg-white py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 flex flex-col">
            <div className="mb-8 md:mb-0 md:pr-0 lg:pr-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                Need <span className="text-indigo-600">Custom Artwork</span>?
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                Commission an artist to create a unique piece just for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  to="/artists"
                  className="px-5 py-2 sm:px-6 sm:py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center text-sm sm:text-base"
                >
                  Request a Commission
                </Link>
              </div>
            </div>
            <div className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-6 text-center">
                <FaUserTie className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-indigo-500 mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                  Commission Process
                </h3>
                <ul className="text-left text-sm sm:text-base text-gray-600 space-y-1 sm:space-y-2">
                  <li className="flex items-start">
                    <span className="text-indigo-500 mr-2">1.</span> Browse artists
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-500 mr-2">2.</span> Submit request
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-500 mr-2">3.</span> Artist creates
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-500 mr-2">4.</span> Receive artwork
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section - Mobile Friendly */}
      <div className="bg-gray-100 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 sm:mt-4 max-w-2xl text-sm sm:text-base text-gray-500 mx-auto">
              Find answers to common questions about ArtVerse
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="mb-3 sm:mb-4 border-b border-gray-200 pb-3 sm:pb-4">
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex justify-between items-center w-full text-left focus:outline-none"
                >
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    {faq.question}
                  </h3>
                  {activeFaq === index ? (
                    <FaChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                  ) : (
                    <FaChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                  )}
                </button>
                {activeFaq === index && (
                  <div className="mt-2 text-sm sm:text-base text-gray-600">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
            Still have questions? We're here to help!
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-5 py-2 sm:px-6 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Contact Us
          </Link>
        </div>
      </div>

      {/* Call to Action - Mobile Optimized */}
      <div className="bg-indigo-700 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {isAuthenticated
              ? "Ready to find your next masterpiece?"
              : "Ready to dive in?"}
          </h2>
          <p className="mt-2 sm:mt-3 max-w-2xl mx-auto text-base sm:text-lg text-indigo-100">
            {isAuthenticated
              ? "Browse our collection of unique artworks."
              : "Create an account to start your art collection today."}
          </p>
          <div className="mt-6">
            <Link
              to={isAuthenticated ? "/artworks" : "/signup"}
              className="inline-flex items-center px-5 py-2 sm:px-6 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50"
            >
              {isAuthenticated ? "Explore Artworks" : "Sign up for free"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;