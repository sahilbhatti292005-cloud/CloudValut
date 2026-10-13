/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Code2, 
  HardDrive, 
  Calendar, 
  ShieldCheck,
  FolderLock
} from 'lucide-react';
import { StoredFile } from '../types';
import { formatDate } from '../utils/fileHelpers';

interface FilePreviewModalProps {
  file: StoredFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: StoredFile) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !file) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText(file.downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isImage = file.category === 'image';
  const isPdf = file.extension === 'pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate" title={file.name}>
                {file.name}
              </h2>
              <p className="text-xs text-slate-500">
                {file.formattedSize} • {file.category.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Content Area */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-50/30">
          {isImage ? (
            <div className="w-full flex items-center justify-center max-h-[380px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={file.downloadUrl}
                alt={file.name}
                className="max-h-[360px] max-w-full object-contain rounded-lg shadow-2xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : isPdf ? (
            <div className="p-8 text-center space-y-3 bg-red-50/50 rounded-2xl border border-red-100 max-w-md w-full">
              <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Portable Document Format (PDF)</h3>
              <p className="text-xs text-slate-500">
                You can download the PDF directly or open it in a new browser tab to view its pages.
              </p>
              <div className="pt-2">
                <a
                  href={file.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open PDF in New Tab</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3 bg-slate-100/70 rounded-2xl border border-slate-200 max-w-md w-full">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-slate-600 mx-auto flex items-center justify-center">
                <HardDrive className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Binary / Document File</h3>
              <p className="text-xs text-slate-500">
                Direct in-browser render not applicable for this file type. Click download to retrieve original content.
              </p>
              <button
                onClick={() => onDownload(file)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          )}

          {/* Detailed Metadata Grid */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">File Size</span>
              <span className="text-xs font-bold text-slate-800 font-mono">{file.formattedSize}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Content Type</span>
              <span className="text-xs font-medium text-slate-800 truncate block font-mono" title={file.contentType}>
                {file.contentType}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Upload Date</span>
              <span className="text-xs font-medium text-slate-800 truncate block">
                {formatDate(file.timeCreated)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
              <span className="text-xs font-semibold text-slate-800 capitalize block">
                {file.category}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={copyUrl}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Direct Link Copied!' : 'Copy Direct Link'}</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => onDownload(file)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
