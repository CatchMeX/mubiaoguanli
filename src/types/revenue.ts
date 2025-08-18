// 收入管理相关类型定义

// 收入分类
export interface RevenueCategory {
  id: string;
  name: string;
  code: string;
  level: number;
  parentId?: string;
  description?: string;
  children?: RevenueCategory[];
  createdAt: string;
  updatedAt: string;
}

// 客户信息
export interface Customer {
  id: string;
  name: string;
  code?: string;
  contact: string; // 联系人
  phone: string;
  residenceAddress?: string; // 住址
  status: 'pending' | 'cooperating' | 'uncooperative';
  description?: string; // 描述
  createdAt: string;
  updatedAt: string;
}

// 收入记录
export interface RevenueRecord {
  id: string;
  recordNumber: string; // 收入单号
  customer: Customer;
  category: RevenueCategory;
  project?: {
    id: string;
    name: string;
  };
  amount: number; // 收入金额
  taxAmount: number; // 税额
  netAmount: number; // 净收入
  description: string;
  revenue_date: string; // 收入日期
  invoiceNumber?: string; // 发票号码
  invoiceDate?: string; // 开票日期
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'online' | 'other'; // 收款方式
  paymentStatus: 'pending' | 'partial' | 'completed' | 'overdue'; // 收款状态
  receivedAmount: number; // 已收金额
  remainingAmount: number; // 未收金额
  dueDate?: string; // 应收日期
  department: {
    id: string;
    name: string;
  };
  salesperson?: {
    id: string;
    name: string;
  }; // 销售人员
  team_id?: string; // 关联团队ID
  is_allocation_enabled?: boolean; // 是否启用分摊
  allocation_records?: Array<{
    id: string;
    allocated_amount: number;
    allocation_config?: {
      id: string;
      name: string;
      target_type: string;
      target_id: string;
      allocation_ratio: number;
    };
  }>; // 分摊记录
  attachments: RevenueAttachment[];
  status: 'draft' | 'confirmed' | 'invoiced' | 'cancelled';
  approvalHistory: RevenueApprovalRecord[];
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 收入附件
export interface RevenueAttachment {
  id: string;
  revenueId: string;
  name: string;
  type: 'contract' | 'invoice' | 'receipt' | 'other';
  url: string;
  uploadedBy: {
    id: string;
    name: string;
  };
  uploadedAt: string;
}

// 收入审批记录
export interface RevenueApprovalRecord {
  id: string;
  revenueId: string;
  approver: {
    id: string;
    name: string;
  };
  approvalLevel: 'department' | 'finance' | 'leadership';
  action: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: string;
  createdAt: string;
}

// 收款计划
export interface PaymentPlan {
  id: string;
  revenueRecord: RevenueRecord;
  planNumber: string; // 计划编号
  totalAmount: number; // 计划总金额
  installments: PaymentInstallment[]; // 分期明细
  status: 'active' | 'completed' | 'cancelled';
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 收款分期
export interface PaymentInstallment {
  id: string;
  planId: string;
  installmentNumber: number; // 期数
  amount: number; // 本期金额
  dueDate: string; // 应收日期
  receivedAmount: number; // 已收金额
  receivedDate?: string; // 实收日期
  status: 'pending' | 'partial' | 'completed' | 'overdue';
  notes?: string;
}

// 收入统计数据
export interface RevenueStatistics {
  totalRevenue: number; // 总收入
  totalReceived: number; // 总已收
  totalPending: number; // 总待收
  totalOverdue: number; // 总逾期
  byCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  byCustomer: Array<{
    customer: string;
    amount: number;
    percentage: number;
  }>;
  byDepartment: Array<{
    department: string;
    amount: number;
    percentage: number;
  }>;
  byMonth: Array<{
    month: string;
    revenue: number;
    received: number;
    pending: number;
  }>;
  paymentStatusDistribution: {
    pending: number;
    partial: number;
    completed: number;
    overdue: number;
  };
  topCustomers: Array<{
    customer: Customer;
    totalAmount: number;
    transactionCount: number;
  }>;
}

// 收入预测
export interface RevenueForecast {
  id: string;
  period: string; // 预测期间
  forecastAmount: number; // 预测金额
  actualAmount?: number; // 实际金额
  variance?: number; // 差异
  variancePercentage?: number; // 差异百分比
  confidence: 'high' | 'medium' | 'low'; // 预测置信度
  basis: string; // 预测依据
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 收入分析报告
export interface RevenueAnalysisReport {
  id: string;
  reportName: string;
  reportType: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: string;
  endDate: string;
  summary: {
    totalRevenue: number;
    totalReceived: number;
    collectionRate: number; // 回款率
    averageCollectionDays: number; // 平均回款天数
    customerCount: number;
    newCustomerCount: number;
  };
  trends: Array<{
    period: string;
    revenue: number;
    growth: number; // 增长率
  }>;
  topPerformers: {
    customers: Array<{
      customer: Customer;
      amount: number;
    }>;
    categories: Array<{
      category: RevenueCategory;
      amount: number;
    }>;
    salespeople: Array<{
      salesperson: {
        id: string;
        name: string;
      };
      amount: number;
    }>;
  };
  risks: Array<{
    type: 'overdue' | 'concentration' | 'decline';
    description: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  generatedBy: {
    id: string;
    name: string;
  };
  generatedAt: string;
}
