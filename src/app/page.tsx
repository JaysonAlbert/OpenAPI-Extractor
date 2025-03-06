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
  const [yamlContent, setYamlContent] = useState<string>('');

  const handleFileLoad = (content: string) => {
    try {
      const doc = yamlLoad(content) as OpenAPIDocument;
      setDocument(doc);
      setEditor(new OpenAPIEditor(doc));
      setYamlContent(content);
    } catch (error) {
      alert('Error loading YAML file: ' + (error as Error).message);
    }
  };

  const handleYamlPaste = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = event.target.value;
    setYamlContent(content);
    try {
      const doc = yamlLoad(content) as OpenAPIDocument;
      setDocument(doc);
      setEditor(new OpenAPIEditor(doc));
    } catch (error) {
      // Don't show error while typing
      if (content.trim()) {
        setDocument(null);
        setEditor(null);
      }
    }
  };

  const handleCopyToClipboard = () => {
    if (editor) {
      const updatedYaml = yamlDump(editor.getDocument(), {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });
      navigator.clipboard.writeText(updatedYaml)
        .then(() => alert('Content copied to clipboard!'))
        .catch(err => alert('Failed to copy content: ' + err.message));
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
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">OpenAPI Editor</h1>
          <p className="text-gray-600">Upload, edit, and manage your OpenAPI specifications</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 transition-all duration-200 hover:shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload or Paste YAML</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200">
              <FileUpload onFileLoad={handleFileLoad} />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Or paste YAML content
              </label>
              <textarea
                value={yamlContent}
                onChange={handleYamlPaste}
                placeholder="Paste your OpenAPI YAML content here..."
                className="w-full h-[200px] p-4 border rounded-lg font-mono text-sm bg-gray-50 
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                          transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {document && (
          <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-200 hover:shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Functions</h2>
              <div className="space-x-4">
                {selectedOperations.size > 0 && (
                  <button 
                    onClick={handleDeleteSelected}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg
                              transition-colors duration-200 inline-flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete Selected ({selectedOperations.size})
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg
                            transition-colors duration-200 inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Changes
                </button>
                <button 
                  onClick={handleCopyToClipboard}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg
                            transition-colors duration-200 inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copy to Clipboard
                </button>
              </div>
            </div>
            <FunctionList
              paths={document.paths}
              onDelete={handleDelete}
              selectedOperations={selectedOperations}
              onToggleSelect={handleToggleSelect}
            />
          </div>
        )}
      </div>
    </main>
  );
} 