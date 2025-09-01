export interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export interface SalesTarget {
  id: string;
  userId: string;
  year: number;
  month: number;
  newDeals: number;
  existingDeals: number;
  newOrders: number;
  existingOrders: number;
  grossProfitBudget?: number;
}

export interface ProposalMenu {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  status: 'new' | 'existing' | 'dormant';
  lastOrderDate?: Date;
}

export interface Project {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  productName: string;
  proposalMenuId: string; // 後方互換性のため残す（非推奨）
  proposalMenuIds?: string[]; // 複数選択対応（新規）
  assigneeId: string;
  status: 'proposal' | 'negotiation' | 'lost' | 'won' | 'active' | 'completed';
  createdAt: Date;
  lastContactDate?: Date;
  orderDate?: Date; // 受注日
  firstMeetingDate?: Date; // 初回商談日
}

export interface ActionLog {
  id: string;
  projectId: string;
  title: string;
  assigneeId: string;
  actionDate: Date;
  nextActionDate?: Date;
  minutes: string;
  nextAction: string;
  status: string;
  summary?: string;
  performanceType?: 'unselected' | 'new' | 'existing';
  createdAt: Date;
}

export interface Order {
  id: string;
  projectId: string;
  clientId: string;
  clientName: string;
  projectTitle: string;
  assigneeId: string;
  orderDate: Date;
  implementationMonth?: string;
  proposalMenu: string;
  revenue?: number;
  cost?: number;
  grossProfit?: number;
  clientType?: 'new' | 'existing' | '-';
}

export interface Performance {
  id: string;
  assigneeId: string;
  clientName: string;
  projectName: string;
  recordingMonth: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  createdAt: Date;
}

export interface FreeWriting {
  id: string;
  userId: string; // 'overall' for 全体タブ, user ID for 個人タブ
  type: 'monthly' | 'weekly';
  period: string; // 月次: '2025-08', 週次: '2025-W32'
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  type: 'performance' | 'action';
  clientName: string;
  message: string;
  severity: 'warning' | 'error';
  lastDate: Date;
  dismissed: boolean;
}