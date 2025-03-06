'use client';

import { Operation, PathItem } from '../lib/types/OpenAPITypes';
import { useRef, useState } from 'react';

interface FunctionInfo {
  operationId: string;
  method: string;
  path: string;
  summary?: string;
}

interface FunctionListProps {
  paths: Record<string, any>;
  onDelete: (operationId: string) => void;
  selectedOperations: Set<string>;
  onToggleSelect: (operationId: string) => void;
}

export function FunctionList({ paths, onDelete, selectedOperations, onToggleSelect }: FunctionListProps) {
  const lastCheckedRef = useRef<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const operations = Object.entries(paths).flatMap(([path, pathItem]) => {
    return Object.entries(pathItem).map(([method, operation]) => {
      if (typeof operation === 'object' && operation && 'operationId' in operation) {
        return {
          path,
          method: method.toUpperCase(),
          operationId: operation.operationId as string,
          summary: operation.summary as string
        };
      }
      return null;
    }).filter(Boolean);
  });

  const filteredOperations = operations.filter(op => {
    if (!op) return false;
    const searchLower = searchTerm.toLowerCase();
    return op.operationId.toLowerCase().includes(searchLower) ||
           op.path.toLowerCase().includes(searchLower) ||
           op.method.toLowerCase().includes(searchLower) ||
           op.summary?.toLowerCase().includes(searchLower);
  });

  const handleCheckboxChange = (index: number, operationId: string, event: React.MouseEvent<HTMLInputElement>) => {
    const isShiftClick = event.shiftKey;
    
    if (isShiftClick && lastCheckedRef.current !== null) {
      const start = Math.min(lastCheckedRef.current, index);
      const end = Math.max(lastCheckedRef.current, index);
      
      const operationsToToggle = filteredOperations
        .slice(start, end + 1)
        .map(op => op?.operationId)
        .filter((id): id is string => id !== undefined);

      const isChecking = !selectedOperations.has(operationId);
      
      operationsToToggle.forEach(id => {
        if (isChecking && !selectedOperations.has(id)) {
          onToggleSelect(id);
        } else if (!isChecking && selectedOperations.has(id)) {
          onToggleSelect(id);
        }
      });
    } else {
      onToggleSelect(operationId);
    }
    
    lastCheckedRef.current = index;
  };

  const handleSelectAll = () => {
    const targetOperations = searchTerm ? filteredOperations : operations;
    targetOperations.forEach(op => {
      if (op && !selectedOperations.has(op.operationId)) {
        onToggleSelect(op.operationId);
      }
    });
  };

  const handleUnselectAll = () => {
    const targetOperations = searchTerm ? filteredOperations : operations;
    targetOperations.forEach(op => {
      if (op && selectedOperations.has(op.operationId)) {
        onToggleSelect(op.operationId);
      }
    });
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800',
      OPTIONS: 'bg-gray-100 text-gray-800',
      HEAD: 'bg-indigo-100 text-indigo-800'
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search functions..."
            className="w-full px-4 py-3 border rounded-lg pl-10 
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                      transition-all duration-200"
          />
          <svg 
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 
                     transition-colors duration-200 inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Select All
          </button>
          <button
            onClick={handleUnselectAll}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 
                     transition-colors duration-200 inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm1 8a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            Unselect All
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredOperations.map((op, index) => op && (
          <div 
            key={op.operationId} 
            className="flex items-center space-x-4 p-4 bg-white border rounded-lg
                     hover:shadow-md transition-all duration-200"
          >
            <input
              type="checkbox"
              checked={selectedOperations.has(op.operationId)}
              onChange={() => {}} // Required for controlled component
              onClick={(e) => handleCheckboxChange(index, op.operationId, e)}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 
                        focus:ring-blue-500 cursor-pointer transition-colors duration-200"
            />
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getMethodColor(op.method)}`}>
              {op.method}
            </span>
            <div className="flex-grow">
              <div className="font-medium text-gray-900">{op.path}</div>
              {op.summary && (
                <div className="text-sm text-gray-500 mt-1">{op.summary}</div>
              )}
            </div>
            <button
              onClick={() => onDelete(op.operationId)}
              className="text-gray-400 hover:text-red-500 transition-colors duration-200"
            >
              <svg 
                className="h-5 w-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 