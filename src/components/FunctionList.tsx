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

  const handleSelectAllMatched = () => {
    filteredOperations.forEach(op => {
      if (op && !selectedOperations.has(op.operationId)) {
        onToggleSelect(op.operationId);
      }
    });
  };

  const handleUnselectAllMatched = () => {
    filteredOperations.forEach(op => {
      if (op && selectedOperations.has(op.operationId)) {
        onToggleSelect(op.operationId);
      }
    });
  };

  const handleSelectAll = () => {
    operations.forEach(op => {
      if (op && !selectedOperations.has(op.operationId)) {
        onToggleSelect(op.operationId);
      }
    });
  };

  const handleUnselectAll = () => {
    operations.forEach(op => {
      if (op && selectedOperations.has(op.operationId)) {
        onToggleSelect(op.operationId);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search functions..."
          className="flex-grow px-3 py-2 border rounded-lg"
        />
        <button
          onClick={handleSelectAll}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Select All
        </button>
        <button
          onClick={handleUnselectAll}
          className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Unselect All
        </button>
        <button
          onClick={handleSelectAllMatched}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Select Matched
        </button>
        <button
          onClick={handleUnselectAllMatched}
          className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Unselect Matched
        </button>
      </div>

      <div className="space-y-2">
        {filteredOperations.map((op, index) => op && (
          <div key={op.operationId} className="flex items-center space-x-4 p-2 hover:bg-gray-100 rounded">
            <input
              type="checkbox"
              checked={selectedOperations.has(op.operationId)}
              onChange={() => {}} // Required for controlled component
              onClick={(e) => handleCheckboxChange(index, op.operationId, e)}
              className="h-4 w-4 cursor-pointer"
            />
            <span className="inline-block w-20 font-mono text-sm">{op.method}</span>
            <span className="flex-grow">{op.path}</span>
            <button
              onClick={() => onDelete(op.operationId)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 