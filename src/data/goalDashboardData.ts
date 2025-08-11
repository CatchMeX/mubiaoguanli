import { CompanyYearlyGoal, TeamMonthlyGoal, PersonalMonthlyGoal, DailyReport } from '@/types';
import { users, departments } from '@/data/mockData';

// 公司年度目标数据
export const goalDashboardYearlyGoals: CompanyYearlyGoal[] = [
  {
    id: 'yearly-2024',
    year: 2024,
    targetValue: 15000000,
    manager: users[0], // 张三
    quarters: [
      { id: 'q1-2024', quarter: 1, targetValue: 3000000, percentage: 20, basis: '历史数据分析', companyYearlyGoalId: 'yearly-2024' },
      { id: 'q2-2024', quarter: 2, targetValue: 3750000, percentage: 25, basis: '市场增长预期', companyYearlyGoalId: 'yearly-2024' },
      { id: 'q3-2024', quarter: 3, targetValue: 3750000, percentage: 25, basis: '产品发布计划', companyYearlyGoalId: 'yearly-2024' },
      { id: 'q4-2024', quarter: 4, targetValue: 4500000, percentage: 30, basis: '年终冲刺计划', companyYearlyGoalId: 'yearly-2024' },
    ],
  },
  {
    id: 'yearly-2025',
    year: 2025,
    targetValue: 20000000,
    manager: users[0], // 张三
    quarters: [
      { id: 'q1-2025', quarter: 1, targetValue: 4000000, percentage: 20, basis: '新产品线推出', companyYearlyGoalId: 'yearly-2025' },
      { id: 'q2-2025', quarter: 2, targetValue: 5000000, percentage: 25, basis: '市场扩张计划', companyYearlyGoalId: 'yearly-2025' },
      { id: 'q3-2025', quarter: 3, targetValue: 5000000, percentage: 25, basis: '技术升级完成', companyYearlyGoalId: 'yearly-2025' },
      { id: 'q4-2025', quarter: 4, targetValue: 6000000, percentage: 30, basis: '全年冲刺目标', companyYearlyGoalId: 'yearly-2025' },
    ],
  },
];

// 团队月度目标数据
export const goalDashboardMonthlyGoals: TeamMonthlyGoal[] = [
  // 2024年销售部月度目标
  {
    id: 'monthly-sales-2024-10',
    department: departments[1], // 销售部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 1200000,
    progress: 95,
    personalGoals: [],
  },
  {
    id: 'monthly-sales-2024-11',
    department: departments[1], // 销售部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 11,
    year: 2024,
    targetValue: 1300000,
    progress: 88,
    personalGoals: [],
  },
  {
    id: 'monthly-sales-2024-12',
    department: departments[1], // 销售部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 12,
    year: 2024,
    targetValue: 1500000,
    progress: 72,
    personalGoals: [],
  },
  
  // 2024年技术部月度目标
  {
    id: 'monthly-tech-2024-10',
    department: departments[0], // 技术部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 300000,
    progress: 85,
    personalGoals: [],
  },
  {
    id: 'monthly-tech-2024-11',
    department: departments[0], // 技术部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 11,
    year: 2024,
    targetValue: 350000,
    progress: 78,
    personalGoals: [],
  },
  {
    id: 'monthly-tech-2024-12',
    department: departments[0], // 技术部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 12,
    year: 2024,
    targetValue: 400000,
    progress: 65,
    personalGoals: [],
  },
  
  // 2024年市场部月度目标
  {
    id: 'monthly-market-2024-10',
    department: departments[4], // 市场部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 200000,
    progress: 92,
    personalGoals: [],
  },
  {
    id: 'monthly-market-2024-11',
    department: departments[4], // 市场部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 11,
    year: 2024,
    targetValue: 250000,
    progress: 84,
    personalGoals: [],
  },
  {
    id: 'monthly-market-2024-12',
    department: departments[4], // 市场部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 12,
    year: 2024,
    targetValue: 300000,
    progress: 68,
    personalGoals: [],
  },
  
  // 2024年财务部月度目标
  {
    id: 'monthly-finance-2024-10',
    department: departments[2], // 财务部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 150000,
    progress: 90,
    personalGoals: [],
  },
  {
    id: 'monthly-finance-2024-11',
    department: departments[2], // 财务部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 11,
    year: 2024,
    targetValue: 180000,
    progress: 85,
    personalGoals: [],
  },
  {
    id: 'monthly-finance-2024-12',
    department: departments[2], // 财务部
    companyYearlyGoal: goalDashboardYearlyGoals[0],
    month: 12,
    year: 2024,
    targetValue: 200000,
    progress: 75,
    personalGoals: [],
  },
];

// 个人月度目标数据
export const goalDashboardPersonalGoals: PersonalMonthlyGoal[] = [
  // 销售部个人目标 - 10月
  {
    id: 'personal-wangwu-2024-10',
    user: users[2], // 王五 - 销售部负责人
    teamMonthlyGoal: goalDashboardMonthlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 400000,
    progress: 98,
    dailyReports: [],
  },
  {
    id: 'personal-sunba-2024-10',
    user: users[5], // 孙八 - 华北区负责人
    teamMonthlyGoal: goalDashboardMonthlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 350000,
    progress: 95,
    dailyReports: [],
  },
  {
    id: 'personal-zhengshiyi-2024-10',
    user: users[8], // 郑十一 - 华南区负责人
    teamMonthlyGoal: goalDashboardMonthlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 300000,
    progress: 92,
    dailyReports: [],
  },
  {
    id: 'personal-chenshier-2024-10',
    user: users[9], // 陈十二 - 北京分部
    teamMonthlyGoal: goalDashboardMonthlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 150000,
    progress: 96,
    dailyReports: [],
  },
  
  // 销售部个人目标 - 11月
  {
    id: 'personal-wangwu-2024-11',
    user: users[2], // 王五
    teamMonthlyGoal: goalDashboardMonthlyGoals[1],
    month: 11,
    year: 2024,
    targetValue: 450000,
    progress: 89,
    dailyReports: [],
  },
  {
    id: 'personal-sunba-2024-11',
    user: users[5], // 孙八
    teamMonthlyGoal: goalDashboardMonthlyGoals[1],
    month: 11,
    year: 2024,
    targetValue: 380000,
    progress: 87,
    dailyReports: [],
  },
  {
    id: 'personal-zhengshiyi-2024-11',
    user: users[8], // 郑十一
    teamMonthlyGoal: goalDashboardMonthlyGoals[1],
    month: 11,
    year: 2024,
    targetValue: 320000,
    progress: 88,
    dailyReports: [],
  },
  {
    id: 'personal-chenshier-2024-11',
    user: users[9], // 陈十二
    teamMonthlyGoal: goalDashboardMonthlyGoals[1],
    month: 11,
    year: 2024,
    targetValue: 150000,
    progress: 90,
    dailyReports: [],
  },
  
  // 销售部个人目标 - 12月
  {
    id: 'personal-wangwu-2024-12',
    user: users[2], // 王五
    teamMonthlyGoal: goalDashboardMonthlyGoals[2],
    month: 12,
    year: 2024,
    targetValue: 500000,
    progress: 75,
    dailyReports: [],
  },
  {
    id: 'personal-sunba-2024-12',
    user: users[5], // 孙八
    teamMonthlyGoal: goalDashboardMonthlyGoals[2],
    month: 12,
    year: 2024,
    targetValue: 420000,
    progress: 72,
    dailyReports: [],
  },
  {
    id: 'personal-zhengshiyi-2024-12',
    user: users[8], // 郑十一
    teamMonthlyGoal: goalDashboardMonthlyGoals[2],
    month: 12,
    year: 2024,
    targetValue: 380000,
    progress: 70,
    dailyReports: [],
  },
  {
    id: 'personal-chenshier-2024-12',
    user: users[9], // 陈十二
    teamMonthlyGoal: goalDashboardMonthlyGoals[2],
    month: 12,
    year: 2024,
    targetValue: 200000,
    progress: 73,
    dailyReports: [],
  },
  
  // 技术部个人目标 - 10月
  {
    id: 'personal-zhangsan-2024-10',
    user: users[0], // 张三 - 技术部负责人
    teamMonthlyGoal: goalDashboardMonthlyGoals[3],
    month: 10,
    year: 2024,
    targetValue: 120000,
    progress: 88,
    dailyReports: [],
  },
  {
    id: 'personal-lisi-2024-10',
    user: users[1], // 李四 - 前端组负责人
    teamMonthlyGoal: goalDashboardMonthlyGoals[3],
    month: 10,
    year: 2024,
    targetValue: 90000,
    progress: 85,
    dailyReports: [],
  },
  {
    id: 'personal-qianqi-2024-10',
    user: users[4], // 钱七 - 后端组负责人
    teamMonthlyGoal: goalDashboardMonthlyGoals[3],
    month: 10,
    year: 2024,
    targetValue: 90000,
    progress: 82,
    dailyReports: [],
  },
  
  // 技术部个人目标 - 11月
  {
    id: 'personal-zhangsan-2024-11',
    user: users[0], // 张三
    teamMonthlyGoal: goalDashboardMonthlyGoals[4],
    month: 11,
    year: 2024,
    targetValue: 140000,
    progress: 80,
    dailyReports: [],
  },
  {
    id: 'personal-lisi-2024-11',
    user: users[1], // 李四
    teamMonthlyGoal: goalDashboardMonthlyGoals[4],
    month: 11,
    year: 2024,
    targetValue: 105000,
    progress: 78,
    dailyReports: [],
  },
  {
    id: 'personal-qianqi-2024-11',
    user: users[4], // 钱七
    teamMonthlyGoal: goalDashboardMonthlyGoals[4],
    month: 11,
    year: 2024,
    targetValue: 105000,
    progress: 76,
    dailyReports: [],
  },
  
  // 技术部个人目标 - 12月
  {
    id: 'personal-zhangsan-2024-12',
    user: users[0], // 张三
    teamMonthlyGoal: goalDashboardMonthlyGoals[5],
    month: 12,
    year: 2024,
    targetValue: 160000,
    progress: 68,
    dailyReports: [],
  },
  {
    id: 'personal-lisi-2024-12',
    user: users[1], // 李四
    teamMonthlyGoal: goalDashboardMonthlyGoals[5],
    month: 12,
    year: 2024,
    targetValue: 120000,
    progress: 65,
    dailyReports: [],
  },
  {
    id: 'personal-qianqi-2024-12',
    user: users[4], // 钱七
    teamMonthlyGoal: goalDashboardMonthlyGoals[5],
    month: 12,
    year: 2024,
    targetValue: 120000,
    progress: 62,
    dailyReports: [],
  },
  
  // 市场部个人目标 - 10月
  {
    id: 'personal-yangshiliu-2024-10',
    user: users[13], // 杨十六 - 市场部负责人
    teamMonthlyGoal: goalDashboardMonthlyGoals[6],
    month: 10,
    year: 2024,
    targetValue: 100000,
    progress: 94,
    dailyReports: [],
  },
  {
    id: 'personal-heshiqi-2024-10',
    user: users[14], // 何十七 - 品牌推广
    teamMonthlyGoal: goalDashboardMonthlyGoals[6],
    month: 10,
    year: 2024,
    targetValue: 60000,
    progress: 92,
    dailyReports: [],
  },
  {
    id: 'personal-luoshiba-2024-10',
    user: users[15], // 罗十八 - 数字营销
    teamMonthlyGoal: goalDashboardMonthlyGoals[6],
    month: 10,
    year: 2024,
    targetValue: 40000,
    progress: 90,
    dailyReports: [],
  },
  
  // 市场部个人目标 - 11月
  {
    id: 'personal-yangshiliu-2024-11',
    user: users[13], // 杨十六
    teamMonthlyGoal: goalDashboardMonthlyGoals[7],
    month: 11,
    year: 2024,
    targetValue: 125000,
    progress: 86,
    dailyReports: [],
  },
  {
    id: 'personal-heshiqi-2024-11',
    user: users[14], // 何十七
    teamMonthlyGoal: goalDashboardMonthlyGoals[7],
    month: 11,
    year: 2024,
    targetValue: 75000,
    progress: 84,
    dailyReports: [],
  },
  {
    id: 'personal-luoshiba-2024-11',
    user: users[15], // 罗十八
    teamMonthlyGoal: goalDashboardMonthlyGoals[7],
    month: 11,
    year: 2024,
    targetValue: 50000,
    progress: 82,
    dailyReports: [],
  },
  
  // 市场部个人目标 - 12月
  {
    id: 'personal-yangshiliu-2024-12',
    user: users[13], // 杨十六
    teamMonthlyGoal: goalDashboardMonthlyGoals[8],
    month: 12,
    year: 2024,
    targetValue: 150000,
    progress: 70,
    dailyReports: [],
  },
  {
    id: 'personal-heshiqi-2024-12',
    user: users[14], // 何十七
    teamMonthlyGoal: goalDashboardMonthlyGoals[8],
    month: 12,
    year: 2024,
    targetValue: 90000,
    progress: 68,
    dailyReports: [],
  },
  {
    id: 'personal-luoshiba-2024-12',
    user: users[15], // 罗十八
    teamMonthlyGoal: goalDashboardMonthlyGoals[8],
    month: 12,
    year: 2024,
    targetValue: 60000,
    progress: 66,
    dailyReports: [],
  },
  
  // 财务部个人目标 - 10月
  {
    id: 'personal-zhaoliu-2024-10',
    user: users[3], // 赵六 - 财务部负责人
    teamMonthlyGoal: goalDashboardMonthlyGoals[9],
    month: 10,
    year: 2024,
    targetValue: 80000,
    progress: 92,
    dailyReports: [],
  },
  
  // 财务部个人目标 - 11月
  {
    id: 'personal-zhaoliu-2024-11',
    user: users[3], // 赵六
    teamMonthlyGoal: goalDashboardMonthlyGoals[10],
    month: 11,
    year: 2024,
    targetValue: 90000,
    progress: 87,
    dailyReports: [],
  },
  
  // 财务部个人目标 - 12月
  {
    id: 'personal-zhaoliu-2024-12',
    user: users[3], // 赵六
    teamMonthlyGoal: goalDashboardMonthlyGoals[11],
    month: 12,
    year: 2024,
    targetValue: 100000,
    progress: 78,
    dailyReports: [],
  },
];

// 日报数据
export const goalDashboardDailyReports: DailyReport[] = [
  // 王五的日报 - 12月
  {
    id: 'daily-wangwu-2024-12-15',
    user: users[2],
    personalMonthlyGoal: goalDashboardPersonalGoals.find(p => p.id === 'personal-wangwu-2024-12')!,
    date: '2024-12-15',
    actualRevenue: 25000,
    description: '完成A客户合同签约，金额25万',
  },
  {
    id: 'daily-wangwu-2024-12-16',
    user: users[2],
    personalMonthlyGoal: goalDashboardPersonalGoals.find(p => p.id === 'personal-wangwu-2024-12')!,
    date: '2024-12-16',
    actualRevenue: 18000,
    description: 'B客户续约成功，金额18万',
  },
  {
    id: 'daily-wangwu-2024-12-17',
    user: users[2],
    personalMonthlyGoal: goalDashboardPersonalGoals.find(p => p.id === 'personal-wangwu-2024-12')!,
    date: '2024-12-17',
    actualRevenue: 32000,
    description: 'C客户新项目启动，首期款32万',
  },
  
  // 孙八的日报 - 12月
  {
    id: 'daily-sunba-2024-12-15',
    user: users[5],
    personalMonthlyGoal: goalDashboardPersonalGoals.find(p => p.id === 'personal-sunba-2024-12')!,
    date: '2024-12-15',
    actualRevenue: 15000,
    description: '华北区D客户签约，金额15万',
  },
  {
    id: 'daily-sunba-2024-12-16',
    user: users[5],
    personalMonthlyGoal: goalDashboardPersonalGoals.find(p => p.id === 'personal-sunba-2024-12')!,
    date: '2024-12-16',
    actualRevenue: 22000,
    description: '北京地区E客户合作达成，金额22万',
  },
  
  // 张三的日报 - 12月
  {
    id: 'daily-zhangsan-2024-12-15',
    user: users[0],
    personalMonthlyGoal: goalDashboardPersonalGoals.find(p => p.id === 'personal-zhangsan-2024-12')!,
    date: '2024-12-15',
    actualRevenue: 8000,
    description: '技术咨询服务费，客户F项目',
  },
  {
    id: 'daily-zhangsan-2024-12-16',
    user: users[0],
    personalMonthlyGoal: goalDashboardPersonalGoals.find(p => p.id === 'personal-zhangsan-2024-12')!,
    date: '2024-12-16',
    actualRevenue: 12000,
    description: '系统开发服务费，客户G项目',
  },
];

// 更新个人目标的日报关联
const wangwuPersonalGoal = goalDashboardPersonalGoals.find(p => p.id === 'personal-wangwu-2024-12');
if (wangwuPersonalGoal) {
  wangwuPersonalGoal.dailyReports = goalDashboardDailyReports.filter(r => r.personalMonthlyGoal.id === 'personal-wangwu-2024-12');
}

const sunbaPersonalGoal = goalDashboardPersonalGoals.find(p => p.id === 'personal-sunba-2024-12');
if (sunbaPersonalGoal) {
  sunbaPersonalGoal.dailyReports = goalDashboardDailyReports.filter(r => r.personalMonthlyGoal.id === 'personal-sunba-2024-12');
}

const zhangsanPersonalGoal = goalDashboardPersonalGoals.find(p => p.id === 'personal-zhangsan-2024-12');
if (zhangsanPersonalGoal) {
  zhangsanPersonalGoal.dailyReports = goalDashboardDailyReports.filter(r => r.personalMonthlyGoal.id === 'personal-zhangsan-2024-12');
}

// 更新团队目标的个人目标关联
goalDashboardMonthlyGoals.forEach(monthlyGoal => {
  monthlyGoal.personalGoals = goalDashboardPersonalGoals.filter(p => p.teamMonthlyGoal.id === monthlyGoal.id);
});

// 导出数据查询函数
export const getMonthlyGoalsForYear = (yearlyGoalId: string): TeamMonthlyGoal[] => {
  return goalDashboardMonthlyGoals.filter(tm => tm.companyYearlyGoal.id === yearlyGoalId);
};

export const getPersonalGoalsForMonth = (monthlyGoalId: string): PersonalMonthlyGoal[] => {
  return goalDashboardPersonalGoals.filter(pm => pm.teamMonthlyGoal.id === monthlyGoalId);
};

export const getDailyReportsForPersonal = (personalGoalId: string): DailyReport[] => {
  return goalDashboardDailyReports.filter(dr => dr.personalMonthlyGoal.id === personalGoalId);
};
