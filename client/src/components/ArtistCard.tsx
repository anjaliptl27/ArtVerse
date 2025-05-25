import { useNavigate } from "react-router-dom";
import { FiUser, FiCalendar, FiDollarSign } from "react-icons/fi";

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

interface ArtistCardProps {
  artist: Artist;
  onCommissionClick: (artistId: string) => void;
  className?: string;
}

const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  onCommissionClick,
  className = "",
}) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 ${className}`}
    >
      <div className="p-5">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <img
              src={artist.profile.avatar || "/default-avatar.png"}
              alt={artist.profile.name}
              className="h-16 w-16 rounded-full object-cover border-2 border-white shadow"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {artist.profile.name}
            </h3>
            <p className="text-xs text-gray-500 flex items-center">
              <FiCalendar className="mr-1" />
              Joined {formatDate(artist.createdAt)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-gray-600 text-sm line-clamp-3">
          {artist.profile.bio || "This artist has not added a bio yet."}
        </p>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => navigate(`/artists/${artist._id}`)}
            className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition flex items-center justify-center text-sm font-medium"
          >
            <FiUser className="mr-2" />
            Profile
          </button>
          <button
            onClick={() => onCommissionClick(artist._id)}
            className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center text-sm font-medium"
          >
            <FiDollarSign className="mr-2" />
            Commission
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistCard;
