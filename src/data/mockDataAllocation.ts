import type { TeamAllocationConfig } from '@/types';

// 团队分摊配置数据
export const teamAllocationConfigs: TeamAllocationConfig[] = [
  {
    id: '1',
    teamId: '1', // 前端开发团队
    isEnabled: true,
    allocationNumber: 30,
    allocationRatio: 30.00, // 确保精确的数值
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '2',
    teamId: '2', // 后端开发团队
    isEnabled: true,
    allocationNumber: 40,
    allocationRatio: 40.00, // 确保精确的数值
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '3',
    teamId: '3', // 华北销售团队
    isEnabled: true,
    allocationNumber: 20,
    allocationRatio: 20.00, // 确保精确的数值
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '4',
    teamId: '4', // 新产品研发团队
    isEnabled: true,
    allocationNumber: 10,
    allocationRatio: 10.00, // 确保精确的数值
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '5',
    teamId: '5', // 华东销售团队 - 未启用
    isEnabled: false,
    allocationNumber: 0,
    allocationRatio: 0.00,
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '6',
    teamId: '6', // 产品设计团队 - 未启用
    isEnabled: false,
    allocationNumber: 0,
    allocationRatio: 0.00,
    createdAt: '2024-04-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
];

// 获取团队分摊配置
export const getTeamAllocationConfig = (teamId: string): TeamAllocationConfig | undefined => {
  return teamAllocationConfigs.find(config => config.teamId === teamId);
};

// 获取所有团队分摊配置 - 直接返回配置数据，不进行计算
export const getAllTeamAllocationConfigs = (): TeamAllocationConfig[] => {
  // 直接返回配置数据，确保分摊比例正确
  return teamAllocationConfigs.map(config => ({
    ...config,
    // 确保分摊比例数据类型正确
    allocationRatio: Number(config.allocationRatio)
  }));
};

// 获取启用的团队分摊配置
export const getEnabledTeamAllocationConfigs = (): TeamAllocationConfig[] => {
  return teamAllocationConfigs.filter(config => config.isEnabled);
};

// 更新团队分摊配置
export const updateTeamAllocationConfig = (config: TeamAllocationConfig): void => {
  const index = teamAllocationConfigs.findIndex(c => c.id === config.id);
  if (index !== -1) {
    teamAllocationConfigs[index] = { ...config, updatedAt: new Date().toISOString() };
  }
};

// 批量更新团队分摊配置
export const batchUpdateTeamAllocationConfigs = (configs: TeamAllocationConfig[]): void => {
  configs.forEach(config => {
    const index = teamAllocationConfigs.findIndex(c => c.id === config.id);
    if (index !== -1) {
      teamAllocationConfigs[index] = { ...config, updatedAt: new Date().toISOString() };
    } else {
      teamAllocationConfigs.push(config);
    }
  });
};

// 添加新的团队分摊配置
export const addTeamAllocationConfig = (config: TeamAllocationConfig): void => {
  teamAllocationConfigs.push(config);
};

// 删除团队分摊配置
export const deleteTeamAllocationConfig = (configId: string): void => {
  const index = teamAllocationConfigs.findIndex(c => c.id === configId);
  if (index !== -1) {
    teamAllocationConfigs.splice(index, 1);
  }
};

// 验证分摊比例总和是否为100%
export const validateAllocationRatios = (configs?: TeamAllocationConfig[]): { isValid: boolean; totalRatio: number } => {
  const configsToValidate = configs || getEnabledTeamAllocationConfigs();
  const totalRatio = configsToValidate.reduce((sum, config) => {
    return sum + (config.allocationRatio || 0);
  }, 0);
  
  // 允许0.01的误差
  const isValid = Math.abs(totalRatio - 100) <= 0.01;
  
  return {
    isValid,
    totalRatio: Math.round(totalRatio * 100) / 100
  };
};

// 计算分摊比例 - 修复缺失的导出函数
export const calculateAllocationRatios = (configs?: TeamAllocationConfig[]): { [teamId: string]: number } => {
  const configsToCalculate = configs || getEnabledTeamAllocationConfigs();
  const ratios: { [teamId: string]: number } = {};
  
  configsToCalculate.forEach(config => {
    ratios[config.teamId] = config.allocationRatio || 0;
  });
  
  return ratios;
};

// 计算分摊金额
export const calculateAllocationAmount = (teamId: string, totalAmount: number): number => {
  const config = getTeamAllocationConfig(teamId);
  if (!config || !config.isEnabled || !totalAmount) return 0;
  
  // 分摊金额 = 总金额 × 分摊比例，四舍五入保留2位小数
  const amount = (totalAmount * config.allocationRatio) / 100;
  return Math.round(amount * 100) / 100;
};

// 获取分摊明细
export const getAllocationDetails = (totalAmount: number): Array<{
  teamId: string;
  teamName: string;
  ratio: number;
  amount: number;
}> => {
  const enabledConfigs = getEnabledTeamAllocationConfigs();
  
  return enabledConfigs.map(config => ({
    teamId: config.teamId,
    teamName: `团队${config.teamId}`, // 这里可以根据实际需要获取团队名称
    ratio: config.allocationRatio,
    amount: calculateAllocationAmount(config.teamId, totalAmount)
  }));
};

// 重新计算所有分摊比例 - 额外的工具函数
export const recalculateAllocationRatios = (): void => {
  const enabledConfigs = getEnabledTeamAllocationConfigs();
  const totalRatio = enabledConfigs.reduce((sum, config) => sum + config.allocationRatio, 0);
  
  if (totalRatio !== 100) {
    console.warn(`分摊比例总计为 ${totalRatio}%，不等于100%`);
  }
};

// 获取分摊配置统计信息
export const getAllocationStats = (): {
  totalConfigs: number;
  enabledConfigs: number;
  disabledConfigs: number;
  totalRatio: number;
  isValid: boolean;
} => {
  const allConfigs = getAllTeamAllocationConfigs();
  const enabledConfigs = getEnabledTeamAllocationConfigs();
  const validation = validateAllocationRatios();
  
  return {
    totalConfigs: allConfigs.length,
    enabledConfigs: enabledConfigs.length,
    disabledConfigs: allConfigs.length - enabledConfigs.length,
    totalRatio: validation.totalRatio,
    isValid: validation.isValid
  };
};
