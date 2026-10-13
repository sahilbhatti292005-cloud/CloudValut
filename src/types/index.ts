/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface StoredFile {
  id: string;
  name: string;
  fullPath: string;
  size: number;
  formattedSize: string;
  contentType: string;
  timeCreated: string;
  updated: string;
  downloadUrl: string;
  category: 'document' | 'image' | 'code' | 'archive' | 'media' | 'other';
  extension: string;
  ownerUid?: string;
}

export interface UploadProgress {
  fileName: string;
  fileSize: number;
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'error';
  errorMessage?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous?: boolean;
}

export interface ProjectStats {
  totalFiles: number;
  totalBytes: number;
  formattedTotalSize: string;
  documentCount: number;
  imageCount: number;
  codeCount: number;
  otherCount: number;
}
