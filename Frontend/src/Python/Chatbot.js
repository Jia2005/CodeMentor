import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; 
import image from './../Images/chatbot.png';
import userAvatar from './../Images/user.png';

function Chatbot({ setShowChatbot, chatSize, toggleChatSize, messages = [], onSendMessage }) {
  const [userInput, setUserInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const chatEndRef = useRef(null);
  const chatMessages = messages.length > 0 ? messages : [
    { role: 'assistant', content: 'Hello! I\'m Luna, your Python coding buddy. Ask me about the code, or for help converting other languages to Python.' }
  ];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    setAiThinking(true);
    try {
      if (typeof onSendMessage === 'function') {
        await onSendMessage(userInput);
      }
      setUserInput('');
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setAiThinking(false);
    }
  };

  const handleClose = () => {
    if (typeof setShowChatbot === 'function') {
      setShowChatbot(false);
    }
  };

  const chatSizeClasses = {
    normal: "w-full sm:w-[350px] h-[400px]",
    large: "w-full sm:w-[600px] h-[600px]"
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl flex flex-col ${chatSizeClasses[chatSize]} transition-all duration-300`}>
      <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center overflow-hidden">
            <img src={image} alt="Luna" className="w-full h-full object-cover"/>
          </div>
          <h3 className="font-medium">Luna - Python Assistant</h3>
        </div>
        <div className="flex space-x-2">
          <button onClick={toggleChatSize} className="p-1 hover:bg-indigo-500 rounded">
            {chatSize === 'large' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button onClick={handleClose} className="p-1 hover:bg-indigo-500 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className="chat-messages bg-gray-50 p-3 flex-grow overflow-auto">
        {chatMessages.map((msg, index) => (
          <div key={index} className={`mb-3 ${ msg.role === 'user' ? 'ml-auto max-w-[80%] flex flex-row-reverse' : 'max-w-[80%] flex' }`}>
            <div className="w-8 h-8 rounded-full flex-shrink-0 mx-2">
              {msg.role === 'user' ? (
                <img src={userAvatar} alt="User" className="w-full h-full rounded-full" />
              ) : (
                <img src={image} alt="Luna" className="w-full h-full rounded-full" />
              )}
            </div>
            <div className={`p-3 rounded-lg ${ msg.role === 'user' ? 'bg-indigo-100 text-right' : 'bg-white border border-gray-200' }`}>
              <div className="font-semibold mb-1 text-sm">
                {msg.role === 'user' ? 'You' : 'Luna'}
              </div>
              {/* === CHANGED SECTION START === */}
              <div className="whitespace-pre-wrap text-sm text-left break-words">
                <ReactMarkdown
                  children={msg.content}
                  components={{
                    // This custom component styles the code blocks (```code```)
                    pre: ({node, ...props}) => <pre className="bg-gray-800 p-2 rounded text-white my-2 overflow-x-auto" {...props} />
                  }}
                />
              </div>
              {/* === CHANGED SECTION END === */}
            </div>
          </div>
        ))}
        {aiThinking && (
          <div className="mb-3 flex max-w-[80%]">
            <div className="w-8 h-8 rounded-full flex-shrink-0 mx-2">
              <img src={image} alt="Luna" className="w-full h-full rounded-full" />
            </div>
            <div className="p-3 rounded-lg bg-white border border-gray-200">
              <div className="font-semibold mb-1 text-sm">Luna</div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse delay-200"></div>
                <span className="text-gray-500 text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="chat-input-area p-2 border-t">
        <div className="flex">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Luna about Python..."
            className="flex-grow border border-gray-300 rounded-l p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSendMessage}
            className="bg-indigo-600 text-white p-2 rounded-r hover:bg-indigo-700 flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;