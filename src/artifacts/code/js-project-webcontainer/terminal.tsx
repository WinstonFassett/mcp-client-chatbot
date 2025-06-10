"use client";

import { useCallback, useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getWebContainerInstance } from './webcontainer-manager';

// Import xterm styles
import 'xterm/css/xterm.css';

interface WebTerminalProps {
  className?: string;
}

export function WebTerminal({ className = '' }: WebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon>(new FitAddon());

  const initTerminal = useCallback(async () => {
    if (!terminalRef.current) return;
    
    // Initialize terminal if it doesn't exist
    if (!terminalInstance.current) {
      const terminal = new Terminal({
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          selection: 'rgba(255, 255, 255, 0.3)',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5',
        },
      });
      
      // Add addons
      terminal.loadAddon(fitAddon.current);
      terminal.loadAddon(new WebLinksAddon());
      
      // Open terminal in the container
      terminal.open(terminalRef.current);
      fitAddon.current.fit();
      
      // Store the terminal instance
      terminalInstance.current = terminal;
      
      try {
        // Get WebContainer instance
        const webcontainer = await getWebContainerInstance();
        
        // Start a shell process
        const shellProcess = await webcontainer.spawn('bash');
        
        // Pipe terminal output to the terminal
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal.write(data);
            },
          })
        );
        
        // Pipe terminal input to the shell process
        const input = shellProcess.input.getWriter();
        terminal.onData((data) => {
          input.write(data);
        });
        
        // Handle terminal resize
        terminal.onResize(({ cols, rows }) => {
          // Resize the shell process if supported
          if (shellProcess.resize) {
            shellProcess.resize({ cols, rows });
          }
        });
      } catch (error) {
        console.error('Failed to initialize terminal:', error);
        terminal.write('\r\n\x1b[31mFailed to initialize terminal. WebContainer may not be supported in this browser.\x1b[0m\r\n');
      }
    }
  }, []);

  // Handle terminal resize
  const handleResize = useCallback(() => {
    if (fitAddon.current) {
      fitAddon.current.fit();
    }
  }, []);

  useEffect(() => {
    // Initialize terminal
    initTerminal();
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    return () => {
      // Clean up
      window.removeEventListener('resize', handleResize);
      
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
        terminalInstance.current = null;
      }
    };
  }, [initTerminal, handleResize]);

  return (
    <div 
      ref={terminalRef} 
      className={`w-full h-full min-h-[200px] ${className}`}
    />
  );
}
