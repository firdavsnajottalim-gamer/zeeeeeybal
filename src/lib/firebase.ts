import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ChatSession, Message, SavedItem, UserProfileData } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without passing firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection as required by Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase: client is currently offline or unreachable.');
    }
    return false;
  }
}

// Auth operations
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } catch (error) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
}

export async function registerWithEmail(name: string, email: string, pass: string): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
    return cred.user;
  } catch (error) {
    console.error('Email Registration Error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

// User Profile Operations
export async function fetchUserProfile(userId: string): Promise<UserProfileData | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfileData): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      userId: profile.uid,
      displayName: profile.displayName || 'Foydalanuvchi',
      email: profile.email || '',
      photoURL: profile.photoURL || '',
      createdAt: new Date(profile.createdAt || Date.now()).toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Chat Sessions Operations
export async function fetchUserChats(userId: string): Promise<ChatSession[]> {
  const path = 'chats';
  try {
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const chats: ChatSession[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      chats.push({
        id: d.id,
        userId: data.userId,
        title: data.title || 'Yangi suhbat',
        category: data.category || 'all',
        createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now(),
        messageCount: data.messageCount || 0,
      });
    });
    return chats;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveChatSession(chat: ChatSession): Promise<void> {
  const path = `chats/${chat.id}`;
  try {
    await setDoc(doc(db, 'chats', chat.id), {
      userId: chat.userId,
      title: chat.title,
      category: chat.category || 'all',
      createdAt: new Date(chat.createdAt).toISOString(),
      updatedAt: new Date(chat.updatedAt).toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteChatSession(chatId: string): Promise<void> {
  const path = `chats/${chatId}`;
  try {
    await deleteDoc(doc(db, 'chats', chatId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Chat Messages Operations
export async function fetchChatMessages(chatId: string): Promise<Message[]> {
  const path = `chats/${chatId}/messages`;
  try {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      messages.push({
        id: d.id,
        role: data.role,
        text: data.text,
        type: data.type || 'chat',
        codeBlocks: data.codeBlocks || [],
        imagePromptDetails: data.imagePromptDetails,
        imageUrl: data.imageUrl,
        timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
      });
    });
    return messages;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveChatMessage(chatId: string, userId: string, message: Message): Promise<void> {
  const path = `chats/${chatId}/messages/${message.id}`;
  try {
    await setDoc(doc(db, 'chats', chatId, 'messages', message.id), {
      userId: userId,
      chatId: chatId,
      role: message.role,
      text: message.text || '',
      type: message.type || 'chat',
      codeSnippet: message.codeBlocks?.[0]?.code || '',
      language: message.codeBlocks?.[0]?.language || '',
      imageUrl: message.imageUrl || '',
      createdAt: new Date(message.timestamp).toISOString(),
      timestamp: new Date(message.timestamp).toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Saved Items Operations (Codes, Prompts, Images)
export async function fetchSavedItems(userId: string): Promise<SavedItem[]> {
  const path = 'saved_items';
  try {
    const q = query(
      collection(db, 'saved_items'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const items: SavedItem[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      items.push({
        id: d.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        language: data.language,
        imageUrl: data.imageUrl,
        tags: data.tags || [],
        createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
      });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function addSavedItemToDb(item: SavedItem): Promise<void> {
  const path = `saved_items/${item.id}`;
  try {
    await setDoc(doc(db, 'saved_items', item.id), {
      userId: item.userId,
      type: item.type,
      title: item.title,
      content: item.content,
      language: item.language || '',
      imageUrl: item.imageUrl || '',
      createdAt: new Date(item.createdAt).toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSavedItemFromDb(itemId: string): Promise<void> {
  const path = `saved_items/${itemId}`;
  try {
    await deleteDoc(doc(db, 'saved_items', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
