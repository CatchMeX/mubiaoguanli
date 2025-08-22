// 往来管理相关类型定义

export interface AccountsRecord {
  id: string;
  recordNumber: string;
  counterparty: {
    id: string;
    name: string;
    code: string;
    type: 'customer' | 'supplier';
  };
  documentNumber: string;
  documentType: 'invoice' | 'contract' | 'receipt' | 'payment' | 'other';
  occurredDate: string;
  amount: number;
  type: 'receivable' | 'payable';
  settledAmount: number;
  balance: number;
  status: 'pending' | 'settled' | 'overdue';
  agingDays: number;
  agingCategory: '30天内' | '31-60天' | '61-90天' | '90+天';
  dueDate?: string;
  description: string;
  department: {
    id: string;
    name: string;
  };
  team_id?: string; // 关联团队ID
  is_allocation_enabled?: boolean; // 是否启用分摊
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SettlementRecord {
  id: string;
  accountsRecordId: string;
  settlementNumber: string;
  settlementDate: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'check' | 'offset' | 'other';
  description: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
  }[];
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface AccountsStatistics {
  totalReceivable: number;
  totalPayable: number;
  totalSettledReceivable: number;
  totalSettledPayable: number;
  totalPendingReceivable: number;
  totalPendingPayable: number;
  totalOverdueReceivable: number;
  totalOverduePayable: number;
  agingDistribution: {
    within30: number;
    within60: number;
    within90: number;
    over90: number;
  };
  topCustomers: Array<{
    customer: {
      id: string;
      name: string;
    };
    totalAmount: number;
    pendingAmount: number;
  }>;
  topSuppliers: Array<{
    supplier: {
      id: string;
      name: string;
    };
    totalAmount: number;
    pendingAmount: number;
  }>;
}

interface AccountsFilter {
  counterpartyId?: string;
  counterpartyType?: 'customer' | 'supplier' | 'all';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: 'all' | 'pending' | 'overdue';
  type?: 'all' | 'receivable' | 'payable';
}
