import { useState, useEffect, useRef } from 'react';

function OutputViewer({ outputLines, errors, isExecuting, onInputSubmit }) {
  const [currentInput, setCurrentInput] = useState('');
  const outputEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLines, errors]);

  // Focus the input field when execution starts
  useEffect(() => {
    if (isExecuting) {
      inputRef.current?.focus();
    }
  }, [isExecuting]);

  const handleInputChange = (e) => {
    setCurrentInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Prevent the default form submission behavior
      e.preventDefault();
      // Submit the input and clear the field
      onInputSubmit(currentInput);
      setCurrentInput('');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Output</h2>
      <div 
        className="bg-[#1e1e1e] text-white p-4 rounded-lg font-mono text-sm overflow-y-auto h-[500px] flex flex-col"
        onClick={() => inputRef.current?.focus()} // Focus input on click
      >
        <div className="flex-grow whitespace-pre-wrap">
          {outputLines.map((line, index) => {
            if (line.type === 'stdout') {
              // Render standard output from the script
              return <span key={index}>{line.data}</span>;
            } else if (line.type === 'input') {
              // Render the input that the user typed
              return <span key={index} className="text-yellow-300">{line.data + '\n'}</span>;
            }
            return null;
          })}
          {errors && <span className="text-red-400">{errors.message}</span>}
          {!isExecuting && outputLines.length === 0 && !errors && (
            <span className="text-gray-500">Run your code to see output here</span>
          )}
        </div>
        
        {/* Show the input prompt only when the code is running */}
        {isExecuting && (
          <div className="flex items-center mt-auto">
            <span className="text-green-400 mr-2 shrink-0">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="bg-transparent border-none text-white w-full focus:outline-none p-0"
              placeholder="Type input and press Enter..."
              autoFocus
              spellCheck="false"
            />
          </div>
        )}
        <div ref={outputEndRef} />
      </div>
    </div>
  );
}

export default OutputViewer;
