import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

function CodeLearningApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Python Code Learning Platform</h1>
      </header>
      <main className="container mx-auto py-6 px-4">
        <CodeLearningPlatform />
      </main>
    </div>
  );
}

function CodeLearningPlatform() {
  const [code, setCode] = useState('# Example Python code\ndef calculate_sum(a, b):\n    """Calculate the sum of two numbers"""\n    return a + b\n\n# Call the function\nresult = calculate_sum(5, 7)\nprint(f"The sum is: {result}")');
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState(null);
  const [viewMode, setViewMode] = useState('output'); 
  const [explanationData, setExplanationData] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatSize, setChatSize] = useState('normal'); // 'normal', 'large', 'small'
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', content: 'Hello! I can help you with Python programming. Ask me about the code, or for help converting other languages to Python.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const chatEndRef = useRef(null);

  const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
  console.log("API Key available:", API_KEY ? "Yes (length: " + API_KEY.length + ")" : "No");
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const formatChatHistory = (messages) => {
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
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
  
  const generateAIExplanations = async (sourceCode) => {
    const lines = sourceCode.split('\n');
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
      const prompt = `Analyze this Python code line by line:
      
      ${sourceCode}
      
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
  
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const newMessage = { role: 'user', content: userInput };
    setChatMessages(prevMessages => [...prevMessages, newMessage]);
    setUserInput('');
    setAiThinking(true);
    
    try {
      
      const history = formatChatHistory(chatMessages);
      const chatSession = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.2
        }
      });
      
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
      
      const result = await chatSession.sendMessage(prompt);
      const response = result.response;
      const responseText = response.text();
      
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
    if (chatSize === 'normal') {
      setChatSize('large');
    } else {
      setChatSize('normal');
    }
  };

  const chatSizeClasses = {
    normal: "w-[600px] h-[400px]",
    large: "w-[800px] h-[600px]"
  };

  return (
    <div className="code-learning-platform">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">Code Editor</h2>
          <Editor
            height="400px"
            defaultLanguage="python"
            value={code}
            onChange={setCode}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 16,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
          
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
            <div>
              <h2 className="text-lg font-semibold mb-3">Output</h2>
              {errors ? (
                <div className="error-container">
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-3">
                    <p className="font-bold">Error</p>
                    <p>{errors.message}</p>
                    {errors.suggestions && (
                      <p className="mt-2 italic">{errors.suggestions}</p>
                    )}
                  </div>
                </div>
              ) : (
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {output || "Run your code to see output here"}
                </pre>
              )}
            </div>
          ) : viewMode === 'line-by-line' ? (
            <div>
              <h2 className="text-lg font-semibold mb-3">Line-by-Line Explanation</h2>
              {explanationData.length > 0 ? (
                <div className="overflow-auto max-h-96">
                  {explanationData.filter(item => !item.skip).map((item, index) => (
                    <div key={index} className="mb-4 p-3 bg-gray-50 rounded border-l-4 border-indigo-400">
                      <div className="font-mono text-sm bg-gray-800 text-white p-2 rounded mb-2">{item.line}</div>
                      <div className={`font-semibold ${item.color}`}>{item.explanation}</div>
                      <div className="text-gray-600 text-sm mt-1">{item.details}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Run your code to see explanations</p>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold mb-3">Visual Explanation</h2>
              <CodeVisualizer code={code} explanationData={explanationData.filter(item => !item.skip)} />
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-50">
        {!showChatbot ? (
          <button 
            onClick={() => setShowChatbot(true)}
            className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center"
          >
            <div>
              <img 
                src="/api/placeholder/48/48" 
                alt="Chat Assistant" 
                className="rounded-full"
              />
            </div>
          </button>
        ) : (
          <div className={`bg-white rounded-lg shadow-xl flex flex-col ${chatSizeClasses[chatSize]} transition-all duration-300`}>
            <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex justify-between items-center">
              <h3 className="font-medium">Python Assistant</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={toggleChatSize}
                  className="p-1 hover:bg-indigo-500 rounded"
                >
                  {chatSize === 'large' ? (
                    <Minimize2 />
                  ) : (
                    <Maximize2 />
                  ) }
                </button>
                <button 
                  onClick={() => setShowChatbot(false)}
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
                      ? 'bg-indigo-100 ml-4' 
                      : 'bg-white border border-gray-200 mr-4'
                  }`}
                >
                  <div className="font-semibold mb-1 text-sm">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div className="whitespace-pre-wrap text-sm">
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
                <div className="mb-3 p-3 rounded-lg bg-white border border-gray-200 mr-4">
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
                  className="bg-indigo-600 text-white p-2 rounded-r hover:bg-indigo-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CodeVisualizer({ code, explanationData }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [executionState, setExecutionState] = useState({
    variables: {},
    callStack: [],
    currentLine: 0
  });
  
  useEffect(() => {
    let timer;
    if (isPlaying && currentStep < explanationData.length - 1) {
      timer = setTimeout(() => {
        setCurrentStep(step => step + 1);
      }, 2000);
    } else if (currentStep >= explanationData.length - 1) {
      setIsPlaying(false);
    }    
    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, explanationData.length]);  

  useEffect(() => {
    if (explanationData.length === 0) return;    
    const currentLine = explanationData[currentStep]?.line.trim();
    const newExecutionState = { ...executionState };
    if (currentLine?.startsWith('def ')) {
      const functionName = currentLine.replace('def ', '').split('(')[0].trim();
      if (!newExecutionState.variables[functionName]) {
        newExecutionState.variables[functionName] = { type: 'function', params: [] };
      }
    } else if (currentLine?.includes('=') && !currentLine?.includes('==')) {
      const parts = currentLine.split('=');
      const varName = parts[0].trim();
      const value = parts[1].trim();
      
      if (value.includes('(') && value.includes(')')) {
        const funcName = value.split('(')[0].trim();
        if (funcName in newExecutionState.variables && newExecutionState.variables[funcName].type === 'function') {
          newExecutionState.callStack.push(funcName);
          
          const argsMatch = value.match(/\((.*?)\)/);
          if (argsMatch && argsMatch[1]) {
            const args = argsMatch[1].split(',').map(arg => arg.trim());
            newExecutionState.variables[funcName].params = args;
          }
          
          if (funcName === 'calculate_sum') {
            const result = eval(value.replace('calculate_sum', ''));
            newExecutionState.variables[varName] = { type: 'variable', value: result };
          } else {
            newExecutionState.variables[varName] = { type: 'variable', value: 'unknown' };
          }
          
          setTimeout(() => {
            setExecutionState(prev => ({
              ...prev,
              callStack: prev.callStack.filter(fn => fn !== funcName)
            }));
          }, 1500);
        } else {
          newExecutionState.variables[varName] = { type: 'variable', value: value };
        }
      } else {
        newExecutionState.variables[varName] = { type: 'variable', value: value };
      }
    } else if (currentLine?.startsWith('return ')) {
      if (newExecutionState.callStack.length > 0) {
        const returnValue = currentLine.replace('return', '').trim();
        newExecutionState.returnValue = returnValue;
      }
    } else if (currentLine?.startsWith('print(')) {
      newExecutionState.output = "Result printed";
    }
    
    newExecutionState.currentLine = currentStep;
    setExecutionState(newExecutionState);
  }, [currentStep, explanationData]);
  
  if (!explanationData.length) {
    return <p className="text-gray-500">Run your code to see animation</p>;
  }

  return (
    <div className="code-visualizer">
      <div className="flex justify-between mb-4">
        <button 
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-3 rounded disabled:opacity-50"
        >
          Previous
        </button>
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`font-medium py-1 px-3 rounded ${isPlaying 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <button 
          onClick={() => setCurrentStep(Math.min(explanationData.length - 1, currentStep + 1))}
          disabled={currentStep === explanationData.length - 1}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-3 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      
      <div className="border-2 border-indigo-200 rounded-lg p-4 bg-white">
        <div className="mb-4">
          <div className="text-sm text-gray-500">Step {currentStep + 1} of {explanationData.length}</div>
          <div className="h-2 bg-gray-200 rounded-full mt-1">
            <div 
              className="h-2 bg-indigo-600 rounded-full" 
              style={{ width: `${((currentStep + 1) / explanationData.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <pre className="font-mono text-sm overflow-x-auto whitespace-pre-wrap">
            {explanationData[currentStep]?.line}
          </pre>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className={`font-bold text-lg ${explanationData[currentStep]?.color}`}>
            {explanationData[currentStep]?.explanation}
          </h3>
          <p className="mt-2 text-gray-700">
            {explanationData[currentStep]?.details}
          </p>
          
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
            <EnhancedCodeVisual 
              step={currentStep} 
              explanationData={explanationData} 
              executionState={executionState}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EnhancedCodeVisual({ step, explanationData, executionState }) {
  const currentLine = explanationData[step]?.line.trim();
  const renderMemory = () => {
    if (Object.keys(executionState.variables).length === 0) {
      return <div className="text-gray-500 text-center italic">No variables in memory yet</div>;
    }
    
    return (
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(executionState.variables).map(([name, details], idx) => (
          <div key={idx} className={`p-2 rounded ${details.type === 'function' ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'} border`}>
            <div className="font-mono text-sm font-bold">{name}</div>
            {details.type === 'function' ? (
              <div className="text-xs text-blue-600">Function</div>
            ) : (
              <div className="text-xs text-yellow-600">Value: {details.value}</div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  const renderCallStack = () => {
    if (executionState.callStack.length === 0) {
      return null;
    }
    
    return (
      <div className="bg-indigo-50 p-2 rounded border border-indigo-200 mb-3">
        <div className="font-semibold text-sm mb-1">Call Stack:</div>
        {executionState.callStack.map((funcName, idx) => (
          <div key={idx} className="bg-white p-1 rounded mb-1 text-sm">
            {funcName}(...)
          </div>
        ))}
      </div>
    );
  };
  
  if (currentLine?.startsWith('def ')) {
    const functionName = currentLine.replace('def ', '').split('(')[0].trim();
    const params = currentLine.split('(')[1]?.split(')')[0].split(',').map(p => p.trim()).filter(p => p);
    
    return (
      <div className="function-visualization">
        <div className="text-center">
          <div className="inline-block p-3 bg-blue-100 border-2 border-blue-300 rounded-lg">
            <div className="font-bold text-blue-700">Function Created</div>
            <div className="text-blue-600">{functionName}</div>
            {params.length > 0 && (
              <div className="mt-2 text-sm">
                <div className="font-semibold">Parameters:</div>
                <div className="flex justify-center gap-2 mt-1">
                  {params.map((param, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-50 rounded border border-blue-200">{param}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-4">
            <svg height="60" width="100%" className="mx-auto">
              <rect x="25%" y="10" width="50%" height="40" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" rx="5" />
              <text x="50%" y="35" textAnchor="middle" fill="#1E40AF" fontSize="12">Function in Memory</text>
            </svg>
          </div>
        </div>
        
        <div className="mt-4 border-t pt-3">
          <div className="font-semibold mb-2">Memory:</div>
          {renderMemory()}
        </div>
      </div>
    );
  } 
  else if (currentLine?.includes('=') && currentLine?.includes('(') && currentLine?.includes(')')) {
    const parts = currentLine.split('=');
    const varName = parts[0].trim();
    const funcCall = parts[1].trim();
    const funcName = funcCall.split('(')[0].trim();
    const args = funcCall.match(/\((.*)\)/)[1].split(',').map(arg => arg.trim());
    
    return (
      <div className="function-call-visualization">
        {renderCallStack()}
        
        <div className="flex flex-col items-center">
          <div className="function-call mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
              <div className="font-mono text-sm">{funcName}()</div>
              <div className="text-xs text-blue-600">Function call</div>
            </div>
            
            <div className="flex justify-center items-center space-x-3">
              {args.map((arg, idx) => (
                <div key={idx} className="argument">
                  <div className="text-xs text-center mb-1">Argument {idx+1}</div>
                  <div className="px-2 py-1 bg-green-50 border border-green-200 rounded text-center text-sm">{arg}</div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-3">
              <svg height="40" width="40">
                <polygon points="20,0 40,20 20,40 0,20" fill="#3B82F6" />
                <text x="20" y="25" textAnchor="middle" fill="white" fontSize="20">↓</text>
              </svg>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2 text-center">
              <div className="font-mono text-sm">{varName}</div>
              <div className="text-xs text-yellow-600">Receives the result</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 border-t pt-3">
          <div className="font-semibold mb-2">Memory after execution:</div>
          {renderMemory()}
        </div>
      </div>
    );
  }
  else if (currentLine?.startsWith('return ')) {
    const returnValue = currentLine.replace('return', '').trim();
    
    return (
      <div className="return-visualization">
        {renderCallStack()}
        
        <div className="text-center">
          <div className="inline-block p-3 bg-red-100 border-2 border-red-300 rounded-lg">
            <div className="font-bold text-red-700">Return Value</div>
            <div className="text-red-600">{returnValue}</div>
          </div>
          
          <div className="flex justify-center mt-3">
            <svg height="40" width="40">
              <polygon points="20,0 40,20 20,40 0,20" fill="#EF4444" />
              <text x="20" y="25" textAnchor="middle" fill="white" fontSize="20">↑</text>
            </svg>
          </div>
          
          <div className="mt-2 text-gray-600 text-sm">
            The function sends this value back to where it was called
          </div>
        </div>
        
        <div className="mt-4 border-t pt-3">
          <div className="font-semibold mb-2">Memory:</div>
          {renderMemory()}
        </div>
      </div>
    );
  }
  else if (currentLine?.includes('=') && !currentLine?.includes('==')) {
    const parts = currentLine.split('=');
    const varName = parts[0].trim();
    const value = parts[1].trim();
    
    return (
      <div className="variable-visualization">
        <div className="flex justify-center items-center space-x-6 mb-4">
          <div className="text-right font-mono font-bold text-yellow-600">{varName}</div>
          <div className="text-gray-500">=</div>
          <div className="p-2 bg-yellow-50 border-2 border-yellow-300 rounded text-yellow-800">{value}</div>
        </div>
        
        <div className="text-center text-sm text-gray-500 mb-4">Variable stored in memory</div>
        <div className="flex justify-center">
          <svg width="200" height="80">
            <rect x="30" y="10" width="140" height="60" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" rx="5" />
            <text x="100" y="40" textAnchor="middle" fill="#92400E" fontSize="14">{varName}: {value}</text>
            <text x="100" y="60" textAnchor="middle" fill="#92400E" fontSize="10">Memory address: 0x{Math.floor(Math.random() * 1000000).toString(16).toUpperCase()}</text>
          </svg>
        </div>
        
        <div className="mt-4 border-t pt-3">
          <div className="font-semibold mb-2">Memory:</div>
          {renderMemory()}
        </div>
      </div>
    );
  }
  else if (currentLine?.startsWith('print(')) {
    const content = currentLine.match(/print\((.*)\)/)[1];
    
    return (
      <div className="print-visualization text-center">
        <div className="flex flex-col items-center">
          <div className="bg-teal-50 border-2 border-teal-300 rounded-lg p-3 mb-2">
            <div className="font-mono">{currentLine}</div>
          </div>
          <svg height="40" width="40">
            <polygon points="20,0 40,20 20,40 0,20" fill="#0D9488" />
            <text x="20" y="25" textAnchor="middle" fill="white" fontSize="20">→</text>
          </svg>
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mt-2 w-full max-w-md">
            <div className="font-mono text-sm">Console Output:</div>
            <div className="bg-black text-green-400 p-2 mt-1 rounded text-left font-mono text-sm">
              {content.includes('{') && content.includes('}') 
                ? "The sum is: 12" 
                : content.replace(/['"]/g, '')}
            </div>
          </div>
        </div>
        
        <div className="mt-4 border-t pt-3">
          <div className="font-semibold mb-2">Memory:</div>
          {renderMemory()}
        </div>
      </div>
    );
  }

  else if (currentLine?.startsWith('#')) {
    return (
      <div className="comment-visualization text-center">
        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 inline-block">
          <div className="text-gray-500">Comment</div>
          <div className="font-mono text-gray-600 mt-1">{currentLine}</div>
        </div>
        <div className="mt-3 text-sm text-gray-500">Comments are ignored by the Python interpreter</div>
        {Object.keys(executionState.variables).length > 0 && (
          <div className="mt-4 border-t pt-3">
            <div className="font-semibold mb-2">Current Memory:</div>
            {renderMemory()}
          </div>
        )}
      </div>
    );
  }
  else if (currentLine?.startsWith('"""') || currentLine?.endsWith('"""')) {
    return (
      <div className="docstring-visualization text-center">
        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 inline-block">
          <div className="text-gray-500">Documentation String</div>
          <div className="font-mono text-gray-600 mt-1">{currentLine}</div>
        </div>
        <div className="mt-3 text-sm text-gray-500">Docstrings provide documentation for functions, classes, or modules</div>
        {Object.keys(executionState.variables).length > 0 && (
          <div className="mt-4 border-t pt-3">
            <div className="font-semibold mb-2">Current Memory:</div>
            {renderMemory()}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="code-execution-visual">
      <div className="text-center text-gray-500">
        <div className="p-4">
          <div className="font-semibold">Code Execution Step</div>
          <div className="mt-2">This line is being processed by the Python interpreter</div>
        </div>
      </div>
      {Object.keys(executionState.variables).length > 0 && (
        <div className="mt-4 border-t pt-3">
          <div className="font-semibold mb-2">Current Memory:</div>
          {renderMemory()}
        </div>
      )}
      
      {executionState.callStack.length > 0 && (
        <div className="mt-4">
          {renderCallStack()}
        </div>
      )}
    </div>
  );
}

function createJavaSupport() {
  const generateJavaExplanations = (sourceCode) => {
    const lines = sourceCode.split('\n');
    const explanations = lines.map((line) => {
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
      if (trimmedLine.includes('class ')) {
        return { 
          line, 
          explanation: "Class Declaration", 
          details: "Defines a blueprint for objects with properties and methods",
          color: "text-green-600" 
        };
      } else if (trimmedLine.includes('public static void main')) {
        return { 
          line, 
          explanation: "Main Method", 
          details: "Entry point for Java application execution",
          color: "text-purple-700" 
        };
      } else if (trimmedLine.includes('Scanner')) {
        return { 
          line, 
          explanation: "Scanner Creation", 
          details: "Creates an object to read input from the specified source",
          color: "text-blue-600" 
        };
      } else if (trimmedLine.includes('System.out.print')) {
        return { 
          line, 
          explanation: "Output Statement", 
          details: "Displays information to the console",
          color: "text-teal-600" 
        };
      } else if (trimmedLine.includes('import ')) {
        return { 
          line, 
          explanation: "Import Statement", 
          details: "Makes classes and packages accessible in your code",
          color: "text-indigo-600" 
        };
      } else if (trimmedLine.match(/\w+\s+\w+\s*=\s*.+/)) {
        return { 
          line, 
          explanation: "Variable Declaration & Assignment", 
          details: "Creates a variable with a type and assigns it a value",
          color: "text-yellow-600" 
        };
      } else if (trimmedLine.startsWith('if ')) {
        return { 
          line, 
          explanation: "Condition Check", 
          details: "Executes code only if the condition is true",
          color: "text-orange-600" 
        };
      } else if (trimmedLine.startsWith('for ') || trimmedLine.startsWith('while ')) {
        return { 
          line, 
          explanation: "Loop Structure", 
          details: "Repeats a block of code multiple times",
          color: "text-pink-600" 
        };
      } else if (trimmedLine.startsWith('//')) {
        return { 
          line, 
          explanation: "Comment", 
          details: "Documentation that isn't executed",
          color: "text-gray-500" 
        };
      } else if (trimmedLine.startsWith('return ')) {
        return { 
          line, 
          explanation: "Return Statement", 
          details: "Sends a value back from a method",
          color: "text-red-600" 
        };
      }
      
      return { 
        line, 
        explanation: "Code Statement", 
        details: "General Java instruction",
        color: "text-gray-700" 
      };
    });
    
    return explanations;
  };
  
  const convertJavaToPython = (javaCode) => {
    let pythonCode = javaCode;
    pythonCode = pythonCode
      .replace(/public class (\w+) \{/g, 'class $1:')
      .replace(/public static void main\(String\[\] args\) \{/g, 'def main():')
      .replace(/System\.out\.println\((.*)\);/g, 'print($1)')
      .replace(/System\.out\.print\((.*)\);/g, 'print($1, end="")')
      .replace(/(int|float|double|String) (\w+) = (.*);/g, '$2 = $3')
      .replace(/for \(int (\w+) = (\d+); \1 < (\d+); \1\+\+\) \{/g, 'for $1 in range($2, $3):')
      .replace(/if \((.*)\) \{/g, 'if $1:')
      .replace(/\} else \{/g, 'else:')
      .replace(/\} else if \((.*)\) \{/g, 'elif $1:')
      .replace(/;/g, '')
      .replace(/\/\/(.*)/g, '# $1')
      .replace(/\}/g, '');
    
    return pythonCode;
  };
  
  return {
    generateJavaExplanations,
    convertJavaToPython
  };
}

export default CodeLearningApp;