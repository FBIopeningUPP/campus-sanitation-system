import { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';

export default function PhotoUpload({ onPhotoSelect, currentPhoto }) {
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onPhotoSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onPhotoSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayPhoto = preview || currentPhoto;

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
      
      {displayPhoto ? (
        <div className="relative inline-block">
          <img
            src={displayPhoto}
            alt="Preview"
            className="w-full max-w-xs h-48 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-xs h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors"
        >
          <Camera className="w-8 h-8" />
          <span className="text-sm">Add Photo (Optional)</span>
          <span className="text-xs text-gray-400">Max 5MB, JPG/PNG</span>
        </button>
      )}
    </div>
  );
}
