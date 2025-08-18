import { TeamPerformanceConfig, PerformanceTier, Team } from '@/types';

// 团队数据
export const teams: Team[] = [
  {
    id: '1',
    name: '前端开发团队',
    code: 'TEAM-001',
    description: '负责前端产品开发和用户界面设计',
    leaderId: '1',
    memberIds: ['1', '2'],
    departmentId: '1',
    status: 'active',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: '后端开发团队',
    code: 'TEAM-002',
    description: '负责后端服务开发和系统架构设计',
    leaderId: '6',
    memberIds: ['6'],
    departmentId: '1',
    status: 'active',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: '华北销售团队',
    code: 'TEAM-003',
    description: '负责华北地区的销售业务',
    leaderId: '3',
    memberIds: ['3', '11'],
    departmentId: '2',
    status: 'active',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '4',
    name: '新产品研发团队',
    code: 'TEAM-004',
    description: '负责新产品的研发和创新',
    leaderId: '7',
    memberIds: ['7', '8', '16'],
    departmentId: '5',
    status: 'active',
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '5',
    name: '质量保证团队',
    code: 'TEAM-005',
    description: '负责产品质量测试和保证',
    leaderId: '9',
    memberIds: ['9', '10'],
    departmentId: '1',
    status: 'active',
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
];

// 绩效阶梯明细数据
export const performanceTiers: PerformanceTier[] = [
  {
    id: '1',
    minDistance: 0,
    maxDistance: 3,
    performance: 3,
  },
  {
    id: '2',
    minDistance: 3,
    maxDistance: 5,
    performance: 5,
  },
  {
    id: '3',
    minDistance: 5,
    maxDistance: 10,
    performance: 8,
  },
  {
    id: '4',
    minDistance: 10,
    maxDistance: 999,
    performance: 12,
  },
];

// 团队绩效配置数据（团队级别）
export const teamPerformanceConfigs: TeamPerformanceConfig[] = [
  {
    id: '1',
    teamId: '1', // 前端开发团队
    calculationType: 'fixed',
    fixedRate: 5, // 5元/公里
    isActive: true,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '2',
    teamId: '2', // 后端开发团队
    calculationType: 'tiered',
    tiers: [
      { id: '1', minDistance: 0, maxDistance: 3, performance: 3 },
      { id: '2', minDistance: 3, maxDistance: 5, performance: 5 },
      { id: '3', minDistance: 5, maxDistance: 10, performance: 8 },
      { id: '4', minDistance: 10, maxDistance: 999, performance: 12 },
    ],
    isActive: true,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '3',
    teamId: '3', // 华北销售团队
    calculationType: 'tiered',
    tiers: [
      { id: '1', minDistance: 0, maxDistance: 5, performance: 4 },
      { id: '2', minDistance: 5, maxDistance: 10, performance: 7 },
      { id: '3', minDistance: 10, maxDistance: 999, performance: 10 },
    ],
    isActive: true,
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '4',
    teamId: '4', // 新产品研发团队
    calculationType: 'fixed',
    fixedRate: 6, // 6元/公里
    isActive: true,
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
];

// 获取团队绩效配置的辅助函数
export const getTeamPerformanceConfig = (teamId: string): TeamPerformanceConfig | undefined => {
  return teamPerformanceConfigs.find(config => config.teamId === teamId && config.isActive);
};

// 更新团队绩效配置的辅助函数
export const updateTeamPerformanceConfig = (config: TeamPerformanceConfig): void => {
  const index = teamPerformanceConfigs.findIndex(c => c.id === config.id);
  if (index !== -1) {
    teamPerformanceConfigs[index] = { ...config, updatedAt: new Date().toISOString() };
  } else {
    teamPerformanceConfigs.push(config);
  }
};

// 添加新的团队绩效配置
export const addTeamPerformanceConfig = (config: TeamPerformanceConfig): void => {
  teamPerformanceConfigs.push(config);
};

// 删除团队绩效配置
export const deleteTeamPerformanceConfig = (configId: string): void => {
  const index = teamPerformanceConfigs.findIndex(c => c.id === configId);
  if (index !== -1) {
    teamPerformanceConfigs.splice(index, 1);
  }
};

// 获取所有团队绩效配置
export const getAllTeamPerformanceConfigs = (): TeamPerformanceConfig[] => {
  return teamPerformanceConfigs.filter(config => config.isActive);
};
