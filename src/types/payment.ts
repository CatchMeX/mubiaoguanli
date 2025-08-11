// 付款/借款管理相关类型定义
import { User, Team, Department, WorkflowInstance } from './index';

export interface Company {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  request_number: string;
  document_type: 'payment' | 'loan';
  payment_reason: string;
  total_amount: number;
  team_id?: string;
  department_id?: string;
  company_id?: string;
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
  team?: Team;
  department?: Department;
  company?: Company;
  approval_workflow?: WorkflowInstance;
  bank_accounts?: PaymentBankAccount[];
  attachments?: PaymentRequestAttachment[];
}

export interface PaymentBankAccount {
  id: string;
  payment_request_id: string;
  account_holder_name: string;
  bank_account: string;
  bank_name: string;
  payment_amount: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequestAttachment {
  id: string;
  payment_request_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
  
  // 关联数据
  uploaded_by_user?: User;
}

export interface PaymentRequestFormData {
  document_type: 'payment' | 'loan';
  payment_reason: string;
  total_amount: string;
  team_id?: string;
  department_id?: string;
  company_id?: string;
  approval_workflow_id?: string;
  bank_accounts: PaymentBankAccountFormData[];
  attachments: File[];
}

export interface PaymentBankAccountFormData {
  account_holder_name: string;
  bank_account: string;
  bank_name: string;
  payment_amount: number;
  sort_order: number;
}

// 用于创建和更新的数据接口
export interface CreatePaymentRequestData {
  document_type: 'payment' | 'loan';
  payment_reason: string;
  total_amount: number;
  team_id?: string;
  department_id?: string;
  company_id?: string;
  approval_workflow_id?: string;
  applicant_id: string;
  created_by?: string;
}

export interface UpdatePaymentRequestData {
  document_type?: 'payment' | 'loan';
  payment_reason?: string;
  total_amount?: number;
  team_id?: string;
  department_id?: string;
  company_id?: string;
  approval_workflow_id?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  updated_by?: string;
}

 