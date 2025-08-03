import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import CodeEditor from './CodeEditor';
import Header from './Header';
import OutputViewer from './OutputViewer';
import LineExplanationViewer from './LineExplanationViewer';
import CodeVisualizer from './CodeVisualizer';
import Chatbot from './Chatbot';
import { GoogleGenerativeAI } from "@google/generative-ai";
import image from './../Images/chatbot.png';

function PythonComplier() {
  const [code, setCode] = useState('# Example with user input\nname = input("Enter your name: ")\nprint(f"Hello, {name}!")');
  const [userInput, setUserInput] = useState(''); // State for user input
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState(null);
  const [viewMode, setViewMode] = useState('output');
  const [explanationData, setExplanationData] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatSize, setChatSize] = useState('normal');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m Luna, your Python coding buddy. Ask me about Python code or for help converting other languages to Python.' }
  ]);

  // The new executeCode function that calls the real backend
  const executeCode = async () => {
    setIsExecuting(true);
    setErrors(null);
    setOutput('');
    setExplanationData([]); // Clear previous explanations

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
        // Generate explanations only on successful execution
        await generateAIExplanations(code);
      }
    } catch (error) {
      console.error("Failed to execute code:", error);
      setErrors({
        message: 'Could not connect to the execution server. Please ensure the backend is running.',
        suggestions: 'Start the backend server by running `node server.js` in the `Backend` directory.'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Your original AI-powered helper functions remain unchanged.
  const getAISuggestions = async (error, code) => {
    try {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) {
        return "Check your code syntax and logic. API key error prevented detailed suggestions.";
      }
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `I have a Python code that generated this error: "${error.message}"
      Here's the code:
      ${code}
      Provide a brief, helpful suggestion to fix this error. Keep it under 100 characters if possible. Don't explain why the error happened, just give a clear, actionable fix.`;
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
      if (trimmedLine.startsWith('def ')) return { line, explanation: "Defines a function", details: "Creating a reusable block of code that can be called later", color: "text-blue-600" };
      if (trimmedLine.startsWith('import ')) return { line, explanation: "Imports a module", details: "Loads external functionality to use in your code", color: "text-purple-600" };
      if (trimmedLine.startsWith('class ')) return { line, explanation: "Defines a class", details: "Creates a blueprint for objects with properties and methods", color: "text-green-600" };
      if (trimmedLine.startsWith('return ')) return { line, explanation: "Returns a value", details: "Sends a result back from a function", color: "text-red-600" };
      if (trimmedLine.includes('=') && !trimmedLine.includes('==')) return { line, explanation: "Variable assignment", details: "Stores a value in memory with a name", color: "text-yellow-600" };
      if (trimmedLine.startsWith('print(')) return { line, explanation: "Output statement", details: "Displays information to the console", color: "text-teal-600" };
      if (trimmedLine.startsWith('if ')) return { line, explanation: "Condition check", details: "Executes code only if the condition is true", color: "text-indigo-600" };
      if (trimmedLine.startsWith('for ')) return { line, explanation: "Loop structure", details: "Repeats code for each item in a sequence", color: "text-pink-600" };
      if (trimmedLine.startsWith('#')) return { line, explanation: "Comment", details: "Documentation that isn't executed", color: "text-gray-500" };
      if (trimmedLine.startsWith('"""') || trimmedLine.endsWith('"""')) return { line, explanation: "Docstring", details: "Documentation string that describes functions, classes, or modules", color: "text-gray-500" };
      return { line, explanation: "Code statement", details: "General Python instruction", color: "text-gray-700" };
    });
    try {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) { setExplanationData(basicExplanations); return; }
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `Analyze this Python code line by line:\n${code}\nFor each non-empty line, provide a brief explanation and a detailed explanation. Format your response as JSON array with objects having these properties: lineIndex, shortExplanation, detailedExplanation. Only include non-empty lines. Return ONLY the JSON.`;
      const result = await model.generateContent(prompt);
      let aiExplanations;
      try {
        aiExplanations = JSON.parse(result.response.text());
      } catch (parseError) { setExplanationData(basicExplanations); return; }
      const enhancedExplanations = basicExplanations.map((basic, index) => {
        const aiExplanation = aiExplanations.find(ai => ai.lineIndex === index);
        if (aiExplanation && !basic.skip) {
          return { ...basic, explanation: aiExplanation.shortExplanation || basic.explanation, details: aiExplanation.detailedExplanation || basic.details };
        }
        return basic;
      });
      setExplanationData(enhancedExplanations);
    } catch (error) {
      console.error("Error generating AI explanations:", error);
      setExplanationData(basicExplanations);
    }
  };

  const toggleChatSize = () => {
    setChatSize(chatSize === 'normal' ? 'large' : 'normal');
  };

  const handleSendMessage = async (message) => {
    // This function remains unchanged as it controls the chatbot.
    try {
      const newUserMessage = { role: 'user', content: message };
      setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
      const isPythonRelated = isPythonQuestion(message);
      if (!isPythonRelated) {
        const friendlyResponse = { role: 'assistant', content: "I specialize in Python. Feel free to ask me anything related to coding or programming concepts!" };
        setChatMessages(prevMessages => [...prevMessages, friendlyResponse]);
        return;
      }
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) throw new Error("API key is missing");
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      let prompt = `Respond to this Python question in a friendly, conversational way: ${message}`;
      const result = await model.generateContent(prompt);
      const botResponse = { role: 'assistant', content: result.response.text() };
      setChatMessages(prevMessages => [...prevMessages, botResponse]);
    } catch (error) {
      console.error("Error in chatbot response:", error);
      const errorResponse = { role: 'assistant', content: "Sorry, I encountered an error processing your request." };
      setChatMessages(prevMessages => [...prevMessages, errorResponse]);
    }
  };

  const isPythonQuestion = (message) => {
    const pythonKeywords = ['python', 'def', 'class', 'import', 'print', 'list', 'dict', 'tuple', 'set', 'for', 'while', 'if', 'else', 'elif', 'function', 'variable', 'pandas', 'numpy', 'django', 'flask', 'code'];
    const lowerMessage = message.toLowerCase();
    return pythonKeywords.some(keyword => lowerMessage.includes(keyword));
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
            <button
              onClick={executeCode}
              disabled={isExecuting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
            >
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