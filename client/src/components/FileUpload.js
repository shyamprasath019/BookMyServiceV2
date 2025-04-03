// client/src/components/FileUpload.js
import React, { useState, useRef, useEffect } from 'react';
import fileUploadService from '../utils/fileUploadService';

const FileUpload = ({ 
  files, 
  onChange, 
  category, 
  id = 'new',
  multiple = true,
  maxFiles = 5,
  acceptedTypes = "image/*",
  showPreview = true
}) => {
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Generate previews when files change
  useEffect(() => {
    // Clean up old previews
    previews.forEach(preview => {
      if (preview.url && preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    });

    // Create new previews
    const newPreviews = Array.from(files || []).map(file => {
      if (typeof file === 'string') {
        // It's a file path, not a File object
        return {
          name: file.split('/').pop(),
          url: file,
          size: 0,
          isUrl: true
        };
      } else {
        // It's a File object
        return {
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          isUrl: false
        };
      }
    });

    setPreviews(newPreviews);

    // Cleanup function
    return () => {
      newPreviews.forEach(preview => {
        if (!preview.isUrl && preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [files]);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    // Check for maximum files
    const totalFiles = (files || []).length + selectedFiles.length;
    if (totalFiles > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} files`);
      return;
    }

    // Reset error state
    setError('');
    
    if (onChange) {
      // For simple file handling, just pass the file objects
      const currentFiles = Array.isArray(files) ? [...files] : [];
      onChange([...currentFiles, ...selectedFiles]);
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index) => {
    if (!files) return;
    
    const newFiles = [...files];
    newFiles.splice(index, 1);
    
    if (onChange) {
      onChange(newFiles);
    }
  };

  const isImageFile = (file) => {
    if (typeof file === 'string') {
      // Check extension for URLs
      const ext = file.split('.').pop().toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    } else {
      // Check mime type for File objects
      return file.type.startsWith('image/');
    }
  };

  const formatFileSize = (bytes) => {
    return fileUploadService.formatFileSize(bytes);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label 
          htmlFor="file-upload" 
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {multiple ? `Upload up to ${maxFiles} files` : 'Upload one file'}
            </p>
          </div>
          <input 
            id="file-upload" 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            multiple={multiple}
            accept={acceptedTypes}
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <p className="text-xs text-center mt-1 text-gray-500">
            Uploading: {uploadProgress}%
          </p>
        </div>
      )}

      {showPreview && previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative bg-gray-100 p-2 rounded-lg">
              {isImageFile(preview.isUrl ? preview.url : { type: 'image' }) ? (
                <div className="aspect-square overflow-hidden rounded-lg mb-2">
                  <img
                    src={preview.url}
                    alt={`Preview ${index}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center bg-gray-200 rounded-lg mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="truncate text-sm pr-2" title={preview.name}>
                  {preview.name}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              {!preview.isUrl && (
                <div className="text-xs text-gray-500">
                  {formatFileSize(preview.size)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;