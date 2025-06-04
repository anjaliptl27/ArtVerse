import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import {Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { toast } from "react-toastify";
import Modal from "react-modal";
import {
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PaperClipIcon,
  UserIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Types
interface IArtworkImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

interface Artwork {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: IArtworkImage[];
  status: "pending" | "approved" | "rejected";
  category: string;
  stock: number;
}

interface Order {
  _id: string;
  items: {
    itemId: string;
    title: string;
    price: number;
  }[];
  buyer: {
    name: string;
    email: string;
  };
  total: number;
  status: string;
  createdAt: string;
}

interface Commission {
  _id: string;
  title: string;
  description: string;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "completed"
    | "in_progress"
    | "cancelled";
  buyerId: {
    name: string;
    email: string;
  };
  budget: number;
  deadline?: string;
}

interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  profile?: {
    name: string;
    avatar?: string;
  };
}

interface IResource {
  name: string;
  url: string;
  _id?: string;
}

interface ILesson {
  _id: string;
  title: string;
  youtubeUrl: string;
  duration: number;
  resources: IResource[];
}

interface ICourse {
  _id: string;
  title: string;
  description: string;
  thumbnail: IArtworkImage;
  artistId: {
    _id: string;
    profile: {
      name: string;
      avatar?: string;
    };
  };
  price: number;
  isApproved: boolean;
  lessons: ILesson[];
  students: {
    userId: IUser;
    enrolledAt: string;
    progress?: number;
  }[];
  status: "draft" | "published" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface DashboardData {
  sales: {
    totalSales: number;
    monthlyEarnings: {
      month: string;
      amount: number;
    }[];
  };
  artworks: {
    total: number;
    byStatus: {
      status: string;
      count: number;
    }[];
    popular: Artwork[];
    all: Artwork[];
  };
  commissions: {
    total: number;
    byStatus: {
      status: string;
      count: number;
    }[];
    pending: Commission[];
    all: Commission[];
  };
  orders: {
    total: number;
    recent: Order[];
  };
  courses: {
    total: number;
    all: ICourse[];
  };
  notifications: {
    unread: number;
    all: Notification[];
  };
}

// Set app element for accessibility
Modal.setAppElement("#root");

const ArtistDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [editingCourse, setEditingCourse] = useState<ICourse | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [activeCommissionTab, setActiveCommissionTab] = useState<
    "all" | "pending"
  >("all");
  const [selectedCourseForLesson, setSelectedCourseForLesson] =
    useState<ICourse | null>(null);
  const [newLesson, setNewLesson] = useState({
    title: "",
    youtubeUrl: "",
    duration: 0,
    resources: [] as IResource[],
  });
  const [newResource, setNewResource] = useState({
    name: "",
    url: "",
  });

  // Cloudinary configuration
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Form states
  const [artworkForm, setArtworkForm] = useState({
    title: "",
    description: "",
    price: 0,
    images: [] as IArtworkImage[],
    category: "Painting",
    stock: 1,
  });

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    price: 0,
    thumbnail: null as IArtworkImage | null,
    status: "draft" as "draft" | "published" | "rejected",
    lessons: [
      { title: "", youtubeUrl: "", duration: 0, resources: [] as IResource[] },
    ],
  });

  // Cloudinary upload function
  const uploadToCloudinary = async (
    file: File,
    folder: string = "artworks"
  ): Promise<IArtworkImage> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", folder);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  // Handle artwork image upload
  const handleArtworkImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;

    try {
      const files = Array.from(e.target.files);
      toast.info("Uploading images...", { autoClose: false });

      const uploadPromises = files.map((file) => uploadToCloudinary(file));
      const uploadedImages = await Promise.all(uploadPromises);

      toast.dismiss();
      setArtworkForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));

      toast.success("Images uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload images");
    }
  };

  // Handle course thumbnail upload
  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return;

    try {
      toast.info("Uploading thumbnail...", { autoClose: false });
      const uploadedImage = await uploadToCloudinary(
        e.target.files[0],
        "courses"
      );
      toast.dismiss();

      setCourseForm((prev) => ({
        ...prev,
        thumbnail: {
          url: uploadedImage.url,
          publicId: uploadedImage.publicId,
          width: uploadedImage.width,
          height: uploadedImage.height,
        },
      }));

      toast.success("Thumbnail uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload thumbnail");
    }
  };

  // Handle remove artwork image
  const handleRemoveArtworkImage = (index: number) => {
    setArtworkForm((prev) => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  // Handle remove course thumbnail
  const handleRemoveThumbnail = () => {
    setCourseForm((prev) => ({
      ...prev,
      thumbnail: null,
    }));
  };

  // Default data
  const defaultData: DashboardData = {
    sales: {
      totalSales: 0,
      monthlyEarnings: Array(12)
        .fill(0)
        .map((_, i) => ({
          month: new Date(0, i).toLocaleString("default", { month: "short" }),
          amount: 0,
        })),
    },
    artworks: {
      total: 0,
      byStatus: [
        { status: "approved", count: 0 },
        { status: "pending", count: 0 },
        { status: "rejected", count: 0 },
      ],
      popular: [],
      all: [],
    },
    commissions: {
      total: 0,
      byStatus: [
        { status: "pending", count: 0 },
        { status: "accepted", count: 0 },
        { status: "in_progress", count: 0 },
        { status: "completed", count: 0 },
        { status: "cancelled", count: 0 },
      ],
      pending: [],
      all: [],
    },
    orders: {
      total: 0,
      recent: [],
    },
    courses: {
      total: 0,
      all: [],
    },
    notifications: {
      unread: 0,
      all: [],
    },
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/artists/dashboard`,
        {
          withCredentials: true,
        }
      );
      setData(response.data);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(
        error.response?.data?.message || "Failed to load dashboard data"
      );
      toast.error("Failed to load dashboard data");
      setData(defaultData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle artwork submission
  const handleArtworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const artworkData = {
        title: artworkForm.title,
        description: artworkForm.description,
        price: artworkForm.price,
        category: artworkForm.category,
        stock: artworkForm.stock,
        images: artworkForm.images.map((img) => ({
          url: img.url,
          publicId: img.publicId,
          width: img.width,
          height: img.height,
        })),
      };
      // Add this before your axios call
      console.log(
        "Artwork data being sent:",
        JSON.stringify(
          {
            ...artworkForm,
            images: artworkForm.images.map((img) => ({
              url: img.url,
              publicId: img.publicId,
              width: img.width,
              height: img.height,
            })),
          },
          null,
          2
        )
      );
      if (editingArtwork) {
        await axios.put(
          `${import.meta.env.VITE_SERVER_URL}/api/artworks/${
            editingArtwork._id
          }`,
          artworkData,
          { withCredentials: true }
        );
        toast.success("Artwork updated successfully!");
      } else {
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/artworks`,
          artworkData,
          { withCredentials: true }
        );
        toast.success("Artwork created successfully!");
      }

      setEditingArtwork(null);
      setActiveTab("artworks");
      fetchDashboardData();
    } catch (error) {
      toast.error(`Failed to ${editingArtwork ? "update" : "create"} artwork`);
    }
  };

  // Handle course submission
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courseData = {
        title: courseForm.title,
        description: courseForm.description,
        price: courseForm.price,
        status: courseForm.status,
        thumbnail: courseForm.thumbnail
          ? {
              url: courseForm.thumbnail.url,
              publicId: courseForm.thumbnail.publicId,
              width: courseForm.thumbnail.width,
              height: courseForm.thumbnail.height,
            }
          : null,
        lessons: courseForm.lessons,
      };

      if (editingCourse) {
        await axios.put(
          `${import.meta.env.VITE_SERVER_URL}/api/courses/${editingCourse._id}`,
          courseData,
          { withCredentials: true }
        );
        toast.success("Course updated successfully!");
      } else {
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/courses`,
          courseData,
          { withCredentials: true }
        );
        toast.success("Course created successfully!");
      }

      setEditingCourse(null);
      setActiveTab("courses");
      fetchDashboardData();
    } catch (error) {
      toast.error(`Failed to ${editingCourse ? "update" : "create"} course`);
    }
  };

  // Handle commission actions
  const handleCommissionAction = async (
    commissionId: string,
    action: "accept" | "reject"
  ) => {
    try {
      await axios.patch(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/commissions/${commissionId}/${action}`,
        { status: action === "accept" ? "accepted" : "rejected" },
        { withCredentials: true }
      );
      toast.success(
        `Commission ${action === "accept" ? "accepted" : "rejected"}!`
      );
      fetchDashboardData();
    } catch (error) {
      toast.error(`Failed to ${action} commission`);
    }
  };

  // Handle delete artwork
  const handleDeleteArtwork = async (artworkId: string) => {
    if (window.confirm("Are you sure you want to delete this artwork?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_SERVER_URL}/api/artworks/${artworkId}`,
          {
            withCredentials: true,
          }
        );
        toast.success("Artwork deleted successfully!");
        fetchDashboardData();
      } catch (error) {
        toast.error("Failed to delete artwork");
      }
    }
  };

  // Handle delete course
  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_SERVER_URL}/api/courses/${courseId}`,
          {
            withCredentials: true,
          }
        );
        toast.success("Course deleted successfully!");
        fetchDashboardData();
      } catch (error) {
        toast.error("Failed to delete course");
      }
    }
  };

  // Handle course status change
  const handleCourseStatusChange = async (
    courseId: string,
    status: "draft" | "published" | "rejected"
  ) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_SERVER_URL}/api/courses/${courseId}/publish`,
        { status },
        { withCredentials: true }
      );
      toast.success(`Course status updated to ${status}`);
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to update course status");
    }
  };

  // Handle add lesson to course
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForLesson) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/courses/${
          selectedCourseForLesson._id
        }/lessons`,
        newLesson,
        { withCredentials: true }
      );
      toast.success("Lesson added successfully!");
      setShowAddLessonModal(false);
      setSelectedCourseForLesson(null);
      setNewLesson({
        title: "",
        youtubeUrl: "",
        duration: 0,
        resources: [],
      });
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to add lesson");
    }
  };

  // Handle add resource to lesson
  const handleAddResource = async (courseId: string, lessonId: string) => {
    if (!newResource.name || !newResource.url) {
      toast.error("Please fill all resource fields");
      return;
    }

    try {
      await axios.post(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/courses/${courseId}/lessons/${lessonId}/resources`,
        newResource,
        { withCredentials: true }
      );
      toast.success("Resource added successfully!");
      setNewResource({ name: "", url: "" });
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to add resource");
    }
  };

  // Handle delete lesson
  const handleDeleteLesson = async (courseId: string, lessonId: string) => {
    if (window.confirm("Are you sure you want to delete this lesson?")) {
      try {
        await axios.delete(
          `${
            import.meta.env.VITE_SERVER_URL
          }/api/courses/${courseId}/lessons/${lessonId}`,
          { withCredentials: true }
        );
        toast.success("Lesson deleted successfully!");
        fetchDashboardData();
      } catch (error) {
        toast.error("Failed to delete lesson");
      }
    }
  };

  // Handle delete resource
  const handleDeleteResource = async (
    courseId: string,
    lessonId: string,
    resourceId: string
  ) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await axios.delete(
          `${
            import.meta.env.VITE_SERVER_URL
          }/api/courses/${courseId}/lessons/${lessonId}/resources/${resourceId}`,
          { withCredentials: true }
        );
        toast.success("Resource deleted successfully!");
        fetchDashboardData();
      } catch (error) {
        toast.error("Failed to delete resource");
      }
    }
  };

  // Set up artwork edit form
  const setupArtworkEdit = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setArtworkForm({
      title: artwork.title,
      description: artwork.description,
      price: artwork.price,
      images: artwork.images,
      category: artwork.category,
      stock: artwork.stock,
    });
    setActiveTab("createArtwork");
  };

  // Set up course edit form
  const setupCourseEdit = (course: ICourse) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description,
      price: course.price,
      thumbnail: course.thumbnail || null,
      status: course.status,
      lessons: course.lessons.map((lesson) => ({
        title: lesson.title,
        youtubeUrl: lesson.youtubeUrl,
        duration: lesson.duration,
        resources: lesson.resources.map((resource) => ({
          name: resource.name,
          url: resource.url,
          _id: resource._id,
        })),
      })),
    });
    setActiveTab("createCourse");
  };

  // Toggle course expansion
  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  // Modal styles
  const customModalStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      maxWidth: "90%",
      width: "600px",
      borderRadius: "12px",
      padding: "0",
      border: "none",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
    },
  };

  // Safe data access
  const currentData = data || defaultData;
  const { sales, artworks, commissions, orders, courses, notifications } =
    currentData;

  // Chart data preparation
  const salesChartData = {
    labels: sales.monthlyEarnings.map((item) => item.month),
    datasets: [
      {
        label: "Monthly Earnings ($)",
        data: sales.monthlyEarnings.map((item) => item.amount),
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const artworkStatusData = {
    labels: artworks.byStatus.map((item) => item.status),
    datasets: [
      {
        label: "Artwork Status",
        data: artworks.byStatus.map((item) => item.count),
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(255, 99, 132, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const commissionStatusData = {
    labels: commissions.byStatus.map((item) => item.status.replace("_", " ")),
    datasets: [
      {
        label: "Commission Status",
        data: commissions.byStatus.map((item) => item.count),
        backgroundColor: [
          "rgba(255, 206, 86, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 99, 132, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        Error: {error}
        <button
          onClick={() => window.location.reload()}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Artist Dashboard</h1>

      {/* Navigation Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "dashboard" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          Overview
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "artworks" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("artworks")}
        >
          Artworks ({artworks.total})
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "commissions" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("commissions")}
        >
          Commissions ({commissions.total})
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "orders" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("orders")}
        >
          Orders ({orders?.total || 0})
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "courses" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("courses")}
        >
          Courses ({courses?.total || 0})
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "notifications" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("notifications")}
        >
          Notifications ({notifications.unread})
        </button>
      </div>

      {/* Dashboard Overview */}
      {activeTab === "dashboard" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
              <p className="text-2xl font-bold">
                ${sales.totalSales.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Artworks</h3>
              <p className="text-2xl font-bold">{artworks.total}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Courses</h3>
              <p className="text-2xl font-bold">{courses.total}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">
                Pending Commissions
              </h3>
              <p className="text-2xl font-bold">
                {commissions.byStatus.find((s) => s.status === "pending")
                  ?.count || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Recent Orders</h3>
              <p className="text-2xl font-bold">{orders.recent.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Monthly Earnings</h3>
              <div className="h-80">
                <Line
                  data={salesChartData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Artwork Status</h3>
              <div className="h-80">
                <Pie
                  data={artworkStatusData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Commission Status</h3>
              <div className="h-80">
                <Pie
                  data={commissionStatusData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Artworks Management */}
      {activeTab === "artworks" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Your Artworks ({artworks.total})
            </h2>
            <button
              onClick={() => {
                setEditingArtwork(null);
                setArtworkForm({
                  title: "",
                  description: "",
                  price: 0,
                  images: [],
                  category: "Painting",
                  stock: 1,
                });
                setActiveTab("createArtwork");
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + New Artwork
            </button>
          </div>

          {artworks.all.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artworks.all.map((artwork) => (
                <div
                  key={artwork._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="h-48 bg-gray-100 mb-4 flex items-center justify-center">
                    {artwork.images[0]?.url ? (
                      <img
                        src={artwork.images[0].url}
                        alt={artwork.title}
                        className="h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg">{artwork.title}</h3>
                  <p className="text-gray-600">${artwork.price}</p>
                  <span
                    className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                      artwork.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : artwork.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {artwork.status}
                  </span>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setupArtworkEdit(artwork)}
                      className="text-sm text-blue-500 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteArtwork(artwork._id)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No artworks found</p>
              <button
                onClick={() => {
                  setEditingArtwork(null);
                  setArtworkForm({
                    title: "",
                    description: "",
                    price: 0,
                    images: [],
                    category: "Painting",
                    stock: 1,
                  });
                  setActiveTab("createArtwork");
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create Your First Artwork
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Artwork Form */}
      {activeTab === "createArtwork" && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">
            {editingArtwork ? "Edit Artwork" : "Create New Artwork"}
          </h2>
          <form onSubmit={handleArtworkSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={artworkForm.title}
                onChange={(e) =>
                  setArtworkForm({ ...artworkForm, title: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                value={artworkForm.description}
                onChange={(e) =>
                  setArtworkForm({
                    ...artworkForm,
                    description: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Price ($)</label>
                <input
                  type="number"
                  value={artworkForm.price}
                  onChange={(e) =>
                    setArtworkForm({
                      ...artworkForm,
                      price: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border rounded"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Stock</label>
                <input
                  type="number"
                  value={artworkForm.stock}
                  onChange={(e) =>
                    setArtworkForm({
                      ...artworkForm,
                      stock: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border rounded"
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Category</label>
              <select
                value={artworkForm.category}
                onChange={(e) =>
                  setArtworkForm({ ...artworkForm, category: e.target.value })
                }
                className="w-full p-2 border rounded"
              >
                <option value="Painting">Painting</option>
                <option value="Sketch">Sketch</option>
                <option value="Digital">Digital</option>
                <option value="Sculpture">Sculpture</option>
                <option value="Photography">Photography</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Images</label>
              <input
                type="file"
                multiple
                onChange={handleArtworkImageUpload}
                className="w-full p-2 border rounded"
                accept="image/*"
                required={!editingArtwork && artworkForm.images.length === 0}
              />

              {artworkForm.images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {artworkForm.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Artwork preview ${index}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveArtworkImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("artworks")}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {editingArtwork ? "Update Artwork" : "Create Artwork"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Commissions Management */}
      {activeTab === "commissions" && (
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Commissions ({commissions.total})
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Commission Status</h3>
              <div className="h-80">
                <Pie
                  data={commissionStatusData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex space-x-4 mb-4">
                <button
                  className={`px-4 py-2 ${
                    activeCommissionTab === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setActiveCommissionTab("all")}
                >
                  All Commissions
                </button>
                <button
                  className={`px-4 py-2 ${
                    activeCommissionTab === "pending"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setActiveCommissionTab("pending")}
                >
                  Pending
                </button>
              </div>

              {activeCommissionTab === "all" ? (
                commissions.all.length > 0 ? (
                  <div className="space-y-4">
                    {commissions.all.map((commission) => (
                      <div
                        key={commission._id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold">{commission.title}</h4>
                            <p className="text-gray-600">
                              {commission.description}
                            </p>
                            <div className="mt-2">
                              <p className="text-sm">
                                <span className="font-medium">Status:</span>
                                <span
                                  className={`ml-1 px-2 py-1 text-xs rounded ${
                                    commission.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : commission.status === "accepted"
                                      ? "bg-blue-100 text-blue-800"
                                      : commission.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {commission.status.replace("_", " ")}
                                </span>
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Budget:</span> $
                                {commission.budget}
                              </p>
                              {commission.deadline && (
                                <p className="text-sm">
                                  <span className="font-medium">Deadline:</span>{" "}
                                  {new Date(
                                    commission.deadline
                                  ).toLocaleDateString()}
                                </p>
                              )}
                              <p className="text-sm">
                                <span className="font-medium">Client:</span>{" "}
                                {commission.buyerId?.name} (
                                {commission.buyerId?.email})
                              </p>
                            </div>
                          </div>
                          {commission.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleCommissionAction(
                                    commission._id,
                                    "accept"
                                  )
                                }
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleCommissionAction(
                                    commission._id,
                                    "reject"
                                  )
                                }
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No commissions found
                  </div>
                )
              ) : commissions?.pending?.length > 0 ? (
                <div className="space-y-4">
                  {commissions.pending.map((commission) => (
                    <div key={commission._id} className="border rounded-lg p-4">
                      <h4 className="font-bold">{commission.title}</h4>
                      <p className="text-gray-600">{commission.description}</p>
                      <div className="mt-2">
                        <p className="text-sm">
                          <span className="font-medium">Budget:</span> $
                          {commission.budget}
                        </p>
                        {commission.deadline && (
                          <p className="text-sm">
                            <span className="font-medium">Deadline:</span>{" "}
                            {new Date(commission.deadline).toLocaleDateString()}
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium">Client:</span>{" "}
                          {commission.buyerId?.name} (
                          {commission.buyerId?.email})
                        </p>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() =>
                            handleCommissionAction(commission._id, "accept")
                          }
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleCommissionAction(commission._id, "reject")
                          }
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No pending commissions
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders Management */}
      {activeTab === "orders" && (
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Recent Orders ({orders.total})
          </h2>

          {orders.recent.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.recent.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{order._id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium">{order.buyer.name}</p>
                          <p className="text-sm text-gray-500">
                            {order.buyer.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ul className="list-disc pl-5">
                          {order.items.map((item, i) => (
                            <li key={i} className="text-sm">
                              {item.title} (${item.price})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${order.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No recent orders</p>
            </div>
          )}
        </div>
      )}

      {/* Courses Management */}
      {activeTab === "courses" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Your Courses ({courses?.total || 0})
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setCourseForm({
                    title: "",
                    description: "",
                    price: 0,
                    thumbnail: null,
                    status: "draft",
                    lessons: [
                      { title: "", youtubeUrl: "", duration: 0, resources: [] },
                    ],
                  });
                  setActiveTab("createCourse");
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + New Course
              </button>
              <button
                onClick={() => setShowAddLessonModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                + Add Lesson
              </button>
            </div>
          </div>

          {(courses?.all?.length || 0) > 0 ? (
            <div className="space-y-6">
              {courses.all.map((course) => (
                <div
                  key={course._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        {course.thumbnail?.url && (
                          <img
                            src={course.thumbnail.url}
                            alt={course.title}
                            className="w-24 h-24 object-cover rounded"
                          />
                        )}
                        <div>
                          <h2 className="text-xl font-bold">{course.title}</h2>
                          <p className="text-gray-600 mt-1">${course.price}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                course.isApproved
                                  ? "bg-green-100 text-green-800"
                                  : course.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {course.isApproved
                                ? "Approved"
                                : course.status === "rejected"
                                ? "Rejected"
                                : course.status === "published"
                                ? "Pending Approval"
                                : "Draft"}
                            </span>
                            {course.rejectionReason && (
                              <span className="text-xs text-red-500">
                                {course.rejectionReason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setupCourseEdit(course)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                        {course.status === "draft" && (
                          <button
                            onClick={() =>
                              handleCourseStatusChange(course._id, "published")
                            }
                            className="text-green-500 hover:text-green-700"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-4 text-gray-600">{course.description}</p>

                    <div className="mt-4 flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <span>{course.students?.length || 0} students</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpenIcon className="h-4 w-4 mr-1" />
                        <span>{course.lessons?.length || 0} lessons</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCourseExpansion(course._id)}
                      className="mt-4 flex items-center text-blue-500 hover:text-blue-700"
                    >
                      {expandedCourse === course._id ? (
                        <>
                          <ChevronUpIcon className="h-4 w-4 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="h-4 w-4 mr-1" />
                          Show Details
                        </>
                      )}
                    </button>

                    {expandedCourse === course._id && (
                      <div className="mt-4 border-t pt-4">
                        <h3 className="font-semibold mb-2">Lessons</h3>
                        <div className="space-y-3">
                          {course.lessons?.map((lesson, index) => (
                            <div
                              key={lesson._id}
                              className="border rounded p-3"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">
                                    {index + 1}. {lesson.title}
                                  </h4>
                                  <div className="mt-1">
                                    <a
                                      href={lesson.youtubeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 text-sm hover:underline"
                                    >
                                      Watch on YouTube
                                    </a>
                                    <span className="text-sm text-gray-500 ml-2">
                                      ({Math.floor(lesson.duration / 60)}m{" "}
                                      {lesson.duration % 60}s)
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    handleDeleteLesson(course._id, lesson._id)
                                  }
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  Delete
                                </button>
                              </div>

                              {lesson.resources?.length > 0 && (
                                <div className="mt-2">
                                  <h5 className="text-sm font-medium">
                                    Resources:
                                  </h5>
                                  <ul className="space-y-1 mt-1">
                                    {lesson.resources.map((resource, i) => (
                                      <li
                                        key={i}
                                        className="flex items-center justify-between"
                                      >
                                        <div className="flex items-center">
                                          <PaperClipIcon className="h-3 w-3 mr-1" />
                                          <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 text-sm hover:underline"
                                          >
                                            {resource.name}
                                          </a>
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleDeleteResource(
                                              course._id,
                                              lesson._id,
                                              resource._id!
                                            )
                                          }
                                          className="text-red-500 hover:text-red-700 text-xs"
                                        >
                                          Delete
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="mt-3 border-t pt-3">
                                <h5 className="text-sm font-medium mb-2">
                                  Add Resource:
                                </h5>
                                <div className="grid grid-cols-5 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Resource name"
                                    value={newResource.name}
                                    onChange={(e) =>
                                      setNewResource({
                                        ...newResource,
                                        name: e.target.value,
                                      })
                                    }
                                    className="col-span-2 p-2 border rounded text-sm"
                                  />
                                  <input
                                    type="url"
                                    placeholder="Resource URL"
                                    value={newResource.url}
                                    onChange={(e) =>
                                      setNewResource({
                                        ...newResource,
                                        url: e.target.value,
                                      })
                                    }
                                    className="col-span-2 p-2 border rounded text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddResource(course._id, lesson._id)
                                    }
                                    className="bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <h3 className="font-semibold mt-6 mb-2">Students</h3>
                        {course.students?.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {course.students.map((student, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-3 p-2 border rounded"
                              >
                                {student.userId.profile?.avatar ? (
                                  <img
                                    src={student.userId.profile.avatar}
                                    alt={
                                      student.userId.profile.name || "Student"
                                    }
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">
                                    {student.userId.profile?.name ||
                                      student.userId.name ||
                                      "Anonymous"}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Enrolled on{" "}
                                    {new Date(
                                      student.enrolledAt
                                    ).toLocaleDateString()}
                                  </p>
                                  {student.progress && (
                                    <p className="text-sm text-gray-500">
                                      Progress: {student.progress}%
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">
                            No students enrolled yet
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No courses found</p>
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setCourseForm({
                    title: "",
                    description: "",
                    price: 0,
                    thumbnail: null,
                    status: "draft",
                    lessons: [
                      { title: "", youtubeUrl: "", duration: 0, resources: [] },
                    ],
                  });
                  setActiveTab("createCourse");
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create Your First Course
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Lesson Modal */}
      {showAddLessonModal && (
        <Modal
          isOpen={showAddLessonModal}
          onRequestClose={() => {
            setShowAddLessonModal(false);
            setSelectedCourseForLesson(null);
            setNewLesson({
              title: "",
              youtubeUrl: "",
              duration: 0,
              resources: [],
            });
          }}
          style={customModalStyles}
          contentLabel="Add Lesson Modal"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Add Lesson to {selectedCourseForLesson?.title || "Course"}
              </h2>
              <button
                onClick={() => {
                  setShowAddLessonModal(false);
                  setSelectedCourseForLesson(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {!selectedCourseForLesson ? (
              <div>
                <h3 className="font-medium mb-4">
                  Select a course to add lesson to:
                </h3>
                <div className="space-y-2">
                  {courses?.all?.map((course) => (
                    <div
                      key={course._id}
                      className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedCourseForLesson(course)}
                    >
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-gray-500">
                        {course.lessons?.length || 0} existing lessons
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddLesson}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-1">
                      Lesson Title
                    </label>
                    <input
                      type="text"
                      value={newLesson.title}
                      onChange={(e) =>
                        setNewLesson({ ...newLesson, title: e.target.value })
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={newLesson.youtubeUrl}
                      onChange={(e) =>
                        setNewLesson({
                          ...newLesson,
                          youtubeUrl: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={newLesson.duration}
                      onChange={(e) =>
                        setNewLesson({
                          ...newLesson,
                          duration: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 border rounded"
                      min="1"
                      required
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Add Lesson
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}

      {/* Create/Edit Course Form */}
      {activeTab === "createCourse" && (
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">
            {editingCourse ? "Edit Course" : "Create New Course"}
          </h2>
          <form onSubmit={handleCourseSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, title: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                    rows={5}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={courseForm.price}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border rounded"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Status</label>
                  <select
                    value={courseForm.status}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        status: e.target.value as
                          | "draft"
                          | "published"
                          | "rejected",
                      })
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Thumbnail</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="w-full p-2 border rounded"
                    required={!editingCourse}
                  />
                  {courseForm.thumbnail && (
                    <div className="mt-2 relative group">
                      <img
                        src={courseForm.thumbnail.url}
                        alt="Course thumbnail preview"
                        className="h-24 object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveThumbnail}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {editingCourse &&
                    !courseForm.thumbnail &&
                    editingCourse.thumbnail?.url && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Current thumbnail:
                        </p>
                        <img
                          src={editingCourse.thumbnail.url}
                          alt="Current course thumbnail"
                          className="h-24 object-contain"
                        />
                      </div>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Lessons</label>
                <div className="space-y-4">
                  {courseForm.lessons.map((lesson, index) => (
                    <div key={index} className="border rounded p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Lesson {index + 1}</h3>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newLessons = [...courseForm.lessons];
                              newLessons.splice(index, 1);
                              setCourseForm({
                                ...courseForm,
                                lessons: newLessons,
                              });
                            }}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => {
                              const newLessons = [...courseForm.lessons];
                              newLessons[index].title = e.target.value;
                              setCourseForm({
                                ...courseForm,
                                lessons: newLessons,
                              });
                            }}
                            className="w-full p-2 border rounded text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            YouTube URL
                          </label>
                          <input
                            type="url"
                            value={lesson.youtubeUrl}
                            onChange={(e) => {
                              const newLessons = [...courseForm.lessons];
                              newLessons[index].youtubeUrl = e.target.value;
                              setCourseForm({
                                ...courseForm,
                                lessons: newLessons,
                              });
                            }}
                            className="w-full p-2 border rounded text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Duration (seconds)
                          </label>
                          <input
                            type="number"
                            value={lesson.duration}
                            onChange={(e) => {
                              const newLessons = [...courseForm.lessons];
                              newLessons[index].duration = Number(
                                e.target.value
                              );
                              setCourseForm({
                                ...courseForm,
                                lessons: newLessons,
                              });
                            }}
                            className="w-full p-2 border rounded text-sm"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setCourseForm({
                        ...courseForm,
                        lessons: [
                          ...courseForm.lessons,
                          {
                            title: "",
                            youtubeUrl: "",
                            duration: 0,
                            resources: [],
                          },
                        ],
                      });
                    }}
                    className="w-full py-2 border border-dashed border-gray-300 rounded hover:bg-gray-50 text-sm"
                  >
                    + Add Lesson
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={() => setActiveTab("courses")}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {editingCourse ? "Update Course" : "Create Course"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Notifications ({notifications.unread} unread)
            </h2>
            <button
              onClick={async () => {
                try {
                  await axios.patch(
                    `${
                      import.meta.env.VITE_SERVER_URL
                    }/api/notifications/mark-all-read`,
                    {},
                    {
                      withCredentials: true,
                    }
                  );
                  toast.success("All notifications marked as read");
                  fetchDashboardData();
                } catch (error) {
                  toast.error("Failed to mark notifications as read");
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Mark All as Read
            </button>
          </div>

          {notifications?.all?.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {notifications.all.map((notification) => (
                  <li
                    key={notification._id}
                    className={`px-6 py-4 ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{notification.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            notification.type === "order"
                              ? "bg-green-100 text-green-800"
                              : notification.type === "commission"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {notification.type}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={async () => {
                              try {
                                await axios.patch(
                                  `${
                                    import.meta.env.VITE_SERVER_URL
                                  }/api/notifications/${notification._id}/read`,
                                  {},
                                  {
                                    withCredentials: true,
                                  }
                                );
                                fetchDashboardData();
                              } catch (error) {
                                toast.error(
                                  "Failed to mark notification as read"
                                );
                              }
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtistDashboard;
