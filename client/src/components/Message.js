// client/src/components/Message.js
import React from 'react';

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
          
          // Default file icon
          return (
            <div key={idx} className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <a 
                href={attachment} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`text-sm ${isCurrentUser ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'} underline`}
                download
              >
                {fileName}
              </a>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="mb-4">
      {/* Date separator */}
      {showDate && (
        <div className="flex justify-center my-4">
          <div className="bg-gray-200 text-gray-600 text-xs rounded-full px-3 py-1">
            {formatDate(message.createdAt)}
          </div>
        </div>
      )}
      
      <div className={`flex ${messageAlignment}`}>
        <div className="max-w-[80%]">
          {/* Sender name (only show for other person's messages) */}
          {!isCurrentUser && showSenderName && (
            <div className="ml-2 mb-1 text-xs text-gray-500">
              {message.sender.username}
            </div>
          )}
          
          {/* Message bubble */}
          <div className={`px-4 py-2 rounded-lg ${messageBubbleStyle}`}>
            {message.content && (
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            )}
            
            {/* Attachments */}
            {renderAttachments(message.attachments)}
          </div>
          
          {/* Message time */}
          <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right mr-2' : 'ml-2'}`}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;