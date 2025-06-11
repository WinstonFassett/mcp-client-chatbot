'use client';

import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal as XTerm } from '@xterm/xterm';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Theme } from '@/artifacts/bolt/lib/stores/theme';
import { createScopedLogger } from '@/artifacts/bolt/utils/logger';
import { getTerminalTheme } from './theme';

const logger = createScopedLogger('Terminal');

export interface TerminalRef {
  reloadStyles: () => void;
}

export interface TerminalProps {
  className?: string;
  theme: Theme;
  readonly?: boolean;
  id: string;
  onTerminalReady?: (terminal: XTerm) => void;
  onTerminalResize?: (cols: number, rows: number) => void;
}

export const Terminal = memo(
  forwardRef<TerminalRef, TerminalProps>(
    ({ className, theme, readonly, id, onTerminalReady, onTerminalResize }, ref) => {
      const terminalElementRef = useRef<HTMLDivElement>(null);
      const terminalRef = useRef<XTerm>();
      const [isReady, setIsReady] = useState(false);

      useEffect(() => {
        const element = terminalElementRef.current!;

        // Skip if already initialized
        if (terminalRef.current) {
          return;
        }

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        const terminal = new XTerm({
          cursorBlink: true,
          convertEol: true,
          disableStdin: readonly,
          theme: getTerminalTheme(readonly ? { cursor: '#00000000' } : {}),
          fontSize: 12,
          fontFamily: 'Menlo, courier-new, courier, monospace',
          allowTransparency: true,
          rendererType: 'canvas', // Force canvas renderer for better compatibility
        });

        terminalRef.current = terminal;

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.open(element);

        // Force a resize to ensure dimensions are set
        const forceResize = () => {
          try {
            fitAddon.fit();
            // Ensure we have valid dimensions
            if (terminal.element && terminal.element.offsetParent !== null) {
              terminal.focus();
              terminal.resize(terminal.cols, terminal.rows);
              return true;
            }
            return false;
          } catch (e) {
            console.error('Error resizing terminal:', e);
            return false;
          }
        };

        // Try to force resize immediately
        let resizeSuccess = forceResize();
        
        // If immediate resize failed, try again after a short delay
        if (!resizeSuccess) {
          const resizeTimer = setTimeout(() => {
            resizeSuccess = forceResize();
            if (resizeSuccess) {
              setIsReady(true);
              onTerminalReady?.(terminal);
            }
          }, 100);
          
          return () => clearTimeout(resizeTimer);
        } else {
          setIsReady(true);
          onTerminalReady?.(terminal);
        }

        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit();
          onTerminalResize?.(terminal.cols, terminal.rows);
        });

        resizeObserver.observe(element);

        logger.debug(`Attach [${id}]`);

        return () => {
          resizeObserver.disconnect();
          terminal.dispose();
          terminalRef.current = undefined;
          setIsReady(false);
        };
      }, []);

      useEffect(() => {
        const terminal = terminalRef.current!;

        // we render a transparent cursor in case the terminal is readonly
        terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});

        terminal.options.disableStdin = readonly;
      }, [theme, readonly]);

      useImperativeHandle(ref, () => {
        return {
          reloadStyles: () => {
            const terminal = terminalRef.current!;
            terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});
          },
        };
      }, []);

      return <div className={className} ref={terminalElementRef} />;
    },
  ),
);
