"use client";

import { useCallback, useEffect, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { writeFile } from './webcontainer-manager';

interface CodeEditorProps {
  filePath: string;
  content: string;
  onChange?: (content: string) => void;
  className?: string;
}

export function CodeEditor({ filePath, content, onChange, className = '' }: CodeEditorProps) {
  const [code, setCode] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update code when content changes
  useEffect(() => {
    setCode(content);
  }, [content]);

  // Get language from file extension
  const getLanguage = useCallback((path: string) => {
    const extension = path.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'jsx':
        return 'jsx';
      case 'ts':
        return 'typescript';
      case 'tsx':
        return 'tsx';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'javascript';
    }
  }, []);

  // Handle code changes
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onChange?.(newCode);
  }, [onChange]);

  // Save changes to file
  const handleSave = useCallback(async () => {
    if (!filePath) return;
    
    try {
      setIsSaving(true);
      await writeFile(filePath, code);
      setIsEditing(false);
      toast.success(`Saved ${filePath}`);
    } catch (error) {
      console.error(`Failed to save ${filePath}:`, error);
      toast.error(`Failed to save ${filePath}`);
    } finally {
      setIsSaving(false);
    }
  }, [filePath, code]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Save on Ctrl+S or Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  if (!filePath) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-gray-500">Select a file to edit</div>
      </div>
    );
  }

  const language = getLanguage(filePath);

  return (
    <div className={`relative ${className}`}>
      <div className="flex justify-between items-center p-2 border-b dark:border-gray-700">
        <div className="font-mono text-sm truncate">{filePath}</div>
        <div>
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full min-h-[400px] p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none"
          spellCheck={false}
          autoComplete="off"
        />
      ) : (
        <div className="overflow-auto">
          <Highlight
            theme={themes.nightOwl}
            code={code}
            language={language}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre className={`${className} p-4 overflow-auto`} style={style}>
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line, key: i })}>
                    <span className="inline-block w-8 text-right mr-2 text-gray-500 select-none">
                      {i + 1}
                    </span>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      )}
    </div>
  );
}
