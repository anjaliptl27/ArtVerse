import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios, { AxiosError } from 'axios';

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

const BuyerProfile:React.FC = () => {
  const [userData, setUserData] = useState<User | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const api = axios.create({
          baseURL: import.meta.env.VITE_SERVER_URL,
          withCredentials: true
        })
        //fetch commissions and profile
        const [profileRes, commissionsRes] = await Promise.all([
          api.get('/api/users/profile'),
          api.get('/api/commissions')
        ]);

        setUserData(profileRes.data.data);
        setCommissions(commissionsRes.data.data || []);
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          navigate('/login');
          toast.error('Please login to view your profile');
        } else {
          toast.error('Failed to load profile data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/auth/logout`);
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-8 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-5">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                  {userData?.profile.name.charAt(0)}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{userData?.profile.name}</h1>
                <p className="text-gray-600">{userData?.profile.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Member since {userData && formatDate(userData.createdAt)}
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => navigate('/edit-profile')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Logout
              </button>
              <button
               onClick={() => navigate('/wishlist')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Wishlist
              </button>

              <button
               onClick={() => navigate('/cart')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Cart
              </button>

            </div>
            
          </div>
          {userData?.commissionStats && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex space-x-6">
                <div className="flex items-center">
                  <span className="text-gray-900 font-medium">{userData.commissionStats.total}</span>
                  <span className="ml-1 text-gray-600">Total Commissions</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-900 font-medium">{userData.commissionStats.completed}</span>
                  <span className="ml-1 text-gray-600">Completed</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Commissions Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-gray-900">Your Commissions</h2>
            <button
              onClick={() => navigate('/artists')}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none sm:mt-0"
            >
              New Commission
            </button>
          </div>

          {commissions.length === 0 ? (
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
              <h3 className="mt-2 text-lg font-medium text-gray-900">No commissions yet</h3>
              <p className="mt-1 text-gray-500">Get started by creating a new commission request.</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/artists')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  New Commission
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {commissions.map((commission) => (
                <div key={commission._id} className="px-6 py-5 hover:bg-gray-50">
                  <div className="sm:flex sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                          {commission.artistId.profile.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{commission.title}</h3>
                          <p className="text-sm text-gray-500">
                            Artist: {commission.artistId.profile.name}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {commission.description}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            ${commission.budget.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">Budget</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(commission.deadline)}
                          </p>
                          <p className="text-xs text-gray-500">Deadline</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(commission.status)}`}
                        >
                          {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => navigate(`/commissions/${commission._id}`)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      View Details
                    </button>
                    {commission.status === 'pending' && (
                      <button
                        onClick={() => navigate(`/commissions/${commission._id}/edit`)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        Edit
                      </button>
                    )}
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