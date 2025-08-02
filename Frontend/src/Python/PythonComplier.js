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
      
      const userInputCode = code;
      if (userInputCode.includes('calculate_sum')) {
        setOutput('The sum is: 12');
      } else if (userInputCode.includes('print(')) {
        const match = userInputCode.match(/print\(['"](.+)['"]\)/);
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

  const handleSendMessage = async (message) => {
    try {
      const newUserMessage = { role: 'user', content: message };
      setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
      
      // Handle greetings and thanks
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        const greetingResponse = { 
          role: 'assistant', 
          content: "Hi there! 👋 It's great to chat with you. How can I help with your Python questions today?" 
        };
        setChatMessages(prevMessages => [...prevMessages, greetingResponse]);
        return;
      }
      
      if (lowerMessage.includes('thank') || lowerMessage.includes('thanks') || lowerMessage.includes('thx')) {
        const thanksResponse = { 
          role: 'assistant', 
          content: "You're welcome! 😊 I'm happy to help. Is there anything else you'd like to know about Python?" 
        };
        setChatMessages(prevMessages => [...prevMessages, thanksResponse]);
        return;
      }
      
      const isPythonRelated = isPythonQuestion(message);
      
      if (!isPythonRelated) {
        const friendlyResponse = { 
          role: 'assistant', 
          content: "I'd love to chat about Python with you! While I specialize in Python topics, feel free to ask me anything related to coding or programming concepts. How can I help you today?" 
        };
        setChatMessages(prevMessages => [...prevMessages, friendlyResponse]);
        return;
      }
      
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) {
        throw new Error("API key is missing");
      }
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      let prompt = message;
      
      if (message.toLowerCase().includes('convert') || 
          message.toLowerCase().includes('translate')) {
        prompt = `Convert the code to proper Python code. Return just the converted code with minimal explanation.
                 
                 ${message}`;
      } 
      else if (message.toLowerCase().includes('explain') && 
               (message.toLowerCase().includes('code') || message.toLowerCase().includes('this'))) {
        prompt = `Explain this Python code concisely:
                 
                 ${code}
                 
                 ${message}
                 
                 Keep your initial answer brief and to the point. Include a section at the end that starts with "EXPANDED_CONTENT:" followed by a detailed explanation. The expanded content should be comprehensive but clear.`;
      }
      else if (message.toLowerCase().includes('debug') || 
               message.toLowerCase().includes('fix') || 
               message.toLowerCase().includes('error')) {
        prompt = `Debug this Python code and suggest fixes concisely:
                 
                 ${code}
                 
                 ${message}
                 
                 Keep your answer short and direct. Include a section at the end that starts with "EXPANDED_CONTENT:" followed by a detailed explanation of the bugs and fixes.`;
      }
      else {
        prompt = `Respond to this Python question in a friendly, conversational way: ${message}
                 
                 Keep your initial answer brief and focused.
                 Use code formatting with \`backticks\` instead of bold text for code elements and syntax.
                 Include a section at the end that starts with "EXPANDED_CONTENT:" followed by a more detailed explanation of the concept.
                 Be enthusiastic and encouraging in your tone.`;
      }
      
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      
      // Split the response to separate main content and expanded content
      const parts = responseText.split("EXPANDED_CONTENT:");
      
      let mainContent = parts[0].trim();
      let expandedContent = parts.length > 1 ? parts[1].trim() : "";
      
      // Add "Know More" button if expanded content exists
      if (expandedContent) {
        mainContent += "\n\n<button class='know-more'>Know More</button>";
      }
      
      const botResponse = { 
        role: 'assistant', 
        content: mainContent,
        expandedContent: expandedContent 
      };
      
      setChatMessages(prevMessages => [...prevMessages, botResponse]);
    } catch (error) {
      console.error("Error in chatbot response:", error);
      
      let errorMessage = "Sorry, I encountered an error processing your request.";
      if (error.message?.includes("API key")) {
        errorMessage += " There seems to be an issue with the API key.";
      } else if (error.message?.includes("quota")) {
        errorMessage += " You may have exceeded your API quota.";
      }
      
      const errorResponse = { role: 'assistant', content: errorMessage };
      setChatMessages(prevMessages => [...prevMessages, errorResponse]);
    }
  };
  
  const isPythonQuestion = (message) => {
    const pythonKeywords = [
      'python', 'def', 'class', 'import', 'print', 'list', 'dict', 'tuple',
      'set', 'for loop', 'while loop', 'if statement', 'elif', 'else',
      'function', 'variable', 'string', 'integer', 'float', 'boolean',
      'module', 'package', 'pip', 'exception', 'try', 'except', 'finally',
      'raise', 'with', 'as', 'lambda', 'yield', 'return', 'break', 'continue',
      'pass', 'assert', 'global', 'nonlocal', 'pandas', 'numpy', 'matplotlib',
      'tensorflow', 'pytorch', 'django', 'flask', 'fastapi', 'sqlalchemy',
      'anaconda', 'jupyter', 'notebook', 'virtual environment', 'venv',
      'iterator', 'generator', 'comprehension', 'decorator', 'recursion',
      'algorithm', 'data structure', 'convert', 'translate', 'code'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    for (const keyword of pythonKeywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    
    if (lowerMessage.includes('this code') || 
        lowerMessage.includes('the code') ||
        lowerMessage.includes('my code') ||
        lowerMessage.includes('code editor')) {
      return true;
    }
    
    return false;
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
            className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center h-16 w-16"
          >
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