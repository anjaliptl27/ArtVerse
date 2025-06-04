import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import Modal from "react-modal";
import {
  FiX,
  FiUpload,
  FiTrash2,
  FiCalendar,
  FiImage,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

interface CommissionModalProps {
  artistId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CommissionFormData {
  title: string;
  description: string;
  deadline: string;
  budget: number;
  sizeRequirements?: string;
  stylePreferences?: string;
  referenceImages?: File[];
}

const CommissionModal: React.FC<CommissionModalProps> = ({
  artistId,
  isOpen,
  onClose,
}) => {
  const [commissionData, setCommissionData] = useState<CommissionFormData>({
    title: "",
    description: "",
    deadline: "",
    budget: 0,
    sizeRequirements: "",
    stylePreferences: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCommissionData((prev) => ({
      ...prev,
      [name]: name === "budget" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setCommissionData({
      title: "",
      description: "",
      deadline: "",
      budget: 0,
      sizeRequirements: "",
      stylePreferences: "",
    });
    setFiles([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submitCommission = async () => {
    if (!artistId) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Append required fields
      formData.append("title", commissionData.title);
      formData.append("description", commissionData.description);
      formData.append("deadline", commissionData.deadline);
      formData.append("budget", commissionData.budget.toString());

      // Append optional fields if they exist
      if (commissionData.sizeRequirements) {
        formData.append("sizeRequirements", commissionData.sizeRequirements);
      }

      if (commissionData.stylePreferences) {
        formData.append("stylePreferences", commissionData.stylePreferences);
      }

      // Append files
      files.forEach((file) => {
        formData.append("referenceImages", file);
      });

      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/commissions/${artistId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      toast.success("Commission request sent successfully!");
      handleClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        toast.error("Please login to request a commission");
        navigate("/login");
      } else {
        toast.error(
          axiosError.response?.status || "Failed to submit commission request"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const customModalStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      maxWidth: "90%",
      width: "500px",
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

  const isFormValid =
    commissionData.title &&
    commissionData.description &&
    commissionData.deadline &&
    commissionData.budget > 0;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Commission Request"
      style={customModalStyles}
      ariaHideApp={false}
    >
      <div className="modal-content bg-white rounded-lg p-6 max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Commission Request
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isSubmitting}
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title*
            </label>
            <input
              type="text"
              name="title"
              value={commissionData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              placeholder="e.g., Character Portrait"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              name="description"
              value={commissionData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              required
              placeholder="Describe what you want in detail..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline*
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="deadline"
                  value={commissionData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min={new Date().toISOString().split("T")[0]}
                  required
                  disabled={isSubmitting}
                />
                <FiCalendar className="absolute right-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget (₹)*
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="budget"
                  value={commissionData.budget || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  step="0.01"
                  required
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
                <FaRupeeSign className="absolute right-3 top-2.5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size Requirements
            </label>
            <input
              type="text"
              name="sizeRequirements"
              value={commissionData.sizeRequirements || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., 1920x1080 pixels, A4 size"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Style Preferences
            </label>
            <input
              type="text"
              name="stylePreferences"
              value={commissionData.stylePreferences || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Anime style, Dark theme, Watercolor"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Images (optional)
            </label>
            <label
              className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept="image/*"
                disabled={isSubmitting}
              />
            </label>

            {files.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Selected files:
                </p>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <div className="flex items-center">
                        <FiImage className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600 truncate max-w-xs">
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove file"
                        disabled={isSubmitting}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={submitCommission}
            disabled={!isFormValid || isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CommissionModal;
