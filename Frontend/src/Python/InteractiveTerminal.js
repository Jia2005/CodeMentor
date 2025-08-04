import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

function InteractiveTerminal({ ws, onSessionEnd }) {
  const terminalRef = useRef(null);

  useEffect(() => {
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

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    
    // Give the browser a moment before fitting
    setTimeout(() => fitAddon.fit(), 20);

    const dataHandler = terminal.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    const messageHandler = event => {
      const message = JSON.parse(event.data);
      if (message.type === 'stdout' || message.type === 'stderr') {
        terminal.write(message.data);
      } else if (message.type === 'exit') {
        terminal.write(`\r\n\n--- Process finished with exit code ${message.code} ---\r\n`);
        onSessionEnd();
      }
    };

    ws.addEventListener('message', messageHandler);

    return () => {
      ws.removeEventListener('message', messageHandler);
      dataHandler.dispose();
      terminal.dispose();
    };
  }, [ws, onSessionEnd]);

  return <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />;
}

export default InteractiveTerminal;