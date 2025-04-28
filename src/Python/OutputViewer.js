import React from 'react';

function OutputViewer({ output, errors }) {
  return (
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
  );
}

export default OutputViewer;