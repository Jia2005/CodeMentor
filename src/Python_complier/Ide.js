import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

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
  const [viewMode, setViewMode] = useState('output'); // 'output', 'line-by-line', 'animated'
  const [explanationData, setExplanationData] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const executeCode = async () => {
    setIsExecuting(true);
    setErrors(null);
    setOutput('');
    
    try {
      // In a real implementation, you would send the code to a backend server or use a WASM solution
      // For this demo, we'll simulate execution with predefined responses
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      
      // Simple error detection - this would be more sophisticated in real implementation
      if (code.includes('syntax error')) {
        throw new Error('SyntaxError: invalid syntax');
      }
      
      if (code.includes('undefined_variable')) {
        throw new Error("NameError: name 'undefined_variable' is not defined");
      }
      
      // Mock output based on the code content
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
      
      // Generate explanations after successful execution
      generateExplanations(code);
    } catch (error) {
      setErrors({
        message: error.message,
        suggestions: getSuggestions(error)
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  const getSuggestions = (error) => {
    if (error.message.includes('name') && error.message.includes('is not defined')) {
      return "It looks like you're using a variable that hasn't been defined. Check your variable names.";
    } else if (error.message.includes('IndentationError')) {
      return "Python is sensitive to indentation. Make sure your code blocks are properly indented.";
    } else if (error.message.includes('SyntaxError')) {
      return "There's a syntax error in your code. Check for missing colons, parentheses, or other syntax elements.";
    }
    return "Check your code syntax and logic.";
  };
  
  const generateExplanations = (sourceCode) => {
    const lines = sourceCode.split('\n');
    const explanations = lines.map((line) => {
      const trimmedLine = line.trim();
      
      // Generate explanation based on Python syntax patterns
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
    
    setExplanationData(explanations);
  };

  return (
    <div className="code-learning-platform">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left side - Code Editor */}
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
        
        {/* Right side - Output or Explanation */}
        <div className="bg-white rounded-lg shadow-md p-4">
          {viewMode === 'output' && (
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
          )}
          
          {viewMode === 'line-by-line' && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Line-by-Line Explanation</h2>
              {explanationData.length > 0 ? (
                <div className="overflow-auto max-h-96">
                  {explanationData.map((item, index) => (
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
          )}
          
          {viewMode === 'animated' && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Visual Explanation</h2>
              <CodeVisualizer code={code} explanationData={explanationData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CodeVisualizer({ code, explanationData }) {
  // This would be a more sophisticated component in a real implementation
  // For this example, we'll show a simplified version
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  React.useEffect(() => {
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
          
          {/* Visual representation */}
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
            <CodeExecutionVisual step={currentStep} explanationData={explanationData} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeExecutionVisual({ step, explanationData }) {
  // This would be where you implement the animations for variables, stack frames, etc.
  const currentLine = explanationData[step]?.line.trim();
  
  // Simple logic to determine what kind of visualization to show
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
              <text x="50%" y="35" textAnchor="middle" fill="#1E40AF" fontSize="12">Function Stack Frame</text>
            </svg>
          </div>
        </div>
      </div>
    );
  } else if (currentLine?.includes('=') && !currentLine?.includes('==')) {
    // Variable assignment visualization
    const parts = currentLine.split('=');
    const varName = parts[0].trim();
    const value = parts[1].trim();
    
    return (
      <div className="variable-visualization">
        <div className="flex justify-center items-center space-x-4">
          <div className="text-right font-mono font-bold text-yellow-600">{varName}</div>
          <div className="text-gray-500">=</div>
          <div className="p-2 bg-yellow-50 border-2 border-yellow-300 rounded text-yellow-800">{value}</div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-500">Variable stored in memory</div>
      </div>
    );
  } else if (currentLine?.startsWith('print(')) {
    // Print visualization
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
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mt-2 text-left">
            <div className="font-mono text-sm">Console Output</div>
          </div>
        </div>
      </div>
    );
  } else if (currentLine?.startsWith('if ')) {
    // Condition visualization
    return (
      <div className="condition-visualization text-center">
        <div className="inline-block">
          <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-3">
            <div className="font-mono">{currentLine.replace('if ', '').replace(':', '')}</div>
          </div>
          <svg height="80" width="200" className="mx-auto">
            <path d="M100,20 L150,60 L100,60 L50,60 Z" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
            <text x="100" y="45" textAnchor="middle" fill="#4F46E5" fontSize="12">Condition</text>
            <text x="60" y="75" textAnchor="middle" fill="#4F46E5" fontSize="10">True</text>
            <text x="140" y="75" textAnchor="middle" fill="#4F46E5" fontSize="10">False</text>
          </svg>
        </div>
      </div>
    );
  }
  
  // Default visualization
  return (
    <div className="text-center text-gray-500">
      <div className="p-4">
        <div className="font-semibold">Code Execution Step</div>
        <div className="mt-2">This line is being processed by the Python interpreter</div>
      </div>
    </div>
  );
}

// Note: For Java support, you would add parser logic specific to Java syntax
// Here's a function that you could add for Java syntax highlighting and explanation

function generateJavaExplanations(sourceCode) {
  const lines = sourceCode.split('\n');
  const explanations = lines.map((line) => {
    const trimmedLine = line.trim();
    
    // Java-specific syntax patterns
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
}

export default CodeLearningApp;