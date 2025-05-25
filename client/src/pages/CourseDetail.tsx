import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import EnrollmentModal from '../components/EnrollmentModal';
import { BookOpenIcon, ClockIcon, LockClosedIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

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

// Add EnrollmentFormData interface
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

  // Helper function to safely format price
  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `₹${num.toFixed(2)}`;
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const [courseResponse, enrollmentResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_SERVER_URL}/api/courses/${id}`),
          axios.get(`${import.meta.env.VITE_SERVER_URL}/api/courses/${id}/enrollment`, {
            withCredentials: true
          })
        ]);

        if (courseResponse.data.success) {
          setCourse(courseResponse.data.data);
        } else {
          throw new Error(courseResponse.data.message || 'Failed to fetch course');
        }

        if (enrollmentResponse.data.success) {
          setIsEnrolled(enrollmentResponse.data.isEnrolled);
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          // Not logged in - silently continue (user just won't see enrolled status)
        } else if (axiosError.response?.status === 404) {
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
  }, [id, navigate]);

  const getOptimizedImageUrl = (imageInput: string | IThumbnail) => {
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

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''} ` : ''}${mins} min${mins !== 1 ? 's' : ''}`;
  };

  const handleEnrollSubmit = async (formData: EnrollmentFormData) => {
    if (!course) return;

    try {
      setEnrolling(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/courses/${course._id}/enroll`,
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Successfully enrolled in the course!');
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
        toast.error(axiosError.response?.status || 'Failed to enroll');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleEnrollClick = () => {
    if (!course) return;

    if (Number(course.price) === 0) {
      // Handle free course enrollment directly
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
    // Navigate to lesson player or open in modal
    console.log('Playing lesson:', lesson.title);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!course) {
    return <div className="p-4 text-center">Course not found</div>;
  }

  const totalDuration = course.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Course Header */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="md:flex">
          <div className="md:flex-shrink-0 md:w-1/3">
            <img
              className="h-full w-full object-cover md:h-full md:w-full"
              src={getOptimizedImageUrl(course.thumbnail)}
              alt={course.title}
            />
          </div>
          <div className="p-8 md:w-2/3">
            <div className="flex justify-between items-start">
              <div>
                <div className="uppercase tracking-wide text-sm text-indigo-600 font-semibold">
                  {course.artistId.profile.name}
                </div>
                <h1 className="mt-2 text-3xl font-extrabold text-gray-900">{course.title}</h1>
                <div className="mt-3 flex items-center space-x-4">
                  <span className="flex items-center text-gray-600">
                    <BookOpenIcon className="h-5 w-5 mr-1" />
                    {course.lessons.length} lesson{course.lessons.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-1" />
                    {formatDuration(totalDuration)}
                  </span>
                  {isEnrolled && (
                    <span className="flex items-center text-green-600">
                      <CheckBadgeIcon className="h-5 w-5 mr-1" />
                      Enrolled
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(course.price)}
                </span>
                {!isEnrolled && (
                  <button
                    onClick={handleEnrollClick}
                    disabled={enrolling}
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed transition"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">About this course</h3>
              <p className="mt-2 text-gray-600 whitespace-pre-line">{course.description}</p>
            </div>

            <div className="mt-6 flex items-center">
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={course.artistId.profile.avatar || '/default-avatar.png'}
                alt={course.artistId.profile.name}
              />
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">{course.artistId.profile.name}</h4>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {course.artistId.profile.bio || 'Artist'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
          
          <div className="space-y-4">
            {course.lessons.map((lesson, index) => (
              <div
                key={lesson._id}
                className={`p-4 border rounded-lg hover:shadow-md transition ${isEnrolled ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50'}`}
                onClick={() => handleLessonClick(lesson)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                      <span className="text-indigo-600 font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{lesson.title}</h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{formatDuration(lesson.duration)}</span>
                      </div>
                    </div>
                  </div>
                  {!isEnrolled && (
                    <div className="text-gray-400">
                      <LockClosedIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                
                {isEnrolled && lesson.resources && lesson.resources.length > 0 && (
                  <div className="mt-3 pl-14">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Resources:</h4>
                    <ul className="space-y-2">
                      {lesson.resources.map((resource) => (
                        <li key={resource._id || resource.url}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                          >
                            <span className="truncate">{resource.name}</span>
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