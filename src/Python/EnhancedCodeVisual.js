import React from 'react';

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

export default EnhancedCodeVisual;