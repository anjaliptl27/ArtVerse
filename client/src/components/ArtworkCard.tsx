import { HeartIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import '../default-artwork.png'

interface IArtworkImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

interface ArtistProfile {
  _id: string;
  profile: {
    name: string;
    avatar?: string;
  };
}

interface ArtworkStats {
  views: number;
  likes: number;
}

interface Artwork {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: IArtworkImage[];
  artistId: ArtistProfile;
  createdAt: string;
  tags?: string[];
  stats: ArtworkStats;
  category: string;
  status: string;
  isWishlisted?: boolean;
  isInCart?: boolean;
}

interface ArtCardProps {
  artwork: Artwork;
  onWishlistToggle: (artworkId: string) => void;
  onAddToCart: (artworkId: string) => void;
}

const ArtworkCard = ({
  artwork,
  onWishlistToggle,
  onAddToCart,
}: ArtCardProps) => {
  const navigate = useNavigate();

  const getOptimizedImageUrl = (imageInput: string | IArtworkImage) => {
    if (typeof imageInput === "string") {
      if (!imageInput) return "../default-artwork.png";
      if (imageInput.includes("res.cloudinary.com")) {
        return imageInput.replace("/upload/", "/upload/w_500,h_500,c_fill/");
      }
      return imageInput;
    }

    if (imageInput?.url) {
      if (imageInput.url.includes("res.cloudinary.com")) {
        return imageInput.url.replace(
          "/upload/",
          "/upload/w_500,h_500,c_fill/"
        );
      }
      return imageInput.url;
    }

    return "../default-artwork.png";
  };

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block  rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300 relative">
        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWishlistToggle(artwork._id);
          }}
          className="absolute top-2 right-2 p-2 bg-white/80 rounded-full z-10 hover:bg-white"
        >
          {artwork.isWishlisted ? (
            <HeartIconSolid className="h-6 w-6 text-red-500" />
          ) : (
            <HeartIcon className="h-6 w-6 text-gray-700" />
          )}
        </button>

        <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
          {artwork.images && artwork.images.length > 0 ? (
            <img
              src={getOptimizedImageUrl(artwork.images[0])}
              alt={artwork.title}
              className="w-full h-full object-cover"
              onClick={() => navigate(`/artworks/${artwork._id}`)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "../default-artwork.png";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold truncate">{artwork.title}</h3>
            <span className="text-lg font-bold">₹{artwork.price}</span>
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {artwork.description}
          </p>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                <span className="text-xs">
                  {artwork.artistId.profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm">{artwork.artistId.profile.name}</span>
            </div>
           
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/artworks/${artwork._id}`)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition flex-1"
            >
              View Details
            </button>
            <button
              onClick={() => onAddToCart(artwork._id)}
              disabled={artwork.isInCart}
              className={`px-3 py-1 text-white rounded transition flex-1 flex items-center justify-center gap-1 ${
                artwork.isInCart
                  ? "bg-gray-400"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              <ShoppingCartIcon className="h-4 w-4" />
              {artwork.isInCart ? "In Cart" : "Add to Cart"}
            </button>
          </div>
          {artwork.tags && artwork.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {artwork.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col  rounded-lg shadow-sm overflow-hidden h-full">
        {/* Image */}
        <div 
          className="aspect-square bg-gray-100 relative"
          onClick={() => navigate(`/artworks/${artwork._id}`)}
        >
          {artwork.images && artwork.images.length > 0 ? (
            <img
              src={getOptimizedImageUrl(artwork.images[0])}
              alt={artwork.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "../default-artwork.png";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-500 text-xs">No Image</span>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWishlistToggle(artwork._id);
            }}
            className="absolute top-2 right-2 p-1 bg-white/80 rounded-full"
          >
            {artwork.isWishlisted ? (
              <HeartIconSolid className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-700" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-2 flex flex-col gap-1">
          <div className="mb-1">
            <h3 className="font-medium text-sm line-clamp-1">{artwork.title}</h3>
            <p className="text-xs text-gray-500 line-clamp-1">
              {artwork.artistId.profile.name}
            </p>
          </div>
          
          <div className="mt-auto">
            <p className="text-sm font-bold">₹{artwork.price}</p>
            <button
              onClick={() => onAddToCart(artwork._id)}
              disabled={artwork.isInCart}
              className={`w-full mt-2 py-1 text-xs rounded ${
                artwork.isInCart
                  ? "bg-gray-200 text-gray-600"
                  : "bg-green-500 text-white hover:bg-green-800"
              }`}
            >
              {artwork.isInCart ? "In Cart" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArtworkCard;