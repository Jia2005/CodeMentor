import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import CodeEditor from './CodeEditor';
import Header from './Header';
import OutputViewer from './OutputViewer';
import LineExplanationViewer from './LineExplanationViewer';
import CodeVisualizer from './CodeVisualizer';
import Chatbot from './Chatbot';
import InteractiveTerminal from './InteractiveTerminal';
import { GoogleGenerativeAI } from "@google/generative-ai";

function PythonComplier() {
  const [code, setCode] = useState('name = input("Enter your name: ")\nprint(f"Hello, {name}!")\n\nage_str = input("Enter your age: ")\nage = int(age_str)\nprint(f"You will be {age + 10} in ten years.")');
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState(null);
  const [viewMode, setViewMode] = useState('output');
  const [explanationData, setExplanationData] = useState([]);
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [ws, setWs] = useState(null);

  const [showChatbot, setShowChatbot] = useState(false);
  const [chatSize, setChatSize] = useState('normal');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      shortContent: "Hello! I'm Luna, your Python coding buddy. Ask me about your code or any Python topic.",
      expandedContent: null,
      isExpanded: false
    }
  ]);

  const handleExecution = () => {
    if (isExecuting) {
      if (ws) {
        ws.close();
      }
      stopSession();
    } else {
      setErrors(null);
      setOutput('');
      setExplanationData([]);
      
      const newWs = new WebSocket('ws://localhost:3001');

      newWs.onopen = () => {
        console.log('WebSocket connected');
        newWs.send(JSON.stringify({ type: 'execute', code }));
        setIsExecuting(true);
        setWs(newWs);
      };

      newWs.onclose = () => {
          console.log('WebSocket disconnected');
          stopSession();
      }
    }
  };

  const stopSession = () => {
    setIsExecuting(false);
    setWs(null);
  };
  
  const toggleChatSize = () => setChatSize(chatSize === 'normal' ? 'large' : 'normal');
  const handleToggleExpand = (messageIndex) => {
    setChatMessages(currentMessages =>
      currentMessages.map((msg, index) =>
        index === messageIndex ? { ...msg, isExpanded: !msg.isExpanded } : msg
      )
    );
  };
  const handleSendMessage = async (message) => {
    const newUserMessage = { role: 'user', shortContent: message, expandedContent: null, isExpanded: false };
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    try {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) throw new Error("API key is missing");
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const history = [...chatMessages, newUserMessage].map(msg => `${msg.role === 'user' ? 'User' : 'Luna'}: ${msg.shortContent}`).join('\n');
      let prompt = `You are Luna, a helpful and friendly Python coding assistant.
      **Core Instructions**:
      1.  **Relevance Rule**: If the user's last question is NOT about Python programming, concepts, libraries, code, or a direct follow-up, you MUST politely decline. State that you are a Python-only assistant. Do not answer the off-topic question.
      2.  **Formatting Rule**: For all relevant answers, you MUST structure your response in two parts separated by '---LEARN-MORE---'.
          - Part 1: A short, concise, direct answer to the user's question (1-2 sentences).
          - Part 2: A detailed, expanded explanation with examples, code snippets, and deeper insights.
          - If there is no additional information to provide, omit the '---LEARN-MORE---' separator and the second part.
      **Context**:
      - The user has the following Python code in their editor:
      \`\`\`python
      ${code}
      \`\`\`
      - Here is the conversation history:
      ${history}
      Now, respond to the last user message based on all the rules and context provided.`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const responseParts = responseText.split('---LEARN-MORE---');
      const shortContent = responseParts[0].trim();
      const expandedContent = responseParts.length > 1 ? responseParts[1].trim() : null;
      const botResponse = {
        role: 'assistant',
        shortContent: shortContent,
        expandedContent: expandedContent,
        isExpanded: false
      };
      setChatMessages(prevMessages => [...prevMessages, botResponse]);
    } catch (error) {
      console.error("Error in chatbot response:", error);
      const errorResponse = { role: 'assistant', shortContent: "Sorry, I encountered an error.", expandedContent: null, isExpanded: false };
      setChatMessages(prevMessages => [...prevMessages, errorResponse]);
    }
  };


  return (
    <div className="code-learning-platform bg-gray-50 min-h-screen">
      <Header />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-3">Code Editor</h2>
          <CodeEditor code={code} setCode={setCode} />
          
          <div className="flex justify-between items-center mt-4">
            <button 
              onClick={handleExecution} 
              className={`font-medium py-2 px-4 rounded text-white ${isExecuting ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isExecuting ? 'Stop Session' : 'Run Interactive'}
            </button>
            <div className="space-x-2">
              <button onClick={() => setViewMode('output')} className={`py-2 px-4 rounded ${viewMode === 'output' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 hover:bg-gray-300'}`}>Output</button>
              <button onClick={() => setViewMode('line-by-line')} disabled={explanationData.length === 0} className={`py-2 px-4 rounded ${viewMode === 'line-by-line' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 hover:bg-gray-300'}`}>Line Explanation</button>
              <button onClick={() => setViewMode('animated')} disabled={explanationData.length === 0} className={`py-2 px-4 rounded ${viewMode === 'animated' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 hover:bg-gray-300'}`}>Animation</button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col">
          {isExecuting && ws ? (
            <>
              <h2 className="text-lg font-semibold mb-3">Interactive Terminal</h2>
              <div className="flex-grow bg-[#1e1e1e] rounded-md overflow-hidden">
                <InteractiveTerminal ws={ws} onSessionEnd={stopSession} />
              </div>
            </>
          ) : viewMode === 'output' ? (
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
            chatSize={chatSize}
            toggleChatSize={toggleChatSize}
            setShowChatbot={setShowChatbot}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onToggleExpand={handleToggleExpand}
          />
        )}
      </div>
    </div>
  );
}

export default PythonComplier;