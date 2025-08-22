export interface Unit {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  employee_id: string;
  email?: string;
  phone?: string;
  avatar?: string;
  position_id?: string;
  salary?: number;
  performance_pay?: number; // 绩效薪资
  status: 'active' | 'inactive';
  join_date?: string;
  created_at: string;
  updated_at: string;
  // 关联字段
  position?: Position;
  primaryDepartment?: Department;
  departments?: Department[];
  user_departments?: Array<{
    is_primary: boolean;
    departments: Department;
  }>;
  roles?: Role[];
}

// 新增Position接口
export interface Position {
  id: string;
  name: string;
  code: string;
  level: number;
  description?: string;
  department_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  manager_id?: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  cost_center?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  children?: Department[];
  manager?: User;
}

export interface Task {
  id: string;
  title: string;
  content?: string;
  deadline?: string;
  priority_level?: 'important_urgent' | 'important_not_urgent' | 'urgent_not_important' | 'not_important_not_urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress?: number; // 任务完成进度（百分比）
  assignee_id?: string;
  created_by_id?: string;
  created_at: string;
  updated_at: string;
  assignee?: User;
  created_by?: User;
  progress_records?: TaskProgress[];
}

// 公司年度目标
export interface CompanyYearlyGoal {
  id: string;
  title: string;
  description?: string;
  year: number;
  target_value: number;
  unit_id?: string;
  manager_id?: string;
  created_by?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  deleted_at?: string; // 软删除时间戳
  manager?: User;
  unit?: Unit;
  creator?: User;
  quarters?: QuarterlyGoal[];
  team_monthly_goals?: TeamMonthlyGoal[];
}

// 季度目标
export interface QuarterlyGoal {
  id: string;
  company_yearly_goal_id: string;
  quarter: 1 | 2 | 3 | 4;
  target_value: number;
  unit_id?: string;
  actual_value?: number;
  percentage: number;
  basis?: string;
  created_at: string;
  updated_at: string;
}

// 团队月度目标
export interface TeamMonthlyGoal {
  id: string;
  department_id?: string;
  company_yearly_goal_id?: string;
  title?: string; // 新增：目标标题字段
  month: number;
  year: number;
  target_value: number;
  unit_id?: string;
  progress: number;
  created_by?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  deleted_at?: string; // 软删除时间戳
  department?: Department;
  company_yearly_goal?: CompanyYearlyGoal;
  unit?: Unit;
  creator?: User;
  personalGoals?: PersonalMonthlyGoal[];
}

// 个人月度目标
export interface PersonalMonthlyGoal {
  id: string;
  user_id?: string;
  team_monthly_goal_id?: string;
  month: number;
  year: number;
  target_value: number;
  unit_id?: string;
  progress: number;
  created_by?: string;
  team_goal_deleted?: boolean;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  remark?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  team_monthly_goal?: TeamMonthlyGoal;
  unit?: Unit;
  creator?: User;
  dailyReports?: DailyReport[];
}

// 日报
export interface DailyReport {
  id: string;
  user_id?: string;
  personal_monthly_goal_id?: string;
  report_date: string;
  work_content?: string;
  progress_description?: string;
  performance_value?: number;
  difficulties?: string;
  next_plan?: string;
  status: 'draft' | 'submitted' | 'approved';
  created_at: string;
  updated_at: string;
  user?: User;
  personal_monthly_goal?: PersonalMonthlyGoal;
}

export interface FinanceCategory {
  id: string;
  name: string;
  code: string;
  type: 'income' | 'expense' | 'cost' | 'asset' | 'liability' | 'equity';
  parent_id?: string;
  level: number;
  sort_order: number;
  description?: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  children?: FinanceCategory[];
  parent?: FinanceCategory;
}

interface FinanceRecord {
  id: string;
  type: 'income' | 'expense' | 'cost';
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  attachments?: string[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  category_id: string;
  brand_id?: string;
  model?: string;
  specification?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_period?: string;
  location_id?: string;
  department_id?: string;
  custodian_id?: string;
  user_id?: string;
  status: 'in_use' | 'idle' | 'maintenance' | 'scrapped' | 'disposed';
  notes?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  category?: AssetCategory;
  brand?: AssetBrand;
  location?: AssetLocation;
  department?: Department;
  custodian?: User;
  user?: User;
}

export interface AssetCategory {
  id: string;
  name: string;
  code: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  project_id?: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  children?: AssetCategory[];
  parent?: AssetCategory;
  project?: Project;
}

export interface AssetLocation {
  id: string;
  name: string;
  code: string;
  type: 'building' | 'floor' | 'room';
  parent_id?: string;
  level: number;
  capacity: number;
  responsible_id?: string;
  address?: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  children?: AssetLocation[];
  parent?: AssetLocation;
  responsible?: User;
}

export interface AssetBrand {
  id: string;
  name: string;
  code: string;
  country?: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}



export interface Team {
  id: string;
  name: string;
  code?: string;
  description?: string;
  leader_id?: string;
  department_id?: string;
  team_type?: 'project' | 'functional' | 'cross_functional';
  established_date?: string;
  objectives?: string;
  location?: string;
  contact_email?: string;
  contact_phone?: string;
  status: 'active' | 'inactive' | 'disbanded';
  created_at: string;
  updated_at: string;
  leader?: User;
  department?: Department;
  members?: User[];
  team_members?: TeamMember[];
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role?: string;
  joined_at: string;
  user?: User;
}

export interface TeamPerformanceConfig {
  id: string;
  team_id: string;
  calculation_type: 'fixed' | 'tiered';
  fixed_rate?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  team?: Team;
  tiers?: PerformanceTier[];
}

export interface PerformanceTier {
  id: string;
  team_performance_config_id: string;
  tier_name: string;
  min_value: number;
  max_value: number;
  rate: number;
  created_at: string;
  updated_at: string;
}

export interface TeamAllocationConfig {
  id: string;
  team_id: string;
  allocation_ratio: number;
  is_enabled: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
  team?: Team;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  type: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  status: string;
  is_system: boolean;
  permissions: Permission[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: string;
}

export interface EmployeeMileage {
  id: string;
  employee_id?: string;
  team_id?: string;
  mileage: number;
  calculated_performance: number;
  record_date: string;
  description?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  updated_at: string;
  employee?: User;
  team?: Team;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  type: 'individual' | 'enterprise' | 'government';
  industry?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_level: 'A' | 'B' | 'C' | 'D';
  status: 'active' | 'inactive';
  registration_date?: string;
  last_transaction_date?: string;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  type: 'goods' | 'service' | 'both';
  industry?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  bank_account?: string;
  credit_level: 'A' | 'B' | 'C' | 'D';
  status: 'active' | 'inactive';
  registration_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  manager_id?: string;
  department_id?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  progress: number;
  created_at: string;
  updated_at: string;
  manager?: User;
  department?: Department;
}



export interface TaskProgress {
  id: string;
  task_id: string;
  progress_date: string;
  progress_percentage: number; // 完成进度（百分比）
  description?: string;
  created_by_id?: string;
  created_at: string;
  updated_at: string;
  task?: Task;
  created_by?: User;
}

// 工作流管理 
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  type: string;
  is_active: boolean;
  created_by_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: User;
  nodes?: WorkflowNode[];
  transitions?: WorkflowTransition[];
}

export interface WorkflowNode {
  id: string;
  workflow_id: string;
  name: string;
  type: 'start' | 'approval' | 'end';
  position_x?: number;
  position_y?: number;
  approval_level?: 'department' | 'finance' | 'leadership';
  approver_role?: string;
  auto_approve: boolean;
  created_at: string;
}

export interface WorkflowTransition {
  id: string;
  workflow_id: string;
  from_node_id: string;
  to_node_id: string;
  condition_type: 'always' | 'approved' | 'rejected';
  created_at: string;
  from_node?: WorkflowNode;
  to_node?: WorkflowNode;
}

export interface WorkflowInstance {
  id: string;
  workflow_id: string;
  entity_type: string;
  entity_id: string;
  current_node_id?: string;
  status: 'running' | 'completed' | 'terminated';
  initiated_by_id?: string;
  initiated_at: string;
  completed_at?: string;
  workflow?: Workflow;
  current_node?: WorkflowNode;
  initiated_by?: User;
}

// 成本管理
export interface CostCenter {
  id: string;
  name: string;
  code: string;
  type: 'department' | 'project' | 'product';
  budget?: number;
  description?: string;
  responsible_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  responsible?: User;
}

export interface CostRecord {
  id: string;
  cost_center_id?: string;
  category_id?: string;
  team_id?: string; // 关联团队ID
  amount: number;
  period_year: number;
  period_month: number;
  description?: string;
  actual_cost?: number;
  budget_cost?: number;
  variance?: number;
  status: 'draft' | 'confirmed' | 'approved';
  created_by_id?: string;
  created_at: string;
  updated_at: string;
  cost_center?: CostCenter;
  category?: FinanceCategory;
  team?: Team; // 关联团队
  created_by?: User;
  allocation_records?: AllocationRecord[];
  is_allocation_enabled?: boolean;
}

// 待办事项
export interface Todo {
  id: string;
  title: string;
  description?: string;
  type: 'general' | 'approval' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  assigned_to_id?: string;
  created_by_id?: string;
  entity_type?: string;
  entity_id?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  assigned_to?: User;
  created_by?: User;
}

// 往来分摊配置
export interface AllocationConfig {
  id: string;
  name: string;
  target_type: 'department' | 'subsidiary' | 'project';
  target_id: string;
  allocation_ratio: number;
  is_enabled: boolean;
  created_by_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: User;
  target?: Department | Supplier | Project; // 根据target_type的不同，指向不同的实体
}

// 往来分摊记录
export interface AllocationRecord {
  id: string;
  source_record_type: 'expense' | 'cost' | 'revenue' | 'accounts';
  source_record_id: string;
  allocation_config_id?: string;
  allocated_amount: number;
  allocation_date: string;
  description?: string;
  created_by_id?: string;
  created_at: string;
  allocation_config?: AllocationConfig;
  created_by?: User;
}

// 往来管理汇总数据
export interface AllocationSummary {
  id: string;
  target_name: string;
  target_type: 'department' | 'subsidiary' | 'project';
  total_allocated: number;
  allocation_count: number;
  avg_allocation: number;
  last_allocation_date?: string;
  allocation_ratio?: number;
}

// 预警规则接口
export interface AlertRule {
  id: string;
  name: string;
  type: 'ratio_change' | 'absolute_amount' | 'relative_amount' | 'asset_ratio';
  enabled: boolean;
  threshold: number;
  subsidiary_id?: string;
  category_id?: string;
  description?: string;
  created_by_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: User;
  category?: FinanceCategory;
}

// 预警记录接口
export interface AlertRecord {
  id: string;
  alert_rule_id?: string;
  type: 'ratio_change' | 'absolute_amount' | 'relative_amount' | 'asset_ratio';
  level: 'low' | 'medium' | 'high';
  target_id: string;
  target_name: string;
  record_id: string;
  record_description?: string;
  current_value: number;
  threshold_value: number;
  historical_average?: number;
  deviation?: number;
  alert_date: string;
  status: 'active' | 'resolved' | 'ignored';
  message?: string;
  resolved_by_id?: string;
  resolved_at?: string;
  created_at: string;
  alert_rule?: AlertRule;
  resolved_by?: User;
}

// 资产变动记录
export interface AssetMovement {
  id: string;
  movement_number: string;
  asset_id: string;
  movement_type: 'transfer' | 'allocation' | 'maintenance';
  from_location_id?: string;
  to_location_id?: string;
  from_department_id?: string;
  to_department_id?: string;
  from_custodian_id?: string;
  to_custodian_id?: string;
  to_status?: string; // 添加状态字段
  reason?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  application_date: string;
  approval_date?: string;
  applicant_id: string;
  approver_id?: string;
  asset?: Asset;
  applicant?: User;
  approver?: User;
}

// 盘点计划
export interface InventoryPlan {
  id: string;
  plan_number: string;
  plan_name: string;
  type: 'full' | 'partial' | 'spot';
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  description?: string;
  location_ids: string[];
  category_ids: string[];
  responsible_ids: string[];
  created_by_id?: string;
  created_at: string;
  updated_at: string;
  // 关联字段
  created_by?: User;
  locations?: AssetLocation[];
  categories?: AssetCategory[];
  responsibles?: User[];
  records?: InventoryPlanRecord[];
}

// 盘点记录
export interface InventoryPlanRecord {
  id: string;
  plan_id: string;
  asset_id: string;
  expected_location_id?: string;
  actual_location_id?: string;
  expected_status?: string;
  actual_status?: string;
  expected_custodian_id?: string;
  actual_custodian_id?: string;
  difference: 'normal' | 'missing' | 'surplus' | 'damaged' | 'location_error' | 'custodian_error';
  checker_id?: string;
  check_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // 关联字段
  plan?: InventoryPlan;
  asset?: Asset;
  expected_location?: AssetLocation;
  actual_location?: AssetLocation;
  expected_custodian?: User;
  actual_custodian?: User;
  checker?: User;
}

// 盘点调整记录
export interface InventoryAdjustment {
  id: string;
  adjustment_number: string;
  plan_record_id?: string;
  asset_id: string;
  adjustment_type: 'location' | 'status' | 'custodian' | 'value' | 'disposal';
  before_value?: any;
  after_value?: any;
  reason?: string;
  operator_id?: string;
  approver_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adjustment_date: string;
  approval_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // 关联字段
  plan_record?: InventoryPlanRecord;
  asset?: Asset;
  operator?: User;
  approver?: User;
}

// 更新采购订单接口，使其与数据库字段一致
export interface ProcurementOrder {
  id: string;
  orderNumber: string;
  title: string;
  applicantId?: string;
  departmentId?: string;
  supplierId?: string;
  expectedDeliveryDate?: string;
  totalAmount?: number;
  purchaseTotalAmount?: number; // 新增采购总额字段
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
  businessPurpose?: string;
  attachments?: string[];
  approvalHistory?: any[];
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  // 关联字段
  applicant?: User;
  department?: Department;
  supplier?: Supplier;
  createdBy?: User;
  items?: ProcurementOrderItem[];
}

// 更新采购订单明细接口
export interface ProcurementOrderItem {
  id: string;
  orderId: string;
  assetCode?: string; // 新增资产编号
  assetName: string;
  categoryId?: string; // 新增资产分类
  brandId?: string; // 新增品牌
  specificationModel?: string; // 规格型号（合并原型号和规格字段）
  quantity: number;
  unitPrice?: number;
  totalAmount?: number;
  budgetAmount?: number;
  projectId?: string; // 新增关联项目
  createdAt: string;
  // 数据库字段名（snake_case）
  category_id?: string;
  brand_id?: string;
  specification_model?: string;
  // 关联字段
  category?: AssetCategory;
  brand?: AssetBrand;
  project?: Project;
}

// 采购入库单
export interface ProcurementReceipt {
  id: string;
  receiptNumber: string;
  orderId?: string;
  supplierId?: string;
  deliveryDate: string;
  inspectorId?: string;
  totalReceived?: number;
  status: 'pending' | 'partial' | 'completed' | 'rejected';
  notes?: string;
  attachments?: string[];
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  // 关联字段
  order?: ProcurementOrder;
  supplier?: Supplier;
  inspector?: User;
  createdBy?: User;
  items?: ProcurementReceiptItem[];
}

// 采购入库明细
export interface ProcurementReceiptItem {
  id: string;
  receiptId: string;
  orderItemId?: string;
  expectedQuantity: number;
  actualQuantity: number;
  qualityStatus: 'qualified' | 'unqualified' | 'damaged';
  receiptStatus: 'normal' | 'partial' | 'excess' | 'shortage';
  unitPrice?: number;
  totalAmount?: number;
  locationId?: string;
  notes?: string;
  createdAt: string;
  // 关联字段
  orderItem?: ProcurementOrderItem;
  location?: AssetLocation;
}

// 维护计划类型
export interface MaintenancePlan {
  id: string;
  plan_name: string;
  asset_id: string;
  asset: Asset;
  type: 'preventive' | 'corrective' | 'emergency';
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  next_date: string;
  responsible_id: string;
  responsible: User;
  description?: string;
  cost?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// 维护记录类型
export interface MaintenanceRecord {
  id: string;
  asset_id: string;
  asset: Asset;
  plan_id?: string;
  plan?: MaintenancePlan;
  type: 'preventive' | 'corrective' | 'emergency';
  description?: string;
  start_date: string;
  end_date?: string;
  cost?: number;
  supplier_id?: string;
  supplier?: Supplier;
  technician?: string;
  result: 'completed' | 'failed' | 'partial';
  next_maintenance_date?: string;
  created_at: string;
  updated_at: string;
}

// 资产处置类型
export interface AssetDisposal {
  id: string;
  asset_id: string;
  asset: Asset;
  type: 'scrap' | 'sale' | 'donation' | 'transfer';
  reason?: string;
  disposal_date: string;
  disposal_value?: number;
  income?: number;
  recipient?: string;
  approver_id: string;
  approver: User;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// 导出财务事项管理相关类型
export * from './financial';

// 导出付款管理相关类型
export * from './payment';

// 导出费用报销管理相关类型
export * from './expense';
export * from './businessTrip';

// 导出共享出行相关类型
export type { 
  RideSharingDailyReport, 
  RideSharingDailyReportFormData, 
  RideSharingStatistics 
} from './rideSharing';
