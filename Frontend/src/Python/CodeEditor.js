import React from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ code, setCode }) {
  return (
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
  );
}

export default CodeEditor;