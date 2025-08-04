import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

function InteractiveTerminal({ ws, onSessionEnd }) {
  const terminalRef = useRef(null);
  const terminal = useRef(null);

  useEffect(() => {
    if (!terminalRef.current || !ws) return;

    const fitAddon = new FitAddon();
    terminal.current = new Terminal({
      cursorBlink: true,
      fontFamily: 'monospace',
      fontSize: 14,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
      },
    });
    terminal.current.loadAddon(fitAddon);
    terminal.current.open(terminalRef.current);
    fitAddon.fit();

    const dataHandler = terminal.current.onData(data => {
      ws.send(JSON.stringify({ type: 'input', data }));
    });

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'stdout' || message.type === 'stderr') {
        terminal.current.write(message.data);
      } else if (message.type === 'exit') {
        terminal.current.write(`\r\n\n--- Process finished with exit code ${message.code} ---\r\n`);
        onSessionEnd();
      }
    };
    
    ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
        if (terminal.current) {
            terminal.current.write('\r\n\n--- WebSocket connection failed ---');
        }
        onSessionEnd();
    }

    return () => {
      dataHandler.dispose();
      if (terminal.current) {
        terminal.current.dispose();
      }
    };
  }, [ws, onSessionEnd]);

  return <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />;
}

export default InteractiveTerminal;