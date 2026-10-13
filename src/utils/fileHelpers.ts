/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoredFile } from '../types';

/**
 * Format bytes into human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Extract extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return (parts.pop() || '').toLowerCase();
  }
  return '';
}

/**
 * Determine high-level category of file
 */
export function getFileCategory(filename: string, contentType = ''): StoredFile['category'] {
  const ext = getFileExtension(filename);
  
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext) || contentType.startsWith('image/')) {
    return 'image';
  }
  if (['pdf', 'doc', 'docx', 'odt', 'rtf', 'tex', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'].includes(ext)) {
    return 'document';
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'html', 'css', 'json', 'xml', 'sql', 'md', 'sh', 'txt'].includes(ext)) {
    return 'code';
  }
  if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2'].includes(ext)) {
    return 'archive';
  }
  if (['mp3', 'wav', 'ogg', 'mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || contentType.startsWith('audio/') || contentType.startsWith('video/')) {
    return 'media';
  }
  return 'other';
}

/**
 * Format date timestamp to readable string
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'Just now';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Maps raw Firebase error codes to beginner-friendly student explanations
 */
export function mapFirebaseError(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const code = err.code || '';
  const message = err.message || '';

  switch (code) {
    case 'storage/unauthorized':
      return 'Permission Denied: Please sign in to access your private storage.';
    case 'storage/canceled':
      return 'Upload was canceled.';
    case 'storage/quota-exceeded':
      return 'Storage Quota Exceeded: Your cloud storage limit has been reached.';
    case 'storage/object-not-found':
      return 'File does not exist in the storage or was already deleted.';
    case 'storage/invalid-checksum':
      return 'Upload failed: File checksum mismatch during transfer.';
    case 'storage/retry-limit-exceeded':
      return 'Cloud storage service temporarily unreachable.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please log in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long for security.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/Password Authentication is not enabled in your Firebase Console. Go to Build > Authentication > Sign-in method and enable Email/Password.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Check your internet connection or browser ad-blockers.';
    default:
      if (message.includes('CORS') || message.includes('preflight')) {
        return 'CORS Error: Firebase Storage requires CORS headers configured for your bucket. Refer to Settings for the 1-minute fix.';
      }
      return message || 'An error occurred. Check browser console for detailed logs.';
  }
}
