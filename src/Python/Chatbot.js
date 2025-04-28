import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, Send } from 'lucide-react';

function Chatbot({ onClose, model, code }) {
  const [chatSize, setChatSize] = useState('normal'); 
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', content: 'Hello! I can help you with Python programming. Ask me about the code, or for help converting other languages to Python.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const newMessage = { role: 'user', content: userInput };
    setChatMessages(prevMessages => [...prevMessages, newMessage]);
    setUserInput('');
    setAiThinking(true);
    
    try {
      let prompt = userInput;
      
      if (userInput.toLowerCase().includes('convert') || 
          userInput.toLowerCase().includes('translate')) {
        prompt = `Act as a Python expert. Convert the code in my query to proper Python code. 
                 Show just the converted code with minimal explanation.
                 
                 ${userInput}`;
      } 
      else if (userInput.toLowerCase().includes('explain') && 
               (userInput.toLowerCase().includes('code') || userInput.toLowerCase().includes('this'))) {
        prompt = `Explain this Python code in clear, simple terms:
                 
                 ${code}
                 
                 ${userInput}`;
      }
      else if (userInput.toLowerCase().includes('debug') || 
               userInput.toLowerCase().includes('fix') || 
               userInput.toLowerCase().includes('error')) {
        prompt = `Debug this Python code and suggest fixes:
                 
                 ${code}
                 
                 ${userInput}`;
      }
      else {
        prompt = `As a Python teaching assistant, respond to this question: ${userInput}`;
      }
      
      // Use the model prop to send the message
      const result = await model.sendMessage(prompt);
      const responseText = result.response.text();
      
      setChatMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: responseText }
      ]);
    } catch (error) {
      let errorMessage = "Sorry, I encountered an error processing your request.";
      if (error.message?.includes("API key")) {
        errorMessage += " There seems to be an issue with the API key.";
      } else if (error.message?.includes("quota")) {
        errorMessage += " You may have exceeded your API quota.";
      }
      console.error("Error with AI response:", error);
      setChatMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: errorMessage }
      ]);
    } finally {
      setAiThinking(false);
    }
  };

  const toggleChatSize = () => {
    setChatSize(chatSize === 'normal' ? 'large' : 'normal');
  };

  const chatSizeClasses = {
    normal: "w-full sm:w-[350px] h-[400px]",
    large: "w-full sm:w-[600px] h-[600px]"
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl flex flex-col ${chatSizeClasses[chatSize]} transition-all duration-300`}>
      <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center">
            <img 
              src="/api/placeholder/32/32" 
              alt="AI Assistant" 
              className="rounded-full"
            />
          </div>
          <h3 className="font-medium">Python Assistant</h3>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={toggleChatSize}
            className="p-1 hover:bg-indigo-500 rounded"
          >
            {chatSize === 'large' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-indigo-500 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="chat-messages bg-gray-50 p-3 flex-grow overflow-auto">
        {chatMessages.map((msg, index) => (
          <div 
            key={index} 
            className={`mb-3 p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-indigo-100 ml-auto max-w-[80%] text-right' 
                : msg.role === 'system'
                  ? 'bg-gray-100 border border-gray-200 max-w-[90%]'
                  : 'bg-white border border-gray-200 max-w-[80%]'
            }`}
          >
            <div className="font-semibold mb-1 text-sm">
              {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'Assistant'}
            </div>
            <div className="whitespace-pre-wrap text-sm text-left">
              {msg.content.includes('```') 
                ? msg.content.split('```').map((part, i) => 
                    i % 2 === 1 
                      ? <pre key={i} className="bg-gray-800 p-2 rounded text-white text-sm my-2 overflow-x-auto">{part.replace(/^python\n/, '')}</pre> 
                      : <span key={i}>{part}</span>
                  )
                : msg.content
              }
            </div>
          </div>
        ))}
        {aiThinking && (
          <div className="mb-3 p-3 rounded-lg bg-white border border-gray-200 max-w-[80%]">
            <div className="font-semibold mb-1 text-sm">Assistant</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse delay-200"></div>
              <span className="text-gray-500 text-sm">Thinking...</span>
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
            placeholder="Ask about Python..."
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