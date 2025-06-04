import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import EnrollmentModal from '../components/EnrollmentModal';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SearchAndSort from '../components/SearchandSort';
import CourseCard from '../components/CourseCard';

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

interface Course {
  _id: string;
  title: string;
  description: string;
  artistId: {
    _id: string;
    profile: {
      name: string;
      avatar?: string;
    };
  };
  price: number;
  thumbnail: IThumbnail;
  isApproved: boolean;
  status: 'draft' | 'published' | 'rejected';
  rejectionReason?: string;
  lessons: Lesson[];
  students: string[];
  createdAt: string;
  updatedAt: string;
  category?: string;
  averageRating?: number;
}

interface EnrollmentFormData {
  name: string;
  email: string;
  phone?: string;
  paymentMethod?: string;
}

interface ApiResponse {
  success: boolean;
  data: Course[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: Course[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [priceInputs, setPriceInputs] = useState({
    min: '',
    max: ''
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 12
  });

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(searchParams);
        params.set('page', pagination.page.toString());
        params.set('limit', pagination.limit.toString());
        
        const response = await axios.get<ApiResponse>(
          `${import.meta.env.VITE_SERVER_URL}/api/courses?${params.toString()}`
        );

        if (response.data.success) {
          const formattedCourses = response.data.data.map((course: any) => ({
            ...course,
            price: typeof course.price === 'string' ? parseFloat(course.price) : course.price
          }));
          setCourses(formattedCourses);
          setPagination(response.data.pagination);
        } 
      } catch (error) {
        const axiosError = error as AxiosError;
        const errorMessage = axiosError.response?.status || axiosError.message || 'Failed to load courses';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [searchParams, pagination.page]);

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPriceInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePriceRangeApply = () => {
    const params = new URLSearchParams(searchParams);
    if (priceInputs.min) params.set('minPrice', priceInputs.min);
    if (priceInputs.max) params.set('maxPrice', priceInputs.max);
    setSearchParams(params);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const customModalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '90%',
      width: '500px',
      borderRadius: '12px',
      padding: '0',
      border: 'none',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000
    }
  };

  const handleEnrollClick = (course: Course) => {
    setSelectedCourse(course);
    setShowEnrollmentModal(true);
  };

  const handleEnrollSubmit = async (formData: EnrollmentFormData) => {
    if (!selectedCourse) return;

    try {
      setEnrolling(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/courses/${selectedCourse._id}/enroll`,
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Successfully enrolled in the course!');
        setShowEnrollmentModal(false);
      } else {
        throw new Error(response.data.message || 'Failed to enroll');
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.status || 'Failed to enroll in course';
      toast.error(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

 

return (
  <div className="container mx-auto px-4 py-8">
    <div className="flex flex-col md:flex-row gap-8">
      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden sticky top-16 bg-white z-10 pb-4 pt-4">
        <div className="flex justify-between items-center mb-4 pt-2">
          <h1 className="text-2xl font-bold text-gray-800">Available Courses</h1>
        </div>

        <div className="flex justify-between items-center mb-2">
          {/* Left: Search */}
          <div className="flex-1">
            <SearchAndSort 
              sortOptions={sortOptions}
              placeholder="Search..."
            />
          </div>

          {/* Right: Filters Button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="ml-4 flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Left Sidebar - Filters */}
      <div
        className={`${
          showMobileFilters ? "block" : "hidden"
        } md:block md:w-64 space-y-6 md:sticky md:top-24 self-start h-max bg-white p-4 rounded-lg shadow md:bg-transparent md:p-0 md:shadow-none`}
      >
        {/* Mobile filter header - Only shown on small screens */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h3 className="font-medium text-lg">Filters</h3>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow md:shadow-none">
          <h3 className="font-medium text-lg mb-4">Filter by Price</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="minPrice" className="block text-sm text-gray-600 mb-1">
                  Min
                </label>
                <input
                  type="number"
                  id="minPrice"
                  name="min"
                  placeholder="₹0"
                  value={priceInputs.min}
                  onChange={handlePriceInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="maxPrice" className="block text-sm text-gray-600 mb-1">
                  Max
                </label>
                <input
                  type="number"
                  id="maxPrice"
                  name="max"
                  placeholder="₹10000"
                  value={priceInputs.max}
                  onChange={handlePriceInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handlePriceRangeApply}
              className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              Apply Filters
            </button>
            {showMobileFilters && (
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition md:hidden"
              >
                Show Results
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Sticky Header - Hidden on mobile since we have a new one */}
        <div className="hidden md:block sticky top-16 bg-white z-10 pb-4">
          <div className="flex justify-between items-center mb-4 pt-2">
            <h1 className="text-3xl font-bold text-gray-800">Available Courses</h1>
            <div className="w-64">
              <SearchAndSort 
                sortOptions={sortOptions}
                placeholder="Search courses..."
              />
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No courses available matching your criteria</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  onEnroll={handleEnrollClick}
                />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="flex space-x-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setPagination(prev => ({ ...prev, page }))}
                      className={`px-3 py-1 rounded ${pagination.page === page ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {/* Enrollment Modal */}
    <Modal
      isOpen={showEnrollmentModal}
      onRequestClose={() => setShowEnrollmentModal(false)}
      style={customModalStyles}
      contentLabel="Course Enrollment"
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Enroll in {selectedCourse?.title}
          </h2>
          <button
            onClick={() => setShowEnrollmentModal(false)}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <EnrollmentModal
          isOpen={showEnrollmentModal}
          onClose={() => setShowEnrollmentModal(false)}
          courseTitle={selectedCourse?.title}
          price={selectedCourse?.price}
          onSubmit={handleEnrollSubmit}
          isLoading={enrolling}
        />
      </div>
    </Modal>
  </div>
);
}
export default Courses;