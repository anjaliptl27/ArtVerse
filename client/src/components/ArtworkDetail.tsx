import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import Modal from "react-modal";

interface ArtworkImage {
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
  stock: number;
  images: ArtworkImage[];
  artistId: {
    _id: string;
    profile: {
      name: string;
      avatar?: string;
      bio?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  tags: string[];
  stats: {
    views: number;
    likes: number;
  };
  category: "Painting" | "Sketch" | "Digital" | "Sculpture" | "Photography";
  status: "pending" | "approved" | "rejected";
  approvedAt?: string;
  rejectionReason?:
    | "low_quality"
    | "copyright_issues"
    | "inappropriate_content"
    | "other"
    | null;
}

interface PurchaseFormData {
  message?: string;
  shippingAddress?: string;
}

const ArtworkDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchaseData, setPurchaseData] = useState<PurchaseFormData>({
    message: "",
    shippingAddress: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fix the fetchArtwork function inside useEffect
  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/artworks/${id}`
        );

        if (response.data.success) {
          setArtwork(response.data.data); // This line was missing!
          // Increment view count
        } else {
          throw new Error("Artwork not found");
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Error fetching artwork:", error);
        if (axiosError.response?.status === 404) {
          toast.error("Artwork not found");
        } else {
          toast.error("Failed to load artwork details");
        }
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id, navigate]);

  const openPurchaseModal = () => {
    if (artwork?.status !== "approved") {
      toast.error("This artwork is not available for purchase");
      return;
    }
    if (artwork.stock <= 0) {
      toast.error("This artwork is out of stock");
      return;
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
    if (!artwork) return;

    try {
      setIsSubmitting(true);

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/purchases`,
        {
          ...purchaseData,
          artworkId: artwork._id,
          artistId: artwork.artistId._id,
          price: artwork.price,
          quantity: 1, // Assuming purchasing one item
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success("Purchase request sent successfully!");
        closeModal();
        // Optionally refresh artwork data to update stock
        const artworkResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/artworks/${id}`
        );
        setArtwork(artworkResponse.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to submit purchase request"
        );
      }
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

  const nextImage = () => {
    if (artwork && artwork.images.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === artwork.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (artwork && artwork.images.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? artwork.images.length - 1 : prevIndex - 1
      );
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading artwork details...</div>;
  }

  if (!artwork) {
    return <div className="p-4 text-center">Artwork not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Artwork Images */}
        <div className="relative">
          {artwork.images.length > 0 ? (
            <>
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={artwork.images[currentImageIndex].url}
                  alt={`${artwork.title} - ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
              {artwork.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white"
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </>
              )}
              <div className="flex mt-4 space-x-2">
                {artwork.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                      currentImageIndex === index
                        ? "border-blue-500"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>

        {/* Artwork Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{artwork.title}</h1>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl text-indigo-600 font-bold">₹{artwork.price}</span>
              {artwork.status !== "approved" && (
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    artwork.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {artwork.status === "pending"
                    ? "Pending Approval"
                    : "Rejected"}
                </span>
              )}
              {artwork.stock <= 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                  Out of Stock
                </span>
              )}
            </div>
            
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {artwork.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              <p className="font-medium">{artwork.category}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Stock</h3>
              <p className="font-medium">{artwork.stock} available</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="font-medium">
                {new Date(artwork.createdAt).toLocaleDateString()}
              </p>
            </div>
            {artwork.status === "rejected" && artwork.rejectionReason && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Rejection Reason
                </h3>
                <p className="font-medium capitalize">
                  {artwork.rejectionReason.replace("_", " ")}
                </p>
              </div>
            )}
          </div>

          {artwork.tags && artwork.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {artwork.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Artist Info */}
          <div className="border-t pt-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">About the Artist</h2>
            <div className="flex items-center space-x-4">
              <img
                src={artwork.artistId.profile.avatar || "/default-avatar.png"}
                alt={artwork.artistId.profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium">{artwork.artistId.profile.name}</h3>
                {artwork.artistId.profile.bio && (
                  <p className="text-gray-600 text-sm mt-1">
                    {artwork.artistId.profile.bio}
                  </p>
                )}
                <button
                  onClick={() => navigate(`/artists/${artwork.artistId._id}`)}
                  className="text-blue-500 text-sm mt-2 hover:underline"
                >
                  View profile
                </button>
              </div>
            </div>
          </div>

          {/* Purchase Button */}
          {artwork.status === "approved" && artwork.stock > 0 && (
            <button
              onClick={openPurchaseModal}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition"
            >
              Purchase Artwork
            </button>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Purchase Artwork"
        className="modal-content bg-white rounded-lg p-6 max-w-md mx-auto mt-20 h-[80vh] overflow-y-auto"
        overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4"
      >
        <h2 className="text-xl font-bold mb-4">Purchase {artwork.title}</h2>
        <div className="mb-4">
          <img
            src={artwork.images[0]?.url || "/default-artwork.png"}
            alt={artwork.title}
            className="w-full h-48 object-cover rounded mb-2"
          />
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">₹{artwork.price}</span>
            <span className="text-sm">by {artwork.artistId.profile.name}</span>
          </div>
          <div className="text-sm mt-1">{artwork.stock} in stock</div>
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
      </Modal>
    </div>
  );
};

export default ArtworkDetail;
