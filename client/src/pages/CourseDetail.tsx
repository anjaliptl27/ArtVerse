import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import EnrollmentModal from '../components/EnrollmentModal';
import { 
  ClockIcon, 
  LockClosedIcon, 
  CheckBadgeIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { FiExternalLink } from 'react-icons/fi';
import { BsPlayFill } from 'react-icons/bs';
import { HiOutlineCurrencyRupee } from 'react-icons/hi';

interface Resource {
  name: string;
  url: string;
  _id?: string;
}

interface Lesson {
  title: string;
  youtubeUrl: string;
  duration?: number;
  resources?: Resource[];
  _id: string;
}

interface IThumbnail {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

interface Artist {
  _id: string;
  profile: {
    name: string;
    avatar?: string;
    bio?: string;
  };
}

interface Course {
  _id: string;
  title: string;
  description: string;
  artistId: Artist;
  price: number | string; 
  thumbnail: IThumbnail;
  isApproved: boolean;
  status: 'draft' | 'published' | 'rejected';
  rejectionReason?: string;
  lessons: Lesson[];
  students: string[];
  createdAt: string;
  updatedAt: string;
}

interface EnrollmentFormData {
  name: string;
  email: string;
  phone?: string;
  paymentMethod?: string;
}

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/auth/me`,
          { withCredentials: true }
        );
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const toastId = toast.loading('Loading course details...');
        
        // First check authentication status
        await checkAuthStatus();
        
        // Then fetch course details
        const courseResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/courses/${id}`
        );

        if (courseResponse.data.success) {
          setCourse(courseResponse.data.data);
          toast.update(toastId, {
            render: 'Course loaded successfully',
            type: 'success',
            isLoading: false,
            autoClose: 2000
          });
        } else {
          throw new Error(courseResponse.data.message || 'Failed to fetch course');
        }

        // Only check enrollment if authenticated
        if (isAuthenticated) {
          try {
            const enrollmentResponse = await axios.get(
              `${import.meta.env.VITE_SERVER_URL}/api/courses/${id}/enrollment`,
              { withCredentials: true }
            );
            if (enrollmentResponse.data.success) {
              setIsEnrolled(enrollmentResponse.data.isEnrolled);
            }
          } catch (enrollmentError) {
            // If there's an error checking enrollment, assume not enrolled
            setIsEnrolled(false);
          }
        } else {
          setIsEnrolled(false); // Explicitly set to false for non-authenticated users
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          setError('Course not found');
          toast.error('Course not found');
          navigate('/courses');
        } else {
          setError(axiosError.message);
          toast.error('Failed to load course details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, navigate, isAuthenticated]);

  const getOptimizedImageUrl = (imageInput: string | IThumbnail) => {
    if (typeof imageInput === 'string') {
      if (!imageInput) return '/default-artwork.png';
      if (imageInput.includes('res.cloudinary.com')) {
        return imageInput.replace('/upload/', '/upload/w_600,h_400,c_fill/');
      }
      return imageInput;
    }
    
    if (imageInput?.url) {
      if (imageInput.url.includes('res.cloudinary.com')) {
        return imageInput.url.replace('/upload/', '/upload/w_600,h_400,c_fill/');
      }
      return imageInput.url;
    }
    
    return '/default-artwork.png';
  };

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
  };

  const handleEnrollSubmit = async (formData: EnrollmentFormData) => {
    if (!course) return;

    try {
      setEnrolling(true);
      const toastId = toast.loading('Processing enrollment...');
      
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/courses/${course._id}/enroll`,
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.update(toastId, {
          render: 'Successfully enrolled in the course!',
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
        setIsEnrolled(true);
        setShowEnrollmentModal(false);
      } else {
        throw new Error(response.data.message || 'Failed to enroll');
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        toast.error('Please login to enroll in this course');
        navigate('/login', { state: { from: `/courses/${course._id}` } });
      } else {
        toast.error('Failed to enroll. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleEnrollClick = () => {
    if (!course) return;

    if (!isAuthenticated) {
      toast.info('Please login to enroll in this course');
      navigate('/login', { state: { from: `/courses/${course._id}` } });
      return;
    }

    if (Number(course.price) === 0) {
      // Free course enrollment
      toast.info('Enrolling in free course...');
      handleEnrollSubmit({
        name: '',
        email: '',
        phone: '',
        paymentMethod: 'none'
      });
    } else {
      setShowEnrollmentModal(true);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!isEnrolled) {
      toast.info('Please enroll in the course to access lessons');
      return;
    }
    // Navigate to lesson player
    navigate(`/courses/${course?._id}/lessons/${lesson._id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-lg shadow p-6 inline-block">
          <p className="text-gray-700">Course not found</p>
          <button
            onClick={() => navigate('/courses')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Browse Available Courses
          </button>
        </div>
      </div>
    );
  }

  const totalDuration = course.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Course Header - Mobile First */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row">
          {/* Course Thumbnail */}
          <div className="md:w-1/3 lg:w-2/5">
            <img
              className="w-full h-48 sm:h-64 md:h-full object-cover"
              src={getOptimizedImageUrl(course.thumbnail)}
              alt={course.title}
            />
          </div>
          
          {/* Course Info */}
          <div className="p-4 sm:p-6 md:w-2/3 lg:w-3/5">
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center text-sm text-indigo-600 font-semibold mb-2">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {course.artistId.profile.name}
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {course.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 mt-3 mb-4">
                  <span className="flex items-center text-sm text-gray-600">
                    <AcademicCapIcon className="h-4 w-4 mr-1.5" />
                    {course.lessons.length} {course.lessons.length === 1 ? 'Lesson' : 'Lessons'}
                  </span>
                  <span className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-1.5" />
                    {formatDuration(totalDuration)}
                  </span>
                  {isEnrolled && (
                    <span className="flex items-center text-sm text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                      <CheckBadgeIcon className="h-4 w-4 mr-1" />
                      Enrolled
                    </span>
                  )}
                </div>
                
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">About this course</h3>
                  <p className="text-gray-600 whitespace-pre-line">
                    {course.description}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-full object-cover border-2 border-indigo-100"
                      src={course.artistId.profile.avatar || '/default-avatar.png'}
                      alt={course.artistId.profile.name}
                    />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        {course.artistId.profile.name}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {course.artistId.profile.bio || 'Course Instructor'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900 flex items-center justify-end">
                      <HiOutlineCurrencyRupee className="h-5 w-5 mr-0.5" />
                      {formatPrice(course.price).replace('₹', '')}
                    </div>
                    {!isEnrolled && (
                      <button
                        onClick={handleEnrollClick}
                        disabled={enrolling}
                        className={`mt-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition
                          ${enrolling ? 'opacity-70 cursor-not-allowed' : 'shadow-md hover:shadow-lg'}`}
                      >
                        {enrolling ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          'Enroll Now'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Course Content
            </h2>
            <div className="text-sm text-gray-500">
              {course.lessons.length} {course.lessons.length === 1 ? 'lesson' : 'lessons'} • {formatDuration(totalDuration)}
            </div>
          </div>
          
          <div className="space-y-3">
            {course.lessons.map((lesson, index) => (
              <div
                key={lesson._id}
                className={`p-3 sm:p-4 border rounded-lg transition-all ${isEnrolled ? 
                  'cursor-pointer hover:bg-indigo-50 hover:border-indigo-200' : 
                  'bg-gray-50 border-gray-200'}`}
                onClick={() => handleLessonClick(lesson)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-3 sm:mr-4
                      ${isEnrolled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {isEnrolled ? (
                        <BsPlayFill className="h-5 w-5" />
                      ) : (
                        <span className="font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`text-sm sm:text-base font-medium truncate ${isEnrolled ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {lesson.title}
                      </h3>
                      <div className="flex items-center mt-1 text-xs sm:text-sm text-gray-500">
                        <ClockIcon className="h-3.5 w-3.5 mr-1" />
                        <span>{formatDuration(lesson.duration)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center ml-2">
                    {!isEnrolled && (
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {isEnrolled && lesson.resources && lesson.resources.length > 0 && (
                  <div className="mt-3 pl-13 sm:pl-14">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Resources:</h4>
                    <ul className="space-y-1.5">
                      {lesson.resources.map((resource) => (
                        <li key={resource._id || resource.url}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate">{resource.name}</span>
                            <FiExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {course && (
        <EnrollmentModal
          isOpen={showEnrollmentModal}
          onClose={() => setShowEnrollmentModal(false)}
          courseTitle={course.title}
          price={Number(course.price)}
          onSubmit={handleEnrollSubmit}
          isLoading={enrolling}
        />
      )}
    </div>
  );
};

export default CourseDetail;