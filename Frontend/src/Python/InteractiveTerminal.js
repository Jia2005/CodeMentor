import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

function InteractiveTerminal({ codeToRun, onSessionEnd }) {
  const termRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!termRef.current || !codeToRun) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'monospace',
      fontSize: 14,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termRef.current);
    fitAddon.fit();

    wsRef.current = new WebSocket('ws://localhost:3001');
    const ws = wsRef.current;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'run', code: codeToRun }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'stdout':
        case 'stderr':
          term.write(msg.data);
          break;
        case 'exit':
          term.writeln('\n\n[Process finished]');
          if(onSessionEnd) onSessionEnd();
          break;
        case 'error':
            term.writeln(`\n\n[Backend Error]: ${msg.data}`);
            if(onSessionEnd) onSessionEnd();
            break;
        default:
          break;
      }
    };

    term.onData(data => {
      ws.send(JSON.stringify({ type: 'stdin', data: data }));
    });
    
    ws.onclose = () => {
        term.writeln('\n\n[Connection to server closed]');
    };

    ws.onerror = (err) => {
        term.writeln(`\n\n[WebSocket Error]: ${err.message || 'Could not connect'}`);
    }

    return () => {
      ws.close();
      term.dispose();
    };
  }, [codeToRun, onSessionEnd]);

  return <div ref={termRef} style={{ width: '100%', height: '100%' }} />;
}

export default InteractiveTerminal;