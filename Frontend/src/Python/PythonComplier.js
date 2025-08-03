import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import Header from './Header';
import InteractiveTerminal from './InteractiveTerminal';

function PythonComplier() {
  const [code, setCode] = useState('name = input("Enter your name: ")\nprint(f"Hello, {name}!")');
  const [sessionKey, setSessionKey] = useState(0);

  const startNewSession = () => {
    setSessionKey(prevKey => prevKey + 1);
  };

  const clearTerminal = () => {
    setSessionKey(0);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <Header />
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        
        <div className="flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-3 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-700">Code Editor</h2>
            <button
              onClick={startNewSession}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              Run
            </button>
          </div>
          <div className="flex-grow h-full">
            <CodeEditor code={code} setCode={setCode} />
          </div>
        </div>

        <div className="flex flex-col bg-gray-900 rounded-lg shadow-lg overflow-hidden">
           <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
             <h2 className="text-lg font-semibold text-white">Interactive Terminal</h2>
             <button
                onClick={clearTerminal}
                className="text-sm bg-gray-700 hover:bg-gray-600 text-white py-1 px-4 rounded-md transition-colors"
              >
                Clear
              </button>
           </div>
          <div className="flex-grow p-2" style={{ backgroundColor: '#1e1e1e' }}>
            {sessionKey > 0 ? (
              <InteractiveTerminal 
                key={sessionKey} 
                codeToRun={code} 
              />
            ) : (
              <div className="p-4 text-gray-500 font-mono h-full flex items-center justify-center">
                Click "Run" to start an interactive session.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default PythonComplier;
