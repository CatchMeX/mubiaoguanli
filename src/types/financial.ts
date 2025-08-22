// 财务事项管理相关类型定义

export interface FinancialMatter {
  id: string;
  matter_number?: string; // 单号字段
  applicant_id: string;
  matter_description: string;
  amount: number;
  department_id: string;
  is_corporate_dimension: boolean;
  team_id?: string;
  approval_workflow_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  workflowStatus?: 'running' | 'completed' | 'terminated' | 'paused';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // 关联数据
  applicant?: User;
  department?: Department;
  team?: Team;
  approval_workflow?: WorkflowInstance;
  allocations?: FinancialMatterAllocation[];
  attachments?: FinancialMatterAttachment[];
}

export interface FinancialMatterAllocation {
  id: string;
  financial_matter_id: string;
  team_id: string;
  allocation_ratio: number;
  allocated_amount: number;
  remark?: string;
  created_at: string;
  updated_at: string;
  
  // 关联数据
  team?: Team;
}

export interface FinancialMatterAttachment {
  id: string;
  financial_matter_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
  
  // 关联数据
  uploaded_by_user?: User;
}

export interface FinancialMatterFormData {
  matter_description: string;
  amount: string;
  department_id: string;
  is_corporate_dimension: boolean;
  team_id?: string;
  approval_workflow_id?: string;
  allocations?: FinancialMatterAllocationFormData[];
  attachments?: File[];
}

export interface FinancialMatterAllocationFormData {
  team_id: string;
  allocation_ratio: number;
  allocated_amount: number;
  remark?: string;
}

// 用于创建和更新的数据接口
export interface CreateFinancialMatterData {
  applicant_id: string;
  matter_number?: string; // 单号字段
  matter_description: string;
  amount: number;
  department_id: string;
  is_corporate_dimension: boolean;
  team_id?: string;
  approval_workflow_id?: string;
  created_by?: string;
}

export interface UpdateFinancialMatterData {
  matter_number?: string; // 单号字段
  matter_description?: string;
  amount?: number;
  department_id?: string;
  is_corporate_dimension?: boolean;
  team_id?: string;
  approval_workflow_id?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  updated_by?: string;
}

// 导入相关类型
import { User } from './index';
import { Department } from './index';
import { Team } from './index';
import { WorkflowInstance } from './index'; 