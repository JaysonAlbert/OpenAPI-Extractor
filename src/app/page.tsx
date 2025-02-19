'use client';

import { useState } from 'react';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import { FileUpload } from '@/components/FileUpload';
import { FunctionList } from '@/components/FunctionList';
import { OpenAPIEditor } from '@/lib/OpenAPIEditor';
import { OpenAPIDocument } from '@/lib/types/OpenAPITypes';

const downloadYaml = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/yaml' });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function Home() {
  const [document, setDocument] = useState<OpenAPIDocument | null>(null);
  const [editor, setEditor] = useState<OpenAPIEditor | null>(null);
  const [selectedOperations, setSelectedOperations] = useState<Set<string>>(new Set());

  const handleFileLoad = (content: string) => {
    try {
      const doc = yamlLoad(content) as OpenAPIDocument;
      setDocument(doc);
      setEditor(new OpenAPIEditor(doc));
    } catch (error) {
      alert('Error loading YAML file: ' + (error as Error).message);
    }
  };

  const handleDelete = (operationId: string) => {
    if (editor) {
      editor.deleteFunction(operationId);
      setDocument({ ...editor.getDocument() });
      setSelectedOperations(prev => {
        const next = new Set(prev);
        next.delete(operationId);
        return next;
      });
    }
  };

  const handleDeleteSelected = () => {
    if (editor && selectedOperations.size > 0) {
      selectedOperations.forEach(operationId => {
        editor.deleteFunction(operationId);
      });
      setDocument({ ...editor.getDocument() });
      setSelectedOperations(new Set());
    }
  };

  const handleToggleSelect = (operationId: string) => {
    setSelectedOperations(prev => {
      const next = new Set(prev);
      if (next.has(operationId)) {
        next.delete(operationId);
      } else {
        next.add(operationId);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (editor) {
      const updatedYaml = yamlDump(editor.getDocument(), {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });
      downloadYaml(updatedYaml, 'openapi.updated.yaml');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">OpenAPI Editor</h1>
      
      <div className="mb-8">
        <FileUpload onFileLoad={handleFileLoad} />
      </div>

      {document && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Functions</h2>
          <FunctionList
            paths={document.paths}
            onDelete={handleDelete}
            selectedOperations={selectedOperations}
            onToggleSelect={handleToggleSelect}
          />
          <div className="mt-4 space-x-4">
            {selectedOperations.size > 0 && (
              <button 
                onClick={handleDeleteSelected}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Delete Selected ({selectedOperations.size})
              </button>
            )}
            <button 
              onClick={handleSave}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </main>
  );
} 