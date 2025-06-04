import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import Modal from "react-modal";
import SearchAndSort from "../components/SearchandSort";
import ArtworkCard from "../components/ArtworkCard";


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

interface PurchaseFormData {
  message?: string;
  shippingAddress?: string;
}

interface ApiResponse {
  success: boolean;
  data: Artwork[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

const Artworks: React.FC = () => {
  const [artworkList, setArtworkList] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchaseData, setPurchaseData] = useState<PurchaseFormData>({
    message: "",
    shippingAddress: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  });
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "popular", label: "Most Popular" },
    { value: "likes", label: "Most Liked" },
  ];

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams(searchParams);
        params.set("page", pagination.page.toString());
        params.set("limit", pagination.limit.toString());

        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);

        const artworksResponse = await axios.get<ApiResponse>(
          `${
            import.meta.env.VITE_SERVER_URL
          }/api/artworks?${params.toString()}`,
          { withCredentials: true }
        );

        if (!artworksResponse.data.success) {
          throw new Error("Failed to fetch artworks");
        }

        const [wishlistResponse, cartResponse] = await Promise.all([
          axios
            .get(`${import.meta.env.VITE_SERVER_URL}/api/wishlist`, {
              withCredentials: true,
            })
            .catch(() => ({ data: { data: [] } })),

          axios
            .get(`${import.meta.env.VITE_SERVER_URL}/api/cart`, {
              withCredentials: true,
            })
            .catch(() => ({ data: { data: [] } })),
        ]);

        const getArtworkIds = (responseData: any): string[] => {
          try {
            if (Array.isArray(responseData)) {
              return responseData;
            }

            if (Array.isArray(responseData) && responseData[0]?.artwork?._id) {
              return responseData.map((item) => item.artwork._id);
            }

            if (Array.isArray(responseData) && responseData[0]?._id) {
              return responseData.map((item) => item._id);
            }

            return [];
          } catch (error) {
            console.error("Error extracting artwork IDs:", error);
            return [];
          }
        };

        const wishlistedIds = getArtworkIds(wishlistResponse.data.data);
        const cartItemIds = getArtworkIds(cartResponse.data.data);

        const artworksWithStatus = artworksResponse.data.data.map(
          (artwork) => ({
            ...artwork,
            isWishlisted: wishlistedIds.includes(artwork._id),
            isInCart: cartItemIds.includes(artwork._id),
          })
        );

        setArtworkList(artworksWithStatus);
        setPagination(artworksResponse.data.pagination);
      } catch (error) {
        console.error("Error fetching artworks:", error);
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          toast.error("Please login to view artworks");
          navigate("/login");
        } else {
          toast.error("Failed to load artworks");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [searchParams, pagination.page, minPrice, maxPrice]);

  const handlePriceRangeApply = () => {
    const params = new URLSearchParams(searchParams);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    setSearchParams(params);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

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

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedArtwork(null);
    setPurchaseData({
      message: "",
      shippingAddress: "",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPurchaseData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitPurchase = async () => {
    if (!selectedArtwork) return;

    try {
      setIsSubmitting(true);

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/purchases/${
          selectedArtwork._id
        }`,
        {
          ...purchaseData,
          artworkId: selectedArtwork._id,
          artistId: selectedArtwork.artistId._id,
          price: selectedArtwork.price,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
console.log('Purchase response:', response.data);
      toast.success("Purchase request sent successfully!");
      closeModal();
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        toast.error("Please login to purchase artwork");
        navigate("/login");
      } else {
        toast.error(
          axiosError.response?.status || "Failed to submit purchase request"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

 
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Mobile Filter Toggle Button  */}
<div className="md:hidden sticky top-16 bg-white z-10 pb-4 pt-4">
  <div className="flex justify-between items-center mb-4 pt-2">
    <h1 className="text-2xl font-bold text-gray-800">Available Artworks</h1>
  </div>

  <div className="flex justify-between items-center mb-2">
    {/* Left: Search */}
    <div className="flex-1">
      <SearchAndSort 
        sortOptions={sortOptions}
        placeholder="Search..."
      />
    </div>

    {/* Right: Filters Button */}
    <button
      onClick={() => setShowMobileFilters(!showMobileFilters)}
      className="ml-4 flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
    >
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
</svg>

      <span >Filters</span>
    </button>
  </div>
</div>

        {/* Left Sidebar - Filters */}
        <div
          className={`${
            showMobileFilters ? "block" : "hidden"
          } md:block md:w-64 space-y-6 md:sticky md:top-24 self-start h-max bg-white p-4 rounded-lg shadow md:bg-transparent md:p-0 md:shadow-none`}
        >
          {/* Mobile filter header - Only shown on small screens */}
          <div className="md:hidden flex justify-between items-center mb-4">
            <h3 className="font-medium text-lg">Filters</h3>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow md:shadow-none">
            <h3 className="font-medium text-lg mb-4">Filter by Price</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="minPrice" className="block text-sm text-gray-600 mb-1">
                    Min
                  </label>
                  <input
                    type="number"
                    id="minPrice"
                    placeholder="₹0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="maxPrice" className="block text-sm text-gray-600 mb-1">
                    Max
                  </label>
                  <input
                    type="number"
                    id="maxPrice"
                    placeholder="₹10000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                onClick={handlePriceRangeApply}
                className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Apply Filters
              </button>
              {showMobileFilters && (
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition md:hidden"
                >
                  Show Results
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Sticky Header - Hidden on mobile since we have a new one */}
          <div className="hidden md:block sticky top-16 bg-white z-10 pb-4">
            <div className="flex justify-between items-center mb-4 pt-2">
              <h1 className="text-3xl font-bold text-gray-800">Available Artworks</h1>
              <div className="w-64">
                <SearchAndSort 
                  sortOptions={sortOptions}
                  placeholder="Search artworks..."
                />
              </div>
            </div>
          </div>
        
{/* Artworks Grid */}
{loading ? (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
) : artworkList.length === 0 ? (
  <div className="text-center py-10">
    <p className="text-gray-500">No artworks available matching your criteria</p>
  </div>
) : (
  <>
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {artworkList.map((artwork) => (
        <ArtworkCard
  artwork={artwork}
  onWishlistToggle={toggleWishlist}
  onAddToCart={addToCart}
/>
      ))}
    </div>

    {pagination.pages > 1 && (
      <div className="mt-6 flex justify-center">
        <div className="flex space-x-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setPagination(prev => ({ ...prev, page }))}
              className={`px-3 py-1 rounded ${pagination.page === page ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    )}
  </>
)}
        </div>
      </div>
      

 
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Purchase Artwork"
        className="modal-content bg-white rounded-lg p-6 max-w-md mx-auto mt-20 h-[80vh] overflow-y-auto"
        overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4"
      >
        {selectedArtwork && (
          <>
            <h2 className="text-xl font-bold mb-4">
              Purchase {selectedArtwork.title}
            </h2>
            <div className="mb-4">
              <img
                src={selectedArtwork.images[0]?.url || "/default-artwork.png"}
                alt={selectedArtwork.title}
                className="w-full h-48 object-cover rounded mb-2"
              />
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">
                  ₹{selectedArtwork.price}
                </span>
                <span className="text-sm">
                  by {selectedArtwork.artistId.profile.name}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Category: {selectedArtwork.category}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Shipping Address*
                </label>
                <input
                  type="text"
                  name="shippingAddress"
                  value={purchaseData.shippingAddress}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Message to Artist (optional)
                </label>
                <textarea
                  name="message"
                  value={purchaseData.message}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                  placeholder="Any special requests or notes for the artist"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={submitPurchase}
                disabled={isSubmitting || !purchaseData.shippingAddress}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Confirm Purchase"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Artworks;