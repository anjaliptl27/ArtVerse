import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios, { AxiosError } from "axios";

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

interface User {
  _id: string;
  profile: ArtistProfile;
  role: string;
  createdAt: string;
  commissionStats?: {
    total: number;
    completed: number;
    inProgress: number;
  };
  stripeAccountId?: string;
}

interface Commission {
  _id: string;
  title: string;
  buyerId: {
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

const ArtistProfile = () => {
  const [userData, setUserData] = useState<User | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar: "",
    skills: [] as string[],
    portfolio: [] as string[],
    socialMedia: [] as { platform: string; url: string }[],
    commissionRates: [] as {
      type: string;
      price: number;
      description?: string;
    }[],
  });
  const [newSkill, setNewSkill] = useState("");
  const [newLink, setNewLink] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cloudinaryWidget, setCloudinaryWidget] = useState<any>(null);
  const [newSocialMedia, setNewSocialMedia] = useState({
    platform: "",
    url: "",
  });
  const [newCommissionRate, setNewCommissionRate] = useState({
    type: "",
    price: 0,
    description: "",
  });
  const [activeTab, setActiveTab] = useState<"profile" | "commissions">("profile");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const api = axios.create({
          baseURL: import.meta.env.VITE_SERVER_URL,
          withCredentials: true,
        });

        const [profileRes, commissionsRes] = await Promise.all([
          api.get("/api/users/profile"),
          api.get("/api/commissions"),
        ]);
        
        setUserData(profileRes.data.data);
        setCommissions(commissionsRes.data.data || []);

        if (profileRes.data.data) {
          setFormData({
            name: profileRes.data.data.profile.name,
            bio: profileRes.data.data.profile.bio || "",
            avatar: profileRes.data.data.profile.avatar || "",
            skills: profileRes.data.data.profile.skills || [],
            portfolio: profileRes.data.data.profile.portfolio || [],
            socialMedia: profileRes.data.data.profile.socialMedia || [],
            commissionRates: profileRes.data.data.profile.commissionRates || [],
          });
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          navigate("/login");
          toast.error("Please login to view your profile");
        } else {
          toast.error("Failed to load profile data");
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
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout. Please try again.");
    }
  };

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleAddLink = () => {
    if (newLink.trim() && !formData.portfolio.includes(newLink.trim())) {
      setFormData((prev) => ({
        ...prev,
        portfolio: [...prev.portfolio, newLink.trim()],
      }));
      setNewLink("");
    }
  };

  const handleRemoveLink = (link: string) => {
    setFormData((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((l) => l !== link),
    }));
  };

  const handleAddSocialMedia = () => {
    if (newSocialMedia.platform.trim() && newSocialMedia.url.trim()) {
      setFormData((prev) => ({
        ...prev,
        socialMedia: [
          ...prev.socialMedia,
          {
            platform: newSocialMedia.platform.trim(),
            url: newSocialMedia.url.trim(),
          },
        ],
      }));
      setNewSocialMedia({ platform: "", url: "" });
    }
  };

  const handleRemoveSocialMedia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, i) => i !== index),
    }));
  };

  const handleAddCommissionRate = () => {
    if (newCommissionRate.type.trim() && newCommissionRate.price > 0) {
      setFormData((prev) => ({
        ...prev,
        commissionRates: [
          ...prev.commissionRates,
          {
            type: newCommissionRate.type.trim(),
            price: newCommissionRate.price,
            description: newCommissionRate.description.trim(),
          },
        ],
      }));
      setNewCommissionRate({ type: "", price: 0, description: "" });
    }
  };

  const handleRemoveCommissionRate = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      commissionRates: prev.commissionRates.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_SERVER_URL,
        withCredentials: true,
      });

      const response = await api.put("/api/users/profile", {
        profile: {
          name: formData.name,
          bio: formData.bio,
          avatar: formData.avatar,
          skills: formData.skills,
          portfolio: formData.portfolio,
          socialMedia: formData.socialMedia,
          commissionRates: formData.commissionRates,
        },
      });

      setUserData(response.data.data);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return statusMap[status.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        cropping: true,
        croppingAspectRatio: 1,
        croppingDefaultSelectionRatio: 1,
        showSkipCropButton: false,
        sources: ["local", "url"],
        multiple: false,
        clientAllowedFormats: ["jpg", "jpeg", "png"],
        maxImageFileSize: 5000000,
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          handleAvatarUpload(result.info.secure_url);
        }
      }
    );

    setCloudinaryWidget(widget);

    return () => {
      widget.destroy();
    };
  }, []);

  const handleAvatarUpload = async (avatarUrl: string) => {
    try {
      setUploadingAvatar(true);
      const api = axios.create({
        baseURL: import.meta.env.VITE_SERVER_URL,
        withCredentials: true,
      });

      const response = await api.put("/api/users/profile/picture", {
        avatar: avatarUrl,
      });

      setUserData((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                avatar: response.data.avatar,
              },
            }
          : null
      );

      setFormData((prev) => ({
        ...prev,
        avatar: response.data.avatar,
      }));

      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to update profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openAvatarUploader = () => {
    if (cloudinaryWidget) {
      cloudinaryWidget.open();
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation Tabs */}
      <div className="sm:hidden bg-white shadow">
        <nav className="flex">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-1/2 py-4 text-sm font-medium text-center border-b-2 ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            className={`w-1/2 py-4 text-sm font-medium text-center border-b-2 ${
              activeTab === "commissions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Commissions
          </button>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:space-x-8 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "commissions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Commissions
          </button>
        </div>

        {/* Profile Section */}
        <div className={`${activeTab !== "profile" ? "hidden sm:block" : ""}`}>
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-4 sm:px-6 py-5 sm:flex sm:items-center sm:justify-between border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Profile Information
              </h3>
              {!editing && (
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button
                    onClick={handleEditToggle}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  >
                    Edit Profile
                  </button>
                  {!userData?.stripeAccountId && (
                    <button
                      onClick={() => navigate("/connect-stripe")}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                    >
                      Connect Stripe
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-5">
              <div className="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-6">
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div className="relative">
                    {userData?.profile.avatar ? (
                      <>
                        <img
                          className="h-32 w-32 rounded-full object-cover cursor-pointer border-4 border-white shadow"
                          src={userData.profile.avatar}
                          alt="Profile"
                          onClick={openAvatarUploader}
                        />
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold cursor-pointer border-4 border-white shadow"
                        onClick={openAvatarUploader}
                      >
                        {userData?.profile.name.charAt(0)}
                      </div>
                    )}
                    {editing && (
                      <button
                        type="button"
                        onClick={openAvatarUploader}
                        className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 text-center"
                      >
                        Change Avatar
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  {editing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="bio"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      {/* Skills Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Skills
                        </label>
                        <div className="flex mt-1">
                          <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Add a skill"
                          />
                          <button
                            type="button"
                            onClick={handleAddSkill}
                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md hover:bg-gray-100"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.skills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
                                className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Portfolio Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Portfolio Links
                        </label>
                        <div className="flex mt-1">
                          <input
                            type="url"
                            value={newLink}
                            onChange={(e) => setNewLink(e.target.value)}
                            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Add a portfolio link"
                          />
                          <button
                            type="button"
                            onClick={handleAddLink}
                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md hover:bg-gray-100"
                          >
                            Add
                          </button>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {formData.portfolio.map((link) => (
                            <li key={link} className="flex items-center">
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm truncate"
                              >
                                {link}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleRemoveLink(link)}
                                className="ml-2 text-red-400 hover:text-red-600 focus:outline-none"
                              >
                                &times;
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Social Media Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Social Media
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          <input
                            type="text"
                            value={newSocialMedia.platform}
                            onChange={(e) =>
                              setNewSocialMedia((prev) => ({
                                ...prev,
                                platform: e.target.value,
                              }))
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Platform (e.g., Twitter)"
                          />
                          <div className="flex">
                            <input
                              type="url"
                              value={newSocialMedia.url}
                              onChange={(e) =>
                                setNewSocialMedia((prev) => ({
                                  ...prev,
                                  url: e.target.value,
                                }))
                              }
                              className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="URL"
                            />
                            <button
                              type="button"
                              onClick={handleAddSocialMedia}
                              className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md hover:bg-gray-100"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {formData.socialMedia.map((sm, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded"
                            >
                              <div className="truncate">
                                <span className="font-medium">
                                  {sm.platform}:{" "}
                                </span>
                                <a
                                  href={sm.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {sm.url}
                                </a>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveSocialMedia(index)}
                                className="ml-2 text-red-400 hover:text-red-600 focus:outline-none"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Commission Rates Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Commission Rates
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                          <input
                            type="text"
                            value={newCommissionRate.type}
                            onChange={(e) =>
                              setNewCommissionRate((prev) => ({
                                ...prev,
                                type: e.target.value,
                              }))
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Type (e.g., Portrait)"
                          />
                          <input
                            type="number"
                            value={newCommissionRate.price}
                            onChange={(e) =>
                              setNewCommissionRate((prev) => ({
                                ...prev,
                                price: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Price"
                            min="0"
                            step="0.01"
                          />
                          <div className="flex">
                            <input
                              type="text"
                              value={newCommissionRate.description}
                              onChange={(e) =>
                                setNewCommissionRate((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Description"
                            />
                            <button
                              type="button"
                              onClick={handleAddCommissionRate}
                              className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md hover:bg-gray-100"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {formData.commissionRates.map((rate, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded"
                            >
                              <div className="truncate">
                                <span className="font-medium">{rate.type}: </span>
                                <span>${rate.price.toFixed(2)}</span>
                                {rate.description && (
                                  <span> - {rate.description}</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCommissionRate(index)}
                                className="ml-2 text-red-400 hover:text-red-600 focus:outline-none"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={handleEditToggle}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          {userData?.profile.name}
                        </h1>
                        <p className="text-gray-600">{userData?.profile.email}</p>
                        {userData?.profile.bio && (
                          <p className="text-gray-600 mt-2">
                            {userData.profile.bio}
                          </p>
                        )}
                      </div>

                      {userData?.profile.skills &&
                        userData.profile.skills.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700">
                              Skills
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {userData.profile.skills.map((skill) => (
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

                      {userData?.profile.portfolio &&
                        userData.profile.portfolio.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700">
                              Portfolio
                            </h3>
                            <ul className="mt-1 space-y-1">
                              {userData.profile.portfolio.map((link) => (
                                <li key={link}>
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm break-all"
                                  >
                                    {link}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {userData?.profile.socialMedia &&
                        userData.profile.socialMedia.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700">
                              Social Media
                            </h3>
                            <ul className="mt-1 space-y-1">
                              {userData.profile.socialMedia.map((sm, index) => (
                                <li key={index}>
                                  <a
                                    href={sm.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm break-all"
                                  >
                                    {sm.platform}: {sm.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {userData?.profile.commissionRates &&
                        userData.profile.commissionRates.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-700">
                              Commission Rates
                            </h3>
                            <ul className="mt-1 space-y-1">
                              {userData.profile.commissionRates.map(
                                (rate, index) => (
                                  <li key={index} className="text-sm">
                                    <span className="font-medium">
                                      {rate.type}:{" "}
                                    </span>
                                    <span>${rate.price.toFixed(2)}</span>
                                    {rate.description && (
                                      <span> - {rate.description}</span>
                                    )}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      <p className="text-sm text-gray-500">
                        Member since {userData && formatDate(userData.createdAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {userData?.commissionStats && (
              <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0">
                  <div className="flex items-center">
                    <span className="text-gray-900 font-medium">
                      {userData.commissionStats.total}
                    </span>
                    <span className="ml-1 text-gray-600">Total Commissions</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-900 font-medium">
                      {userData.commissionStats.inProgress}
                    </span>
                    <span className="ml-1 text-gray-600">In Progress</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-900 font-medium">
                      {userData.commissionStats.completed}
                    </span>
                    <span className="ml-1 text-gray-600">Completed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Commissions Section */}
        <div className={`${activeTab !== "commissions" ? "hidden sm:block" : ""}`}>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 sm:px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Your Commissions
              </h2>
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
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No commissions yet
                </h3>
                <p className="mt-1 text-gray-500">
                  When buyers request your services, they'll appear here.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate("/explore")}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  >
                    Explore Marketplace
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {commissions.map((commission) => (
                  <div
                    key={commission._id}
                    className="px-4 sm:px-6 py-4 hover:bg-gray-50"
                  >
                    <div className="sm:flex sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
                            {commission.buyerId.profile.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-base font-medium text-gray-900 line-clamp-1">
                              {commission.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Buyer: {commission.buyerId.profile.name}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {commission.description}
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:ml-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
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
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                              commission.status
                            )}`}
                          >
                            {commission.status.charAt(0).toUpperCase() +
                              commission.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() =>
                          navigate(`/commissions/${commission._id}`)
                        }
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                      >
                        View Details
                      </button>
                      {commission.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              navigate(
                                `/commissions/${commission._id}/accepted`
                              )
                            }
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/commissions/${commission._id}/rejected`
                              )
                            }
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {commission.status === "accepted" && (
                        <button
                          onClick={() =>
                            navigate(
                              `/commissions/${commission._id}/completed`
                            )
                          }
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                          Mark Complete
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
    </div>
  );
};

export default ArtistProfile;