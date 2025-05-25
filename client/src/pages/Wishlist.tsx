import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { TrashIcon } from "@heroicons/react/24/solid";

interface WishlistItem {
  _id: string;
  itemId: string;
  itemType: "artwork" | "course";
  title: string;
  price: number;
  thumbnail?: string;
  images?: Array<{
    url: string;
    publicId: string;
    width?: number;
    height?: number;
  }>;
  artistId?: {
    _id: string;
    profile: {
      name: string;
      avatar?: string;
    };
  };
  stats?: {
    views: number;
    likes: number;
  };
}

const Wishlist: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingMove, setProcessingMove] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/wishlist`,
          {
            withCredentials: true,
          }
        );

        if (response.data.success) {
          const items = response.data.data?.items || response.data.items || [];
          // Process items to ensure proper image display
          const processedItems = items.map((item: WishlistItem) => ({
            ...item,
            // Use first image URL as thumbnail if no thumbnail exists
            thumbnail: item.images?.[0]?.url || "/default-artwork.png",
          }));
          setWishlistItems(processedItems);
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          toast.error("Please login to view wishlist");
          navigate("/login");
        } else {
          toast.error("Failed to load wishlist");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate]);

  const removeFromWishlist = async (wishlistItemId: string) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/wishlist/${wishlistItemId}`,
        {
          withCredentials: true,
        }
      );

      setWishlistItems((prev) =>
        prev.filter((item) => item._id !== wishlistItemId)
      );
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove from wishlist");
    }
  };

  const moveToCart = async (wishlistItem: WishlistItem) => {
    try {
      setProcessingMove(true);
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/cart`,
        {
          itemId: wishlistItem.itemId,
          itemType: wishlistItem.itemType,
        },
        { withCredentials: true }
      );

      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/wishlist/${wishlistItem._id}`,
        {
          withCredentials: true,
        }
      );

      setWishlistItems((prev) =>
        prev.filter((item) => item._id !== wishlistItem._id)
      );
      toast.success("Item moved to cart");
    } catch (error) {
      toast.error("Failed to move item to cart");
    } finally {
      setProcessingMove(false);
    }
  };

  const clearWishlist = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/wishlist`, {
        withCredentials: true,
      });

      setWishlistItems([]);
      toast.success("Wishlist cleared");
    } catch (error) {
      toast.error("Failed to clear wishlist");
    }
  };

  const totalValue = wishlistItems.reduce((sum, item) => sum + item.price, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Wishlist</h1>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl">Your wishlist is empty</p>
          <button
            onClick={() => navigate("/artworks")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Browse Artworks
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            {wishlistItems.map((item) => (
              <div
                key={item._id}
                className="border rounded-lg p-4 mb-4 flex flex-col sm:flex-row gap-4"
              >
                <div className="w-full sm:w-32 h-32 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/${
                          item.itemType === "artwork" ? "artworks" : "courses"
                        }/${item.itemId}`
                      )
                    }
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-gray-600">₹{item.price}</p>
                  {item.artistId && (
                    <p className="text-sm text-gray-500 mt-1"></p>
                  )}
                  {item.stats && (
                    <p className="text-sm text-gray-500 mt-1">
                      {item.stats.likes} likes
                    </p>
                  )}
                </div>
                <div className="flex flex-col justify-between items-end gap-2">
                  <span className="font-bold">₹{item.price}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveToCart(item)}
                      disabled={processingMove}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:opacity-50"
                    >
                      {processingMove ? "Moving..." : "Move to Cart"}
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end mt-4">
              <button
                onClick={clearWishlist}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear Wishlist
              </button>
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="border rounded-lg p-6 bg-gray-50">
              <h2 className="text-xl font-bold mb-4">Wishlist Summary</h2>
              <div className="flex justify-between mb-2">
                <span>Items</span>
                <span>{wishlistItems.length}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Total Value</span>
                <span>₹{totalValue.toFixed(2)}</span>
              </div>
              <div className="border-t my-4"></div>

              <button
                onClick={() => navigate("/cart")}
                className="w-full mt-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
