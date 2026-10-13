/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  HardDrive, 
  FileText, 
  Image as ImageIcon, 
  Code2, 
  Archive, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { StoredFile, AuthUser } from '../types';

interface StorageStatsCardProps {
  files: StoredFile[];
  user: AuthUser | null;
  onOpenAuth: () => void;
}

export const StorageStatsCard: React.FC<StorageStatsCardProps> = ({
  files,
  user,
  onOpenAuth
}) => {
  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const docCount = files.filter(f => f.category === 'document').length;
  const imgCount = files.filter(f => f.category === 'image').length;
  const codeCount = files.filter(f => f.category === 'code').length;
  const archiveCount = files.filter(f => f.category === 'archive').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-600" />
          <span>Storage Overview</span>
        </h3>
        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
          {formatSize(totalBytes)}
        </span>
      </div>

      {/* Progress Bar / Usage */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
          <span>{files.length} {files.length === 1 ? 'file stored' : 'files stored'}</span>
          <span>Max 25 MB / file</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
          <div 
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(5, (files.length > 0 ? 15 + files.length * 5 : 0)))}%` }}
          />
        </div>
      </div>

      {/* Category breakdown grid */}
      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Docs</span>
            <span className="font-bold text-slate-800 text-xs">{docCount}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Images</span>
            <span className="font-bold text-slate-800 text-xs">{imgCount}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Code</span>
            <span className="font-bold text-slate-800 text-xs">{codeCount}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Archive className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Archives</span>
            <span className="font-bold text-slate-800 text-xs">{archiveCount}</span>
          </div>
        </div>
      </div>

      {/* Account status note */}
      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        {user ? (
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Private Storage Vault</span>
          </span>
        ) : (
          <button
            onClick={onOpenAuth}
            className="text-blue-600 hover:underline font-semibold"
          >
            Sign in to unlock private storage
          </button>
        )}
        <span className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Encrypted</span>
        </span>
      </div>
    </div>
  );
};
