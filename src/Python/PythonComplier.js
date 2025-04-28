import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import Header from './Header';
import OutputViewer from './OutputViewer';
import LineExplanationViewer from './LineExplanationViewer';
import CodeVisualizer from './CodeVisualizer';
import Chatbot from './Chatbot';
import { GoogleGenerativeAI } from "@google/generative-ai";
import image from './../Images/chatbot.png';

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
    { role: 'assistant', content: 'Hello! I\'m Luna, your Python coding buddy. Ask me about the code, or for help converting other languages to Python.' }
  ]);

  const executeCode = async () => {
    setIsExecuting(true);
    setErrors(null);
    setOutput('');
    
    try {
      if (containsNonPythonCode(code)) {
        throw new Error('This compiler only accepts Python code. Please correct your syntax.');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (code.includes('syntax error')) {
        throw new Error('SyntaxError: invalid syntax');
      }      
      if (code.includes('undefined_variable')) {
        throw new Error("NameError: name 'undefined_variable' is not defined");
      }
      if (code.includes('calculate_sum')) {
        setOutput('The sum is: 12');
      } else if (code.includes('print(')) {
        const match = code.match(/print\(['"](.+)['"]\)/);
        if (match) {
          setOutput(match[1]);
        } else {
          setOutput('[Output would appear here]');
        }
      } else {
        setOutput('[Output would appear here]');
      }
      
      await generateAIExplanations(code);
    } catch (error) {
      setErrors({
        message: error.message,
        suggestions: await getAISuggestions(error, code)
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  const containsNonPythonCode = (code) => {
    const javaIndicators = [
      'public class', 'public static void main', 'System.out.println',
      'String[] args', 'import java.util'
    ];
    
    const cppIndicators = [
      '#include <iostream>', 'std::', 'cout <<', 'int main()',
      'using namespace std'
    ];
    
    const jsIndicators = [
      'function()', 'const ', 'let ', 'document.getElementById',
      'console.log(', 'var '
    ];
    
    const allIndicators = [...javaIndicators, ...cppIndicators, ...jsIndicators];
    
    for (const indicator of allIndicators) {
      if (code.includes(indicator)) {
        return true;
      }
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
        console.error("API key is missing");
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
      if (line.trim() === '') {
        return { 
          line, 
          explanation: "Empty line", 
          details: "Line break in code for better readability",
          color: "text-gray-400",
          skip: true
        };
      }
      
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('def ')){
        return { 
          line, 
          explanation: "Defines a function", 
          details: "Creating a reusable block of code that can be called later",
          color: "text-blue-600" 
        };
      } else if (trimmedLine.startsWith('import ')) {
        return { 
          line, 
          explanation: "Imports a module", 
          details: "Loads external functionality to use in your code",
          color: "text-purple-600" 
        };
      } else if (trimmedLine.startsWith('class ')) {
        return { 
          line, 
          explanation: "Defines a class", 
          details: "Creates a blueprint for objects with properties and methods",
          color: "text-green-600" 
        };
      } else if (trimmedLine.startsWith('return ')) {
        return { 
          line, 
          explanation: "Returns a value", 
          details: "Sends a result back from a function",
          color: "text-red-600" 
        };
      } else if (trimmedLine.includes('=') && !trimmedLine.includes('==')) {
        return { 
          line, 
          explanation: "Variable assignment", 
          details: "Stores a value in memory with a name",
          color: "text-yellow-600" 
        };
      } else if (trimmedLine.startsWith('print(')) {
        return { 
          line, 
          explanation: "Output statement", 
          details: "Displays information to the console",
          color: "text-teal-600" 
        };
      } else if (trimmedLine.startsWith('if ')) {
        return { 
          line, 
          explanation: "Condition check", 
          details: "Executes code only if the condition is true",
          color: "text-indigo-600" 
        };
      } else if (trimmedLine.startsWith('for ')) {
        return { 
          line, 
          explanation: "Loop structure", 
          details: "Repeats code for each item in a sequence",
          color: "text-pink-600" 
        };
      } else if (trimmedLine.startsWith('#')) {
        return { 
          line, 
          explanation: "Comment", 
          details: "Documentation that isn't executed",
          color: "text-gray-500" 
        };
      } else if (trimmedLine.startsWith('"""') || trimmedLine.endsWith('"""')) {
        return { 
          line, 
          explanation: "Docstring", 
          details: "Documentation string that describes functions, classes, or modules",
          color: "text-gray-500" 
        };
      }
      
      return { 
        line, 
        explanation: "Code statement", 
        details: "General Python instruction",
        color: "text-gray-700" 
      };
    });
    
    try {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) {
        console.error("API key is missing");
        setExplanationData(basicExplanations);
        return;
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const prompt = `Analyze this Python code line by line:
      
      ${code}
      
      For each non-empty line, provide:
      1. A brief explanation (5-10 words)
      2. A detailed explanation about what the line does (max 50 words)
      
      Format your response as JSON array with objects having these properties:
      - lineIndex: the index number (integer starting at 0)
      - shortExplanation: brief explanation
      - detailedExplanation: detailed explanation
      
      Only include non-empty lines. Return ONLY the JSON, nothing else.`;
      
      const result = await model.generateContent(prompt);
      let aiExplanations;
      
      try {
        aiExplanations = JSON.parse(result.response.text());
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        setExplanationData(basicExplanations);
        return;
      }
      
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

  // Function to handle sending messages to the chatbot
  const handleSendMessage = async (message) => {
    try {
      // Add user message to chat
      const newUserMessage = { role: 'user', content: message };
      setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
      
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) {
        throw new Error("API key is missing");
      }
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      let prompt = message;
      
      if (message.toLowerCase().includes('convert') || 
          message.toLowerCase().includes('translate')) {
        prompt = `Act as a Python expert. Convert the code in my query to proper Python code. 
                 Show just the converted code with minimal explanation.
                 
                 ${message}`;
      } 
      else if (message.toLowerCase().includes('explain') && 
               (message.toLowerCase().includes('code') || message.toLowerCase().includes('this'))) {
        prompt = `Explain this Python code in clear, simple terms:
                 
                 ${code}
                 
                 ${message}`;
      }
      else if (message.toLowerCase().includes('debug') || 
               message.toLowerCase().includes('fix') || 
               message.toLowerCase().includes('error')) {
        prompt = `Debug this Python code and suggest fixes:
                 
                 ${code}
                 
                 ${message}`;
      }
      else {
        prompt = `As a Python teaching assistant, respond to this question: ${message}`;
      }
      
      const result = await model.generateContent(prompt);
      const botResponse = { role: 'assistant', content: result.response.text() };
      
      setChatMessages(prevMessages => [...prevMessages, botResponse]);
    } catch (error) {
      console.error("Error in chatbot response:", error);
      
      let errorMessage = "Sorry, I encountered an error processing your request.";
      if (error.message?.includes("API key")) {
        errorMessage += " There seems to be an issue with the API key.";
      } else if (error.message?.includes("quota")) {
        errorMessage += " You may have exceeded your API quota.";
      }
      
      // Add error message to chat
      const errorResponse = { role: 'assistant', content: errorMessage };
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
          
          <div className="flex justify-between mt-4">
            <button 
              onClick={executeCode} 
              disabled={isExecuting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
            >
              {isExecuting ? 'Running...' : 'Run Code'}
            </button>
            
            <div className="space-x-2">
              <button 
                onClick={() => setViewMode('output')}
                className={`py-2 px-4 rounded ${viewMode === 'output' 
                  ? 'bg-indigo-100 text-indigo-800' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                Output
              </button>
              <button 
                onClick={() => setViewMode('line-by-line')}
                className={`py-2 px-4 rounded ${viewMode === 'line-by-line' 
                  ? 'bg-indigo-100 text-indigo-800' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                disabled={explanationData.length === 0}
              >
                Line Explanation
              </button>
              <button 
                onClick={() => setViewMode('animated')}
                className={`py-2 px-4 rounded ${viewMode === 'animated' 
                  ? 'bg-indigo-100 text-indigo-800' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                disabled={explanationData.length === 0}
              >
                Animation
              </button>
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
          <button 
            onClick={() => setShowChatbot(true)}
            className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center h-20 w-20"
          >
            <div>
              <img 
                src={image}
                alt="Chat Assistant" 
                className="rounded-full"
              />
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