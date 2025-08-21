import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { 
  User, 
  SalesTarget, 
  ProposalMenu, 
  Client, 
  Project, 
  ActionLog, 
  Order, 
  Performance,
  FreeWriting
} from '../types';

// Users Collection
export const usersCollection = collection(db, 'users');

export const createUser = async (userData: Omit<User, 'id'>) => {
  const docRef = await addDoc(usersCollection, userData);
  return docRef.id;
};

export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as User));
};

export const updateUser = async (id: string, userData: Partial<User>) => {
  const docRef = doc(db, 'users', id);
  await updateDoc(docRef, userData);
};

export const deleteUser = async (id: string) => {
  const docRef = doc(db, 'users', id);
  await deleteDoc(docRef);
};

// Sales Targets Collection
export const salesTargetsCollection = collection(db, 'salesTargets');

export const createSalesTarget = async (targetData: Omit<SalesTarget, 'id'>) => {
  const docRef = await addDoc(salesTargetsCollection, targetData);
  return docRef.id;
};

export const getSalesTargets = async (userId?: string): Promise<SalesTarget[]> => {
  let q = query(salesTargetsCollection);
  if (userId) {
    q = query(salesTargetsCollection, where('userId', '==', userId));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as SalesTarget));
};

export const updateSalesTarget = async (id: string, targetData: Partial<SalesTarget>) => {
  const docRef = doc(db, 'salesTargets', id);
  await updateDoc(docRef, targetData);
};

// Proposal Menus Collection
export const proposalMenusCollection = collection(db, 'proposalMenus');

export const createProposalMenu = async (menuData: Omit<ProposalMenu, 'id'>) => {
  const docRef = await addDoc(proposalMenusCollection, {
    ...menuData,
    createdAt: Timestamp.fromDate(menuData.createdAt)
  });
  return docRef.id;
};

export const getProposalMenus = async (): Promise<ProposalMenu[]> => {
  const snapshot = await getDocs(query(proposalMenusCollection, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate()
    } as ProposalMenu;
  });
};

export const deleteProposalMenu = async (id: string) => {
  const docRef = doc(db, 'proposalMenus', id);
  await deleteDoc(docRef);
};

// Clients Collection
export const clientsCollection = collection(db, 'clients');

export const createClient = async (clientData: Omit<Client, 'id'>) => {
  const docRef = await addDoc(clientsCollection, {
    ...clientData,
    lastOrderDate: clientData.lastOrderDate ? Timestamp.fromDate(clientData.lastOrderDate) : null
  });
  return docRef.id;
};

export const getClients = async (): Promise<Client[]> => {
  const snapshot = await getDocs(clientsCollection);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      lastOrderDate: data.lastOrderDate?.toDate() || null
    } as Client;
  });
};

// Projects Collection
export const projectsCollection = collection(db, 'projects');

export const createProject = async (projectData: Omit<Project, 'id'>) => {
  const docRef = await addDoc(projectsCollection, {
    ...projectData,
    createdAt: Timestamp.fromDate(projectData.createdAt),
    lastContactDate: projectData.lastContactDate ? Timestamp.fromDate(projectData.lastContactDate) : null
  });
  return docRef.id;
};

export const getProjects = async (): Promise<Project[]> => {
  const snapshot = await getDocs(query(projectsCollection, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      lastContactDate: data.lastContactDate?.toDate() || null
    } as Project;
  });
};

export const updateProject = async (id: string, projectData: Partial<Project>) => {
  const docRef = doc(db, 'projects', id);
  const updateData = {
    ...projectData,
    lastContactDate: projectData.lastContactDate ? Timestamp.fromDate(projectData.lastContactDate) : null
  };
  await updateDoc(docRef, updateData);
};

export const deleteProject = async (id: string) => {
  const docRef = doc(db, 'projects', id);
  await deleteDoc(docRef);
};

// Action Logs Collection
export const actionLogsCollection = collection(db, 'actionLogs');

export const createActionLog = async (logData: Omit<ActionLog, 'id'>) => {
  const docRef = await addDoc(actionLogsCollection, {
    ...logData,
    actionDate: Timestamp.fromDate(logData.actionDate),
    nextActionDate: logData.nextActionDate ? Timestamp.fromDate(logData.nextActionDate) : null,
    createdAt: Timestamp.fromDate(logData.createdAt)
  });
  return docRef.id;
};

export const getActionLogs = async (projectId?: string): Promise<ActionLog[]> => {
  let q = query(actionLogsCollection, orderBy('createdAt', 'desc'));
  if (projectId) {
    q = query(actionLogsCollection, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      actionDate: data.actionDate.toDate(),
      nextActionDate: data.nextActionDate?.toDate() || null,
      createdAt: data.createdAt.toDate()
    } as ActionLog;
  });
};

export const updateActionLog = async (id: string, logData: Partial<ActionLog>) => {
  const docRef = doc(db, 'actionLogs', id);
  const updateData = {
    ...logData,
    actionDate: logData.actionDate ? Timestamp.fromDate(logData.actionDate) : undefined,
    nextActionDate: logData.nextActionDate ? Timestamp.fromDate(logData.nextActionDate) : null
  };
  await updateDoc(docRef, updateData);
};

export const deleteActionLog = async (id: string) => {
  const docRef = doc(db, 'actionLogs', id);
  await deleteDoc(docRef);
};

// Orders Collection
export const ordersCollection = collection(db, 'orders');

export const createOrder = async (orderData: Omit<Order, 'id'>) => {
  const docRef = await addDoc(ordersCollection, {
    ...orderData,
    orderDate: Timestamp.fromDate(orderData.orderDate)
  });
  return docRef.id;
};

export const getOrders = async (): Promise<Order[]> => {
  const snapshot = await getDocs(query(ordersCollection, orderBy('orderDate', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      orderDate: data.orderDate.toDate()
    } as Order;
  });
};

export const updateOrder = async (id: string, orderData: Partial<Order>) => {
  const docRef = doc(db, 'orders', id);
  const updateData = {
    ...orderData,
    orderDate: orderData.orderDate ? Timestamp.fromDate(orderData.orderDate) : undefined
  };
  await updateDoc(docRef, updateData);
};

// Performance Collection
export const performanceCollection = collection(db, 'performance');

export const createPerformance = async (performanceData: Omit<Performance, 'id'>) => {
  const docRef = await addDoc(performanceCollection, {
    ...performanceData,
    createdAt: Timestamp.fromDate(performanceData.createdAt)
  });
  return docRef.id;
};

export const getPerformance = async (): Promise<Performance[]> => {
  const snapshot = await getDocs(query(performanceCollection, orderBy('recordingMonth', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate()
    } as Performance;
  });
};

export const deletePerformance = async (id: string) => {
  const docRef = doc(db, 'performance', id);
  await deleteDoc(docRef);
};

export const deleteAllPerformance = async (): Promise<number> => {
  const snapshot = await getDocs(performanceCollection);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  return snapshot.docs.length;
};

// FreeWriting Collection
export const freeWritingCollection = collection(db, 'freeWriting');

export const getFreeWriting = async (userId: string, type: 'monthly' | 'weekly', period: string): Promise<FreeWriting | null> => {
  const q = query(
    freeWritingCollection,
    where('userId', '==', userId),
    where('type', '==', type),
    where('period', '==', period)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate()
  } as FreeWriting;
};

export const saveFreeWriting = async (freeWritingData: Omit<FreeWriting, 'id'>) => {
  // 既存のドキュメントを確認
  const existing = await getFreeWriting(freeWritingData.userId, freeWritingData.type, freeWritingData.period);
  
  if (existing) {
    // 更新
    const docRef = doc(db, 'freeWriting', existing.id);
    await updateDoc(docRef, {
      content: freeWritingData.content,
      updatedAt: Timestamp.fromDate(new Date())
    });
    return existing.id;
  } else {
    // 新規作成
    const docRef = await addDoc(freeWritingCollection, {
      ...freeWritingData,
      createdAt: Timestamp.fromDate(freeWritingData.createdAt),
      updatedAt: Timestamp.fromDate(freeWritingData.updatedAt)
    });
    return docRef.id;
  }
};

export const updateFreeWriting = async (id: string, content: string) => {
  const docRef = doc(db, 'freeWriting', id);
  await updateDoc(docRef, {
    content,
    updatedAt: Timestamp.fromDate(new Date())
  });
};