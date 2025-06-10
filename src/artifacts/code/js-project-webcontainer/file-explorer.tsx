"use client";

import { useCallback, useEffect, useState } from 'react';
import { listFiles, readFile } from './webcontainer-manager';
import { FileIcon, ChevronDownIcon } from '@/components/icons';

interface FileExplorerProps {
  onFileSelect: (path: string, content: string) => void;
  className?: string;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileNode[];
  isExpanded: boolean;
}

export function FileExplorer({ onFileSelect, className = '' }: FileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Build file tree recursively
  const buildFileTree = useCallback(async (path: string = '/'): Promise<FileNode> => {
    try {
      const files = await listFiles(path);
      const children: FileNode[] = [];
      
      for (const file of files) {
        // Skip hidden files and node_modules
        if (file.startsWith('.') || file === 'node_modules') continue;
        
        const filePath = path === '/' ? `/${file}` : `${path}/${file}`;
        
        try {
          // Check if it's a directory by trying to list files
          const subFiles = await listFiles(filePath);
          
          // It's a directory
          const directoryNode: FileNode = {
            name: file,
            path: filePath,
            isDirectory: true,
            children: [],
            isExpanded: false,
          };
          
          // Only expand first level directories by default
          if (path === '/') {
            directoryNode.isExpanded = true;
            // Recursively build children for first level directories
            const subTree = await buildFileTree(filePath);
            directoryNode.children = subTree.children;
          }
          
          children.push(directoryNode);
        } catch (error) {
          // It's a file
          children.push({
            name: file,
            path: filePath,
            isDirectory: false,
            children: [],
            isExpanded: false,
          });
        }
      }
      
      // Sort: directories first, then files, both alphabetically
      children.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      
      return {
        name: path === '/' ? 'root' : path.split('/').pop() || '',
        path,
        isDirectory: true,
        children,
        isExpanded: true,
      };
    } catch (error) {
      console.error(`Failed to build file tree for ${path}:`, error);
      return {
        name: path === '/' ? 'root' : path.split('/').pop() || '',
        path,
        isDirectory: true,
        children: [],
        isExpanded: true,
      };
    }
  }, []);

  // Initialize file tree
  useEffect(() => {
    const initFileTree = async () => {
      try {
        setLoading(true);
        const tree = await buildFileTree();
        setFileTree(tree);
        
        // Select package.json by default if it exists
        const packageJsonNode = tree.children.find(node => node.name === 'package.json');
        if (packageJsonNode) {
          handleFileSelect(packageJsonNode.path);
        }
      } catch (error) {
        console.error('Failed to initialize file tree:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initFileTree();
  }, [buildFileTree]);

  // Handle file selection
  const handleFileSelect = useCallback(async (path: string) => {
    try {
      const content = await readFile(path);
      setSelectedFile(path);
      onFileSelect(path, content);
    } catch (error) {
      console.error(`Failed to read file ${path}:`, error);
    }
  }, [onFileSelect]);

  // Toggle directory expansion
  const toggleDirectory = useCallback((node: FileNode) => {
    if (!node.isDirectory) return;
    
    setFileTree(prevTree => {
      if (!prevTree) return prevTree;
      
      // Helper function to update node recursively
      const updateNode = (currentNode: FileNode): FileNode => {
        if (currentNode.path === node.path) {
          // Toggle expansion
          return {
            ...currentNode,
            isExpanded: !currentNode.isExpanded,
          };
        }
        
        // Update children recursively
        if (currentNode.children.length > 0) {
          return {
            ...currentNode,
            children: currentNode.children.map(updateNode),
          };
        }
        
        return currentNode;
      };
      
      return updateNode(prevTree);
    });
    
    // If expanding, load children if not already loaded
    if (!node.isExpanded && node.children.length === 0) {
      buildFileTree(node.path).then(updatedNode => {
        setFileTree(prevTree => {
          if (!prevTree) return prevTree;
          
          // Helper function to update node with children
          const updateNodeWithChildren = (currentNode: FileNode): FileNode => {
            if (currentNode.path === node.path) {
              return {
                ...currentNode,
                children: updatedNode.children,
                isExpanded: true,
              };
            }
            
            // Update children recursively
            if (currentNode.children.length > 0) {
              return {
                ...currentNode,
                children: currentNode.children.map(updateNodeWithChildren),
              };
            }
            
            return currentNode;
          };
          
          return updateNodeWithChildren(prevTree);
        });
      });
    }
  }, [buildFileTree]);

  // Render file tree node
  const renderNode = useCallback((node: FileNode) => {
    return (
      <div key={node.path} className="pl-2">
        <div 
          className={`flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer ${
            selectedFile === node.path ? 'bg-blue-100 dark:bg-blue-900' : ''
          }`}
          onClick={() => node.isDirectory ? toggleDirectory(node) : handleFileSelect(node.path)}
        >
          {node.isDirectory ? (
            <>
              <span className="mr-1">
                {node.isExpanded ? 
                  <ChevronDownIcon /> : 
                  <span style={{ transform: 'rotate(-90deg)', display: 'inline-block' }}>
                    <ChevronDownIcon />
                  </span>
                }
              </span>
              <span className="mr-2 text-yellow-500">📁</span>
            </>
          ) : (
            <span className="ml-5 mr-2 text-blue-500"><FileIcon /></span>
          )}
          <span className="text-sm truncate">{node.name}</span>
        </div>
        
        {node.isDirectory && node.isExpanded && (
          <div className="ml-2 border-l dark:border-gray-700">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  }, [handleFileSelect, selectedFile, toggleDirectory]);

  if (loading) {
    return (
      <div className={`p-2 ${className}`}>
        <div className="animate-pulse">Loading files...</div>
      </div>
    );
  }

  if (!fileTree) {
    return (
      <div className={`p-2 ${className}`}>
        <div className="text-red-500">Failed to load file tree</div>
      </div>
    );
  }

  return (
    <div className={`overflow-auto ${className}`}>
      <div className="p-2">
        <div className="font-medium mb-2">Files</div>
        {fileTree.children.map(node => renderNode(node))}
      </div>
    </div>
  );
}
