/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Code2, 
  Archive, 
  Film, 
  RefreshCw, 
  LayoutGrid, 
  List, 
  SortAsc, 
  Filter, 
  HardDrive, 
  FolderLock,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { StoredFile } from '../types';
import { formatDate } from '../utils/fileHelpers';

interface FileListProps {
  files: StoredFile[];
  isLoading: boolean;
  onRefresh: () => void;
  onDownload: (file: StoredFile) => void;
  onPreview: (file: StoredFile) => void;
  onDeleteRequest: (file: StoredFile) => void;
  currentUserId?: string;
  isFirebaseActive: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  isLoading,
  onRefresh,
  onDownload,
  onPreview,
  onDeleteRequest,
  currentUserId,
  isFirebaseActive
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'size-desc' | 'size-asc'>('date-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyFileLink = (file: StoredFile) => {
    if (file.downloadUrl) {
      navigator.clipboard.writeText(file.downloadUrl);
      setCopiedId(file.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(f => f.name.toLowerCase().includes(q) || f.fullPath.toLowerCase().includes(q));
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(f => f.category === selectedCategory);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'size-desc') {
        return b.size - a.size;
      }
      if (sortBy === 'size-asc') {
        return a.size - b.size;
      }
      if (sortBy === 'date-asc') {
        const timeA = new Date(a.timeCreated || 0).getTime();
        const timeB = new Date(b.timeCreated || 0).getTime();
        return timeA - timeB;
      }
      // default: date-desc (newest first)
      const timeA = new Date(a.timeCreated || 0).getTime();
      const timeB = new Date(b.timeCreated || 0).getTime();
      return timeB - timeA;
    });

    return result;
  }, [files, searchQuery, selectedCategory, sortBy]);

  // Total statistics
  const totalSizeBytes = useMemo(() => files.reduce((acc, f) => acc + (f.size || 0), 0), [files]);
  const formattedTotalSize = useMemo(() => {
    if (totalSizeBytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(totalSizeBytes) / Math.log(k));
    return `${(totalSizeBytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }, [totalSizeBytes]);

  const getCategoryIcon = (category: StoredFile['category']) => {
    switch (category) {
      case 'document':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-600" />;
      case 'code':
        return <Code2 className="w-5 h-5 text-amber-600" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-purple-600" />;
      case 'media':
        return <Film className="w-5 h-5 text-emerald-600" />;
      default:
        return <File className="w-5 h-5 text-slate-600" />;
    }
  };

  const getCategoryBadgeClass = (category: StoredFile['category']) => {
    switch (category) {
      case 'document': return 'bg-red-50 text-red-700 border-red-200';
      case 'image': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'code': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'archive': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'media': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      
      {/* Top Controls Header */}
      <div className="p-5 border-b border-slate-200/80 space-y-4">
        
        {/* Title & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900">Stored Files</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Total Storage Consumed: <strong className="text-slate-800">{formattedTotalSize}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Fetch latest files from Cloud Storage"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-2xs text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-2xs text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files by name or extension..."
              className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'document', 'image', 'code', 'archive'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat === 'all' ? 'All Types' : cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="size-desc">Size (Largest)</option>
              <option value="size-asc">Size (Smallest)</option>
            </select>
          </div>

        </div>

      </div>

      {/* Main File Display Body */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Loading files...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="p-12 sm:p-16 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center">
            <HardDrive className="w-8 h-8 stroke-[1.6]" />
          </div>
          <div className="max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' ? (
              <>
                <h4 className="text-sm font-bold text-slate-800">No matching files found</h4>
                <p className="text-xs text-slate-500 mt-1">
                  No files matched your search or category filter. Try clearing your search term.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Clear Filters
                </button>
              </>
            ) : !currentUserId ? (
              <>
                <h4 className="text-sm font-bold text-slate-800">Demo Storage is Empty</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a file above to test storage, or sign in to access your private account.
                </p>
              </>
            ) : (
              <>
                <h4 className="text-sm font-bold text-slate-800">Your Storage is Empty</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a file above to store it in your private account.
                </p>
              </>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE / LIST VIEW */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 sm:px-6">File Name</th>
                <th className="py-3 px-4 hidden md:table-cell">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4 hidden sm:table-cell">Uploaded On</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFiles.map((file) => (
                <tr 
                  key={file.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  {/* File Name & Icon */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs">
                        {getCategoryIcon(file.category)}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => onPreview(file)}
                          className="font-bold text-slate-900 hover:text-blue-600 truncate block text-left max-w-[200px] sm:max-w-xs transition-colors"
                          title={file.name}
                        >
                          {file.name}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(file.category)}`}>
                            {file.extension.toUpperCase() || 'FILE'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono sm:hidden">
                            {file.formattedSize}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <span className="text-slate-600 capitalize text-xs">
                      {file.category}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                    {file.formattedSize}
                  </td>

                  {/* Upload Date */}
                  <td className="py-3.5 px-4 hidden sm:table-cell text-slate-500 whitespace-nowrap text-[11px]">
                    {formatDate(file.timeCreated)}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {/* Preview Button */}
                      <button
                        onClick={() => onPreview(file)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Preview File"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Download Button */}
                      <button
                        onClick={() => onDownload(file)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Download to Device"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Copy Link */}
                      <button
                        onClick={() => copyFileLink(file)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Copy Public/Direct Cloud Link"
                      >
                        {copiedId === file.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => onDeleteRequest(file)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete from Cloud Storage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/40 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
                    {getCategoryIcon(file.category)}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(file.category)}`}>
                    {file.extension.toUpperCase() || 'FILE'}
                  </span>
                </div>

                <button
                  onClick={() => onPreview(file)}
                  className="font-bold text-slate-900 hover:text-blue-600 text-left text-xs line-clamp-2 block transition-colors"
                  title={file.name}
                >
                  {file.name}
                </button>
                <p className="text-[11px] text-slate-400 mt-2">
                  {formatDate(file.timeCreated)}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-slate-700 text-[11px]">
                  {file.formattedSize}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onPreview(file)}
                    className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50"
                    title="Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDownload(file)}
                    className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-emerald-50"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => copyFileLink(file)}
                    className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-indigo-50"
                    title="Copy Link"
                  >
                    {copiedId === file.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onDeleteRequest(file)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer count */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>{filteredFiles.length} of {files.length} items</span>
      </div>

    </div>
  );
};
