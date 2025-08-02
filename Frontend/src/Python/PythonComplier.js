import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import CodeEditor from './CodeEditor';
import Header from './Header';
import OutputViewer from './OutputViewer';
import LineExplanationViewer from './LineExplanationViewer';
import CodeVisualizer from './CodeVisualizer';
import Chatbot from './Chatbot';
import { GoogleGenerativeAI } from "@google/generative-ai";

function PythonComplier() {
  const [code, setCode] = useState('# Example Python code\ndef calculate_sum(a, b):\n    """Calculate the sum of two numbers"""\n    return a + b\n\n# Call the function\nresult = calculate_sum(5, 7)\nprint(f"The sum is: {result}")');
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

  const executeCode = async () => {
    setIsExecuting(true);
    setErrors(null);
    setOutput('');
    setExplanationData([]);

    try {
      // Step 1: Make a POST request to your backend server with the code.
      const response = await fetch('http://localhost:3001/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Step 2: Get the execution result (output or error) from the backend.
      const result = await response.json();

      // Step 3: Update the UI with the real result from the server.
      if (result.error) {
        setErrors({ message: result.error, suggestions: '' });
      } else {
        setOutput(result.output);
        await generateAIExplanations(code);
      }

    } catch (error) {
      console.error("Failed to execute code:", error);
      setErrors({
        message: "Could not connect to the execution server. Please ensure the backend is running.",
        suggestions: error.message
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const containsNonPythonCode = (code) => {
    const javaIndicators = ['public class', 'public static void main', 'System.out.println'];
    const cppIndicators = ['#include <iostream>', 'std::', 'cout <<', 'int main()'];
    const jsIndicators = ['function()', 'const ', 'let ', 'console.log('];
    const allIndicators = [...javaIndicators, ...cppIndicators, ...jsIndicators];
    for (const indicator of allIndicators) {
      if (code.includes(indicator)) return true;
    }
    return false;
  };

  const getAISuggestions = async (error, code) => {
    if (error.message.includes('only accepts Python')) {
      return "This compiler only works with Python code. You can use our chatbot to help convert your code to Python.";
    }
    try {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) {
        return "Check your code syntax and logic. API key error prevented detailed suggestions.";
      }
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `I have a Python code that generated this error: "${error.message}"\n\nHere's the code:\n${code}\n\nProvide a brief, helpful suggestion to fix this error.`;
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
        const trimmedLine = line.trim();
        if (trimmedLine === '') return { line, explanation: "Empty line", details: "Line break for readability.", color: "text-gray-400", skip: true };
        if (trimmedLine.startsWith('def ')) return { line, explanation: "Defines a function", details: "Creating a reusable block of code.", color: "text-blue-600" };
        if (trimmedLine.startsWith('import ')) return { line, explanation: "Imports a module", details: "Loads external functionality.", color: "text-purple-600" };
        if (trimmedLine.startsWith('class ')) return { line, explanation: "Defines a class", details: "Creates a blueprint for objects.", color: "text-green-600" };
        if (trimmedLine.startsWith('return ')) return { line, explanation: "Returns a value", details: "Sends a result back from a function.", color: "text-red-600" };
        if (trimmedLine.includes('=') && !trimmedLine.includes('==')) return { line, explanation: "Variable assignment", details: "Stores a value in memory.", color: "text-yellow-600" };
        if (trimmedLine.startsWith('print(')) return { line, explanation: "Output statement", details: "Displays information to the console.", color: "text-teal-600" };
        if (trimmedLine.startsWith('if ')) return { line, explanation: "Condition check", details: "Executes code if a condition is true.", color: "text-indigo-600" };
        if (trimmedLine.startsWith('for ')) return { line, explanation: "Loop structure", details: "Repeats code for each item in a sequence.", color: "text-pink-600" };
        if (trimmedLine.startsWith('#')) return { line, explanation: "Comment", details: "Documentation that isn't executed.", color: "text-gray-500" };
        if (trimmedLine.startsWith('"""') || trimmedLine.endsWith('"""')) return { line, explanation: "Docstring", details: "Documentation for functions/classes.", color: "text-gray-500" };
        return { line, explanation: "Code statement", details: "A general Python instruction.", color: "text-gray-700" };
    });

    try {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) {
        setExplanationData(basicExplanations);
        return;
      }
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = `Analyze this Python code line by line:\n\n${code}\n\nFor each non-empty line, provide:\n1. A brief explanation (5-10 words)\n2. A detailed explanation (max 50 words)\n\nFormat your response as a JSON array of objects with keys: "lineIndex", "shortExplanation", "detailedExplanation".\nReturn ONLY the JSON array.`;
      const result = await model.generateContent(prompt);
      const aiExplanations = JSON.parse(result.response.text());

      const enhancedExplanations = basicExplanations.map((basic, index) => {
        const aiExplanation = aiExplanations.find(ai => ai.lineIndex === index);
        if (aiExplanation && !basic.skip) {
          return {
            ...basic,
            explanation: aiExplanation.shortExplanation || basic.explanation,
            details: aiExplanation.detailedExplanation || basic.details
          };
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
    try {
      const newUserMessage = { role: 'user', content: message };
      setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
      const lowerMessage = message.toLowerCase();

      if (['hello', 'hi', 'hey'].some(greeting => lowerMessage.includes(greeting))) {
        const greetingResponse = { role: 'assistant', content: "Hi there! 👋 How can I help with your Python questions today?" };
        setChatMessages(prevMessages => [...prevMessages, greetingResponse]);
        return;
      }
      if (['thank', 'thanks', 'thx'].some(thanks => lowerMessage.includes(thanks))) {
        const thanksResponse = { role: 'assistant', content: "You're welcome! 😊 Is there anything else you'd like to know?" };
        setChatMessages(prevMessages => [...prevMessages, thanksResponse]);
        return;
      }

      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) throw new Error("API key is missing");

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      let prompt;
      if (lowerMessage.includes('convert') || lowerMessage.includes('translate')) {
        prompt = `Convert the following code to proper Python. Return just the code. ${message}`;
      } else if (lowerMessage.includes('explain')) {
        prompt = `Explain this Python code concisely:\n\n${code}\n\n${message}`;
      } else if (lowerMessage.includes('debug') || lowerMessage.includes('fix') || lowerMessage.includes('error')) {
        prompt = `Debug this Python code and suggest fixes concisely:\n\n${code}\n\n${message}`;
      } else {
        prompt = `Respond to this Python question in a friendly, conversational way: ${message}`;
      }

      const result = await model.generateContent(prompt);
      const botResponse = { role: 'assistant', content: result.response.text() };
      setChatMessages(prevMessages => [...prevMessages, botResponse]);

    } catch (error) {
      console.error("Error in chatbot response:", error);
      const errorResponse = { role: 'assistant', content: "Sorry, I encountered an error processing your request." };
      setChatMessages(prevMessages => [...prevMessages, errorResponse]);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-3">Code Editor</h2>
            <CodeEditor code={code} setCode={setCode} />
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={executeCode}
                disabled={isExecuting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
              >
                {isExecuting ? 'Running...' : 'Run Code'}
              </button>
              <div className="flex items-center space-x-2">
                <button onClick={() => setViewMode('output')} className={`py-2 px-4 rounded font-medium ${viewMode === 'output' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 hover:bg-gray-300'}`}>Output</button>
                <button onClick={() => setViewMode('line-by-line')} disabled={!explanationData.length} className={`py-2 px-4 rounded font-medium ${viewMode === 'line-by-line' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 hover:bg-gray-300'} disabled:opacity-50`}>Line Explanation</button>
                <button onClick={() => setViewMode('animated')} disabled={!explanationData.length} className={`py-2 px-4 rounded font-medium ${viewMode === 'animated' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 hover:bg-gray-300'} disabled:opacity-50`}>Animation</button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 h-[630px] overflow-y-auto">
            {viewMode === 'output' && <OutputViewer output={output} errors={errors} />}
            {viewMode === 'line-by-line' && <LineExplanationViewer explanationData={explanationData} />}
            {viewMode === 'animated' && <CodeVisualizer code={code} explanationData={explanationData.filter(item => !item.skip)} />}
          </div>
        </div>
      </main>
      <div className="fixed bottom-4 right-4 z-50">
        {!showChatbot ? (
          <button
            onClick={() => setShowChatbot(true)}
            className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110 flex items-center justify-center h-16 w-16"
          >
            <MessageSquare size={30} />
            <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
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