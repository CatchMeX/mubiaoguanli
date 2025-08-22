// 费用管理相关类型定义

// 费用分类
export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  level: number;
  parent_id?: string;
  description?: string;
  status: 'active' | 'inactive';
  children?: ExpenseCategory[];
  created_at: string;
  updated_at: string;
}

// 供应商
interface ExpenseSupplier {
  id: string;
  name: string;
  code: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  taxNumber?: string; // 税号
  bankAccount?: string; // 银行账户
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 费用附件
interface ExpenseAttachment {
  id: string;
  expenseId: string;
  name: string;
  type: 'invoice' | 'receipt' | 'contract' | 'approval' | 'other';
  url: string;
  uploadedBy: {
    id: string;
    name: string;
  };
  uploadedAt: string;
}

// 费用审批记录
interface ExpenseApprovalRecord {
  id: string;
  expenseId: string;
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

import type { FinanceCategory } from './index';

// 费用记录
export interface ExpenseRecord {
  id: string;
  expenseNumber: string; // 费用单号
  category: FinanceCategory;
  supplier?: ExpenseSupplier;
  amount: number;
  taxAmount: number;
  netAmount: number; // 净费用金额
  description: string;
  expenseDate: string; // 费用发生日期
  invoiceNumber?: string;
  invoiceDate?: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'other';
  paymentStatus: 'pending' | 'partial' | 'completed' | 'overdue';
  paidAmount: number; // 已付金额
  remainingAmount: number; // 待付金额
  dueDate?: string; // 应付日期
  department: {
    id: string;
    name: string;
  };
  applicant: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  team_id?: string; // 关联团队ID
  is_allocation_enabled?: boolean; // 是否启用分摊
  attachments: ExpenseAttachment[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  approvalHistory: ExpenseApprovalRecord[];
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  businessPurpose: string; // 业务用途
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 付款计划
interface PaymentPlan {
  id: string;
  expenseRecord: ExpenseRecord;
  planNumber: string;
  totalAmount: number;
  installments: PaymentInstallment[];
  status: 'active' | 'completed' | 'cancelled';
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 付款分期
interface PaymentInstallment {
  id: string;
  planId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  paidDate?: string;
  status: 'pending' | 'partial' | 'completed' | 'overdue';
  notes?: string;
}

// 费用统计数据
interface ExpenseStatistics {
  totalExpense: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  byCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  bySupplier: Array<{
    supplier: string;
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
    expense: number;
    paid: number;
    pending: number;
  }>;
  paymentStatusDistribution: {
    pending: number;
    partial: number;
    completed: number;
    overdue: number;
  };
  topSuppliers: Array<{
    supplier: ExpenseSupplier;
    totalAmount: number;
    transactionCount: number;
  }>;
}

// 费用预测
interface ExpenseForecast {
  id: string;
  period: string; // YYYY-MM
  forecastAmount: number;
  confidence: 'low' | 'medium' | 'high';
  basis: string; // 预测依据
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 费用分析报告
interface ExpenseAnalysisReport {
  id: string;
  reportName: string;
  reportType: 'monthly' | 'quarterly' | 'annual';
  startDate: string;
  endDate: string;
  summary: {
    totalExpense: number;
    totalPaid: number;
    paymentRate: number; // 付款率
    averagePaymentDays: number; // 平均付款天数
    supplierCount: number;
    newSupplierCount: number;
  };
  trends: Array<{
    period: string;
    expense: number;
    growth: number; // 增长率
  }>;
  topPerformers: {
    suppliers: Array<{
      supplier: ExpenseSupplier;
      amount: number;
    }>;
    categories: Array<{
      category: ExpenseCategory;
      amount: number;
    }>;
    departments: Array<{
      department: string;
      amount: number;
    }>;
  };
  risks: Array<{
    type: 'overdue' | 'concentration' | 'budget_overrun';
    description: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
  generatedBy: {
    id: string;
    name: string;
  };
  generatedAt: string;
}

// 费用报销/冲销管理相关类型定义
import { User, Team, Department, WorkflowInstance } from './index';

export interface ExpenseReimbursement {
  id: string;
  request_number: string;
  expense_reason: string;
  expense_category: 'loan_offset' | 'expense_reimbursement';
  total_amount: number;
  department_id?: string;
  is_corporate_dimension: boolean;
  team_id?: string;
  approval_workflow_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  workflowStatus?: 'running' | 'completed' | 'terminated' | 'paused';
  applicant_id: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // 关联数据
  applicant?: User;
  department?: Department;
  team?: Team;
  approval_workflow?: WorkflowInstance;
  allocations?: ExpenseReimbursementAllocation[];
  attachments?: ExpenseReimbursementAttachment[];
}

export interface ExpenseReimbursementAllocation {
  id: string;
  expense_reimbursement_id: string;
  team_id: string;
  allocation_ratio: number;
  allocation_amount: number;
  created_at: string;
  updated_at: string;
  
  // 关联数据
  team?: Team;
}

export interface ExpenseReimbursementAttachment {
  id: string;
  expense_reimbursement_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
  
  // 关联数据
  uploaded_by_user?: User;
}

export interface ExpenseReimbursementFormData {
  expense_reason: string;
  expense_category: 'loan_offset' | 'expense_reimbursement';
  total_amount: string;
  department_id?: string;
  is_corporate_dimension: boolean;
  team_id?: string;
  approval_workflow_id?: string;
  allocations: ExpenseReimbursementAllocationFormData[];
  attachments: File[];
}

export interface ExpenseReimbursementAllocationFormData {
  team_id: string;
  allocation_ratio: number;
  allocation_amount: number;
}

// 用于创建和更新的数据接口
export interface CreateExpenseReimbursementData {
  expense_reason: string;
  expense_category: 'loan_offset' | 'expense_reimbursement';
  total_amount: number;
  department_id?: string;
  is_corporate_dimension: boolean;
  team_id?: string;
  approval_workflow_id?: string;
  applicant_id: string;
  created_by?: string;
}

export interface UpdateExpenseReimbursementData {
  expense_reason?: string;
  expense_category?: 'loan_offset' | 'expense_reimbursement';
  total_amount?: number;
  department_id?: string;
  is_corporate_dimension?: boolean;
  team_id?: string;
  approval_workflow_id?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  updated_by?: string;
}

// 统计数据接口
export interface ExpenseReimbursementStatistics {
  total_count: number;
  total_amount: number;
  by_status: { status: string; count: number; amount: number }[];
  by_department: { department_name: string; count: number; amount: number }[];
  by_category: { expense_category: string; count: number; amount: number }[];
}
