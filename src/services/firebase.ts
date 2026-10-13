/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  listAll, 
  deleteObject, 
  getMetadata,
  FirebaseStorage 
} from 'firebase/storage';
import { FirebaseConfig, StoredFile, AuthUser } from '../types';
import { formatBytes, getFileCategory, getFileExtension } from '../utils/fileHelpers';

const CONFIG_STORAGE_KEY = 'cloudvault_firebase_config';
const SANDBOX_STORAGE_KEY = 'cloudvault_sandbox_files';

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;

const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyDVe8CzvK_3BTLHPG1iqmTVZ0jx-94ERGo",
  authDomain: "cloudvault-b81f4.firebaseapp.com",
  projectId: "cloudvault-b81f4",
  storageBucket: "cloudvault-b81f4.firebasestorage.app",
  messagingSenderId: "1018559928703",
  appId: "1:1018559928703:web:b41c6cda824def50c8e24a"
};

/**
 * Returns saved configuration from localStorage or default Firebase project configuration
 */
export function getStoredFirebaseConfig(): FirebaseConfig | null {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId && parsed.storageBucket) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse issues
  }

  // Check if Vite environment variables are provided
  const envConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  };

  if (envConfig.apiKey && envConfig.projectId && envConfig.storageBucket) {
    return envConfig;
  }

  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Initializes or re-initializes Firebase with the given or stored configuration
 */
export function initFirebase(customConfig?: FirebaseConfig): { app: FirebaseApp | null; auth: Auth | null; storage: FirebaseStorage | null } {
  const config = customConfig || getStoredFirebaseConfig();
  
  if (!config || !config.apiKey || !config.projectId || !config.storageBucket) {
    appInstance = null;
    authInstance = null;
    storageInstance = null;
    return { app: null, auth: null, storage: null };
  }

  try {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(config);
    }
    authInstance = getAuth(appInstance);
    storageInstance = getStorage(appInstance);
    // Limit max retry time to 4 seconds to prevent blocking UI
    storageInstance.maxOperationRetryTime = 4000;
    return { app: appInstance, auth: authInstance, storage: storageInstance };
  } catch (err) {
    console.error('Failed to initialize Firebase SDK:', err);
    return { app: null, auth: null, storage: null };
  }
}

/**
 * Checks if Firebase has valid initialized instances
 */
export function isFirebaseReady(): boolean {
  return !!(authInstance && storageInstance);
}

/**
 * Saves custom config to localStorage and reinitializes SDK
 */
export function saveFirebaseConfig(config: FirebaseConfig): boolean {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    initFirebase(config);
    return true;
  } catch (err) {
    console.error('Failed to save Firebase config:', err);
    return false;
  }
}

/**
 * Removes custom config
 */
export function clearFirebaseConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  appInstance = null;
  authInstance = null;
  storageInstance = null;
}

/* ============================================================
   AUTHENTICATION & USER REGISTRY METHODS
   ============================================================ */

const USERS_STORAGE_KEY = 'cloudvault_registered_users';

interface RegisteredUserRecord {
  uid: string;
  email: string;
  password: string;
  createdAt: string;
}

export function getRegisteredUsers(): RegisteredUserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUser(record: RegisteredUserRecord) {
  const users = getRegisteredUsers();
  users.push(record);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export async function registerWithEmail(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Try Firebase Auth first if available
  if (authInstance) {
    try {
      const credential = await createUserWithEmailAndPassword(authInstance, normalizedEmail, password);
      // Generate consistent UID for account isolation
      const record: RegisteredUserRecord = {
        uid: credential.user.uid,
        email: normalizedEmail,
        password: password,
        createdAt: new Date().toISOString()
      };
      saveRegisteredUser(record);

      return {
        uid: credential.user.uid,
        email: normalizedEmail,
        displayName: normalizedEmail.split('@')[0],
        isAnonymous: false
      };
    } catch (fbErr: any) {
      if (
        fbErr.code === 'auth/email-already-in-use' || 
        fbErr.code === 'auth/weak-password' || 
        fbErr.code === 'auth/invalid-email'
      ) {
        throw fbErr;
      }
    }
  }

  // 2. Local Account Registry
  const users = getRegisteredUsers();
  const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('An account already exists with this email address. Please sign in instead.');
  }

  // Generate unique user UID based on email hash
  let hash = 0;
  for (let i = 0; i < normalizedEmail.length; i++) {
    hash = ((hash << 5) - hash) + normalizedEmail.charCodeAt(i);
    hash |= 0;
  }
  const userUid = 'usr_' + Math.abs(hash).toString(36);

  const newUser: RegisteredUserRecord = {
    uid: userUid,
    email: normalizedEmail,
    password: password,
    createdAt: new Date().toISOString()
  };
  saveRegisteredUser(newUser);

  return {
    uid: userUid,
    email: normalizedEmail,
    displayName: normalizedEmail.split('@')[0],
    isAnonymous: false
  };
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check local registered user database first
  const users = getRegisteredUsers();
  const userRecord = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (userRecord) {
    if (userRecord.password !== password) {
      throw new Error('Incorrect password. Please verify your credentials and try again.');
    }
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.email.split('@')[0],
      isAnonymous: false
    };
  }

  // 2. Try Firebase Auth if not in local registry
  if (authInstance) {
    try {
      const credential = await signInWithEmailAndPassword(authInstance, normalizedEmail, password);
      return {
        uid: credential.user.uid,
        email: credential.user.email || normalizedEmail,
        displayName: (credential.user.email || normalizedEmail).split('@')[0],
        isAnonymous: false
      };
    } catch (fbErr: any) {
      if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        throw fbErr;
      }
    }
  }

  throw new Error('No account found with this email. Please click Create Account.');
}

export async function logOut(): Promise<void> {
  if (authInstance) {
    try {
      await signOut(authInstance);
    } catch {
      // Ignore
    }
  }
}

export function subscribeAuthState(callback: (user: AuthUser | null) => void): () => void {
  if (!authInstance) {
    return () => {};
  }
  return onAuthStateChanged(authInstance, (user: FirebaseUser | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: user.isAnonymous
      });
    } else {
      callback(null);
    }
  });
}

/* ============================================================
   FIREBASE CLOUD STORAGE METHODS
   ============================================================ */

/**
 * Uploads a file to Firebase Cloud Storage with real-time progress tracking
 * Stored at: users/{userUid}/{filename} for authenticated users,
 * or guest_uploads/{filename} if user is not logged in.
 */
export function uploadFileToCloud(
  file: File,
  userUid: string | null,
  onProgress: (progress: number, bytesTransferred: number, totalBytes: number) => void
): Promise<StoredFile> {
  return new Promise((resolve, reject) => {
    if (!storageInstance) {
      reject(new Error('Firebase Cloud Storage is not initialized. Please configure your Firebase credentials.'));
      return;
    }

    // Sanitize filename and build path
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folderPath = userUid ? `users/${userUid}` : 'public_uploads';
    const storagePath = `${folderPath}/${sanitizedName}`;

    const storageRef = ref(storageInstance, storagePath);
    
    // Metadata for Cloud Storage
    const metadata = {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        originalName: file.name,
        uploadedBy: userUid || 'guest',
        clientTimestamp: new Date().toISOString()
      }
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    // Handshake timeout: if 0 bytes transferred after 4.5 seconds (CORS preflight blocked or bucket not created)
    let hasTransferredBytes = false;
    const handshakeTimeout = setTimeout(() => {
      if (!hasTransferredBytes) {
        try {
          uploadTask.cancel();
        } catch {}
        reject(new Error('CORS_OR_BUCKET_TIMEOUT'));
      }
    }, 4500);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.bytesTransferred > 0) {
          hasTransferredBytes = true;
          clearTimeout(handshakeTimeout);
        }
        const progress = snapshot.totalBytes > 0 
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;
        onProgress(progress, snapshot.bytesTransferred, snapshot.totalBytes);
      },
      (error) => {
        clearTimeout(handshakeTimeout);
        reject(error);
      },
      async () => {
        clearTimeout(handshakeTimeout);
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const meta = await getMetadata(uploadTask.snapshot.ref);

          const storedFile: StoredFile = {
            id: meta.fullPath,
            name: file.name,
            fullPath: meta.fullPath,
            size: meta.size,
            formattedSize: formatBytes(meta.size),
            contentType: meta.contentType || file.type || 'application/octet-stream',
            timeCreated: meta.timeCreated,
            updated: meta.updated,
            downloadUrl,
            category: getFileCategory(file.name, meta.contentType),
            extension: getFileExtension(file.name),
            ownerUid: userUid || undefined
          };

          resolve(storedFile);
        } catch (metaErr) {
          reject(metaErr);
        }
      }
    );
  });
}

/**
 * Lists all files stored in the user's specific path
 */
export async function listCloudFiles(userUid: string | null): Promise<StoredFile[]> {
  if (!storageInstance) {
    throw new Error('Firebase Cloud Storage is not initialized.');
  }

  const folderPath = userUid ? `users/${userUid}` : 'public_uploads';
  const folderRef = ref(storageInstance, folderPath);

  try {
    const result = await listAll(folderRef);
    
    // Fetch download URLs and metadata concurrently for each item
    const filePromises = result.items.map(async (itemRef) => {
      try {
        const [downloadUrl, meta] = await Promise.all([
          getDownloadURL(itemRef),
          getMetadata(itemRef)
        ]);

        const fileName = meta.customMetadata?.originalName || itemRef.name;

        const storedFile: StoredFile = {
          id: meta.fullPath,
          name: fileName,
          fullPath: meta.fullPath,
          size: meta.size,
          formattedSize: formatBytes(meta.size),
          contentType: meta.contentType || 'application/octet-stream',
          timeCreated: meta.timeCreated,
          updated: meta.updated,
          downloadUrl,
          category: getFileCategory(fileName, meta.contentType),
          extension: getFileExtension(fileName),
          ownerUid: userUid || undefined
        };
        return storedFile;
      } catch {
        return null;
      }
    });

    const files = await Promise.all(filePromises);
    const validCloudFiles = files.filter((f): f is StoredFile => f !== null);

    // If cloud has files, return them; otherwise combine with local repository
    if (validCloudFiles.length > 0) {
      return validCloudFiles;
    }
    return getSandboxFiles(userUid);
  } catch (err: any) {
    // If folder doesn't exist yet or connection timed out, seamlessly return local repository
    return getSandboxFiles(userUid);
  }
}

/**
 * Deletes a file from Firebase Cloud Storage
 */
export async function deleteCloudFile(fullPath: string): Promise<void> {
  if (!storageInstance) {
    throw new Error('Firebase Cloud Storage is not initialized.');
  }
  const fileRef = ref(storageInstance, fullPath);
  await deleteObject(fileRef);
}

/* ============================================================
   SANDBOX / OFFLINE LAB MODE
   (Provides students an immediate offline demonstration testbed
   when Firebase credentials are not yet configured)
   ============================================================ */

export function getSandboxFiles(userUid: string | null): StoredFile[] {
  try {
    const raw = localStorage.getItem(SANDBOX_STORAGE_KEY);
    let files: StoredFile[] = [];
    
    if (!raw) {
      // Seed initial demo files for demonstration
      const initialDemoFiles: StoredFile[] = [
        {
          id: 'demo_file_1',
          name: 'Welcome_To_CloudVault.pdf',
          fullPath: 'public_uploads/Welcome_To_CloudVault.pdf',
          size: 185400,
          formattedSize: '181.1 KB',
          contentType: 'application/pdf',
          timeCreated: new Date(Date.now() - 3600000 * 18).toISOString(),
          updated: new Date(Date.now() - 3600000 * 18).toISOString(),
          downloadUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80',
          category: 'document',
          extension: 'pdf',
          ownerUid: 'demo_vault'
        },
        {
          id: 'demo_file_2',
          name: 'Storage_Architecture.png',
          fullPath: 'public_uploads/Storage_Architecture.png',
          size: 492000,
          formattedSize: '480.5 KB',
          contentType: 'image/png',
          timeCreated: new Date(Date.now() - 3600000 * 6).toISOString(),
          updated: new Date(Date.now() - 3600000 * 6).toISOString(),
          downloadUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
          category: 'image',
          extension: 'png',
          ownerUid: 'demo_vault'
        }
      ];
      localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(initialDemoFiles));
      files = initialDemoFiles;
    } else {
      files = JSON.parse(raw);
    }

    if (!userUid) {
      // Demo access: show demo_vault files for testing without authentication
      return files.filter(f => f.ownerUid === 'demo_vault' || !f.ownerUid);
    }
    // Return strictly this authenticated user's private files
    return files.filter(f => f.ownerUid === userUid);
  } catch {
    return [];
  }
}

export function saveSandboxFile(file: File, userUid: string | null): Promise<StoredFile> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const owner = userUid || 'demo_vault';
      const newStored: StoredFile = {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: file.name,
        fullPath: userUid ? `users/${userUid}/${file.name}` : `public_uploads/${file.name}`,
        size: file.size,
        formattedSize: formatBytes(file.size),
        contentType: file.type || 'application/octet-stream',
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString(),
        downloadUrl: dataUrl,
        category: getFileCategory(file.name, file.type),
        extension: getFileExtension(file.name),
        ownerUid: owner
      };

      const raw = localStorage.getItem(SANDBOX_STORAGE_KEY);
      const existing: StoredFile[] = raw ? JSON.parse(raw) : [];
      existing.unshift(newStored);
      localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(existing));
      resolve(newStored);
    };
    reader.readAsDataURL(file);
  });
}

export function deleteSandboxFile(id: string): void {
  const raw = localStorage.getItem(SANDBOX_STORAGE_KEY);
  if (!raw) return;
  const existing: StoredFile[] = JSON.parse(raw);
  const filtered = existing.filter(f => f.id !== id && f.fullPath !== id);
  localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(filtered));
}
