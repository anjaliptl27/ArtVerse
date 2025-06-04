import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import CommissionModal from '../components/CommissionModal'; 

interface ArtistProfile {
  name: string;
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
  email: string;
  profile: ArtistProfile;
  role: string;
  createdAt: string;
}

interface Artwork {
  _id: string;
  title: string;
  description: string;
  images: string[];
  price?: number;
  createdAt: string;
}

interface IArtworkImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}


const ArtistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommissionModal, setShowCommissionModal] = useState(false);


  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        setLoading(true);
        const api = axios.create({
          baseURL: import.meta.env.VITE_SERVER_URL,
          withCredentials: true
        });

        const [artistRes, artworksRes] = await Promise.all([
          api.get(`/api/users/artists/${id}`),
          api.get(`/api/artworks?artistId=${id}`)
        ]);
       
        setArtist(artistRes.data.data || null);
        setArtworks(artworksRes.data.data || []);
      } catch (error) {
        toast.error('Failed to load artist data');
        navigate('/artists');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [id, navigate]);

  const handleCommissionClick = () => {
    setShowCommissionModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOptimizedImageUrl = (imageInput: string | IArtworkImage) => {
    if (typeof imageInput === 'string') {
      if (!imageInput) return '/default-artwork.png';
      if (imageInput.includes('res.cloudinary.com')) {
        return imageInput.replace('/upload/', '/upload/w_500,h_500,c_fill/');
      }
      return imageInput;
    }
    
    if (imageInput?.url) {
      if (imageInput.url.includes('res.cloudinary.com')) {
        return imageInput.url.replace('/upload/', '/upload/w_500,h_500,c_fill/');
      }
      return imageInput.url;
    }
    
    return '/default-artwork.png';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Artist not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Artist Profile Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-8 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-5">
              <div className="flex-shrink-0 h-24 w-24">
                {artist.profile.avatar ? (
                  <img
                    className="h-full w-full rounded-full object-cover"
                    src={artist.profile.avatar}
                    alt="Profile"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                    {artist.profile.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{artist.profile.name}</h1>
                <p className="text-gray-600">{artist.email}</p>
                {artist.profile.bio && (
                  <p className="text-gray-600 mt-2">{artist.profile.bio}</p>
                )}
                
                {artist.profile.skills && artist.profile.skills.length > 0 && (
                  <div className="mt-2">
                    <h3 className="text-sm font-medium text-gray-700">Skills</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {artist.profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-2">
                  Member since {formatDate(artist.createdAt)}
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => handleCommissionClick()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                Request Commission
              </button>
            </div>
          </div>

          {/* Social Media Links */}
          {artist.profile.socialMedia && artist.profile.socialMedia.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Connect With This Artist</h3>
              <div className="flex space-x-4">
                {artist.profile.socialMedia.map((sm, index) => (
                  <a
                    key={index}
                    href={sm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {sm.platform}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Commission Rates */}
        {artist.profile.commissionRates && artist.profile.commissionRates.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Commission Options</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {artist.profile.commissionRates.map((rate, index) => (
                <div key={index} className="px-6 py-5 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{rate.type}</h3>
                      {rate.description && (
                        <p className="text-gray-600 mt-1">{rate.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-medium text-gray-900">
                       ₹{rate.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleCommissionClick()}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Request
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Artist Portfolio/Works */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Artist's Works</h2>
          </div>
          {artworks.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No artworks yet</h3>
              <p className="mt-1 text-gray-500">Check back later for new works from this artist.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {artworks.map((artwork) => (
                <div key={artwork._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(artwork.images[0])}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                      onClick={() => navigate(`/artworks/${artwork._id}`)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-artwork.png';
                      }}
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-medium text-gray-900">{artwork.title}</h3>
                    <p className="text-gray-600 mt-1 line-clamp-2 flex-1">{artwork.description}</p>
                    {artwork.price && (
                      <p className="text-gray-900 font-medium mt-2">₹{artwork.price.toFixed(2)}</p>
                    )}
                    <button
                      onClick={() => navigate(`/artworks/${artwork._id}`)}
                      className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 self-start"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commission Modal */}
      {showCommissionModal && artist && (
        <CommissionModal
          artistId={artist._id}
          isOpen={showCommissionModal}
          onClose={() => setShowCommissionModal(false)}
        />
      )}
    </div>
  );
};

export default ArtistDetail;