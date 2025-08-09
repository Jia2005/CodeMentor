function LineExplanationViewer({ explanationData }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Line-by-Line Explanation</h2>
      {explanationData.length > 0 ? (
        <div className="overflow-y-auto h-[550px]">
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
  );
}

export default LineExplanationViewer;