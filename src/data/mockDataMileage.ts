import { EmployeeMileage } from '@/types';
import { users } from '@/data/mockData';

// 员工里程记录数据
export const employeeMileageRecords: EmployeeMileage[] = [
  {
    id: '1',
    employee: users[1], // 李四 - 前端开发团队
    teamId: '1',
    mileage: 8.5,
    calculatedPerformance: 42.5, // 8.5 * 5 = 42.5 (固定值计算)
    recordDate: '2024-12-01',
    description: '客户现场技术支持',
    status: 'confirmed',
    createdAt: '2024-12-01T09:00:00.000Z',
    updatedAt: '2024-12-01T09:00:00.000Z',
  },
  {
    id: '2',
    employee: users[6], // 周九 - 前端开发团队
    teamId: '1',
    mileage: 12.3,
    calculatedPerformance: 61.5, // 12.3 * 5 = 61.5 (固定值计算)
    recordDate: '2024-12-01',
    description: '项目部署和培训',
    status: 'confirmed',
    createdAt: '2024-12-01T10:30:00.000Z',
    updatedAt: '2024-12-01T10:30:00.000Z',
  },
  {
    id: '3',
    employee: users[4], // 钱七 - 后端开发团队
    teamId: '2',
    mileage: 4.2,
    calculatedPerformance: 5, // 阶梯计算：3-5公里范围，绩效5元
    recordDate: '2024-12-01',
    description: '服务器维护',
    status: 'confirmed',
    createdAt: '2024-12-01T14:15:00.000Z',
    updatedAt: '2024-12-01T14:15:00.000Z',
  },
  {
    id: '4',
    employee: users[0], // 张三 - 后端开发团队
    teamId: '2',
    mileage: 7.8,
    calculatedPerformance: 8, // 阶梯计算：5-10公里范围，绩效8元
    recordDate: '2024-12-01',
    description: '数据库优化',
    status: 'confirmed',
    createdAt: '2024-12-01T16:45:00.000Z',
    updatedAt: '2024-12-01T16:45:00.000Z',
  },
  {
    id: '5',
    employee: users[5], // 孙八 - 华北销售团队
    teamId: '3',
    mileage: 15.6,
    calculatedPerformance: 10, // 阶梯计算：10公里以上，绩效10元
    recordDate: '2024-12-01',
    description: '客户拜访',
    status: 'confirmed',
    createdAt: '2024-12-01T08:20:00.000Z',
    updatedAt: '2024-12-01T08:20:00.000Z',
  },
  {
    id: '6',
    employee: users[9], // 陈十二 - 华北销售团队
    teamId: '3',
    mileage: 6.7,
    calculatedPerformance: 7, // 阶梯计算：5-10公里范围，绩效7元
    recordDate: '2024-12-01',
    description: '商务洽谈',
    status: 'confirmed',
    createdAt: '2024-12-01T11:10:00.000Z',
    updatedAt: '2024-12-01T11:10:00.000Z',
  },
  {
    id: '7',
    employee: users[1], // 李四 - 前端开发团队
    teamId: '1',
    mileage: 3.2,
    calculatedPerformance: 16, // 3.2 * 5 = 16 (固定值计算)
    recordDate: '2024-11-30',
    description: '用户培训',
    status: 'confirmed',
    createdAt: '2024-11-30T15:30:00.000Z',
    updatedAt: '2024-11-30T15:30:00.000Z',
  },
  {
    id: '8',
    employee: users[13], // 杨十六 - 新产品研发团队
    teamId: '4',
    mileage: 9.1,
    calculatedPerformance: 54.6, // 9.1 * 6 = 54.6 (固定值计算)
    recordDate: '2024-12-01',
    description: '市场调研',
    status: 'pending',
    createdAt: '2024-12-01T13:25:00.000Z',
    updatedAt: '2024-12-01T13:25:00.000Z',
  },
];

// 获取所有里程记录
export const getAllMileageRecords = (): EmployeeMileage[] => {
  return employeeMileageRecords;
};

// 根据员工ID获取里程记录
export const getMileageRecordsByEmployee = (employeeId: string): EmployeeMileage[] => {
  return employeeMileageRecords.filter(record => record.employee.id === employeeId);
};

// 根据团队ID获取里程记录
export const getMileageRecordsByTeam = (teamId: string): EmployeeMileage[] => {
  return employeeMileageRecords.filter(record => record.teamId === teamId);
};

// 添加里程记录
export const addMileageRecord = (record: EmployeeMileage): void => {
  employeeMileageRecords.push(record);
};

// 更新里程记录
export const updateMileageRecord = (record: EmployeeMileage): void => {
  const index = employeeMileageRecords.findIndex(r => r.id === record.id);
  if (index !== -1) {
    employeeMileageRecords[index] = { ...record, updatedAt: new Date().toISOString() };
  }
};

// 删除里程记录
export const deleteMileageRecord = (recordId: string): void => {
  const index = employeeMileageRecords.findIndex(r => r.id === recordId);
  if (index !== -1) {
    employeeMileageRecords.splice(index, 1);
  }
};

// 获取员工里程统计
export const getMileageStatistics = () => {
  const totalRecords = employeeMileageRecords.length;
  const totalMileage = employeeMileageRecords.reduce((sum, record) => sum + record.mileage, 0);
  const totalPerformance = employeeMileageRecords.reduce((sum, record) => sum + record.calculatedPerformance, 0);
  const confirmedRecords = employeeMileageRecords.filter(record => record.status === 'confirmed').length;
  
  return {
    totalRecords,
    totalMileage: Math.round(totalMileage * 10) / 10,
    totalPerformance: Math.round(totalPerformance * 100) / 100,
    confirmedRecords,
    pendingRecords: totalRecords - confirmedRecords,
    averageMileage: totalRecords > 0 ? Math.round((totalMileage / totalRecords) * 10) / 10 : 0,
    averagePerformance: totalRecords > 0 ? Math.round((totalPerformance / totalRecords) * 100) / 100 : 0,
  };
};
