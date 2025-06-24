
import React, { useEffect } from 'react';

const ChatSupport: React.FC = () => {
  useEffect(() => {
    // Add message handler for Coachvox chat
    const handleMessage = (event: MessageEvent) => {
      try {
        if (JSON.parse(event.data) === 'openChat') {
          const chatElement = document.getElementById('smallChatCoachvox');
          const containerElement = chatElement?.parentElement;
          if (chatElement) {
            chatElement.setAttribute("style", "height:550px;width:300px;position:fixed;bottom:10px;right:10px;z-index:2147483647;border:none;");
          }
          if (containerElement) {
            containerElement.setAttribute("style", "position:fixed;z-index:2147483647;bottom:10px;right:10px;min-width:300px;min-height:550px;overflow:visible;pointer-events:auto;");
          }
        }
        if (JSON.parse(event.data) === 'closeChat') {
          const chatElement = document.getElementById('smallChatCoachvox');
          const containerElement = chatElement?.parentElement;
          if (chatElement) {
            chatElement.setAttribute("style", "height:130px;width:130px;position:fixed;bottom:10px;right:10px;z-index:2147483647;border:none;");
          }
          if (containerElement) {
            containerElement.setAttribute("style", "position:fixed;z-index:2147483647;bottom:10px;right:10px;min-width:130px;min-height:130px;overflow:visible;pointer-events:auto;");
          }
        }
      } catch (e) {
        console.log(JSON.stringify(e));
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      zIndex: 2147483647,
      bottom: '10px',
      right: '10px',
      minWidth: '130px',
      minHeight: '130px',
      overflow: 'visible',
      pointerEvents: 'auto'
    }}>
      <iframe 
        src="https://app.coachvox.ai/avatar/qwxnsubYKJUqDp9cK7hS/embed/small" 
        allowFullScreen 
        allow="microphone;"
        frameBorder="0" 
        id="smallChatCoachvox" 
        style={{
          position: 'fixed',
          height: '130px',
          bottom: '10px',
          right: '10px',
          width: '130px',
          zIndex: 2147483647,
          border: 'none'
        }}
        title="Coach Fox AI Assistant"
      />
        </div>
  );
};

export default ChatSupport;
