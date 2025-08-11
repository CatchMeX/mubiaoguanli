export interface BusinessTripReimbursement {
  id: string;
  applicant_id: string;
  expense_reason: string;
  total_amount: number;
  department_id?: string;
  team_id?: string;
  approval_workflow_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  workflowStatus?: 'running' | 'completed' | 'terminated' | 'paused';
  is_corporate_dimension: boolean;
  request_number: string;
  created_at: string;
  updated_at: string;
  // Related data
  applicant?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
  approval_workflow?: {
    id: string;
    status: string;
    initiated_at: string;
  };
}

export interface BusinessTripExpenseDetail {
  id: string;
  business_trip_reimbursement_id: string;
  accommodation_fee: number;
  intercity_transport_fee: number;
  local_transport_fee: number;
  other_fees: number;
  total_fee: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessTripBankAccount {
  id: string;
  business_trip_reimbursement_id: string;
  payee_account_name: string;
  bank_account: string;
  bank_name: string;
  payment_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessTripAllocation {
  id: string;
  business_trip_reimbursement_id: string;
  team_id: string;
  allocation_ratio: number;
  allocation_amount: number;
  created_at: string;
  updated_at: string;
  // Related data
  team?: {
    id: string;
    name: string;
  };
}

export interface BusinessTripAttachment {
  id: string;
  business_trip_reimbursement_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
  // Related data
  uploaded_by_user?: {
    id: string;
    name: string;
  };
}

// Form data interfaces
export interface BusinessTripReimbursementFormData {
  applicant_id: string;
  expense_reason: string;
  total_amount: string;
  department_id: string;
  team_id: string;
  approval_workflow_id: string;
  is_corporate_dimension: boolean;
  expense_details: BusinessTripExpenseDetailFormData[];
  bank_accounts: BusinessTripBankAccountFormData[];
  allocations: BusinessTripAllocationFormData[];
  attachments: File[];
}

export interface BusinessTripExpenseDetailFormData {
  accommodation_fee: string;
  intercity_transport_fee: string;
  local_transport_fee: string;
  other_fees: string;
  description: string;
}

export interface BusinessTripBankAccountFormData {
  payee_account_name: string;
  bank_account: string;
  bank_name: string;
  payment_amount: string;
}

export interface BusinessTripAllocationFormData {
  team_id: string;
  allocation_ratio: string;
}

// API data interfaces
export interface CreateBusinessTripReimbursementData {
  applicant_id: string;
  expense_reason: string;
  total_amount: number;
  department_id?: string;
  team_id?: string;
  approval_workflow_id?: string;
  is_corporate_dimension: boolean;
  expense_details: Omit<BusinessTripExpenseDetail, 'id' | 'business_trip_reimbursement_id' | 'created_at' | 'updated_at'>[];
  bank_accounts: Omit<BusinessTripBankAccount, 'id' | 'business_trip_reimbursement_id' | 'created_at' | 'updated_at'>[];
  allocations: Omit<BusinessTripAllocation, 'id' | 'business_trip_reimbursement_id' | 'allocation_amount' | 'created_at' | 'updated_at'>[];
}

export interface UpdateBusinessTripReimbursementData {
  expense_reason?: string;
  total_amount?: number;
  department_id?: string;
  team_id?: string;
  approval_workflow_id?: string;
  is_corporate_dimension?: boolean;
  expense_details: Omit<BusinessTripExpenseDetail, 'id' | 'business_trip_reimbursement_id' | 'created_at' | 'updated_at'>[];
  bank_accounts: Omit<BusinessTripBankAccount, 'id' | 'business_trip_reimbursement_id' | 'created_at' | 'updated_at'>[];
  allocations: Omit<BusinessTripAllocation, 'id' | 'business_trip_reimbursement_id' | 'allocation_amount' | 'created_at' | 'updated_at'>[];
}

// Statistics interface
export interface BusinessTripReimbursementStatistics {
  total_count: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_amount: number;
  pending_amount: number;
  approved_amount: number;
  rejected_amount: number;
} 