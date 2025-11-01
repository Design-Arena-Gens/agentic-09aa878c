'use client';

import { Upload } from 'lucide-react';
import { useRef } from 'react';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File) => void;
  accept?: string;
}

export default function FileUpload({ label, onFileSelect, accept = '.csv' }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors flex flex-col items-center gap-2"
      >
        <Upload className="w-8 h-8 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-xs text-gray-400">CSV format</span>
      </button>
    </div>
  );
}
