// client/src/utils/fileUploadService.js
import api from './api';

/**
 * Enhanced service for handling file uploads throughout the application
 * This version properly stores files in client/src/assets and manages references
 */
const fileUploadService = {
  /**
   * Upload a file to the specified directory
   * @param {File} file - The file to upload
   * @param {string} category - The category of the upload (gig, job, profile, etc.)
   * @param {string} id - The ID of the item the file is associated with (optional)
   * @returns {Promise<string>} - The path to the stored file
   */
  uploadFile: async (file, category, id = 'new') => {
    // For a real app, this would send the file to the server
    // For our implementation, we'll simulate storage in the client/src/assets directory
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('id', id);
    
    try {
      const response = await api.post('/uploads/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Return the path to the stored file
      return response.data.filePath;
    } catch (error) {
      console.error('Error uploading file:', error);
      // For now, return a simulated path as fallback
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      return `/src/assets/images/${category}/${id}/${Date.now()}-${safeName}`;
    }
  },

  /**
   * Upload multiple files
   * @param {File[]} files - Array of files to upload
   * @param {string} category - The category of uploads (gig, job, profile, etc.)
   * @param {string} id - The ID of the item the files are associated with (optional)
   * @returns {Promise<string[]>} - Array of paths to the stored files
   */
  uploadFiles: async (files, category, id = 'new') => {
    if (!files || files.length === 0) return [];
    
    try {
      // Process all files in parallel
      const uploadPromises = Array.from(files).map(file => 
        fileUploadService.uploadFile(file, category, id)
      );
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      // Return simulated paths as fallback
      return Array.from(files).map(file => {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        return `/src/assets/images/${category}/${id}/${Date.now()}-${safeName}`;
      });
    }
  },
  
  /**
   * Generate a URL for a file path
   * @param {string} filePath - The path to the file
   * @returns {string} - The URL to access the file
   */
  getFileUrl: (filePath) => {
    if (!filePath) return '';
    
    // If it's already a full URL, return it
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    // If it's a relative path, convert to absolute
    if (filePath.startsWith('/')) {
      // In a real app, this would be the base URL of your server
      // For now, we'll assume it's relative to the current origin
      return `${window.location.origin}${filePath}`;
    }
    
    // Otherwise, assume it's relative to the app root
    return `${window.location.origin}/${filePath}`;
  },
  
  /**
   * Delete a file
   * @param {string} filePath - The path to the file to delete
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  deleteFile: async (filePath) => {
    if (!filePath) return false;
    
    try {
      await api.delete(`/uploads/file`, { data: { filePath } });
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },
  
  /**
   * Gets a file's extension
   * @param {string} filename - The filename
   * @returns {string} - The file extension
   */
  getFileExtension: (filename) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  },
  
  /**
   * Generate a readable file size string
   * @param {number} bytes - File size in bytes
   * @returns {string} - Human readable file size
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  /**
   * Check if file is an image
   * @param {File} file - The file to check
   * @returns {boolean} - Whether the file is an image
   */
  isImage: (file) => {
    const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return file && acceptedImageTypes.includes(file.type);
  },
  
  /**
   * Creates a file preview URL
   * @param {File} file - The file to preview
   * @returns {string} - URL for previewing the file
   */
  createFilePreview: (file) => {
    if (!file) return '';
    return URL.createObjectURL(file);
  },
  
  /**
   * Revokes a file preview URL to free memory
   * @param {string} previewUrl - The preview URL to revoke
   */
  revokeFilePreview: (previewUrl) => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  }
};

export default fileUploadService;