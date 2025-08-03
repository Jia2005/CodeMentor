import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import CodeEditor from './CodeEditor';
import Header from './Header';
import OutputViewer from './OutputViewer';
import LineExplanationViewer from './LineExplanationViewer';
import CodeVisualizer from './CodeVisualizer';
import Chatbot from './Chatbot';
import { GoogleGenerativeAI } from "@google/generative-ai";

function PythonComplier() {
  const [code, setCode] = useState('# Example with user input\nname = input("Enter your name: ")\nprint(f"Hello, {name}!")');
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState(null);
  const [viewMode, setViewMode] = useState('output');
  const [explanationData, setExplanationData] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatSize, setChatSize] = useState('normal');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m Luna, your Python coding buddy. Ask me about the code in the editor, or for help with any Python topic.' }
  ]);

  const executeCode = async () => {
    setIsExecuting(true);
    setErrors(null);
    setOutput('');
    setExplanationData([]);

    try {
      const response = await fetch('http://localhost:3001/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, userInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setOutput(result.output);
      if (result.error) {
        setErrors({
          message: result.error,
          suggestions: await getAISuggestions({ message: result.error }, code)
        });
      } else {
        await generateAIExplanations(code);
      }
    } catch (error) {
      console.error("Failed to execute code:", error);
      setErrors({
        message: 'Could not connect to the execution server. Please ensure the backend is running correctly.',
        suggestions: 'Stop the backend server (Ctrl+C) and restart it with `node server.js`.'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getAISuggestions = async (error, code) => {
    try {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) {
        return "Check your code syntax and logic. API key error prevented detailed suggestions.";
      }
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `I have a Python code that generated this error: "${error.message}"\nHere's the code:\n${code}\nProvide a brief, helpful suggestion to fix this error.`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (aiError) {
      console.error("Error getting AI suggestions:", aiError);
      return "Check your code syntax and logic.";
    }
  };

  const generateAIExplanations = async (code) => {
    const lines = code.split('\n');
    const basicExplanations = lines.map((line) => {
      if (line.trim() === '') return { line, skip: true };
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('def ')) return { line, explanation: "Defines a function", details: "Creating a reusable block of code.", color: "text-blue-600" };
      if (trimmedLine.startsWith('import ')) return { line, explanation: "Imports a module", details: "Loads external functionality.", color: "text-purple-600" };
      if (trimmedLine.startsWith('class ')) return { line, explanation: "Defines a class", details: "Creates a blueprint for objects.", color: "text-green-600" };
      if (trimmedLine.startsWith('return ')) return { line, explanation: "Returns a value", details: "Sends a result back from a function.", color: "text-red-600" };
      if (trimmedLine.includes('=') && !trimmedLine.includes('==')) return { line, explanation: "Variable assignment", details: "Stores a value in memory.", color: "text-yellow-600" };
      if (trimmedLine.startsWith('print(')) return { line, explanation: "Output statement", details: "Displays information to the console.", color: "text-teal-600" };
      if (trimmedLine.startsWith('#')) return { line, explanation: "Comment", details: "A note that isn't executed.", color: "text-gray-500" };
      return { line, explanation: "Code statement", details: "A general Python instruction.", color: "text-gray-700" };
    });
    setExplanationData(basicExplanations);
  };

  const toggleChatSize = () => {
    setChatSize(chatSize === 'normal' ? 'large' : 'normal');
  };

  const handleSendMessage = async (message) => {
    try {
      const newUserMessage = { role: 'user', content: message };
      setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
      const lowerMessage = message.toLowerCase();
      
      const isAboutTheCode = lowerMessage.includes('this code') || 
                             lowerMessage.includes('the code') || 
                             lowerMessage.includes('my code') ||
                             lowerMessage.includes('is this right');

      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) throw new Error("API key is missing");

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      let prompt = `You are Luna, a friendly and helpful Python coding assistant.`;

      if (isAboutTheCode) {
        prompt += `\n\nThe user has the following Python code in their editor:\n\`\`\`python\n${code}\n\`\`\`\n\nThey asked: "${message}". Please answer their question about the code.`;
      } else {
        prompt += `\nThe user asked: "${message}". Answer their question about Python.`;
      }

      const result = await model.generateContent(prompt);
      const botResponse = { role: 'assistant', content: result.response.text() };
      setChatMessages(prevMessages => [...prevMessages, botResponse]);

    } catch (error) {
      console.error("Error in chatbot response:", error);
      const errorResponse = { role: 'assistant', content: "Sorry, I encountered an error. Please check the console for details." };
      setChatMessages(prevMessages => [...prevMessages, errorResponse]);
    }
  };

  return (
    <div className="code-learning-platform">
      <Header/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">Code Editor</h2>
          <CodeEditor code={code} setCode={setCode} />
          
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">User Input</h3>
            <textarea
              className="w-full p-2 border rounded font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Enter any required input for your script here, one line per input."
              rows="3"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
          </div>

          <div className="flex justify-between mt-4">
            <button onClick={executeCode} disabled={isExecuting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50">
              {isExecuting ? 'Running...' : 'Run Code'}
            </button>
            <div className="space-x-2">
              <button onClick={() => setViewMode('output')} className={`py-2 px-4 rounded ${viewMode === 'output' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 hover:bg-gray-300'}`}>Output</button>
              <button onClick={() => setViewMode('line-by-line')} disabled={explanationData.length === 0} className={`py-2 px-4 rounded ${viewMode === 'line-by-line' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 hover:bg-gray-300'}`}>Line Explanation</button>
              <button onClick={() => setViewMode('animated')} disabled={explanationData.length === 0} className={`py-2 px-4 rounded ${viewMode === 'animated' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 hover:bg-gray-300'}`}>Animation</button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          {viewMode === 'output' ? (
            <OutputViewer output={output} errors={errors} />
          ) : viewMode === 'line-by-line' ? (
            <LineExplanationViewer explanationData={explanationData} />
          ) : (
            <CodeVisualizer code={code} explanationData={explanationData.filter(item => !item.skip)} />
          )}
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-50">
        {!showChatbot ? (
          <button onClick={() => setShowChatbot(true)} className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center h-16 w-16">
             <div className='absolute'>
            <MessageSquare size={30} className="text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full">
              <span className="absolute top-0 left-0 w-full h-full rounded-full bg-green-400 animate-ping opacity-75"></span>
            </div>
            </div>
          </button>
        ) : (
          <Chatbot
            code={code}
            chatSize={chatSize}
            toggleChatSize={toggleChatSize}
            setShowChatbot={setShowChatbot}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
}

export default PythonComplier;