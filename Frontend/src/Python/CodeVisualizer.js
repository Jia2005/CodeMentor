import { useState, useEffect } from 'react';
import EnhancedCodeVisual from './EnhancedCodeVisual';

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

    setExecutionState(prevExecutionState => {
      const currentLine = explanationData[currentStep]?.line.trim();
      const newExecutionState = { ...prevExecutionState };

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
              
              if (funcName === 'calculate_sum') {
                const result = args.reduce((sum, current) => sum + parseInt(current, 10), 0);
                newExecutionState.variables[varName] = { type: 'variable', value: result };
              } else {
                newExecutionState.variables[varName] = { type: 'variable', value: 'unknown' };
              }
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
      return newExecutionState;
    });
  }, [currentStep, explanationData]);

  if (!explanationData.length) {
    return <p className="text-gray-500">Run your code to see animation</p>;
  }

  return (
    <div className="code-visualizer h-[600px] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-3">Visual Explanation</h2>
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

export default CodeVisualizer;