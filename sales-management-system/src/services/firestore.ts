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
  FreeWriting,
  PerformanceImportHistory,
  PerformanceComparison,
  MonthlyPerformanceComparison,
  MonthlyComparisonDetail
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

export const updateProposalMenu = async (id: string, menuData: Partial<ProposalMenu>) => {
  const docRef = doc(db, 'proposalMenus', id);
  await updateDoc(docRef, menuData);
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
    lastContactDate: projectData.lastContactDate ? Timestamp.fromDate(projectData.lastContactDate) : null,
    orderDate: projectData.orderDate ? Timestamp.fromDate(projectData.orderDate) : null,
    firstMeetingDate: projectData.firstMeetingDate ? Timestamp.fromDate(projectData.firstMeetingDate) : null
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
      lastContactDate: data.lastContactDate?.toDate() || null,
      orderDate: data.orderDate?.toDate() || null,
      firstMeetingDate: data.firstMeetingDate?.toDate() || null
    } as Project;
  });
};

export const updateProject = async (id: string, projectData: Partial<Project>) => {
  const docRef = doc(db, 'projects', id);
  const updateData: any = { ...projectData };
  
  // Dateフィールドの変換処理
  if (projectData.lastContactDate !== undefined) {
    updateData.lastContactDate = projectData.lastContactDate ? Timestamp.fromDate(projectData.lastContactDate) : null;
  }
  if (projectData.orderDate !== undefined) {
    updateData.orderDate = projectData.orderDate ? Timestamp.fromDate(projectData.orderDate) : null;
  }
  if (projectData.firstMeetingDate !== undefined) {
    updateData.firstMeetingDate = projectData.firstMeetingDate ? Timestamp.fromDate(projectData.firstMeetingDate) : null;
  }
  
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
  // undefined値を除外したオブジェクトを作成
  const cleanData: any = {
    projectId: orderData.projectId,
    clientId: orderData.clientId,
    clientName: orderData.clientName,
    projectTitle: orderData.projectTitle,
    assigneeId: orderData.assigneeId,
    orderDate: Timestamp.fromDate(orderData.orderDate),
    proposalMenu: orderData.proposalMenu
  };
  
  // オプショナルフィールドは値がある場合のみ追加
  if (orderData.implementationMonth !== undefined) {
    cleanData.implementationMonth = orderData.implementationMonth;
  }
  if (orderData.revenue !== undefined) {
    cleanData.revenue = orderData.revenue;
  }
  if (orderData.cost !== undefined) {
    cleanData.cost = orderData.cost;
  }
  if (orderData.grossProfit !== undefined) {
    cleanData.grossProfit = orderData.grossProfit;
  }
  if (orderData.clientType !== undefined) {
    cleanData.clientType = orderData.clientType;
  }
  
  const docRef = await addDoc(ordersCollection, cleanData);
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
  const updateData: any = {};
  
  // Object.entriesを使用してより安全に処理
  Object.entries(orderData).forEach(([key, value]) => {
    // undefined、nullをスキップ
    if (value === undefined || value === null) {
      return;
    }
    
    // idフィールドは更新対象から除外
    if (key === 'id') {
      return;
    }
    
    // orderDateの場合はTimestamp変換
    if (key === 'orderDate') {
      if (value instanceof Date) {
        updateData.orderDate = Timestamp.fromDate(value);
      } else {
        return;
      }
    } else {
      // その他のフィールドはそのまま追加
      updateData[key] = value;
    }
  });
  
  // 更新データが空でない場合のみ更新実行
  if (Object.keys(updateData).length > 0) {
    await updateDoc(docRef, updateData);
  }
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

// Performance Import History Collection
export const performanceImportHistoryCollection = collection(db, 'performanceImportHistory');

export const savePerformanceHistory = async (data: Performance[], importType: 'current' | 'previous'): Promise<void> => {
  // 既存の同じimportTypeのデータを削除
  const q = query(performanceImportHistoryCollection, where('importType', '==', importType));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  // 新しい履歴を保存
  await addDoc(performanceImportHistoryCollection, {
    importDate: Timestamp.fromDate(new Date()),
    importType,
    dataSnapshot: data.map(item => ({
      ...item,
      createdAt: Timestamp.fromDate(item.createdAt)
    }))
  });
};

export const getPerformanceHistory = async (importType: 'current' | 'previous'): Promise<PerformanceImportHistory | null> => {
  const q = query(performanceImportHistoryCollection, where('importType', '==', importType));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    importDate: data.importDate.toDate(),
    importType: data.importType,
    dataSnapshot: data.dataSnapshot.map((item: any) => ({
      ...item,
      createdAt: item.createdAt.toDate()
    }))
  } as PerformanceImportHistory;
};

export const getPerformanceComparison = async (): Promise<{
  comparisons: PerformanceComparison[];
  hasHistory: boolean;
}> => {
  const previous = await getPerformanceHistory('previous');
  const current = await getPerformanceHistory('current');
  
  if (!previous || !current) {
    return { comparisons: [], hasHistory: false };
  }
  
  const calculatePeriodTotal = (data: Performance[], startMonth: number, endMonth: number): number => {
    return data
      .filter(p => {
        const month = parseInt(p.recordingMonth.substring(5, 7));
        return month >= startMonth && month <= endMonth;
      })
      .reduce((sum, p) => sum + p.grossProfit, 0);
  };
  
  const periods = [
    { name: '下期（7月〜12月）', start: 7, end: 12 },
    { name: 'Q3（7月〜9月）', start: 7, end: 9 },
    { name: 'Q4（10月〜12月）', start: 10, end: 12 }
  ];
  
  const comparisons = periods.map(period => {
    const previousTotal = calculatePeriodTotal(previous.dataSnapshot, period.start, period.end);
    const currentTotal = calculatePeriodTotal(current.dataSnapshot, period.start, period.end);
    const difference = currentTotal - previousTotal;
    const percentageChange = previousTotal > 0 ? (difference / previousTotal) * 100 : 0;
    
    return {
      period: period.name,
      previous: previousTotal,
      current: currentTotal,
      difference,
      percentageChange,
      lastImportDate: previous.importDate,
      currentImportDate: current.importDate
    };
  });
  
  return { comparisons, hasHistory: true };
};

export const getPersonalPerformanceComparison = async (assigneeId: string): Promise<{
  comparisons: PerformanceComparison[];
  hasHistory: boolean;
}> => {
  const previous = await getPerformanceHistory('previous');
  const current = await getPerformanceHistory('current');
  
  if (!previous || !current) {
    return { comparisons: [], hasHistory: false };
  }
  
  // 個人別にフィルタリング
  const previousPersonalData = previous.dataSnapshot.filter(p => p.assigneeId === assigneeId);
  const currentPersonalData = current.dataSnapshot.filter(p => p.assigneeId === assigneeId);
  
  const calculatePeriodTotal = (data: Performance[], startMonth: number, endMonth: number): number => {
    return data
      .filter(p => {
        const month = parseInt(p.recordingMonth.substring(5, 7));
        return month >= startMonth && month <= endMonth;
      })
      .reduce((sum, p) => sum + p.grossProfit, 0);
  };
  
  const periods = [
    { name: '下期（7月〜12月）', start: 7, end: 12 },
    { name: 'Q3（7月〜9月）', start: 7, end: 9 },
    { name: 'Q4（10月〜12月）', start: 10, end: 12 }
  ];
  
  const comparisons = periods.map(period => {
    const previousTotal = calculatePeriodTotal(previousPersonalData, period.start, period.end);
    const currentTotal = calculatePeriodTotal(currentPersonalData, period.start, period.end);
    const difference = currentTotal - previousTotal;
    const percentageChange = previousTotal > 0 ? (difference / previousTotal) * 100 : 0;
    
    return {
      period: period.name,
      previous: previousTotal,
      current: currentTotal,
      difference,
      percentageChange,
      lastImportDate: previous.importDate,
      currentImportDate: current.importDate
    };
  });
  
  return { comparisons, hasHistory: true };
};

export const getMonthlyPerformanceComparison = async (assigneeId?: string): Promise<MonthlyPerformanceComparison[]> => {
  const previous = await getPerformanceHistory('previous');
  const current = await getPerformanceHistory('current');
  
  if (!previous || !current) {
    return [];
  }
  
  // 個人別フィルタリング（assigneeIdが指定されている場合）
  const previousData = assigneeId 
    ? previous.dataSnapshot.filter(p => p.assigneeId === assigneeId)
    : previous.dataSnapshot;
  const currentData = assigneeId 
    ? current.dataSnapshot.filter(p => p.assigneeId === assigneeId)
    : current.dataSnapshot;
  
  const months = [
    { month: '2025-07', monthName: '7月' },
    { month: '2025-08', monthName: '8月' },
    { month: '2025-09', monthName: '9月' },
    { month: '2025-10', monthName: '10月' },
    { month: '2025-11', monthName: '11月' },
    { month: '2025-12', monthName: '12月' }
  ];
  
  const monthlyComparisons: MonthlyPerformanceComparison[] = months.map(({ month, monthName }) => {
    // 該当月のデータを抽出
    const previousMonthData = previousData.filter(p => p.recordingMonth.startsWith(month));
    const currentMonthData = currentData.filter(p => p.recordingMonth.startsWith(month));
    
    // 月合計を計算
    const previousTotal = previousMonthData.reduce((sum, p) => sum + p.grossProfit, 0);
    const currentTotal = currentMonthData.reduce((sum, p) => sum + p.grossProfit, 0);
    const difference = currentTotal - previousTotal;
    const percentageChange = previousTotal > 0 ? (difference / previousTotal) * 100 : 0;
    
    // 差分要因詳細を計算
    const details = calculateMonthlyComparisonDetails(previousMonthData, currentMonthData);
    
    return {
      month,
      monthName,
      previous: previousTotal,
      current: currentTotal,
      difference,
      percentageChange,
      details
    };
  });
  
  return monthlyComparisons;
};

const calculateMonthlyComparisonDetails = (
  previousData: Performance[], 
  currentData: Performance[]
): MonthlyComparisonDetail[] => {
  const details: MonthlyComparisonDetail[] = [];
  
  // 前回データのマップを作成（クライアント名＋案件名をキーとする）
  const previousMap = new Map<string, number>();
  previousData.forEach(p => {
    const key = `${p.clientName}|${p.projectName}`;
    previousMap.set(key, (previousMap.get(key) || 0) + p.grossProfit);
  });
  
  // 最新データのマップを作成
  const currentMap = new Map<string, number>();
  currentData.forEach(p => {
    const key = `${p.clientName}|${p.projectName}`;
    currentMap.set(key, (currentMap.get(key) || 0) + p.grossProfit);
  });
  
  // 全てのキー（クライアント名＋案件名の組み合わせ）を収集
  const allKeys = new Set([...previousMap.keys(), ...currentMap.keys()]);
  
  allKeys.forEach(key => {
    const [clientName, projectName] = key.split('|');
    const previousAmount = previousMap.get(key) || 0;
    const currentAmount = currentMap.get(key) || 0;
    const difference = currentAmount - previousAmount;
    
    let changeType: 'new' | 'increased' | 'decreased' | 'removed';
    
    if (previousAmount === 0 && currentAmount > 0) {
      changeType = 'new';
    } else if (previousAmount > 0 && currentAmount === 0) {
      changeType = 'removed';
    } else if (difference > 0) {
      changeType = 'increased';
    } else if (difference < 0) {
      changeType = 'decreased';
    } else {
      // 差分が0の場合はスキップ
      return;
    }
    
    details.push({
      clientName,
      projectName,
      previousAmount,
      currentAmount,
      difference,
      changeType
    });
  });
  
  // 差分の絶対値で降順ソート
  details.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  
  return details;
};