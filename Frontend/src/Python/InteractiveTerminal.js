import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

function InteractiveTerminal({ ws, onSessionEnd }) {
  const terminalRef = useRef(null);
  const termInstance = useRef(null);
  const fitAddon = useRef(null);

  useEffect(() => {
    if (terminalRef.current && !termInstance.current) {
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
      
      const addon = new FitAddon();
      
      termInstance.current = terminal;
      fitAddon.current = addon;

      termInstance.current.loadAddon(addon);
      termInstance.current.open(terminalRef.current);
    }

    return () => {
      termInstance.current?.dispose();
      termInstance.current = null;
    };
  }, []); // The empty array [] ensures this effect runs only once on mount

  useEffect(() => {
    if (!ws || !termInstance.current || !fitAddon.current) {
      return;
    }

    // Flag to ensure we only call fit() once per session
    let isFitted = false;

    const dataHandler = termInstance.current.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    const messageHandler = (event) => {
      // **THE FIX**: On the very first message, resize the terminal.
      if (!isFitted) {
        fitAddon.current.fit();
        isFitted = true;
      }
      
      const message = JSON.parse(event.data);
      if (termInstance.current) {
        if (message.type === 'stdout' || message.type === 'stderr') {
          termInstance.current.write(message.data);
        } else if (message.type === 'exit') {
          termInstance.current.write(`\r\n\n--- Process finished with exit code ${message.code} ---\r\n`);
          onSessionEnd();
        }
      }
    };

    const errorHandler = (error) => {
      console.error("WebSocket Error:", error);
      if (termInstance.current) {
        termInstance.current.write('\r\n\n--- WebSocket connection failed ---');
      }
      onSessionEnd();
    };

    ws.addEventListener('message', messageHandler);
    ws.addEventListener('error', errorHandler);

    return () => {
      dataHandler.dispose();
      ws.removeEventListener('message', messageHandler);
      ws.removeEventListener('error', errorHandler);
    };
  }, [ws, onSessionEnd]); // Re-run this effect if the websocket connection changes

  return <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />;
}

export default InteractiveTerminal;