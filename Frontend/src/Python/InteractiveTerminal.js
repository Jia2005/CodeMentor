// Path: Frontend/src/Python/InteractiveTerminal.js

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

function InteractiveTerminal({ ws, onSessionEnd }) {
  const terminalRef = useRef(null);
  const termInstance = useRef(null);

  // This effect runs ONLY ONCE to create and set up the terminal
  useEffect(() => {
    if (terminalRef.current && !termInstance.current) {
      const fitAddon = new FitAddon();
      const terminal = new Terminal({
        cursorBlink: true,
        fontFamily: 'monospace',
        fontSize: 14,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
        },
      });

      termInstance.current = terminal;
      termInstance.current.loadAddon(fitAddon);
      termInstance.current.open(terminalRef.current);
      
      // We give the browser a moment to render before fitting the terminal
      setTimeout(() => fitAddon.fit(), 10);
    }

    return () => {
      // This cleanup runs when the component is removed
      termInstance.current?.dispose();
      termInstance.current = null;
    };
  }, []); // The empty array [] ensures this effect runs only once on mount

  // This effect handles all COMMUNICATION with the WebSocket
  useEffect(() => {
    if (!ws || !termInstance.current) {
      return;
    }

    // Handler for user input (sending data to the backend)
    const dataHandler = termInstance.current.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // Handler for messages coming FROM the backend
    const messageHandler = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'stdout' || message.type === 'stderr') {
        termInstance.current.write(message.data);
      } else if (message.type === 'exit') {
        termInstance.current.write(`\r\n\n--- Process finished with exit code ${message.code} ---\r\n`);
        onSessionEnd();
      }
    };

    const errorHandler = (error) => {
      console.error("WebSocket Error:", error);
      termInstance.current?.write('\r\n\n--- WebSocket connection failed ---');
      onSessionEnd();
    };

    ws.addEventListener('message', messageHandler);
    ws.addEventListener('error', errorHandler);

    // Cleanup function to remove listeners
    return () => {
      dataHandler.dispose();
      ws.removeEventListener('message', messageHandler);
      ws.removeEventListener('error', errorHandler);
    };
  }, [ws, onSessionEnd]);

  return <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />;
}

export default InteractiveTerminal;