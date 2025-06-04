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
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 ${className}`}
    >
      <div className="p-4 sm:p-5">
        {/* Avatar & Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
          <img
            src={artist.profile.avatar || "/default-avatar.png"}
            alt={artist.profile.name}
            className="h-16 w-16 rounded-full object-cover border-2 border-white shadow"
          />
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              {artist.profile.name}
            </h3>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <FiCalendar className="mr-1" />
              Joined {formatDate(artist.createdAt)}
            </p>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-3 text-gray-600 text-sm line-clamp-1">
          {artist.profile.bio || "This artist has not added a bio yet."}
        </p>

        {/* Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
          <div className="mt-4 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
  {/* Always show Profile button */}
  <button
    onClick={() => navigate(`/artists/${artist._id}`)}
    className="w-full px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition flex items-center justify-center text-sm font-medium"
  >
    <FiUser className="mr-2" />
    Profile
  </button>

  {/* Show Commission button only on sm+ */}
  <button
    onClick={() => onCommissionClick(artist._id)}
    className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition items-center justify-center text-sm font-medium hidden sm:flex"
  >
    <FiDollarSign className="mr-2" />
    Commission
  </button>
</div>

        </div>
      </div>
    </div>
  );
};

export default ArtistCard;
