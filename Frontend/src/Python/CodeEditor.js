import Editor from '@monaco-editor/react';

function CodeEditor({ code, setCode }) {
  return (
    <Editor
      // The editor will now take the height of its container
      height="350px"
      corner="rounded-xl"
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
        scrollbar: {
          vertical: 'hidden',
          handleMouseWheel: false,
        },
      }}
    />
  );
}

export default CodeEditor;