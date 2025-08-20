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
  proposalMenuId: string;
  assigneeId: string;
  status: 'proposal' | 'negotiation' | 'lost' | 'won' | 'active' | 'completed';
  createdAt: Date;
  lastContactDate?: Date;
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
}

export interface Performance {
  id: string;
  clientName: string;
  projectName: string;
  recordingMonth: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  createdAt: Date;
}