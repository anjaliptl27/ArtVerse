import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios, { AxiosError } from 'axios';
import { FiEdit2, FiLogOut, FiShoppingCart, FiHeart, FiPlus, FiMeh, FiClock, FiInfo } from 'react-icons/fi';
import {FaRupeeSign} from 'react-icons/fa';

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

interface User {
  _id: string;
  profile: UserProfile;
  role: string;
  createdAt: string;
  commissionStats?: {
    total: number;
    completed: number;
  };
}

interface Commission {
  _id: string;
  title: string;
  artistId: {
    _id: string;
    profile: {
      name: string;
      avatar?: string;
    };
  };
  status: string;
  budget: number;
  deadline: string;
  description: string;
  createdAt: string;
}

const BuyerProfile: React.FC = () => {
  const [userData, setUserData] = useState<User | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const api = axios.create({
          baseURL: import.meta.env.VITE_SERVER_URL,
          withCredentials: true
        });

        const toastId = toast.loading('Loading profile data...');
        
        const [profileRes, commissionsRes] = await Promise.all([
          api.get('/api/users/profile'),
          api.get('/api/commissions')
        ]);

        setUserData(profileRes.data.data);
        setCommissions(commissionsRes.data.data || []);
        toast.update(toastId, {
          render: 'Profile loaded successfully',
          type: 'success',
          isLoading: false,
          autoClose: 2000
        });
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          toast.error('Please login to view your profile');
          navigate('/login');
        } else {
          toast.error('Failed to load profile data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const toastId = toast.loading('Logging out...');
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/auth/logout`);
      toast.update(toastId, {
        render: 'Logged out successfully',
        type: 'success',
        isLoading: false,
        autoClose: 2000
      });
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { class: string; text: string }> = {
      pending: { class: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      accepted: { class: 'bg-blue-100 text-blue-800', text: 'Accepted' },
      completed: { class: 'bg-green-100 text-green-800', text: 'Completed' },
      rejected: { class: 'bg-red-100 text-red-800', text: 'Rejected' },
      cancelled: { class: 'bg-gray-100 text-gray-800', text: 'Cancelled' }
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || { class: 'bg-gray-100 text-gray-800', text: status };
    return (
      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6 sm:mb-8">
          <div className="px-4 py-6 sm:px-6 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 sm:space-x-5">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-300 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                  {userData?.profile.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{userData?.profile.name}</h1>
                <p className="text-sm sm:text-base text-gray-600">{userData?.profile.email}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Member since {userData && formatDate(userData.createdAt)}
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/edit-profile')}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiEdit2 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Edit
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiLogOut className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
              <button
                onClick={() => navigate('/wishlist')}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiHeart className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Wishlist
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiShoppingCart className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Cart
              </button>
            </div>
          </div>
          {userData?.commissionStats && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3">
              <div className="flex flex-wrap gap-4 sm:gap-6">
                <div className="flex items-center">
                  <span className="text-gray-900 font-medium text-sm sm:text-base">
                    {userData.commissionStats.total}
                  </span>
                  <span className="ml-1.5 text-gray-600 text-xs sm:text-sm">Total Commissions</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-900 font-medium text-sm sm:text-base">
                    {userData.commissionStats.completed}
                  </span>
                  <span className="ml-1.5 text-gray-600 text-xs sm:text-sm">Completed</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Commissions Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-4 sm:px-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-medium text-gray-900">Your Commissions</h2>
            <button
              onClick={() => navigate('/artists')}
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FiPlus className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              New Commission
            </button>
          </div>

          {commissions.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-gray-400 flex items-center justify-center">
                <FiMeh className="h-full w-full" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">No commissions yet</h3>
              <p className="mt-1 text-sm sm:text-base text-gray-500">
                Get started by creating a new commission request with an artist.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/artists')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                  New Commission
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {commissions.map((commission) => (
                <div key={commission._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-300 flex items-center justify-center text-white">
                          {commission.artistId.profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 line-clamp-1">
                            {commission.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Artist: {commission.artistId.profile.name}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {commission.description}
                      </p>
                    </div>
                    <div className="sm:ml-4">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <div className="flex items-center">
                          <FaRupeeSign className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {formatCurrency(commission.budget)}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <FiClock className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {formatDate(commission.deadline)}
                          </p>
                        </div>
                        <div className="w-full sm:w-auto">
                          {getStatusBadge(commission.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => {
                        toast.info('Loading commission details...');
                        navigate(`/commissions/${commission._id}`);
                      }}
                      className="inline-flex items-center px-2.5 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiInfo className="mr-1.5 h-3 w-3" />
                      Details
                    </button>
                    
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerProfile;