/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowUpCircle
} from 'lucide-react';
import { AuthUser, UploadProgress } from '../types';
import { formatBytes } from '../utils/fileHelpers';

interface FileUploadAreaProps {
  onUpload: (file: File) => Promise<void>;
  uploadProgress: UploadProgress | null;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onUpload,
  uploadProgress
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setFileError(null);

    // Validation 1: Size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size (${formatBytes(file.size)}) exceeds max limit: 25 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size === 0) {
      setFileError('The selected file is empty (0 bytes).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      await onUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // Handled in parent or error progress
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-blue-600" />
          <span>Upload File</span>
        </h2>
      </div>

      {/* Main Drag-and-Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="w-12 h-12 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shadow-xs">
            <ArrowUpCircle className="w-7 h-7 stroke-[1.8]" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              <span className="text-blue-600 underline underline-offset-2">Click to Browse</span> or drag and drop files
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Max limit: 25 MB per file
            </p>
          </div>
        </div>
      </div>

      {/* Validation error */}
      {fileError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{fileError}</span>
          </div>
          <button 
            onClick={() => setFileError(null)} 
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Upload Progress Card */}
      {uploadProgress && (
        <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-bold text-slate-800 truncate" title={uploadProgress.fileName}>
                  {uploadProgress.fileName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatBytes(uploadProgress.bytesTransferred)} / {formatBytes(uploadProgress.totalBytes)} ({uploadProgress.percentage}%)
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {uploadProgress.state === 'running' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 animate-pulse">
                  Uploading...
                </span>
              )}
              {uploadProgress.state === 'success' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Uploaded
                </span>
              )}
              {uploadProgress.state === 'error' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  Failed
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                uploadProgress.state === 'error'
                  ? 'bg-red-500'
                  : uploadProgress.state === 'success'
                  ? 'bg-emerald-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </div>

          {uploadProgress.errorMessage && (
            <p className="text-[11px] text-red-600 mt-2 font-medium">
              {uploadProgress.errorMessage}
            </p>
          )}
        </div>
      )}

    </div>
  );
};
