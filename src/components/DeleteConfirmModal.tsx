/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { StoredFile } from '../types';

interface DeleteConfirmModalProps {
  file: StoredFile | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: StoredFile) => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  file,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in duration-200">
        
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1">
            Delete File from Cloud Storage?
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            You are about to delete <strong className="text-slate-800 break-all">{file.name}</strong> from your CloudVault repository.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 mb-5 flex items-center justify-between">
            <span className="text-slate-500 font-medium truncate max-w-[200px]">{file.name}</span>
            <span className="font-mono text-slate-700 text-xs font-semibold">{file.formattedSize}</span>
          </div>

          <div className="p-3 bg-red-50 border border-red-200/80 rounded-xl text-xs text-red-700 leading-relaxed mb-6">
            <strong>Permanent Action:</strong> Once deleted from Google Cloud Storage, this object cannot be recovered.
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(file)}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-red-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete File</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
