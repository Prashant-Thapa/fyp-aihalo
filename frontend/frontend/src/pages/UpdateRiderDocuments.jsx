import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileText, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { uploadPhoto } from "../api/upload.api";
import { updateRiderDocuments, getRiderProfile } from "../api/rider.api";
import { toast, ToastContainer } from "react-toastify";

const UpdateRiderDocuments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [riderProfile, setRiderProfile] = useState(null);
  
  const [formData, setFormData] = useState({
    profilePhoto: null,
    licenseFrontPhoto: null,
    licenseBackPhoto: null,
  });

  const [uploadedPhotos, setUploadedPhotos] = useState({
    profilePhoto: null,
    licenseFrontPhoto: null,
    licenseBackPhoto: null,
  });

  const photoLabels = {
    profilePhoto: "Profile Photo",
    licenseFrontPhoto: "License (Front)",
    licenseBackPhoto: "License (Back)",
  };

  useEffect(() => {
    fetchRiderProfile();
  }, []);

  const fetchRiderProfile = async () => {
    try {
      setFetchingProfile(true);
      const response = await getRiderProfile();
      setRiderProfile(response.data);
    } catch (err) {
      toast.error("Failed to fetch your profile");
      navigate("/login");
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleFileChange = async (e, photoType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    try {
      setLoading(true);
      const response = await uploadPhoto(file);
      
      if (response.success) {
        setUploadedPhotos((prev) => ({
          ...prev,
          [photoType]: response.data.url,
        }));
        toast.success(`${photoLabels[photoType]} uploaded successfully!`);
      }
    } catch (err) {
      toast.error(`Failed to upload ${photoLabels[photoType]}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // At least one photo must be updated
      if (!uploadedPhotos.profilePhoto && !uploadedPhotos.licenseFrontPhoto && !uploadedPhotos.licenseBackPhoto) {
        toast.error("Please upload at least one updated document");
        setLoading(false);
        return;
      }

      const response = await updateRiderDocuments(
        riderProfile.id,
        uploadedPhotos.profilePhoto || riderProfile.profilePhoto,
        uploadedPhotos.licenseFrontPhoto || riderProfile.licenseFrontPhoto,
        uploadedPhotos.licenseBackPhoto || riderProfile.licenseBackPhoto
      );

      if (response.success) {
        toast.success("✅ Documents updated successfully! Your application is now pending review.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update documents");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4E3C]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Update Your Documents</h1>
          <p className="text-gray-600 mt-2">
            Upload new/improved photos based on the feedback you received
          </p>
        </div>

        {/* Rejection Info Card */}
        {riderProfile?.rejectionReason && (
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Reason for Previous Rejection:</h3>
                <p className="text-blue-800 mt-2">{riderProfile.rejectionReason}</p>
                <p className="text-sm text-blue-700 mt-3">
                  Please address these issues in your updated documents. Your new application will be reviewed shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Update Your Documents</h2>

          <div className="space-y-6">
            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Profile Photo (Passport Size)
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, "profilePhoto")}
                  accept="image/*"
                  className="hidden"
                  id="profilePhoto"
                  disabled={loading}
                />
                <label
                  htmlFor="profilePhoto"
                  className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploadedPhotos.profilePhoto ? "✅ Photo updated" : "Click to upload or drag and drop"}
                  </p>
                </label>
              </div>
            </div>

            {/* License Front Photo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                License (Front Side)
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, "licenseFrontPhoto")}
                  accept="image/*"
                  className="hidden"
                  id="licenseFrontPhoto"
                  disabled={loading}
                />
                <label
                  htmlFor="licenseFrontPhoto"
                  className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploadedPhotos.licenseFrontPhoto ? "✅ Photo updated" : "Click to upload or drag and drop"}
                  </p>
                </label>
              </div>
            </div>

            {/* License Back Photo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                License (Back Side)
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, "licenseBackPhoto")}
                  accept="image/*"
                  className="hidden"
                  id="licenseBackPhoto"
                  disabled={loading}
                />
                <label
                  htmlFor="licenseBackPhoto"
                  className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploadedPhotos.licenseBackPhoto ? "✅ Photo updated" : "Click to upload or drag and drop"}
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 Tip:</strong> Make sure your photos are clear, well-lit, and show all details clearly. This will help us approve your application faster.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (!uploadedPhotos.profilePhoto && !uploadedPhotos.licenseFrontPhoto && !uploadedPhotos.licenseBackPhoto)}
            className="w-full mt-8 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Submit Updated Documents
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Your application will be reviewed again after submission
          </p>
        </form>
      </div>
    </div>
  );
};

export default UpdateRiderDocuments;
