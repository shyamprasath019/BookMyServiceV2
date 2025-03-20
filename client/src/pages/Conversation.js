// client/src/pages/Conversation.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useWebSocketContext } from '../utils/websocketService';
import api from '../utils/api';
import fileUploadService from '../utils/fileUploadService';

const ConversationHeader = ({ conversation, otherParticipant, isLoading }) => {
  const navigate = useNavigate();
  
  if (isLoading || !conversation) {
    return (
      <div className="bg-blue-500 text-white p-4 flex items-center">
        <div className="animate-pulse flex items-center">
          <div className="bg-blue-400 h-10 w-10 rounded-full mr-3"></div>
          <div className="h-4 bg-blue-400 rounded w-24"></div>
        </div>
      </div>
    );
  }
  
  const getConversationTypeWithIcon = () => {
    if (!conversation.order) {
      return {
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
        title: 'Direct Message'
      };
    }
    
    if (conversation.order.gig) {
      return {
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        title: 'Gig Order'
      };
    }
    
    if (conversation.order.job) {
      return {
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        title: 'Job Order'
      };
    }
    
    return {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      title: 'Order'
    };
  };
  
  const { icon, title } = getConversationTypeWithIcon();
  
  return (
    <div className="bg-blue-500 text-white p-4 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/messages')}
          className="mr-2 md:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="h-10 w-10 rounded-full bg-white text-blue-500 flex items-center justify-center font-bold mr-3 overflow-hidden">
          {otherParticipant?.profileImage ? (
            <img
              src={otherParticipant.profileImage}
              alt={otherParticipant.username}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            otherParticipant?.username.charAt(0).toUpperCase()
          )}
        </div>
        
        <div>
          <h3 className="font-bold">{otherParticipant?.username}</h3>
          
          <div className="flex items-center text-xs text-blue-100">
            {icon}
            <span>{title}</span>
            
            {conversation.order && (
              <span className="ml-1">: {conversation.order.title}</span>
            )}
          </div>
        </div>
      </div>
      
      {conversation.order && (
        <Link
          to={`/orders/${conversation.order._id}`}
          className="bg-white text-blue-500 px-3 py-1 rounded text-sm hover:bg-blue-50 transition-colors"
        >
          View Order
        </Link>
      )}
    </div>
  );
};

const Message = ({ message, isCurrentUser, showDate, previousMessage }) => {
  // Determine if we should show sender name (when first message or different sender than previous)
  const showSenderName = !previousMessage || previousMessage.sender._id !== message.sender._id;
  
  // Format date/time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString([], { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Determine message alignment and styling based on sender
  const messageAlignment = isCurrentUser ? 'justify-end' : 'justify-start';
  const messageBubbleStyle = isCurrentUser 
    ? 'bg-blue-500 text-white rounded-tr-none' 
    : 'bg-white text-gray-800 rounded-tl-none border border-gray-200';
  
  // Helper to render file attachments
  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {attachments.map((attachment, idx) => {
          const fileName = attachment.split('/').pop();
          const fileExtension = fileName.split('.').pop().toLowerCase();
          
          // Determine if attachment is an image
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
          
          if (isImage) {
            return (
              <div key={idx} className="rounded overflow-hidden">
                <img 
                  src={attachment} 
                  alt={`Attachment ${idx + 1}`} 
                  className="max-w-full max-h-60 object-contain"
                />
                <div className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'} mt-1`}>
                  {fileName}
                </div>
              </div>
            );
          }
          
          // File type icon based on extension
          const getFileIcon = () => {
            // Document files
            if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(fileExtension)) {
              return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              );
            }
            
            // Spreadsheets
            if (['xls', 'xlsx', 'csv'].includes(fileExtension)) {
              return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              );
            }
            
            // Code files
            if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp'].includes(fileExtension)) {
              return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              );
            }
            
            // Archives
            if (['zip', 'rar', 'tar', 'gz', '7z'].includes(fileExtension)) {
              return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              );
            }
            
            // Default file icon
            return (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l