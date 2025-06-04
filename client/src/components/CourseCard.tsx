import { BookOpenIcon, ClockIcon, UserIcon} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

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
  status: "draft" | "published" | "rejected";
  rejectionReason?: string;
  lessons: Lesson[];
  students: string[];
  createdAt: string;
  updatedAt: string;
  category?: string;
  averageRating?: number;
}

interface CourseCardProps {
  course: Course;
  onEnroll: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEnroll }) => {
  const navigate = useNavigate();

  const price =
    typeof course.price === "string" ? parseFloat(course.price) : course.price;

  const getOptimizedImageUrl = (imageInput: string | IThumbnail) => {
    if (typeof imageInput === "string") {
      if (!imageInput) return "/default-artwork.png";
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

    return "/default-artwork.png";
  };

  const totalDuration =
    course.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) ||
    0;
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="w-full h-48 overflow-hidden relative">
          {course.thumbnail ? (
            <img
              src={getOptimizedImageUrl(course.thumbnail)}
              alt={course.title}
            className="w-full h-full object-cover"
              onClick={() => navigate(`/courses/${course._id}`)}
            />
          ) : (
            <div 
            className="w-full h-48 bg-gray-200 flex items-center justify-center cursor-pointer"
              onClick={() => navigate(`/courses/${course._id}`)}
            >
              <span className="text-gray-500">No thumbnail available</span>
            </div>
          )}
        </div>
      <div className="p-4">
        <h2
          className="text-xl font-bold mb-2 text-gray-800 cursor-pointer hover:text-blue-600"
              onClick={() => navigate(`/courses/${course._id}`)}
            >
              {course.title}
        </h2>
        <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

        <div className="flex items-center text-gray-500 mb-2">
          <UserIcon className="h-4 w-4 mr-2" />
          <span className="text-sm">{course.artistId.profile.name}</span>
        </div>

        <div className="flex items-center text-gray-500 mb-2">
          <BookOpenIcon className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {course.lessons?.length || 0} lesson
            {course.lessons?.length !== 1 ? "s" : ""}
            </span>
          </div>

        <div className="flex items-center text-gray-500 mb-4">
          <ClockIcon className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {hours > 0 ? `${hours} hr${hours > 1 ? "s" : ""} ` : ""}
            {minutes > 0 ? `${minutes} min${minutes > 1 ? "s" : ""}` : ""}
              </span>
            </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold text-gray-800">
            ₹{price.toFixed(2)}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              course.isApproved
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {course.status === "published"
              ? "Published"
              : course.status === "draft"
              ? "Draft"
              : "Rejected"}
          </span>
          </div>

        <div className="flex space-x-2">
            <button
            onClick={() => navigate(`/courses/${course._id}`)}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Details
          </button>
          <button
            onClick={() => onEnroll(course)}
            className="flex-1 py-2 px-4 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700"
            >
              Enroll Now
            </button>
          </div>
        </div>
      </div>
  );
};

export default CourseCard;
