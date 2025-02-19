'use client'

import { OpenAPIEditor } from '@/lib/OpenAPIEditor'

interface DeleteButtonProps {
  editor: OpenAPIEditor;
  operationId: string;
  onDelete: () => void;
}

export function DeleteButton({ editor, operationId, onDelete }: DeleteButtonProps) {
  const handleDelete = () => {
    editor.deleteFunction(operationId);
    onDelete();
  };

  return (
    <button onClick={handleDelete}>
      Delete
    </button>
  );
} 