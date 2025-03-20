// client/src/utils/fileUploadService.js
import api from './api';

/**
 * Service for handling file uploads throughout the application
 */
const fileUploadService = {
  /**
   * Upload a profile image
   * @param {File} file - The image file to upload
   * @returns {Promise<string>} - URL of the uploaded image
   */
  uploadProfileImage: async (file) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    const response = await api.post('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.profileImage;
  },
  
  /**
   * Upload gig images
   * @param {Array<File>} files - Array of image files to upload
   * @returns {Promise<Array<string>>} - Array of URLs for the uploaded images
   */
  uploadGigImages: async (files) => {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('gigImages', file);
    });
    
    const response = await api.post('/gigs/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.imageUrls;
  },
  
  /**
   * Upload job attachments
   * @param {Array<File>} files - Array of files to upload
   * @returns {Promise<Array<string>>} - Array of URLs for the uploaded files
   */
  uploadJobAttachments: async (files) => {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('jobAttachments', file);
    });
    
    const response = await api.post('/jobs/upload-attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.attachmentUrls;
  },
  
  /**
   * Upload message attachments
   * @param {Array<File>} files - Array of files to upload
   * @returns {Promise<Array<string>>} - Array of URLs for the uploaded files
   */
  uploadMessageAttachments: async (files) => {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('messageAttachments', file);
    });
    
    const response = await api.post('/messages/upload-attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.attachmentUrls;
  },
  
  /**
   * Upload order delivery attachments
   * @param {Array<File>} files - Array of files to upload
   * @returns {Promise<Array<string>>} - Array of URLs for the uploaded files
   */
  uploadDeliveryAttachments: async (files) => {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('deliveryAttachments', file);
    });
    
    const response = await api.post('/orders/upload-delivery', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.deliveryUrls;
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
    return acceptedImageTypes.includes(file.type);
  }
};

export default fileUploadService;