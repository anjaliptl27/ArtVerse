import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import CommissionModal from '../components/CommissionModal';
import ArtistCard from '../components/ArtistCard';

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

const Artists: React.FC = () => {
  const [artistList, setArtistList] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/users/artists`);

        if (Array.isArray(response.data)) {
          setArtistList(response.data);
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          toast.error('Please login to view artists');
          navigate('/login');
        } else {
          toast.error('Failed to load artists');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [navigate]);

  const handleCommissionClick = (artistId: string) => {
    setSelectedArtistId(artistId);
    setShowCommissionModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-18">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Discover Artists</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
              {/* Loading skeleton remains the same */}
            </div>
          ))}
        </div>
      ) : artistList.length === 0 ? (
        <div className="text-center py-12">
          {/* No artists found message remains the same */}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artistList.map((artist) => (
            <ArtistCard
              key={artist._id}
              artist={artist}
              onCommissionClick={handleCommissionClick}
            />
          ))}
        </div>
      )}

      <CommissionModal
        artistId={selectedArtistId || ''}
        isOpen={showCommissionModal}
        onClose={() => setShowCommissionModal(false)}
      />
    </div>
  );
};

export default Artists;