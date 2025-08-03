import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronsUpDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import image from './../Images/chatbot.png';
import userAvatar from './../Images/user.png';

function Chatbot({ setShowChatbot, chatSize, toggleChatSize, messages = [], onSendMessage, onToggleExpand }) {
  const [userInput, setUserInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    setAiThinking(true);
    await onSendMessage(userInput);
    setUserInput('');
    setAiThinking(false);
  };

  const chatSizeClasses = {
    normal: "w-full sm:w-[350px] h-[400px]",
    large: "w-full sm:w-[600px] h-[600px]"
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl flex flex-col ${chatSizeClasses[chatSize]} transition-all duration-300`}>
      <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex justify-between items-center cursor-pointer" onDoubleClick={toggleChatSize}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center overflow-hidden">
            <img src={image} alt="Luna" className="w-full h-full object-cover" />
          </div>
          <h3 className="font-medium">Luna - Python Assistant</h3>
        </div>
        <div className="flex space-x-2">
          <button onClick={toggleChatSize} className="p-1 hover:bg-indigo-500 rounded"><ChevronsUpDown size={18} /></button>
          <button onClick={() => setShowChatbot(false)} className="p-1 hover:bg-indigo-500 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className="chat-messages bg-gray-50 p-3 flex-grow overflow-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-3 w-full flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <img src={msg.role === 'user' ? userAvatar : image} alt={msg.role} className="w-8 h-8 rounded-full flex-shrink-0 mx-2" />
              <div className={`p-3 rounded-lg overflow-hidden ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-white border border-gray-200'}`}>
                <div className={`font-semibold mb-1 text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'user' ? 'You' : 'Luna'}
                </div>
                <div className="whitespace-pre-wrap text-sm text-left break-words">
                  <ReactMarkdown components={{ pre: (props) => <pre className="bg-gray-800 p-2 my-2 rounded text-white overflow-x-auto" {...props} /> }}>
                    {msg.shortContent}
                  </ReactMarkdown>
                  {msg.isExpanded && msg.expandedContent && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <ReactMarkdown components={{ pre: (props) => <pre className="bg-gray-800 p-2 my-2 rounded text-white overflow-x-auto" {...props} /> }}>
                        {msg.expandedContent}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                {msg.expandedContent && !msg.isExpanded && (
                  <button
                    onClick={() => onToggleExpand(index)}
                    className="mt-2 text-sm text-indigo-600 font-semibold hover:text-indigo-800"
                  >
                    Learn More
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {aiThinking && (
          <div className="mb-3 flex max-w-[80%]">
            <div className="w-8 h-8 rounded-full flex-shrink-0 mx-2"><img src={image} alt="Luna" className="w-full h-full rounded-full" /></div>
            <div className="p-3 rounded-lg bg-white border border-gray-200">
              <div className="font-semibold mb-1 text-sm">Luna</div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse [animation-delay:0.4s]"></div>
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
            disabled={aiThinking}
          />
          <button onClick={handleSendMessage} className="bg-indigo-600 text-white p-2 rounded-r hover:bg-indigo-700 flex items-center justify-center" disabled={aiThinking}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;