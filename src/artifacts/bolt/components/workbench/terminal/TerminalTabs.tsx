'use client';

import { useStore } from '@nanostores/react';
import React, { memo, useEffect, useRef, useState } from 'react';
import { Panel, type ImperativePanelHandle } from 'react-resizable-panels';
import { IconButton } from '@/artifacts/bolt/components/ui/IconButton';
import { shortcutEventEmitter } from '@/artifacts/bolt/lib/hooks';
import { themeStore } from '@/artifacts/bolt/lib/stores/theme';
import { workbenchStore } from '@/artifacts/bolt/lib/stores/workbench';
import { classNames } from '@/artifacts/bolt/utils/classNames';
import DynamicTerminal from './DynamicTerminal';
import type { TerminalRef } from './Terminal';
import { createScopedLogger } from '@/artifacts/bolt/utils/logger';

const logger = createScopedLogger('Terminal');

const MAX_TERMINALS = 3;
export const DEFAULT_TERMINAL_SIZE = 25;

export const TerminalTabs = memo(() => {
  const showTerminal = useStore(workbenchStore.showTerminal);
  const theme = useStore(themeStore);
  // Get actionRunner and terminal directly from workbenchStore
  const actionRunner = workbenchStore.actionRunner.get();
  const terminal = workbenchStore.terminal;

  const terminalRefs = useRef<Array<TerminalRef | null>>([]);
  const terminalPanelRef = useRef<ImperativePanelHandle>(null);
  const terminalToggledByShortcut = useRef(false);
  const hasRunInitialCommands = useRef(false);
  const isInitialMount = useRef(true);

  const [activeTerminal, setActiveTerminal] = useState(0);
  const [terminalCount, setTerminalCount] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  // Handle running initial commands when the terminal is ready
  useEffect(() => {
    const runInitialCommands = async () => {
      if (!actionRunner || !terminal || hasRunInitialCommands.current) return;
      
      // Skip if this is the initial mount and we're not showing the terminal
      if (isInitialMount.current && !showTerminal) {
        return;
      }
      
      hasRunInitialCommands.current = true;
      
      try {
        // Run npm install if needed
        if (workbenchStore.shouldRunNpmInstall) {
          logger.debug('Running npm install');
          await terminal.executeCommand(`install-${Date.now()}`, 'npm install');
          workbenchStore.setShouldRunNpmInstall(false);
        }

        // Run dev server if needed
        if (workbenchStore.shouldRunDev) {
          logger.debug('Running npm run dev');
          // Don't await this as it's long-running
          terminal.executeCommand(`dev-${Date.now()}`, 'npm run dev')
            .catch(error => logger.error('Error running dev server:', error));
          workbenchStore.setShouldRunDev(false);
        }
      } catch (error) {
        logger.error('Error running initial commands:', error);
      }
    };

    // Only run if we're showing the terminal
    if (showTerminal) {
      runInitialCommands();
    }
  }, [actionRunner, terminal, showTerminal]);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      isInitialMount.current = false;
    };
  }, []);

  // Handle terminal visibility changes
  useEffect(() => {
    const { current: terminalPanel } = terminalPanelRef;
    if (!terminalPanel) return;

    const isCollapsed = terminalPanel.isCollapsed();

    if (!showTerminal && !isCollapsed) {
      terminalPanel.collapse();
    } else if (showTerminal && isCollapsed) {
      terminalPanel.resize(DEFAULT_TERMINAL_SIZE);
    }

    terminalToggledByShortcut.current = false;
  }, [showTerminal]);

  // Initialize the terminal when the component mounts
  useEffect(() => {
    if (actionRunner) {
      // The terminal will be initialized by the DynamicTerminal component
      // which will call workbenchStore.setBoltTerminal when it's ready
    }
  }, [actionRunner]);

  const addTerminal = () => {
    if (terminalCount < MAX_TERMINALS) {
      setTerminalCount(terminalCount + 1);
      setActiveTerminal(terminalCount);
    }
  };

  useEffect(() => {
    const unsubscribeFromEventEmitter = shortcutEventEmitter.on('toggleTerminal', () => {
      terminalToggledByShortcut.current = true;
    });

    const unsubscribeFromThemeStore = themeStore.subscribe(() => {
      for (const ref of Object.values(terminalRefs.current)) {
        ref?.reloadStyles();
      }
    });

    return () => {
      unsubscribeFromEventEmitter();
      unsubscribeFromThemeStore();
    };
  }, []);

  return (
    <Panel
      ref={terminalPanelRef}
      defaultSize={showTerminal ? DEFAULT_TERMINAL_SIZE : 0}
      minSize={10}
      collapsible
      onExpand={() => {
        if (!terminalToggledByShortcut.current) {
          workbenchStore.toggleTerminal(true);
        }
      }}
      onCollapse={() => {
        if (!terminalToggledByShortcut.current) {
          workbenchStore.toggleTerminal(false);
        }
      }}
    >
      <div className="h-full">
        <div className="bg-bolt-elements-terminals-background h-full flex flex-col">
          <div className="flex items-center bg-bolt-elements-background-depth-2 border-y border-bolt-elements-borderColor gap-1.5 min-h-[34px] p-2">
            {Array.from({ length: terminalCount + 1 }, (_, index) => {
              const isActive = activeTerminal === index;

              return (
                <React.Fragment key={index}>
                  {index == 0 ? (
                    <button
                      key={index}
                      className={classNames(
                        'flex items-center text-sm cursor-pointer gap-1.5 px-3 py-2 h-full whitespace-nowrap rounded-full',
                        {
                          'bg-bolt-elements-terminals-buttonBackground text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary':
                            isActive,
                          'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-terminals-buttonBackground':
                            !isActive,
                        },
                      )}
                      onClick={() => setActiveTerminal(index)}
                    >
                      <div className="i-ph:terminal-window-duotone text-lg" />
                      Bolt Terminal
                    </button>
                  ) : (
                    <React.Fragment>
                      <button
                        key={index}
                        className={classNames(
                          'flex items-center text-sm cursor-pointer gap-1.5 px-3 py-2 h-full whitespace-nowrap rounded-full',
                          {
                            'bg-bolt-elements-terminals-buttonBackground text-bolt-elements-textPrimary': isActive,
                            'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-terminals-buttonBackground':
                              !isActive,
                          },
                        )}
                        onClick={() => setActiveTerminal(index)}
                      >
                        <div className="i-ph:terminal-window-duotone text-lg" />
                        Terminal {terminalCount > 1 && index}
                      </button>
                    </React.Fragment>
                  )}
                </React.Fragment>
              );
            })}
            {terminalCount < MAX_TERMINALS && <IconButton icon="i-ph:plus" size="md" onClick={addTerminal} />}
            <IconButton
              className="ml-auto"
              icon="i-ph:caret-down"
              title="Close"
              size="md"
              onClick={() => workbenchStore.toggleTerminal(false)}
            />
          </div>
          {Array.from({ length: terminalCount + 1 }, (_, index) => {
            const isActive = activeTerminal === index;

            logger.debug(`Starting bolt terminal [${index}]`);

            if (index == 0) {
              return (
                <DynamicTerminal
                  key={index}
                  id={`terminal_${index}`}
                  className={classNames('h-full overflow-hidden modern-scrollbar-invert', {
                    hidden: !isActive,
                  })}
                  ref={(ref) => {
                    terminalRefs.current.push(ref);
                  }}
                  onTerminalReady={(terminal) => workbenchStore.attachBoltTerminal(terminal)}
                  onTerminalResize={(cols, rows) => workbenchStore.onTerminalResize(cols, rows)}
                  theme={theme}
                />
              );
            } else {
              return (
                <DynamicTerminal
                  key={index}
                  id={`terminal_${index}`}
                  className={classNames('modern-scrollbar h-full overflow-hidden', {
                    hidden: !isActive,
                  })}
                  ref={(ref) => {
                    terminalRefs.current.push(ref);
                  }}
                  onTerminalReady={(terminal) => workbenchStore.attachTerminal(terminal)}
                  onTerminalResize={(cols, rows) => workbenchStore.onTerminalResize(cols, rows)}
                  theme={theme}
                />
              );
            }
          })}
        </div>
      </div>
    </Panel>
  );
});
