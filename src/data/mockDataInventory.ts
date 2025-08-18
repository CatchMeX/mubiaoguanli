import type { InventoryRecord, InventoryStatistics } from '@/types/inventory';
import { users, departments, assetLocations, projects } from '@/data/mockData';

// 模拟资产数据（简化版，实际应从资产清单获取）
const mockAssets = [
  {
    id: '1',
    assetCode: 'ASSET-2024-001',
    name: 'Dell OptiPlex 7090',
    category: { id: '1', name: '计算机设备' },
    currentLocation: assetLocations[0],
    currentDepartment: departments[0],
    currentCustodian: users[0],
  },
  {
    id: '2',
    assetCode: 'ASSET-2024-002',
    name: 'HP LaserJet Pro M404n',
    category: { id: '2', name: '办公设备' },
    currentLocation: assetLocations[1],
    currentDepartment: departments[1],
    currentCustodian: users[2],
  },
  {
    id: '3',
    assetCode: 'ASSET-2024-003',
    name: 'iPhone 15 Pro',
    category: { id: '3', name: '通讯设备' },
    currentLocation: assetLocations[2],
    currentDepartment: departments[2],
    currentCustodian: users[3],
  },
];

// 出入库记录模拟数据
export const inventoryRecords: InventoryRecord[] = [
  {
    id: '1',
    recordNumber: 'INV-IN-2024-001',
    type: 'in',
    reason: 'purchase',
    asset: mockAssets[0] as any,
    quantity: 1,
    toLocation: assetLocations[0],
    toDepartment: departments[0],
    toCustodian: users[0],
    project: projects[0],
    operator: users[0],
    approver: users[1],
    status: 'completed',
    operationDate: '2024-12-01',
    approvalDate: '2024-12-01',
    completionDate: '2024-12-01',
    notes: '新采购的台式电脑，分配给技术部使用',
    attachments: [],
    createdAt: '2024-12-01T09:00:00.000Z',
    updatedAt: '2024-12-01T09:30:00.000Z',
  },
  {
    id: '2',
    recordNumber: 'INV-OUT-2024-001',
    type: 'out',
    reason: 'allocation',
    asset: mockAssets[1] as any,
    quantity: 1,
    fromLocation: assetLocations[1],
    toLocation: assetLocations[2],
    fromDepartment: departments[1],
    toDepartment: departments[2],
    fromCustodian: users[2],
    toCustodian: users[3],
    operator: users[2],
    approver: users[1],
    status: 'completed',
    operationDate: '2024-12-01',
    approvalDate: '2024-12-01',
    completionDate: '2024-12-01',
    notes: '打印机从销售部调拨到市场部',
    attachments: [],
    createdAt: '2024-12-01T10:00:00.000Z',
    updatedAt: '2024-12-01T10:30:00.000Z',
  },
  {
    id: '3',
    recordNumber: 'INV-OUT-2024-002',
    type: 'out',
    reason: 'repair_out',
    asset: mockAssets[2] as any,
    quantity: 1,
    fromLocation: assetLocations[2],
    fromDepartment: departments[2],
    fromCustodian: users[3],
    operator: users[3],
    status: 'pending',
    operationDate: '2024-12-02',
    notes: '手机屏幕损坏，送修',
    attachments: [],
    createdAt: '2024-12-02T14:00:00.000Z',
    updatedAt: '2024-12-02T14:00:00.000Z',
  },
  {
    id: '4',
    recordNumber: 'INV-IN-2024-002',
    type: 'in',
    reason: 'repair_in',
    asset: mockAssets[2] as any,
    quantity: 1,
    toLocation: assetLocations[2],
    toDepartment: departments[2],
    toCustodian: users[3],
    operator: users[3],
    status: 'approved',
    operationDate: '2024-12-03',
    approvalDate: '2024-12-03',
    notes: '手机维修完成，重新入库',
    attachments: [],
    createdAt: '2024-12-03T16:00:00.000Z',
    updatedAt: '2024-12-03T16:30:00.000Z',
  },
  {
    id: '5',
    recordNumber: 'INV-IN-2024-003',
    type: 'in',
    reason: 'transfer_in',
    asset: mockAssets[0] as any,
    quantity: 1,
    fromLocation: assetLocations[0],
    toLocation: assetLocations[1],
    fromDepartment: departments[0],
    toDepartment: departments[1],
    fromCustodian: users[0],
    toCustodian: users[2],
    project: projects[1],
    operator: users[0],
    status: 'pending',
    operationDate: '2024-12-04',
    notes: '电脑从技术部调拨到销售部支持新项目',
    attachments: [],
    createdAt: '2024-12-04T11:00:00.000Z',
    updatedAt: '2024-12-04T11:00:00.000Z',
  },
];

// 获取所有出入库记录
export const getAllInventoryRecords = (): InventoryRecord[] => {
  return inventoryRecords;
};

// 根据类型获取记录
export const getInventoryRecordsByType = (type: 'in' | 'out'): InventoryRecord[] => {
  return inventoryRecords.filter(record => record.type === type);
};

// 根据状态获取记录
export const getInventoryRecordsByStatus = (status: string): InventoryRecord[] => {
  return inventoryRecords.filter(record => record.status === status);
};

// 根据资产ID获取记录
export const getInventoryRecordsByAsset = (assetId: string): InventoryRecord[] => {
  return inventoryRecords.filter(record => record.asset.id === assetId);
};

// 添加出入库记录
export const addInventoryRecord = (record: InventoryRecord): void => {
  inventoryRecords.unshift(record);
};

// 更新出入库记录
export const updateInventoryRecord = (record: InventoryRecord): void => {
  const index = inventoryRecords.findIndex(r => r.id === record.id);
  if (index !== -1) {
    inventoryRecords[index] = { ...record, updatedAt: new Date().toISOString() };
  }
};

// 删除出入库记录
export const deleteInventoryRecord = (recordId: string): void => {
  const index = inventoryRecords.findIndex(r => r.id === recordId);
  if (index !== -1) {
    inventoryRecords.splice(index, 1);
  }
};

// 获取出入库统计
export const getInventoryStatistics = (): InventoryStatistics => {
  const totalRecords = inventoryRecords.length;
  const inRecords = inventoryRecords.filter(r => r.type === 'in').length;
  const outRecords = inventoryRecords.filter(r => r.type === 'out').length;
  const pendingRecords = inventoryRecords.filter(r => r.status === 'pending').length;
  const completedRecords = inventoryRecords.filter(r => r.status === 'completed').length;
  
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = inventoryRecords.filter(r => r.operationDate === today).length;
  
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthRecords = inventoryRecords.filter(r => r.operationDate.startsWith(thisMonth)).length;
  
  return {
    totalRecords,
    inRecords,
    outRecords,
    pendingRecords,
    completedRecords,
    todayRecords,
    thisMonthRecords,
  };
};

// 获取可用资产列表（用于出入库选择）
export const getAvailableAssets = () => {
  return mockAssets;
};
