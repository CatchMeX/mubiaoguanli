import type { User, Department, AssetLocation, Project, Asset } from './index';

// 出入库类型
export type InventoryType = 'in' | 'out';

// 出入库原因
export type InventoryReason = 
  | 'purchase'      // 采购入库
  | 'return'        // 退货入库
  | 'transfer_in'   // 调拨入库
  | 'repair_in'     // 维修入库
  | 'allocation'    // 分配出库
  | 'transfer_out'  // 调拨出库
  | 'repair_out'    // 维修出库
  | 'scrap'         // 报废出库
  | 'loss'          // 丢失出库
  | 'other';        // 其他

// 出入库状态
export type InventoryStatus = 'pending' | 'approved' | 'completed' | 'cancelled';

// 出入库记录
export interface InventoryRecord {
  id: string;
  recordNumber: string;           // 出入库单号
  type: InventoryType;            // 出入库类型
  reason: InventoryReason;        // 出入库原因
  asset: Asset;                   // 关联资产
  quantity: number;               // 数量
  fromLocation?: AssetLocation;   // 原位置（出库时）
  toLocation?: AssetLocation;     // 目标位置（入库时）
  fromDepartment?: Department;    // 原部门（出库时）
  toDepartment?: Department;      // 目标部门（入库时）
  fromCustodian?: User;          // 原保管人（出库时）
  toCustodian?: User;            // 目标保管人（入库时）
  project?: Project;             // 关联项目
  operator: User;                // 操作人
  approver?: User;               // 审批人
  status: InventoryStatus;       // 状态
  operationDate: string;         // 操作日期
  approvalDate?: string;         // 审批日期
  completionDate?: string;       // 完成日期
  notes?: string;                // 备注
  attachments?: string[];        // 附件
  createdAt: string;
  updatedAt: string;
}

// 快速出入库表单数据
export interface QuickInventoryForm {
  type: InventoryType;
  reason: InventoryReason;
  assetId: string;
  quantity: number;
  fromLocationId?: string;
  toLocationId?: string;
  fromDepartmentId?: string;
  toDepartmentId?: string;
  fromCustodianId?: string;
  toCustodianId?: string;
  projectId?: string;
  operationDate: string;
  notes?: string;
}

// 出入库统计
export interface InventoryStatistics {
  totalRecords: number;
  inRecords: number;
  outRecords: number;
  pendingRecords: number;
  completedRecords: number;
  todayRecords: number;
  thisMonthRecords: number;
}
