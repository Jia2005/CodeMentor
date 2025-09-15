import { useState } from 'react';
import { AlertTriangle, Lightbulb, X } from 'lucide-react';
function DebugPopup({ error, explanation, onHint, onShowCorrectCode, onClose }) {
  const [showHint, setShowHint] = useState(false);
  const [showCode, setShowCode] = useState(false);
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 md:w-1/2 lg:w-1/3">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold flex items-center text-red-600">
            <AlertTriangle className="mr-2" /> Error Detected!
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-700 mb-4">
          It looks like your code has an error on line <span className="font-bold">{error.line}</span>. Would you like some help with this?
        </p>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => {
              setShowHint(true);
              onHint();
            }}
            className="flex-1 bg-indigo-600 text-white font-medium py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            <Lightbulb size={16} className="inline mr-2" />
            Give Me a Hint
          </button>
          <button
            onClick={() => setShowCode(true)}
            className="flex-1 bg-green-600 text-white font-medium py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={!explanation.correctCode}
          >
            Show Correct Code
          </button>
        </div>
        {(showHint || showCode) && (
          <div className="bg-gray-100 p-4 rounded-md mt-4">
            {showHint && <p>{explanation.hint}</p>}
            {showCode && (
              <pre className="bg-gray-800 text-white p-2 rounded overflow-x-auto">
                {explanation.correctCode}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default DebugPopup;