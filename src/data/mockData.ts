import { 
  User, Department, Position, Permission, CompanyYearlyGoal, 
  TeamMonthlyGoal, PersonalMonthlyGoal, Project, FinancialCategory, 
  OperatingCost, Reimbursement, DailyReport, Subsidiary, CostAllocation,
  AssetCategory, AssetLocation, Supplier, Brand, Asset, AssetAttachment,
  AssetMovement, MaintenancePlan, MaintenanceRecord, AssetDisposal,
  InventoryPlan, InventoryRecord, InventoryAdjustment, AssetStatistics,
  ProcurementOrder, ProcurementOrderItem, ProcurementAttachment,
  ProcurementApprovalRecord, ProcurementReceipt, ProcurementReceiptItem,
  ProcurementException, ProcurementStatistics, Team, TeamMemberPerformance, PerformanceTier,
  Revenue, Expense, AccountReceivable, AccountPayable, Customer
} from '@/types';

// 权限数据
const permissions: Permission[] = [
  { id: '1', name: '查看任务', role: 'employee' },
  { id: '2', name: '创建任务', role: 'supervisor' },
  { id: '3', name: '管理部门', role: 'director' },
  { id: '4', name: '系统管理', role: 'admin' },
  { id: '5', name: '人事管理', role: 'hr' },
  { id: '6', name: '财务管理', role: 'finance' },
];

// 职级数据
const positions: Position[] = [
  { id: '1', name: 'P1-初级员工', level: 'P1', permissions: [permissions[0]] },
  { id: '2', name: 'P2-中级员工', level: 'P2', permissions: [permissions[0]] },
  { id: '3', name: 'P3-高级员工', level: 'P3', permissions: [permissions[0], permissions[1]] },
  { id: '4', name: 'P4-主管', level: 'P4', permissions: [permissions[0], permissions[1], permissions[2]] },
  { id: '5', name: 'P5-总监', level: 'P5', permissions: permissions },
];

// 部门数据 - 扩展为更复杂的树形结构
export const departments: Department[] = [
  {
    id: '1',
    name: '技术部',
    level: 1,
    costCenter: 'TECH001',
    children: [
      { 
        id: '11', 
        name: '前端组', 
        level: 2, 
        parentId: '1', 
        costCenter: 'TECH001-FE',
        children: [
          { id: '111', name: 'React团队', level: 3, parentId: '11', costCenter: 'TECH001-FE-R' },
          { id: '112', name: 'Vue团队', level: 3, parentId: '11', costCenter: 'TECH001-FE-V' },
        ]
      },
      { 
        id: '12', 
        name: '后端组', 
        level: 2, 
        parentId: '1', 
        costCenter: 'TECH001-BE',
        children: [
          { id: '121', name: 'Java团队', level: 3, parentId: '12', costCenter: 'TECH001-BE-J' },
          { id: '122', name: 'Python团队', level: 3, parentId: '12', costCenter: 'TECH001-BE-P' },
        ]
      },
      { 
        id: '13', 
        name: '测试组', 
        level: 2, 
        parentId: '1', 
        costCenter: 'TECH001-QA',
        children: [
          { id: '131', name: '自动化测试', level: 3, parentId: '13', costCenter: 'TECH001-QA-A' },
          { id: '132', name: '性能测试', level: 3, parentId: '13', costCenter: 'TECH001-QA-P' },
        ]
      },
    ]
  },
  {
    id: '2',
    name: '销售部',
    level: 1,
    costCenter: 'SALES001',
    children: [
      { 
        id: '21', 
        name: '华北区', 
        level: 2, 
        parentId: '2', 
        costCenter: 'SALES001-N',
        children: [
          { id: '211', name: '北京分部', level: 3, parentId: '21', costCenter: 'SALES001-N-BJ' },
          { id: '212', name: '天津分部', level: 3, parentId: '21', costCenter: 'SALES001-N-TJ' },
        ]
      },
      { 
        id: '22', 
        name: '华南区', 
        level: 2, 
        parentId: '2', 
        costCenter: 'SALES001-S',
        children: [
          { id: '221', name: '深圳分部', level: 3, parentId: '22', costCenter: 'SALES001-S-SZ' },
          { id: '222', name: '广州分部', level: 3, parentId: '22', costCenter: 'SALES001-S-GZ' },
        ]
      },
    ]
  },
  {
    id: '3',
    name: '财务部',
    level: 1,
    costCenter: 'FIN001',
    children: [
      { id: '31', name: '会计组', level: 2, parentId: '3', costCenter: 'FIN001-ACC' },
      { id: '32', name: '出纳组', level: 2, parentId: '3', costCenter: 'FIN001-CAS' },
    ]
  },
  {
    id: '4',
    name: '人事部',
    level: 1,
    costCenter: 'HR001',
    children: [
      { id: '41', name: '招聘组', level: 2, parentId: '4', costCenter: 'HR001-REC' },
      { id: '42', name: '培训组', level: 2, parentId: '4', costCenter: 'HR001-TRA' },
    ]
  },
  {
    id: '5',
    name: '市场部',
    level: 1,
    costCenter: 'MKT001',
    children: [
      { id: '51', name: '品牌推广', level: 2, parentId: '5', costCenter: 'MKT001-BRA' },
      { id: '52', name: '数字营销', level: 2, parentId: '5', costCenter: 'MKT001-DIG' },
    ]
  },
];

// 用户数据 - 扩展更多员工
export const users: User[] = [
  {
    id: '1',
    name: '张三',
    employeeId: 'EMP001',
    position: positions[4],
    joinDate: '2020-01-15',
    status: 'active',
    salary: 25000,
    departments: [departments[0]],
    primaryDepartment: departments[0],
  },
  {
    id: '2',
    name: '李四',
    employeeId: 'EMP002',
    position: positions[3],
    joinDate: '2021-03-20',
    status: 'active',
    salary: 18000,
    departments: [departments[0].children![0]],
    primaryDepartment: departments[0].children![0],
  },
  {
    id: '3',
    name: '王五',
    employeeId: 'EMP003',
    position: positions[3],
    joinDate: '2022-06-10',
    status: 'active',
    salary: 20000,
    departments: [departments[1]],
    primaryDepartment: departments[1],
  },
  {
    id: '4',
    name: '赵六',
    employeeId: 'EMP004',
    position: positions[3],
    joinDate: '2023-01-08',
    status: 'active',
    salary: 16000,
    departments: [departments[2]],
    primaryDepartment: departments[2],
  },
  {
    id: '5',
    name: '钱七',
    employeeId: 'EMP005',
    position: positions[2],
    joinDate: '2022-08-15',
    status: 'active',
    salary: 16000,
    departments: [departments[0].children![1]],
    primaryDepartment: departments[0].children![1],
  },
  {
    id: '6',
    name: '孙八',
    employeeId: 'EMP006',
    position: positions[2],
    joinDate: '2023-05-20',
    status: 'active',
    salary: 15000,
    departments: [departments[1].children![0]],
    primaryDepartment: departments[1].children![0],
  },
  {
    id: '7',
    name: '周九',
    employeeId: 'EMP007',
    position: positions[1],
    joinDate: '2023-09-10',
    status: 'active',
    salary: 12000,
    departments: [departments[0].children![0].children![0]],
    primaryDepartment: departments[0].children![0].children![0],
  },
  {
    id: '8',
    name: '吴十',
    employeeId: 'EMP008',
    position: positions[1],
    joinDate: '2023-11-01',
    status: 'active',
    salary: 13000,
    departments: [departments[0].children![0].children![1]],
    primaryDepartment: departments[0].children![0].children![1],
  },
  {
    id: '9',
    name: '郑十一',
    employeeId: 'EMP009',
    position: positions[2],
    joinDate: '2022-04-15',
    status: 'active',
    salary: 17000,
    departments: [departments[1].children![1]],
    primaryDepartment: departments[1].children![1],
  },
  {
    id: '10',
    name: '陈十二',
    employeeId: 'EMP010',
    position: positions[1],
    joinDate: '2023-07-20',
    status: 'active',
    salary: 11000,
    departments: [departments[1].children![0].children![0]],
    primaryDepartment: departments[1].children![0].children![0],
  },
  {
    id: '11',
    name: '刘十三',
    employeeId: 'EMP011',
    position: positions[1],
    joinDate: '2023-08-10',
    status: 'active',
    salary: 12500,
    departments: [departments[1].children![0].children![1]],
    primaryDepartment: departments[1].children![0].children![1],
  },
  {
    id: '12',
    name: '黄十四',
    employeeId: 'EMP012',
    position: positions[2],
    joinDate: '2022-12-01',
    status: 'active',
    salary: 16500,
    departments: [departments[1].children![1].children![0]],
    primaryDepartment: departments[1].children![1].children![0],
  },
  {
    id: '13',
    name: '林十五',
    employeeId: 'EMP013',
    position: positions[1],
    joinDate: '2023-10-15',
    status: 'active',
    salary: 11500,
    departments: [departments[1].children![1].children![1]],
    primaryDepartment: departments[1].children![1].children![1],
  },
  {
    id: '14',
    name: '杨十六',
    employeeId: 'EMP014',
    position: positions[3],
    joinDate: '2021-09-20',
    status: 'active',
    salary: 19000,
    departments: [departments[4]],
    primaryDepartment: departments[4],
  },
  {
    id: '15',
    name: '何十七',
    employeeId: 'EMP015',
    position: positions[2],
    joinDate: '2022-11-10',
    status: 'active',
    salary: 15500,
    departments: [departments[4].children![0]],
    primaryDepartment: departments[4].children![0],
  },
  {
    id: '16',
    name: '罗十八',
    employeeId: 'EMP016',
    position: positions[1],
    joinDate: '2023-06-05',
    status: 'active',
    salary: 12000,
    departments: [departments[4].children![1]],
    primaryDepartment: departments[4].children![1],
  },
];

// 更新部门管理者
departments[0].manager = users[0]; // 技术部 - 张三
departments[0].children![0].manager = users[1]; // 前端组 - 李四
departments[0].children![1].manager = users[4]; // 后端组 - 钱七
departments[1].manager = users[2]; // 销售部 - 王五
departments[1].children![0].manager = users[5]; // 华北区 - 孙八
departments[1].children![1].manager = users[8]; // 华南区 - 郑十一
departments[2].manager = users[3]; // 财务部 - 赵六
departments[4].manager = users[13]; // 市场部 - 杨十六

// 绩效阶梯明细数据
const performanceTiers: PerformanceTier[] = [
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

// 团队成员绩效配置数据
const teamMemberPerformances: TeamMemberPerformance[] = [
  {
    id: '1',
    teamId: '1',
    memberId: '2', // 李四
    calculationType: 'fixed',
    fixedRate: 5, // 5元/公里
    isActive: true,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '2',
    teamId: '1',
    memberId: '7', // 周九
    calculationType: 'tiered',
    tiers: [
      { id: '1', minDistance: 0, maxDistance: 3, performance: 3 },
      { id: '2', minDistance: 3, maxDistance: 5, performance: 5 },
      { id: '3', minDistance: 5, maxDistance: 10, performance: 8 },
    ],
    isActive: true,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '3',
    teamId: '2',
    memberId: '5', // 钱七
    calculationType: 'fixed',
    fixedRate: 6, // 6元/公里
    isActive: true,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '4',
    teamId: '3',
    memberId: '6', // 孙八
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
];

// 子公司数据 - 修复数据结构，确保所有必需字段都存在
const subsidiaries: Subsidiary[] = [
  {
    id: '1',
    name: '北京分公司',
    code: 'BJ001',
    legalRepresentative: '张总',
    registeredCapital: 1000,
    businessScope: '技术开发、技术服务、技术咨询',
    address: '北京市海淀区中关村大街1号',
    phone: '010-12345678',
    email: 'beijing@company.com',
    allocationRatio: 40,
    status: 'active',
    establishDate: '2020-01-01',
    establishedDate: '2020-01-01',
    remarks: '总部所在地，承担主要业务',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: '上海分公司',
    code: 'SH001',
    legalRepresentative: '李总',
    registeredCapital: 800,
    businessScope: '软件开发、系统集成、技术服务',
    address: '上海市浦东新区陆家嘴金融中心',
    phone: '021-87654321',
    email: 'shanghai@company.com',
    allocationRatio: 35,
    status: 'active',
    establishDate: '2021-03-15',
    establishedDate: '2021-03-15',
    remarks: '华东地区业务中心',
    createdAt: '2021-03-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: '深圳分公司',
    code: 'SZ001',
    legalRepresentative: '王总',
    registeredCapital: 600,
    businessScope: '互联网技术开发、电子商务平台运营',
    address: '深圳市南山区科技园南区',
    phone: '0755-12345678',
    email: 'shenzhen@company.com',
    allocationRatio: 25,
    status: 'active',
    establishDate: '2022-06-01',
    establishedDate: '2022-06-01',
    remarks: '华南地区业务中心',
    createdAt: '2022-06-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '4',
    name: '成都分公司',
    code: 'CD001',
    legalRepresentative: '赵总',
    registeredCapital: 400,
    businessScope: '软件技术服务、信息系统集成',
    address: '成都市高新区天府大道中段',
    phone: '028-87654321',
    email: 'chengdu@company.com',
    allocationRatio: 0,
    status: 'inactive',
    establishDate: '2023-01-01',
    establishedDate: '2023-01-01',
    remarks: '西南地区业务中心，暂停运营',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
];

// 公司年度目标 - 扩展多个年度目标
const companyYearlyGoals: CompanyYearlyGoal[] = [
  {
    id: '1',
    year: 2024,
    targetValue: 15000000,
    manager: users[0],
    quarters: [
      { id: '1', quarter: 1, targetValue: 3000000, percentage: 20, basis: '历史数据分析', companyYearlyGoalId: '1' },
      { id: '2', quarter: 2, targetValue: 3750000, percentage: 25, basis: '市场增长预期', companyYearlyGoalId: '1' },
      { id: '3', quarter: 3, targetValue: 3750000, percentage: 25, basis: '产品发布计划', companyYearlyGoalId: '1' },
      { id: '4', quarter: 4, targetValue: 4500000, percentage: 30, basis: '年终冲刺计划', companyYearlyGoalId: '1' },
    ],
  },
  {
    id: '2',
    year: 2025,
    targetValue: 20000000,
    manager: users[0],
    quarters: [
      { id: '5', quarter: 1, targetValue: 4000000, percentage: 20, basis: '新产品线推出', companyYearlyGoalId: '2' },
      { id: '6', quarter: 2, targetValue: 5000000, percentage: 25, basis: '市场扩张计划', companyYearlyGoalId: '2' },
      { id: '7', quarter: 3, targetValue: 5000000, percentage: 25, basis: '技术升级完成', companyYearlyGoalId: '2' },
      { id: '8', quarter: 4, targetValue: 6000000, percentage: 30, basis: '全年冲刺目标', companyYearlyGoalId: '2' },
    ],
  },
];

// 团队月度目标 - 大幅扩展数据
const teamMonthlyGoals: TeamMonthlyGoal[] = [
  // 2024年销售部目标
  {
    id: '1',
    department: departments[1], // 销售部
    companyYearlyGoal: companyYearlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 1200000,
    progress: 95,
    personalGoals: [],
  },
  {
    id: '2',
    department: departments[1], // 销售部
    companyYearlyGoal: companyYearlyGoals[0],
    month: 11,
    year: 2024,
    target_value: 1300000,
    progress: 88,
    creator: users[0], // 张三 - 系统管理员
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    personalGoals: [],
  },
  {
    id: '3',
    department: departments[1], // 销售部
    companyYearlyGoal: companyYearlyGoals[0],
    month: 12,
    year: 2024,
    targetValue: 1500000,
    progress: 72,
    personalGoals: [],
  },
  // 2024年技术部目标（技术服务收入）
  {
    id: '4',
    department: departments[0], // 技术部
    companyYearlyGoal: companyYearlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 300000,
    progress: 85,
    personalGoals: [],
  },
  {
    id: '5',
    department: departments[0], // 技术部
    companyYearlyGoal: companyYearlyGoals[0],
    month: 11,
    year: 2024,
    targetValue: 350000,
    progress: 78,
    personalGoals: [],
  },
  {
    id: '6',
    department: departments[0], // 技术部
    companyYearlyGoal: companyYearlyGoals[0],
    month: 12,
    year: 2024,
    targetValue: 400000,
    progress: 65,
    personalGoals: [],
  },
  // 2024年市场部目标
  {
    id: '7',
    department: departments[4], // 市场部
    companyYearlyGoal: companyYearlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 200000,
    progress: 92,
    personalGoals: [],
  },
  {
    id: '8',
    department: departments[4], // 市场部
    companyYearlyGoal: companyYearlyGoals[0],
    month: 11,
    year: 2024,
    targetValue: 250000,
    progress: 84,
    personalGoals: [],
  },
  {
    id: '9',
    department: departments[4], // 市场部
    companyYearlyGoal: companyYearlyGoals[0],
    month: 12,
    year: 2024,
    targetValue: 300000,
    progress: 68,
    personalGoals: [],
  },
];

// 个人月度目标 - 大幅扩展数据
const personalMonthlyGoals: PersonalMonthlyGoal[] = [
  // 销售部个人目标 - 10月
  {
    id: '1',
    user: users[2], // 王五 - 销售部负责人
    teamMonthlyGoal: teamMonthlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 400000,
    progress: 98,
    dailyReports: [],
  },
  {
    id: '2',
    user: users[5], // 孙八 - 华北区负责人
    teamMonthlyGoal: teamMonthlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 350000,
    progress: 95,
    dailyReports: [],
  },
  {
    id: '3',
    user: users[8], // 郑十一 - 华南区负责人
    teamMonthlyGoal: teamMonthlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 300000,
    progress: 92,
    dailyReports: [],
  },
  {
    id: '4',
    user: users[9], // 陈十二 - 北京分部
    teamMonthlyGoal: teamMonthlyGoals[0],
    month: 10,
    year: 2024,
    targetValue: 150000,
    progress: 96,
    dailyReports: [],
  },
  
  // 销售部个人目标 - 11月
  {
    id: '5',
    user: users[2], // 王五
    teamMonthlyGoal: teamMonthlyGoals[1],
    month: 11,
    year: 2024,
    targetValue: 450000,
    progress: 89,
    dailyReports: [],
  },
  {
    id: '6',
    user: users[5], // 孙八
    teamMonthlyGoal: teamMonthlyGoals[1],
    month: 11,
    year: 2024,
    targetValue: 380000,
    progress: 87,
    dailyReports: [],
  },
  {
    id: '7',
    user: users[8], // 郑十一
    teamMonthlyGoal: teamMonthlyGoals[1],
    month: 11,
    year: 2024,
    targetValue: 320000,
    progress: 88,
    dailyReports: [],
  },
  {
    id: '8',
    user: users[9], // 陈十二
    teamMonthlyGoal: teamMonthlyGoals[1],
    month: 11,
    year: 2024,
    targetValue: 150000,
    progress: 90,
    dailyReports: [],
  },
  
  // 销售部个人目标 - 12月
  {
    id: '9',
    user: users[2], // 王五
    teamMonthlyGoal: teamMonthlyGoals[2],
    month: 12,
    year: 2024,
    targetValue: 500000,
    progress: 75,
    dailyReports: [],
  },
  {
    id: '10',
    user: users[5], // 孙八
    teamMonthlyGoal: teamMonthlyGoals[2],
    month: 12,
    year: 2024,
    targetValue: 420000,
    progress: 72,
    dailyReports: [],
  },
  {
    id: '11',
    user: users[8], // 郑十一
    teamMonthlyGoal: teamMonthlyGoals[2],
    month: 12,
    year: 2024,
    targetValue: 380000,
    progress: 70,
    dailyReports: [],
  },
  {
    id: '12',
    user: users[9], // 陈十二
    teamMonthlyGoal: teamMonthlyGoals[2],
    month: 12,
    year: 2024,
    targetValue: 200000,
    progress: 73,
    dailyReports: [],
  },
  
  // 技术部个人目标 - 10月
  {
    id: '13',
    user: users[0], // 张三 - 技术部负责人
    teamMonthlyGoal: teamMonthlyGoals[3],
    month: 10,
    year: 2024,
    targetValue: 120000,
    progress: 88,
    dailyReports: [],
  },
  {
    id: '14',
    user: users[1], // 李四 - 前端组负责人
    teamMonthlyGoal: teamMonthlyGoals[3],
    month: 10,
    year: 2024,
    targetValue: 90000,
    progress: 85,
    dailyReports: [],
  },
  {
    id: '15',
    user: users[4], // 钱七 - 后端组负责人
    teamMonthlyGoal: teamMonthlyGoals[3],
    month: 10,
    year: 2024,
    targetValue: 90000,
    progress: 82,
    dailyReports: [],
  },
  
  // 技术部个人目标 - 11月
  {
    id: '16',
    user: users[0], // 张三
    teamMonthlyGoal: teamMonthlyGoals[4],
    month: 11,
    year: 2024,
    targetValue: 140000,
    progress: 80,
    dailyReports: [],
  },
  {
    id: '17',
    user: users[1], // 李四
    teamMonthlyGoal: teamMonthlyGoals[4],
    month: 11,
    year: 2024,
    targetValue: 105000,
    progress: 78,
    dailyReports: [],
  },
  {
    id: '18',
    user: users[4], // 钱七
    teamMonthlyGoal: teamMonthlyGoals[4],
    month: 11,
    year: 2024,
    targetValue: 105000,
    progress: 76,
    dailyReports: [],
  },
  
  // 技术部个人目标 - 12月
  {
    id: '19',
    user: users[0], // 张三
    teamMonthlyGoal: teamMonthlyGoals[5],
    month: 12,
    year: 2024,
    targetValue: 160000,
    progress: 68,
    dailyReports: [],
  },
  {
    id: '20',
    user: users[1], // 李四
    teamMonthlyGoal: teamMonthlyGoals[5],
    month: 12,
    year: 2024,
    targetValue: 120000,
    progress: 65,
    dailyReports: [],
  },
  {
    id: '21',
    user: users[4], // 钱七
    teamMonthlyGoal: teamMonthlyGoals[5],
    month: 12,
    year: 2024,
    targetValue: 120000,
    progress: 62,
    dailyReports: [],
  },
  
  // 市场部个人目标 - 10月
  {
    id: '22',
    user: users[13], // 杨十六 - 市场部负责人
    teamMonthlyGoal: teamMonthlyGoals[6],
    month: 10,
    year: 2024,
    targetValue: 100000,
    progress: 94,
    dailyReports: [],
  },
  {
    id: '23',
    user: users[14], // 何十七 - 品牌推广
    teamMonthlyGoal: teamMonthlyGoals[6],
    month: 10,
    year: 2024,
    targetValue: 60000,
    progress: 92,
    dailyReports: [],
  },
  {
    id: '24',
    user: users[15], // 罗十八 - 数字营销
    teamMonthlyGoal: teamMonthlyGoals[6],
    month: 10,
    year: 2024,
    targetValue: 40000,
    progress: 90,
    dailyReports: [],
  },
  
  // 市场部个人目标 - 11月
  {
    id: '25',
    user: users[13], // 杨十六
    teamMonthlyGoal: teamMonthlyGoals[7],
    month: 11,
    year: 2024,
    targetValue: 125000,
    progress: 86,
    dailyReports: [],
  },
  {
    id: '26',
    user: users[14], // 何十七
    teamMonthlyGoal: teamMonthlyGoals[7],
    month: 11,
    year: 2024,
    targetValue: 75000,
    progress: 84,
    dailyReports: [],
  },
  {
    id: '27',
    user: users[15], // 罗十八
    teamMonthlyGoal: teamMonthlyGoals[7],
    month: 11,
    year: 2024,
    targetValue: 50000,
    progress: 82,
    dailyReports: [],
  },
  
  // 市场部个人目标 - 12月
  {
    id: '28',
    user: users[13], // 杨十六
    teamMonthlyGoal: teamMonthlyGoals[8],
    month: 12,
    year: 2024,
    targetValue: 150000,
    progress: 70,
    dailyReports: [],
  },
  {
    id: '29',
    user: users[14], // 何十七
    teamMonthlyGoal: teamMonthlyGoals[8],
    month: 12,
    year: 2024,
    targetValue: 90000,
    progress: 68,
    dailyReports: [],
  },
  {
    id: '30',
    user: users[15], // 罗十八
    teamMonthlyGoal: teamMonthlyGoals[8],
    month: 12,
    year: 2024,
    targetValue: 60000,
    progress: 66,
    dailyReports: [],
  },
];

// 日报数据 - 扩展更多日报
const dailyReports: DailyReport[] = [
  // 王五的日报
  {
    id: '1',
    user: users[2],
    personalMonthlyGoal: personalMonthlyGoals[8], // 12月目标
    date: '2024-12-15',
    actualRevenue: 25000,
    description: '完成A客户合同签约，金额25万',
  },
  {
    id: '2',
    user: users[2],
    personalMonthlyGoal: personalMonthlyGoals[8],
    date: '2024-12-16',
    actualRevenue: 18000,
    description: 'B客户续约成功，金额18万',
  },
  {
    id: '3',
    user: users[2],
    personalMonthlyGoal: personalMonthlyGoals[8],
    date: '2024-12-17',
    actualRevenue: 32000,
    description: 'C客户新项目启动，首期款32万',
  },
  
  // 孙八的日报
  {
    id: '4',
    user: users[5],
    personalMonthlyGoal: personalMonthlyGoals[9], // 12月目标
    date: '2024-12-15',
    actualRevenue: 15000,
    description: '华北区D客户签约，金额15万',
  },
  {
    id: '5',
    user: users[5],
    personalMonthlyGoal: personalMonthlyGoals[9],
    date: '2024-12-16',
    actualRevenue: 22000,
    description: '北京地区E客户合作达成，金额22万',
  },
  
  // 张三的日报
  {
    id: '6',
    user: users[0],
    personalMonthlyGoal: personalMonthlyGoals[18], // 12月目标
    date: '2024-12-15',
    actualRevenue: 8000,
    description: '技术咨询服务费，客户F项目',
  },
  {
    id: '7',
    user: users[0],
    personalMonthlyGoal: personalMonthlyGoals[18],
    date: '2024-12-16',
    actualRevenue: 12000,
    description: '系统开发服务费，客户G项目',
  },
];

// 更新个人目标的日报关联
personalMonthlyGoals[8].dailyReports = dailyReports.filter(r => r.personalMonthlyGoal.id === personalMonthlyGoals[8].id);
personalMonthlyGoals[9].dailyReports = dailyReports.filter(r => r.personalMonthlyGoal.id === personalMonthlyGoals[9].id);
personalMonthlyGoals[18].dailyReports = dailyReports.filter(r => r.personalMonthlyGoal.id === personalMonthlyGoals[18].id);

// 更新团队目标的个人目标关联
teamMonthlyGoals[0].personalGoals = personalMonthlyGoals.filter(p => p.teamMonthlyGoal.id === teamMonthlyGoals[0].id);
teamMonthlyGoals[1].personalGoals = personalMonthlyGoals.filter(p => p.teamMonthlyGoal.id === teamMonthlyGoals[1].id);
teamMonthlyGoals[2].personalGoals = personalMonthlyGoals.filter(p => p.teamMonthlyGoal.id === teamMonthlyGoals[2].id);
teamMonthlyGoals[3].personalGoals = personalMonthlyGoals.filter(p => p.teamMonthlyGoal.id === teamMonthlyGoals[3].id);
teamMonthlyGoals[4].personalGoals = personalMonthlyGoals.filter(p => p.teamMonthlyGoal.id === teamMonthlyGoals[4].id);
teamMonthlyGoals[5].personalGoals = personalMonthlyGoals.filter(p => p.teamMonthlyGoal.id === teamMonthlyGoals[5].id);
teamMonthlyGoals[6].personalGoals = personalMonthlyGoals.filter(p => p.teamMonthlyGoal.id === teamMonthlyGoals[6].id);
teamMonthlyGoals[7].personalGoals = personalMonthlyGoals.filter(p => p.teamMonthlyGoal.id === teamMonthlyGoals[7].id);
teamMonthlyGoals[8].personalGoals = personalMonthlyGoals.filter(p => p.teamMonthlyGoal.id === teamMonthlyGoals[8].id);

// 财务科目
const financialCategories: FinancialCategory[] = [
  {
    id: '1',
    name: '销售费用',
    level: 1,
    children: [
      {
        id: '11',
        name: '推广费',
        level: 2,
        parentId: '1',
        children: [
          { id: '111', name: '线上广告', level: 3, parentId: '11' },
          { id: '112', name: '线下活动', level: 3, parentId: '11' },
        ]
      },
      { id: '12', name: '差旅费', level: 2, parentId: '1' },
    ]
  },
  {
    id: '2',
    name: '管理费用',
    level: 1,
    children: [
      { id: '21', name: '办公费', level: 2, parentId: '2' },
      { id: '22', name: '培训费', level: 2, parentId: '2' },
    ]
  },
];

// 项目数据
export const projects: Project[] = [
  {
    id: '1',
    name: '新产品开发项目',
    budget: 500000,
    duration: '6个月',
    department: departments[0],
    costDetails: [],
  },
  {
    id: '2',
    name: '市场推广项目',
    budget: 300000,
    duration: '3个月',
    department: departments[1],
    costDetails: [],
  },
];

// 客户数据
const customers: Customer[] = [
  {
    id: '1',
    name: '华为技术有限公司',
    code: 'HUAWEI001',
    contact: '张经理',
    phone: '0755-28780808',
    email: 'zhang@huawei.com',
    address: '深圳市龙岗区坂田华为基地',
    status: 'active',
  },
  {
    id: '2',
    name: '腾讯科技（深圳）有限公司',
    code: 'TENCENT001',
    contact: '李总监',
    phone: '0755-86013388',
    email: 'li@tencent.com',
    address: '深圳市南山区科技中一路腾讯大厦',
    status: 'active',
  },
  {
    id: '3',
    name: '阿里巴巴集团',
    code: 'ALIBABA001',
    contact: '王部长',
    phone: '0571-85022088',
    email: 'wang@alibaba.com',
    address: '杭州市余杭区文一西路969号',
    status: 'active',
  },
];

// 供应商数据
const suppliers: Supplier[] = [
  {
    id: '1',
    name: '联想集团',
    code: 'LENOVO',
    contact: '张经理',
    phone: '010-12345678',
    email: 'zhang@lenovo.com',
    address: '北京市海淀区上地信息路1号',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    name: '戴尔科技',
    code: 'DELL',
    contact: '李经理',
    phone: '021-87654321',
    email: 'li@dell.com',
    address: '上海市浦东新区张江高科技园区',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '3',
    name: '华为技术',
    code: 'HUAWEI',
    contact: '王经理',
    phone: '0755-28780808',
    email: 'wang@huawei.com',
    address: '深圳市龙岗区坂田华为基地',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '4',
    name: '宜家家居',
    code: 'IKEA',
    contact: '赵经理',
    phone: '400-800-2345',
    email: 'zhao@ikea.com',
    address: '北京市朝阳区阜通东大街6号',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
  },
];

// 收入数据
const revenues: Revenue[] = [
  // 原始收入记录
  {
    id: '1',
    description: '华为ERP系统销售收入',
    amount: 500000,
    date: '2024-12-01',
    project: projects[0],
    customer: customers[0],
    financialCategory: financialCategories[0],
    status: 'received',
    isAllocated: true,
    allocationType: 'ratio',
    allocations: [],
  },
  // 分摊子记录
  {
    id: '1-1',
    description: '华为ERP系统销售收入 - 前端开发团队分摊',
    amount: 200000,
    date: '2024-12-01',
    project: projects[0],
    customer: customers[0],
    financialCategory: financialCategories[0],
    status: 'received',
    isAllocated: false,
    parentRevenueId: '1',
    isAllocationChild: true,
  },
  {
    id: '1-2',
    description: '华为ERP系统销售收入 - 后端开发团队分摊',
    amount: 175000,
    date: '2024-12-01',
    project: projects[0],
    customer: customers[0],
    financialCategory: financialCategories[0],
    status: 'received',
    isAllocated: false,
    parentRevenueId: '1',
    isAllocationChild: true,
  },
  {
    id: '1-3',
    description: '华为ERP系统销售收入 - 华北销售团队分摊',
    amount: 125000,
    date: '2024-12-01',
    project: projects[0],
    customer: customers[0],
    financialCategory: financialCategories[0],
    status: 'received',
    isAllocated: false,
    parentRevenueId: '1',
    isAllocationChild: true,
  },
  
  // 其他收入记录
  {
    id: '2',
    description: '腾讯系统集成服务收入',
    amount: 300000,
    date: '2024-11-25',
    project: projects[1],
    customer: customers[1],
    financialCategory: financialCategories[0],
    status: 'pending',
    isAllocated: false,
  },
  {
    id: '3',
    description: '阿里巴巴CRM系统销售收入',
    amount: 800000,
    date: '2024-12-05',
    project: projects[0],
    customer: customers[2],
    financialCategory: financialCategories[0],
    status: 'pending',
    isAllocated: false,
  },
  {
    id: '4',
    description: '技术咨询服务费',
    amount: 150000,
    date: '2024-11-30',
    customer: customers[0],
    financialCategory: financialCategories[0],
    status: 'overdue',
    isAllocated: false,
  },
];

// 费用数据
const expenses: Expense[] = [
  // 原始费用记录
  {
    id: '1',
    description: '线上广告投放费用',
    amount: 50000,
    date: '2024-12-01',
    financialCategory: financialCategories[0].children![0].children![0],
    project: projects[1],
    supplier: suppliers[0],
    status: 'paid',
    isAllocated: true,
    allocationType: 'ratio',
    allocations: [],
  },
  // 分摊子记录
  {
    id: '1-1',
    description: '线上广告投放费用 - 前端开发团队分摊',
    amount: 20000,
    date: '2024-12-01',
    financialCategory: financialCategories[0].children![0].children![0],
    project: projects[1],
    supplier: suppliers[0],
    status: 'paid',
    isAllocated: false,
    parentExpenseId: '1',
    isAllocationChild: true,
  },
  {
    id: '1-2',
    description: '线上广告投放费用 - 后端开发团队分摊',
    amount: 17500,
    date: '2024-12-01',
    financialCategory: financialCategories[0].children![0].children![0],
    project: projects[1],
    supplier: suppliers[0],
    status: 'paid',
    isAllocated: false,
    parentExpenseId: '1',
    isAllocationChild: true,
  },
  {
    id: '1-3',
    description: '线上广告投放费用 - 华北销售团队分摊',
    amount: 12500,
    date: '2024-12-01',
    financialCategory: financialCategories[0].children![0].children![0],
    project: projects[1],
    supplier: suppliers[0],
    status: 'paid',
    isAllocated: false,
    parentExpenseId: '1',
    isAllocationChild: true,
  },
  
  // 其他费用记录
  {
    id: '2',
    description: '办公设备采购',
    amount: 30000,
    date: '2024-12-14',
    financialCategory: financialCategories[1].children![0],
    supplier: suppliers[1],
    status: 'pending',
    isAllocated: false,
  },
  {
    id: '3',
    description: '员工培训费用',
    amount: 15000,
    date: '2024-11-20',
    financialCategory: financialCategories[1].children![1],
    status: 'approved',
    isAllocated: false,
  },
  {
    id: '4',
    description: '通讯费用',
    amount: 8600,
    date: '2024-11-15',
    financialCategory: financialCategories[1].children![0],
    status: 'overdue',
    isAllocated: false,
  },
];

// 应收账款数据
const accountsReceivable: AccountReceivable[] = [
  // 原始应收账款记录
  {
    id: '1',
    description: '华为项目应收款',
    amount: 200000,
    date: '2024-12-01',
    dueDate: '2024-12-31',
    customer: customers[0],
    project: projects[0],
    status: 'pending',
    isAllocated: true,
    allocationType: 'ratio',
    allocations: [],
  },
  // 分摊子记录
  {
    id: '1-1',
    description: '华为项目应收款 - 前端开发团队分摊',
    amount: 80000,
    date: '2024-12-01',
    dueDate: '2024-12-31',
    customer: customers[0],
    project: projects[0],
    status: 'pending',
    isAllocated: false,
    parentAccountId: '1',
    isAllocationChild: true,
  },
  {
    id: '1-2',
    description: '华为项目应收款 - 后端开发团队分摊',
    amount: 70000,
    date: '2024-12-01',
    dueDate: '2024-12-31',
    customer: customers[0],
    project: projects[0],
    status: 'pending',
    isAllocated: false,
    parentAccountId: '1',
    isAllocationChild: true,
  },
  {
    id: '1-3',
    description: '华为项目应收款 - 华北销售团队分摊',
    amount: 50000,
    date: '2024-12-01',
    dueDate: '2024-12-31',
    customer: customers[0],
    project: projects[0],
    status: 'pending',
    isAllocated: false,
    parentAccountId: '1',
    isAllocationChild: true,
  },
  
  // 其他应收账款记录
  {
    id: '2',
    description: '腾讯项目应收款',
    amount: 150000,
    date: '2024-11-25',
    dueDate: '2024-12-25',
    customer: customers[1],
    project: projects[1],
    status: 'partial',
    isAllocated: false,
  },
  {
    id: '3',
    description: '阿里巴巴项目应收款',
    amount: 300000,
    date: '2024-12-05',
    dueDate: '2025-01-05',
    customer: customers[2],
    project: projects[0],
    status: 'overdue',
    isAllocated: false,
  },
];

// 应付账款数据
const accountsPayable: AccountPayable[] = [
  // 原始应付账款记录
  {
    id: '1',
    description: '设备采购应付款',
    amount: 80000,
    date: '2024-12-01',
    dueDate: '2024-12-31',
    supplier: suppliers[0],
    project: projects[0],
    status: 'pending',
    isAllocated: true,
    allocationType: 'ratio',
    allocations: [],
  },
  // 分摊子记录
  {
    id: '1-1',
    description: '设备采购应付款 - 前端开发团队分摊',
    amount: 32000,
    date: '2024-12-01',
    dueDate: '2024-12-31',
    supplier: suppliers[0],
    project: projects[0],
    status: 'pending',
    isAllocated: false,
    parentAccountId: '1',
    isAllocationChild: true,
  },
  {
    id: '1-2',
    description: '设备采购应付款 - 后端开发团队分摊',
    amount: 28000,
    date: '2024-12-01',
    dueDate: '2024-12-31',
    supplier: suppliers[0],
    project: projects[0],
    status: 'pending',
    isAllocated: false,
    parentAccountId: '1',
    isAllocationChild: true,
  },
  {
    id: '1-3',
    description: '设备采购应付款 - 华北销售团队分摊',
    amount: 20000,
    date: '2024-12-01',
    dueDate: '2024-12-31',
    supplier: suppliers[0],
    project: projects[0],
    status: 'pending',
    isAllocated: false,
    parentAccountId: '1',
    isAllocationChild: true,
  },
  
  // 其他应付账款记录
  {
    id: '2',
    description: '软件许可费应付款',
    amount: 50000,
    date: '2024-11-20',
    dueDate: '2024-12-20',
    supplier: suppliers[1],
    status: 'settled',
    isAllocated: false,
  },
  {
    id: '3',
    description: '办公用品应付款',
    amount: 25000,
    date: '2024-12-10',
    dueDate: '2025-01-10',
    supplier: suppliers[2],
    status: 'overdue',
    isAllocated: false,
  },
];

// 费用分摊记录
const costAllocations: CostAllocation[] = [
  {
    id: '1',
    originalCostId: '1',
    subsidiary: subsidiaries[0],
    allocationRatio: 40,
    allocationAmount: 20000,
    createdAt: '2024-12-01',
  },
  {
    id: '2',
    originalCostId: '1',
    subsidiary: subsidiaries[1],
    allocationRatio: 35,
    allocationAmount: 17500,
    createdAt: '2024-12-01',
  },
  {
    id: '3',
    originalCostId: '1',
    subsidiary: subsidiaries[2],
    allocationRatio: 25,
    allocationAmount: 12500,
    createdAt: '2024-12-01',
  },
];

// 经营成本（包含分摊功能）- 扩展更多历史数据支持异常预警
const operatingCosts: OperatingCost[] = [
  // 当前分摊费用
  {
    id: '1',
    category: 'sales',
    project: projects[1],
    financialCategory: financialCategories[0].children![0].children![0],
    amount: 50000,
    description: '线上广告投放',
    date: '2024-12-01',
    isAllocated: true,
    allocationType: 'ratio',
    allocations: costAllocations,
  },
  // 分摊子记录
  {
    id: '1-1',
    category: 'sales',
    project: projects[1],
    financialCategory: financialCategories[0].children![0].children![0],
    amount: 20000,
    description: '线上广告投放 - 北京分公司分摊',
    date: '2024-12-01',
    isAllocated: false,
    parentCostId: '1',
    isAllocationChild: true,
  },
  {
    id: '1-2',
    category: 'sales',
    project: projects[1],
    financialCategory: financialCategories[0].children![0].children![0],
    amount: 17500,
    description: '线上广告投放 - 上海分公司分摊',
    date: '2024-12-01',
    isAllocated: false,
    parentCostId: '1',
    isAllocationChild: true,
  },
  {
    id: '1-3',
    category: 'sales',
    project: projects[1],
    financialCategory: financialCategories[0].children![0].children![0],
    amount: 12500,
    description: '线上广告投放 - 深圳分公司分摊',
    date: '2024-12-01',
    isAllocated: false,
    parentCostId: '1',
    isAllocationChild: true,
  },
  
  // 异常金额费用（触发绝对金额预警）
  {
    id: '2',
    category: 'management',
    financialCategory: financialCategories[1].children![0],
    amount: 300000,
    description: '办公设备采购',
    date: '2024-12-14',
    isAllocated: true,
    allocationType: 'ratio',
  },
  {
    id: '2-1',
    category: 'management',
    financialCategory: financialCategories[1].children![0],
    amount: 120000,
    description: '办公设备采购 - 北京分公司分摊',
    date: '2024-12-14',
    isAllocated: false,
    parentCostId: '2',
    isAllocationChild: true,
  },
  {
    id: '2-2',
    category: 'management',
    financialCategory: financialCategories[1].children![0],
    amount: 105000,
    description: '办公设备采购 - 上海分公司分摊',
    date: '2024-12-14',
    isAllocated: false,
    parentCostId: '2',
    isAllocationChild: true,
  },
  {
    id: '2-3',
    category: 'management',
    financialCategory: financialCategories[1].children![0],
    amount: 75000,
    description: '办公设备采购 - 深圳分公司分摊',
    date: '2024-12-14',
    isAllocated: false,
    parentCostId: '2',
    isAllocationChild: true,
  },

  // 比例异常费用（触发比例变动预警）
  {
    id: '3',
    category: 'sales',
    financialCategory: financialCategories[0].children![0].children![1],
    amount: 80000,
    description: '市场推广费用',
    date: '2024-12-13',
    isAllocated: true,
    allocationType: 'ratio',
  },
  {
    id: '3-1',
    category: 'sales',
    financialCategory: financialCategories[0].children![0].children![1],
    amount: 36000, // 45% 比例异常
    description: '市场推广费用 - 北京分公司分摊',
    date: '2024-12-13',
    isAllocated: false,
    parentCostId: '3',
    isAllocationChild: true,
  },
  {
    id: '3-2',
    category: 'sales',
    financialCategory: financialCategories[0].children![0].children![1],
    amount: 24000, // 30% 比例
    description: '市场推广费用 - 上海分公司分摊',
    date: '2024-12-13',
    isAllocated: false,
    parentCostId: '3',
    isAllocationChild: true,
  },
  {
    id: '3-3',
    category: 'sales',
    financialCategory: financialCategories[0].children![0].children![1],
    amount: 20000, // 25% 比例
    description: '市场推广费用 - 深圳分公司分摊',
    date: '2024-12-13',
    isAllocated: false,
    parentCostId: '3',
    isAllocationChild: true,
  },

  // 历史正常费用数据（用于计算历史平均值）
  {
    id: '4',
    category: 'management',
    financialCategory: financialCategories[1].children![1],
    amount: 20000,
    description: '员工技能培训',
    date: '2024-11-05',
    isAllocated: true,
    allocationType: 'ratio',
  },
  {
    id: '4-1',
    category: 'management',
    financialCategory: financialCategories[1].children![1],
    amount: 8000,
    description: '员工技能培训 - 北京分公司分摊',
    date: '2024-11-05',
    isAllocated: false,
    parentCostId: '4',
    isAllocationChild: true,
  },
  {
    id: '4-2',
    category: 'management',
    financialCategory: financialCategories[1].children![1],
    amount: 7000,
    description: '员工技能培训 - 上海分公司分摊',
    date: '2024-11-05',
    isAllocated: false,
    parentCostId: '4',
    isAllocationChild: true,
  },
  {
    id: '4-3',
    category: 'management',
    financialCategory: financialCategories[1].children![1],
    amount: 5000,
    description: '员工技能培训 - 深圳分公司分摊',
    date: '2024-11-05',
    isAllocated: false,
    parentCostId: '4',
    isAllocationChild: true,
  },

  // 更多历史数据用于计算平均值
  {
    id: '5',
    category: 'operation',
    financialCategory: financialCategories[1].children![0],
    amount: 15000,
    description: '办公室租金',
    date: '2024-10-01',
    isAllocated: true,
    allocationType: 'ratio',
  },
  {
    id: '5-1',
    category: 'operation',
    financialCategory: financialCategories[1].children![0],
    amount: 6000,
    description: '办公室租金 - 北京分公司分摊',
    date: '2024-10-01',
    isAllocated: false,
    parentCostId: '5',
    isAllocationChild: true,
  },
  {
    id: '5-2',
    category: 'operation',
    financialCategory: financialCategories[1].children![0],
    amount: 5250,
    description: '办公室租金 - 上海分公司分摊',
    date: '2024-10-01',
    isAllocated: false,
    parentCostId: '5',
    isAllocationChild: true,
  },
  {
    id: '5-3',
    category: 'operation',
    financialCategory: financialCategories[1].children![0],
    amount: 3750,
    description: '办公室租金 - 深圳分公司分摊',
    date: '2024-10-01',
    isAllocated: false,
    parentCostId: '5',
    isAllocationChild: true,
  },
];

// 报销数据 - 修复数据结构
const reimbursements: Reimbursement[] = [
  {
    id: '1',
    applicant: users[2], // 修复：使用 applicant 而不是 user
    project: projects[1],
    financialCategory: financialCategories[0].children![1],
    amount: 3500,
    description: '客户拜访差旅费',
    invoiceImages: ['invoice1.jpg'],
    status: 'pending',
    applicationDate: '2024-12-15', // 修复：使用 applicationDate 而不是 submittedAt
    approvalHistory: [
      {
        approver: users[0],
        action: 'pending',
        date: '2024-12-15',
        comment: '等待审批'
      }
    ]
  },
  {
    id: '2',
    applicant: users[1], // 修复：使用 applicant 而不是 user
    financialCategory: financialCategories[1].children![0],
    amount: 800,
    description: '办公用品采购',
    invoiceImages: ['invoice2.jpg'],
    status: 'approved',
    applicationDate: '2024-12-10', // 修复：使用 applicationDate 而不是 submittedAt
    approvalHistory: [
      {
        approver: users[0],
        action: 'approved',
        date: '2024-12-12',
        comment: '审批通过'
      }
    ]
  },
  {
    id: '3',
    applicant: users[3],
    financialCategory: financialCategories[0].children![0].children![0],
    amount: 2500,
    description: '线上广告费用',
    invoiceImages: ['invoice3.jpg'],
    status: 'rejected',
    applicationDate: '2024-12-08',
    approvalHistory: [
      {
        approver: users[0],
        action: 'rejected',
        date: '2024-12-09',
        comment: '预算不足，暂缓执行'
      }
    ]
  },
  {
    id: '4',
    applicant: users[4],
    project: projects[0],
    financialCategory: financialCategories[1].children![1],
    amount: 1200,
    description: '技术培训费用',
    invoiceImages: ['invoice4.jpg'],
    status: 'approved',
    applicationDate: '2024-12-12',
    approvalHistory: [
      {
        approver: users[0],
        action: 'approved',
        date: '2024-12-13',
        comment: '培训有助于技能提升，同意报销'
      }
    ]
  }
];

// ==================== 资产管理模拟数据 ====================

// 资产分类数据
export const assetCategories: AssetCategory[] = [
  {
    id: '1',
    name: '办公设备',
    code: 'OFFICE',
    level: 1,
    depreciationYears: 5,
    depreciationMethod: 'straight_line',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '11',
        name: '计算机设备',
        code: 'COMPUTER',
        level: 2,
        parentId: '1',
        depreciationYears: 3,
        depreciationMethod: 'straight_line',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '111', name: '台式电脑', code: 'DESKTOP', level: 3, parentId: '11', depreciationYears: 3, depreciationMethod: 'straight_line', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '112', name: '笔记本电脑', code: 'LAPTOP', level: 3, parentId: '11', depreciationYears: 3, depreciationMethod: 'straight_line', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '113', name: '服务器', code: 'SERVER', level: 3, parentId: '11', depreciationYears: 5, depreciationMethod: 'straight_line', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
      {
        id: '12',
        name: '办公家具',
        code: 'FURNITURE',
        level: 2,
        parentId: '1',
        depreciationYears: 10,
        depreciationMethod: 'straight_line',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '121', name: '办公桌', code: 'DESK', level: 3, parentId: '12', depreciationYears: 10, depreciationMethod: 'straight_line', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '122', name: '办公椅', code: 'CHAIR', level: 3, parentId: '12', depreciationYears: 8, depreciationMethod: 'straight_line', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
    ]
  },
  {
    id: '2',
    name: '生产设备',
    code: 'PRODUCTION',
    level: 1,
    depreciationYears: 10,
    depreciationMethod: 'straight_line',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '21',
        name: '机械设备',
        code: 'MACHINERY',
        level: 2,
        parentId: '2',
        depreciationYears: 15,
        depreciationMethod: 'straight_line',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
      },
    ]
  },
  {
    id: '3',
    name: '运输工具',
    code: 'TRANSPORT',
    level: 1,
    depreciationYears: 8,
    depreciationMethod: 'declining_balance',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '31',
        name: '汽车',
        code: 'CAR',
        level: 2,
        parentId: '3',
        depreciationYears: 8,
        depreciationMethod: 'declining_balance',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
      },
    ]
  },
];

// 存放地点数据
export const assetLocations: AssetLocation[] = [
  {
    id: '1',
    name: '总部大厦',
    type: 'building',
    level: 1,
    code: 'HQ',
    capacity: 1000,
    responsible: users[0],
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '11',
        name: '1楼',
        type: 'floor',
        level: 2,
        parentId: '1',
        code: 'HQ-F1',
        capacity: 200,
        responsible: users[1],
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '111', name: '大厅', type: 'room', level: 3, parentId: '11', code: 'HQ-F1-LOBBY', capacity: 50, createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '112', name: '会议室A', type: 'room', level: 3, parentId: '11', code: 'HQ-F1-MEET-A', capacity: 20, createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '113', name: '会议室B', type: 'room', level: 3, parentId: '11', code: 'HQ-F1-MEET-B', capacity: 10, createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
      {
        id: '12',
        name: '2楼',
        type: 'floor',
        level: 2,
        parentId: '1',
        code: 'HQ-F2',
        capacity: 200,
        responsible: users[2],
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '121', name: '技术部办公区', type: 'room', level: 3, parentId: '12', code: 'HQ-F2-TECH', capacity: 80, createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '122', name: '产品部办公区', type: 'room', level: 3, parentId: '12', code: 'HQ-F2-PROD', capacity: 60, createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
      {
        id: '13',
        name: '3楼',
        type: 'floor',
        level: 2,
        parentId: '1',
        code: 'HQ-F3',
        capacity: 200,
        responsible: users[3],
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '131', name: '销售部办公区', type: 'room', level: 3, parentId: '13', code: 'HQ-F3-SALES', capacity: 100, createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '132', name: '市场部办公区', type: 'room', level: 3, parentId: '13', code: 'HQ-F3-MKT', capacity: 50, createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
    ]
  },
  {
    id: '2',
    name: '研发中心',
    type: 'building',
    level: 1,
    code: 'RD',
    capacity: 500,
    responsible: users[4],
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '21',
        name: '1楼',
        type: 'floor',
        level: 2,
        parentId: '2',
        code: 'RD-F1',
        capacity: 250,
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '211', name: '实验室A', type: 'room', level: 3, parentId: '21', code: 'RD-F1-LAB-A', capacity: 30, createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '212', name: '实验室B', type: 'room', level: 3, parentId: '21', code: 'RD-F1-LAB-B', capacity: 30, createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
    ]
  },
];

// 品牌数据
const brands: Brand[] = [
  {
    id: '1',
    name: 'ThinkPad',
    code: 'THINKPAD',
    country: '中国',
    description: '商务笔记本电脑品牌',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    name: 'Dell',
    code: 'DELL',
    country: '美国',
    description: '计算机设备品牌',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '3',
    name: 'Apple',
    code: 'APPLE',
    country: '美国',
    description: '苹果电子产品',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '4',
    name: 'Herman Miller',
    code: 'HM',
    country: '美国',
    description: '高端办公家具品牌',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
  },
];

// 资产附件数据
const assetAttachments: AssetAttachment[] = [
  {
    id: '1',
    assetId: '1',
    name: '购买发票.pdf',
    type: 'invoice',
    url: '/attachments/invoice_001.pdf',
    uploadedBy: users[0],
    uploadedAt: '2024-01-15',
  },
  {
    id: '2',
    assetId: '1',
    name: '采购合同.pdf',
    type: 'contract',
    url: '/attachments/contract_001.pdf',
    uploadedBy: users[0],
    uploadedAt: '2024-01-15',
  },
  {
    id: '3',
    assetId: '2',
    name: '设备照片.jpg',
    type: 'photo',
    url: '/attachments/photo_002.jpg',
    uploadedBy: users[1],
    uploadedAt: '2024-02-01',
  },
];

// 资产数据
export const assets: Asset[] = [
  {
    id: '1',
    assetCode: 'LAPTOP-001',
    name: 'ThinkPad X1 Carbon',
    category: assetCategories[0].children![0].children![1], // 笔记本电脑
    brand: brands[0], // ThinkPad
    model: 'X1 Carbon Gen 9',
    specification: 'i7-1165G7/16GB/512GB SSD/14寸',
    supplier: suppliers[0], // 联想集团
    purchaseDate: '2024-01-15',
    purchasePrice: 12000,
    currentValue: 9600,
    depreciationValue: 2400,
    location: assetLocations[0].children![1].children![0], // 总部大厦-2楼-技术部办公区
    department: departments[0], // 技术部
    custodian: users[1], // 李四
    user: users[1], // 李四
    status: 'in_use',
    warrantyExpiry: '2027-01-15',
    attachments: assetAttachments.filter(a => a.assetId === '1'),
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    assetCode: 'DESKTOP-001',
    name: 'Dell OptiPlex 7090',
    category: assetCategories[0].children![0].children![0], // 台式电脑
    brand: brands[1], // Dell
    model: 'OptiPlex 7090',
    specification: 'i5-11500/8GB/256GB SSD',
    supplier: suppliers[1], // 戴尔科技
    purchaseDate: '2024-02-01',
    purchasePrice: 6000,
    currentValue: 5000,
    depreciationValue: 1000,
    location: assetLocations[0].children![2].children![0], // 总部大厦-3楼-销售部办公区
    department: departments[1], // 销售部
    custodian: users[2], // 王五
    user: users[2], // 王五
    status: 'in_use',
    warrantyExpiry: '2027-02-01',
    attachments: assetAttachments.filter(a => a.assetId === '2'),
    createdAt: '2024-02-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '3',
    assetCode: 'SERVER-001',
    name: 'Dell PowerEdge R740',
    category: assetCategories[0].children![0].children![2], // 服务器
    brand: brands[1], // Dell
    model: 'PowerEdge R740',
    specification: 'Xeon Silver 4214/32GB/2TB HDD',
    supplier: suppliers[1], // 戴尔科技
    purchaseDate: '2024-03-01',
    purchasePrice: 35000,
    currentValue: 28000,
    depreciationValue: 7000,
    location: assetLocations[1].children![0].children![0], // 研发中心-1楼-实验室A
    department: departments[0], // 技术部
    custodian: users[0], // 张三
    status: 'in_use',
    warrantyExpiry: '2029-03-01',
    attachments: [],
    createdAt: '2024-03-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '4',
    assetCode: 'DESK-001',
    name: 'Herman Miller办公桌',
    category: assetCategories[0].children![1].children![0], // 办公桌
    brand: brands[3], // Herman Miller
    model: 'Aeron Desk',
    specification: '1.6m x 0.8m 实木桌面',
    supplier: suppliers[3], // 宜家家居
    purchaseDate: '2024-04-01',
    purchasePrice: 3000,
    currentValue: 2700,
    depreciationValue: 300,
    location: assetLocations[0].children![1].children![0], // 总部大厦-2楼-技术部办公区
    department: departments[0], // 技术部
    custodian: users[1], // 李四
    user: users[1], // 李四
    status: 'in_use',
    attachments: [],
    createdAt: '2024-04-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '5',
    assetCode: 'CHAIR-001',
    name: 'Herman Miller人体工学椅',
    category: assetCategories[0].children![1].children![1], // 办公椅
    brand: brands[3], // Herman Miller
    model: 'Aeron Chair',
    specification: '网面透气 可调节高度',
    supplier: suppliers[3], // 宜家家居
    purchaseDate: '2024-04-01',
    purchasePrice: 2000,
    currentValue: 1750,
    depreciationValue: 250,
    location: assetLocations[0].children![1].children![0], // 总部大厦-2楼-技术部办公区
    department: departments[0], // 技术部
    custodian: users[1], // 李四
    user: users[1], // 李四
    status: 'in_use',
    attachments: [],
    createdAt: '2024-04-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '6',
    assetCode: 'LAPTOP-002',
    name: 'MacBook Pro',
    category: assetCategories[0].children![0].children![1], // 笔记本电脑
    brand: brands[2], // Apple
    model: 'MacBook Pro 14"',
    specification: 'M2 Pro/16GB/512GB SSD',
    purchaseDate: '2024-05-01',
    purchasePrice: 18000,
    currentValue: 15000,
    depreciationValue: 3000,
    location: assetLocations[0].children![1].children![1], // 总部大厦-2楼-产品部办公区
    department: departments[0], // 技术部
    status: 'idle',
    attachments: [],
    createdAt: '2024-05-01',
    updatedAt: '2024-12-01',
  },
];

// 资产变动记录
const assetMovements: AssetMovement[] = [
  {
    id: '1',
    asset: assets[0],
    type: 'location_change',
    fromValue: '总部大厦-1楼-大厅',
    toValue: '总部大厦-2楼-技术部办公区',
    reason: '部门调整，设备重新分配',
    operator: users[0],
    operatedAt: '2024-06-01',
    approver: users[0],
    approvedAt: '2024-06-01',
    status: 'approved',
  },
  {
    id: '2',
    asset: assets[1],
    type: 'user_change',
    fromValue: '无使用人',
    toValue: '王五',
    reason: '新员工入职，分配设备',
    operator: users[0],
    operatedAt: '2024-06-15',
    approver: users[0],
    approvedAt: '2024-06-15',
    status: 'approved',
  },
  {
    id: '3',
    asset: assets[5],
    type: 'status_change',
    fromValue: 'in_use',
    toValue: 'idle',
    reason: '员工离职，设备回收',
    operator: users[0],
    operatedAt: '2024-11-01',
    status: 'pending',
  },
];

// 维保计划
export const maintenancePlans: MaintenancePlan[] = [
  {
    id: '1',
    asset: assets[2], // 服务器
    planName: '服务器定期维护',
    type: 'preventive',
    frequency: 'quarterly',
    nextDate: '2025-01-01',
    responsible: users[0],
    description: '定期清理灰尘、检查硬件状态、更新系统',
    cost: 1000,
    status: 'active',
    createdAt: '2024-03-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    asset: assets[0], // 笔记本
    planName: '笔记本年度保养',
    type: 'preventive',
    frequency: 'annual',
    nextDate: '2025-01-15',
    responsible: users[1],
    description: '系统重装、硬件检测、电池校准',
    cost: 200,
    status: 'active',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01',
  },
];

// 维保记录
const maintenanceRecords: MaintenanceRecord[] = [
  {
    id: '1',
    asset: assets[2], // 服务器
    plan: maintenancePlans[0],
    type: 'preventive',
    description: '定期维护：清理灰尘、检查硬件、更新系统',
    startDate: '2024-10-01',
    endDate: '2024-10-01',
    cost: 1000,
    supplier: suppliers[1], // 戴尔科技
    technician: '技术工程师-李工',
    result: 'completed',
    nextMaintenanceDate: '2025-01-01',
    attachments: [],
    operator: users[0],
    createdAt: '2024-10-01',
  },
  {
    id: '2',
    asset: assets[0], // 笔记本
    type: 'corrective',
    description: '故障维修：键盘按键失灵，更换键盘',
    startDate: '2024-08-15',
    endDate: '2024-08-16',
    cost: 300,
    supplier: suppliers[0], // 联想集团
    technician: '维修工程师-王工',
    result: 'completed',
    attachments: [],
    operator: users[1],
    createdAt: '2024-08-15',
  },
];

// 资产处置记录
const assetDisposals: AssetDisposal[] = [
  {
    id: '1',
    asset: {
      ...assets[0],
      id: 'disposed-1',
      assetCode: 'LAPTOP-OLD-001',
      name: '旧笔记本电脑',
      status: 'disposed',
    },
    type: 'scrap',
    reason: '设备老化，无法正常使用',
    disposalDate: '2024-09-01',
    disposalValue: 0,
    income: 0,
    approver: users[0],
    approvedAt: '2024-08-30',
    operator: users[1],
    attachments: [],
    createdAt: '2024-09-01',
  },
];

// 盘点计划
export const inventoryPlans: InventoryPlan[] = [
  {
    id: '1',
    planName: '2024年度全面盘点',
    type: 'full',
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    locations: assetLocations,
    categories: assetCategories,
    responsible: [users[0], users[1], users[2]],
    status: 'in_progress',
    description: '年度全面资产盘点，核实所有资产状态和位置',
    createdBy: users[0],
    createdAt: '2024-11-15',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    planName: '技术部设备专项盘点',
    type: 'partial',
    startDate: '2024-11-01',
    endDate: '2024-11-15',
    locations: [assetLocations[0].children![1]], // 2楼
    categories: [assetCategories[0].children![0]], // 计算机设备
    responsible: [users[1]],
    status: 'completed',
    description: '技术部计算机设备专项盘点',
    createdBy: users[0],
    createdAt: '2024-10-25',
    updatedAt: '2024-11-15',
  },
];

// 盘点记录
export const inventoryRecords: InventoryRecord[] = [
  {
    id: '1',
    plan: inventoryPlans[1],
    asset: assets[0],
    expectedLocation: assetLocations[0].children![1].children![0],
    actualLocation: assetLocations[0].children![1].children![0],
    expectedStatus: 'in_use',
    actualStatus: 'in_use',
    expectedCustodian: users[1],
    actualCustodian: users[1],
    difference: 'normal',
    notes: '设备状态正常，位置正确',
    operator: users[1],
    operatedAt: '2024-11-05',
    photos: ['/photos/inventory_001.jpg'],
  },
  {
    id: '2',
    plan: inventoryPlans[1],
    asset: assets[1],
    expectedLocation: assetLocations[0].children![2].children![0],
    actualLocation: assetLocations[0].children![1].children![0],
    expectedStatus: 'in_use',
    actualStatus: 'in_use',
    expectedCustodian: users[2],
    actualCustodian: users[2],
    difference: 'location_error',
    notes: '设备位置与记录不符，实际在技术部办公区',
    operator: users[1],
    operatedAt: '2024-11-06',
    photos: ['/photos/inventory_002.jpg'],
  },
];

// 盘点差异处理
export const inventoryAdjustments: InventoryAdjustment[] = [
  {
    id: '1',
    record: inventoryRecords[1],
    adjustmentType: 'location_update',
    reason: '设备实际使用位置变更，更新资产位置信息',
    approver: users[0],
    approvedAt: '2024-11-07',
    operator: users[1],
    createdAt: '2024-11-07',
  },
];

// 资产统计数据
export const assetStatistics: AssetStatistics = {
  totalAssets: assets.length,
  totalValue: assets.reduce((sum, asset) => sum + asset.currentValue, 0),
  byStatus: {
    in_use: assets.filter(a => a.status === 'in_use').length,
    idle: assets.filter(a => a.status === 'idle').length,
    maintenance: assets.filter(a => a.status === 'maintenance').length,
    scrapped: assets.filter(a => a.status === 'scrapped').length,
    disposed: assets.filter(a => a.status === 'disposed').length,
  },
  byCategory: [
    {
      category: '办公设备',
      count: assets.filter(a => a.category.parentId === '1' || a.category.id === '1').length,
      value: assets.filter(a => a.category.parentId === '1' || a.category.id === '1').reduce((sum, a) => sum + a.currentValue, 0),
    },
    {
      category: '生产设备',
      count: assets.filter(a => a.category.parentId === '2' || a.category.id === '2').length,
      value: assets.filter(a => a.category.parentId === '2' || a.category.id === '2').reduce((sum, a) => sum + a.currentValue, 0),
    },
  ],
  byLocation: [
    {
      location: '总部大厦',
      count: assets.filter(a => a.location.parentId?.startsWith('1')).length,
      value: assets.filter(a => a.location.parentId?.startsWith('1')).reduce((sum, a) => sum + a.currentValue, 0),
    },
    {
      location: '研发中心',
      count: assets.filter(a => a.location.parentId?.startsWith('2')).length,
      value: assets.filter(a => a.location.parentId?.startsWith('2')).reduce((sum, a) => sum + a.currentValue, 0),
    },
  ],
  byDepartment: [
    {
      department: '技术部',
      count: assets.filter(a => a.department.id === '1').length,
      value: assets.filter(a => a.department.id === '1').reduce((sum, a) => sum + a.currentValue, 0),
    },
    {
      department: '销售部',
      count: assets.filter(a => a.department.id === '2').length,
      value: assets.filter(a => a.department.id === '2').reduce((sum, a) => sum + a.currentValue, 0),
    },
  ],
  depreciation: {
    totalOriginalValue: assets.reduce((sum, asset) => sum + asset.purchasePrice, 0),
    totalDepreciation: assets.reduce((sum, asset) => sum + asset.depreciationValue, 0),
    currentValue: assets.reduce((sum, asset) => sum + asset.currentValue, 0),
    depreciationRate: (assets.reduce((sum, asset) => sum + asset.depreciationValue, 0) / assets.reduce((sum, asset) => sum + asset.purchasePrice, 0)) * 100,
  },
};

// ==================== 采购管理模拟数据 ====================

// 采购订单明细数据
const procurementOrderItems: ProcurementOrderItem[] = [
  {
    id: '1',
    assetName: 'ThinkPad X1 Carbon',
    assetType: 'fixed_asset',
    specification: 'i7-1165G7/16GB/512GB SSD/14寸',
    quantity: 5,
    budgetAmount: 60000,
    unitPrice: 12000,
    totalAmount: 60000,
    purpose: '技术部新员工配置',
    remarks: '需要预装开发环境',
  },
  {
    id: '2',
    assetName: '办公桌',
    assetType: 'fixed_asset',
    specification: '1.6m x 0.8m 实木桌面',
    quantity: 10,
    budgetAmount: 30000,
    unitPrice: 3000,
    totalAmount: 30000,
    purpose: '新办公区域配置',
  },
  {
    id: '3',
    assetName: '打印纸',
    assetType: 'consumable',
    specification: 'A4 80g 500张/包',
    quantity: 100,
    budgetAmount: 2000,
    unitPrice: 20,
    totalAmount: 2000,
    purpose: '日常办公用品补充',
  },
];

// 采购附件数据
const procurementAttachments: ProcurementAttachment[] = [
  {
    id: '1',
    orderId: '1',
    name: 'ThinkPad报价单.pdf',
    type: 'quotation',
    url: '/attachments/procurement/quote_001.pdf',
    uploadedBy: users[1],
    uploadedAt: '2024-12-01',
  },
  {
    id: '2',
    orderId: '1',
    name: '技术参数说明.pdf',
    type: 'specification',
    url: '/attachments/procurement/spec_001.pdf',
    uploadedBy: users[1],
    uploadedAt: '2024-12-01',
  },
  {
    id: '3',
    orderId: '2',
    name: '办公家具报价单.pdf',
    type: 'quotation',
    url: '/attachments/procurement/quote_002.pdf',
    uploadedBy: users[2],
    uploadedAt: '2024-12-05',
  },
];

// 采购审批记录数据
const procurementApprovalRecords: ProcurementApprovalRecord[] = [
  {
    id: '1',
    orderId: '1',
    approver: users[0], // 张三 - 技术部负责人
    approvalLevel: 'department',
    action: 'approved',
    comment: '技术部确实需要这些设备，同意采购',
    approvedAt: '2024-12-02',
    createdAt: '2024-12-01',
  },
  {
    id: '2',
    orderId: '1',
    approver: users[3], // 赵六 - 财务部
    approvalLevel: 'finance',
    action: 'approved',
    comment: '预算充足，财务审批通过',
    approvedAt: '2024-12-03',
    createdAt: '2024-12-02',
  },
  {
    id: '3',
    orderId: '1',
    approver: users[0], // 张三 - 分管领导
    approvalLevel: 'leadership',
    action: 'approved',
    comment: '最终审批通过，可以执行采购',
    approvedAt: '2024-12-04',
    createdAt: '2024-12-03',
  },
  {
    id: '4',
    orderId: '2',
    approver: users[2], // 王五 - 销售部负责人
    approvalLevel: 'department',
    action: 'pending',
    comment: '',
    createdAt: '2024-12-05',
  },
];

// 采购订单数据
const procurementOrders: ProcurementOrder[] = [
  {
    id: '1',
    orderNumber: 'PO-2024-001',
    title: '技术部笔记本电脑采购',
    applicant: users[1], // 李四
    department: departments[0], // 技术部
    expectedDeliveryDate: '2024-12-20',
    totalBudget: 60000,
    items: [procurementOrderItems[0]],
    attachments: procurementAttachments.filter(a => a.orderId === '1'),
    status: 'approved',
    approvalHistory: procurementApprovalRecords.filter(r => r.orderId === '1'),
    createdBy: users[1],
    createdAt: '2024-12-01',
    updatedAt: '2024-12-04',
  },
  {
    id: '2',
    orderNumber: 'PO-2024-002',
    title: '办公家具采购申请',
    applicant: users[2], // 王五
    department: departments[1], // 销售部
    expectedDeliveryDate: '2024-12-25',
    totalBudget: 30000,
    items: [procurementOrderItems[1]],
    attachments: procurementAttachments.filter(a => a.orderId === '2'),
    status: 'pending',
    approvalHistory: procurementApprovalRecords.filter(r => r.orderId === '2'),
    createdBy: users[2],
    createdAt: '2024-12-05',
    updatedAt: '2024-12-05',
  },
  {
    id: '3',
    orderNumber: 'PO-2024-003',
    title: '办公用品补充采购',
    applicant: users[4], // 钱七
    department: departments[0], // 技术部
    expectedDeliveryDate: '2024-12-18',
    totalBudget: 2000,
    items: [procurementOrderItems[2]],
    attachments: [],
    status: 'draft',
    approvalHistory: [],
    createdBy: users[4],
    createdAt: '2024-12-10',
    updatedAt: '2024-12-10',
  },
];

// 采购入库明细数据
const procurementReceiptItems: ProcurementReceiptItem[] = [
  {
    id: '1',
    receiptId: '1',
    orderItemId: '1',
    orderItem: procurementOrderItems[0],
    expectedQuantity: 5,
    actualQuantity: 5,
    qualityStatus: 'qualified',
    receiptStatus: 'normal',
    unitPrice: 12000,
    totalAmount: 60000,
    location: assetLocations[0].children![1].children![0], // 技术部办公区
    custodian: users[1], // 李四
    assetCode: 'LAPTOP-003,LAPTOP-004,LAPTOP-005,LAPTOP-006,LAPTOP-007',
    notes: '设备已验收合格，已分配资产编号',
  },
];

// 采购入库单数据
const procurementReceipts: ProcurementReceipt[] = [
  {
    id: '1',
    receiptNumber: 'PR-2024-001',
    procurementOrder: procurementOrders[0],
    supplier: suppliers[0], // 联想集团
    deliveryDate: '2024-12-15',
    inspector: users[1], // 李四
    items: procurementReceiptItems,
    status: 'completed',
    totalReceived: 60000,
    notes: '所有设备已验收完成，质量合格',
    attachments: [],
    createdBy: users[1],
    createdAt: '2024-12-15',
    updatedAt: '2024-12-15',
  },
];

// 采购异常处理数据
const procurementExceptions: ProcurementException[] = [
  {
    id: '1',
    receiptId: '1',
    receiptItemId: '1',
    type: 'quality_issue',
    description: '其中一台笔记本电脑屏幕有轻微划痕',
    handlingMethod: 'accept',
    handlingResult: '经协商，供应商给予5%折扣补偿',
    handler: users[1],
    handledAt: '2024-12-15',
    status: 'resolved',
    createdAt: '2024-12-15',
  },
];

// 采购统计数据
const procurementStatistics: ProcurementStatistics = {
  totalOrders: procurementOrders.length,
  totalAmount: procurementOrders.reduce((sum, order) => sum + order.totalBudget, 0),
  byStatus: {
    draft: procurementOrders.filter(o => o.status === 'draft').length,
    pending: procurementOrders.filter(o => o.status === 'pending').length,
    approved: procurementOrders.filter(o => o.status === 'approved').length,
    rejected: procurementOrders.filter(o => o.status === 'rejected').length,
    completed: procurementOrders.filter(o => o.status === 'completed').length,
  },
  byDepartment: [
    {
      department: '技术部',
      orderCount: procurementOrders.filter(o => o.department.id === '1').length,
      totalAmount: procurementOrders.filter(o => o.department.id === '1').reduce((sum, o) => sum + o.totalBudget, 0),
    },
    {
      department: '销售部',
      orderCount: procurementOrders.filter(o => o.department.id === '2').length,
      totalAmount: procurementOrders.filter(o => o.department.id === '2').reduce((sum, o) => sum + o.totalBudget, 0),
    },
  ],
  byMonth: [
    {
      month: '2024-12',
      orderCount: procurementOrders.length,
      totalAmount: procurementOrders.reduce((sum, order) => sum + order.totalBudget, 0),
    },
  ],
  averageApprovalTime: 3, // 平均3天
  completionRate: 33.3, // 33.3%完成率
};

// 模拟团队数据 - 扩展包含绩效配置
const initialTeams: Team[] = [
  {
    id: '1',
    name: '前端开发团队',
    code: 'FE-TEAM-001',
    leader: users[1], // 李四
    description: '负责公司所有前端项目的开发和维护',
    teamType: 'functional',
    members: [users[1], users[6], users[7]], // 李四、周九、吴十
    establishedDate: '2024-01-15',
    status: 'active',
    objectives: '提升用户体验，优化前端性能，推进技术栈升级',
    location: '总部大厦2楼技术部',
    contactInfo: {
      email: 'frontend@company.com',
      phone: '010-12345678',
    },
    performanceConfigs: teamMemberPerformances.filter(p => p.teamId === '1'),
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: '后端开发团队',
    code: 'BE-TEAM-001',
    leader: users[4], // 钱七
    description: '负责后端服务架构设计和API开发',
    teamType: 'functional',
    members: [users[4], users[0]], // 钱七、张三
    establishedDate: '2024-01-15',
    status: 'active',
    objectives: '构建稳定可靠的后端服务，提升系统性能和安全性',
    location: '总部大厦2楼技术部',
    contactInfo: {
      email: 'backend@company.com',
      phone: '010-12345679',
    },
    performanceConfigs: teamMemberPerformances.filter(p => p.teamId === '2'),
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: '华北销售团队',
    code: 'SALES-NORTH-001',
    leader: users[5], // 孙八
    description: '负责华北地区的销售业务拓展',
    teamType: 'functional',
    members: [users[5], users[9], users[10]], // 孙八、陈十二、刘十三
    establishedDate: '2024-02-01',
    status: 'active',
    objectives: '扩大华北地区市场份额，提升客户满意度',
    location: '总部大厦3楼销售部',
    contactInfo: {
      email: 'sales-north@company.com',
      phone: '010-12345680',
    },
    performanceConfigs: teamMemberPerformances.filter(p => p.teamId === '3'),
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '4',
    name: '新产品研发团队',
    code: 'RD-PRODUCT-001',
    leader: users[0], // 张三
    description: '跨部门协作的新产品研发项目团队',
    teamType: 'cross_functional',
    members: [users[0], users[1], users[2], users[13]], // 张三、李四、王五、杨十六
    establishedDate: '2024-06-01',
    status: 'active',
    objectives: '完成新产品的设计、开发和市场推广',
    location: '研发中心',
    contactInfo: {
      email: 'newproduct@company.com',
      phone: '010-12345681',
    },
    performanceConfigs: teamMemberPerformances.filter(p => p.teamId === '4'),
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
];

// 获取团队成员绩效配置的辅助函数
const getTeamMemberPerformance = (teamId: string, memberId: string): TeamMemberPerformance | undefined => {
  return teamMemberPerformances.find(p => p.teamId === teamId && p.memberId === memberId && p.isActive);
};

// 更新团队成员绩效配置的辅助函数
const updateTeamMemberPerformance = (config: TeamMemberPerformance): void => {
  const index = teamMemberPerformances.findIndex(p => p.id === config.id);
  if (index !== -1) {
    teamMemberPerformances[index] = { ...config, updatedAt: new Date().toISOString() };
  } else {
    teamMemberPerformances.push(config);
  }
};

// 当前用户（模拟登录用户）
const currentUser = users[0];
