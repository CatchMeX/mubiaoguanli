// 收入管理模块的模拟数据
import { 
  RevenueCategory, Customer, RevenueRecord, RevenueAttachment,
  RevenueApprovalRecord, PaymentPlan, PaymentInstallment,
  RevenueStatistics, RevenueForecast, RevenueAnalysisReport
} from '@/types/revenue';

// 收入分类数据
export const revenueCategories: RevenueCategory[] = [
  {
    id: '1',
    name: '产品销售收入',
    code: 'PRODUCT',
    level: 1,
    description: '产品销售产生的收入',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '11',
        name: '软件产品',
        code: 'SOFTWARE',
        level: 2,
        parentId: '1',
        description: '软件产品销售收入',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '111', name: '企业管理软件', code: 'ERP', level: 3, parentId: '11', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '112', name: '财务管理软件', code: 'FMS', level: 3, parentId: '11', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '113', name: '客户关系管理', code: 'CRM', level: 3, parentId: '11', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
      {
        id: '12',
        name: '硬件产品',
        code: 'HARDWARE',
        level: 2,
        parentId: '1',
        description: '硬件产品销售收入',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '121', name: '服务器设备', code: 'SERVER', level: 3, parentId: '12', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '122', name: '网络设备', code: 'NETWORK', level: 3, parentId: '12', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
    ]
  },
  {
    id: '2',
    name: '服务收入',
    code: 'SERVICE',
    level: 1,
    description: '提供服务产生的收入',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '21',
        name: '技术服务',
        code: 'TECH_SERVICE',
        level: 2,
        parentId: '2',
        description: '技术服务收入',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '211', name: '系统集成', code: 'INTEGRATION', level: 3, parentId: '21', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '212', name: '技术咨询', code: 'CONSULTING', level: 3, parentId: '21', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '213', name: '运维服务', code: 'MAINTENANCE', level: 3, parentId: '21', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
      {
        id: '22',
        name: '培训服务',
        code: 'TRAINING',
        level: 2,
        parentId: '2',
        description: '培训服务收入',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '221', name: '企业培训', code: 'CORP_TRAINING', level: 3, parentId: '22', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '222', name: '在线培训', code: 'ONLINE_TRAINING', level: 3, parentId: '22', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
    ]
  },
  {
    id: '3',
    name: '授权许可收入',
    code: 'LICENSE',
    level: 1,
    description: '软件授权许可收入',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '31',
        name: '软件授权',
        code: 'SOFTWARE_LICENSE',
        level: 2,
        parentId: '3',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
      },
    ]
  },
];

// 客户数据
export const customers: Customer[] = [
  {
    id: '1',
    name: '华为技术有限公司',
    code: 'HUAWEI001',
    type: 'enterprise',
    industry: '通信设备',
    contact: '张经理',
    phone: '0755-28780808',
    email: 'zhang@huawei.com',
    address: '深圳市龙岗区坂田华为基地',
    creditLevel: 'A',
    status: 'active',
    registrationDate: '2023-01-15',
    lastTransactionDate: '2024-12-10',
    totalRevenue: 2500000,
    createdAt: '2023-01-15',
    updatedAt: '2024-12-10',
  },
  {
    id: '2',
    name: '腾讯科技（深圳）有限公司',
    code: 'TENCENT001',
    type: 'enterprise',
    industry: '互联网',
    contact: '李总监',
    phone: '0755-86013388',
    email: 'li@tencent.com',
    address: '深圳市南山区科技中一路腾讯大厦',
    creditLevel: 'A',
    status: 'active',
    registrationDate: '2023-03-20',
    lastTransactionDate: '2024-11-25',
    totalRevenue: 1800000,
    createdAt: '2023-03-20',
    updatedAt: '2024-11-25',
  },
  {
    id: '3',
    name: '阿里巴巴集团',
    code: 'ALIBABA001',
    type: 'enterprise',
    industry: '电子商务',
    contact: '王部长',
    phone: '0571-85022088',
    email: 'wang@alibaba.com',
    address: '杭州市余杭区文一西路969号',
    creditLevel: 'A',
    status: 'active',
    registrationDate: '2023-05-10',
    lastTransactionDate: '2024-12-05',
    totalRevenue: 3200000,
    createdAt: '2023-05-10',
    updatedAt: '2024-12-05',
  },
  {
    id: '4',
    name: '中国银行股份有限公司',
    code: 'BOC001',
    type: 'enterprise',
    industry: '金融服务',
    contact: '赵行长',
    phone: '010-66596688',
    email: 'zhao@boc.cn',
    address: '北京市西城区复兴门内大街1号',
    creditLevel: 'A',
    status: 'active',
    registrationDate: '2023-02-28',
    lastTransactionDate: '2024-11-30',
    totalRevenue: 1500000,
    createdAt: '2023-02-28',
    updatedAt: '2024-11-30',
  },
  {
    id: '5',
    name: '北京市政府信息化办公室',
    code: 'BJGOV001',
    type: 'government',
    industry: '政府机构',
    contact: '孙主任',
    phone: '010-12345678',
    email: 'sun@beijing.gov.cn',
    address: '北京市东城区正义路2号',
    creditLevel: 'A',
    status: 'active',
    registrationDate: '2023-06-15',
    lastTransactionDate: '2024-10-20',
    totalRevenue: 800000,
    createdAt: '2023-06-15',
    updatedAt: '2024-10-20',
  },
  {
    id: '6',
    name: '小米科技有限责任公司',
    code: 'XIAOMI001',
    type: 'enterprise',
    industry: '消费电子',
    contact: '周经理',
    phone: '010-56268888',
    email: 'zhou@xiaomi.com',
    address: '北京市海淀区清河中街68号',
    creditLevel: 'B',
    status: 'active',
    registrationDate: '2023-08-01',
    lastTransactionDate: '2024-12-01',
    totalRevenue: 950000,
    createdAt: '2023-08-01',
    updatedAt: '2024-12-01',
  },
];

// 收入附件数据
export const revenueAttachments: RevenueAttachment[] = [
  {
    id: '1',
    revenueId: '1',
    name: '销售合同.pdf',
    type: 'contract',
    url: '/attachments/revenue/contract_001.pdf',
    uploadedBy: { id: '2', name: '李四' },
    uploadedAt: '2024-12-01',
  },
  {
    id: '2',
    revenueId: '1',
    name: '发票.pdf',
    type: 'invoice',
    url: '/attachments/revenue/invoice_001.pdf',
    uploadedBy: { id: '2', name: '李四' },
    uploadedAt: '2024-12-02',
  },
  {
    id: '3',
    revenueId: '2',
    name: '收款凭证.jpg',
    type: 'receipt',
    url: '/attachments/revenue/receipt_002.jpg',
    uploadedBy: { id: '3', name: '王五' },
    uploadedAt: '2024-11-25',
  },
];

// 收入审批记录数据
export const revenueApprovalRecords: RevenueApprovalRecord[] = [
  {
    id: '1',
    revenueId: '1',
    approver: { id: '1', name: '张三' },
    approvalLevel: 'department',
    action: 'approved',
    comment: '销售合同审核通过，金额合理',
    approvedAt: '2024-12-02',
    createdAt: '2024-12-01',
  },
  {
    id: '2',
    revenueId: '1',
    approver: { id: '4', name: '赵六' },
    approvalLevel: 'finance',
    action: 'approved',
    comment: '财务审核通过，可以确认收入',
    approvedAt: '2024-12-03',
    createdAt: '2024-12-02',
  },
  {
    id: '3',
    revenueId: '2',
    approver: { id: '2', name: '李四' },
    approvalLevel: 'department',
    action: 'pending',
    comment: '',
    createdAt: '2024-11-25',
  },
];

// 收入记录数据
export const revenueRecords: RevenueRecord[] = [
  {
    id: '1',
    recordNumber: 'REV-2024-001',
    customer: customers[0], // 华为
    category: revenueCategories[0].children![0].children![0], // 企业管理软件
    project: { id: '1', name: '华为ERP系统项目' },
    amount: 500000,
    taxAmount: 65000,
    netAmount: 435000,
    description: '华为ERP系统销售收入',
    revenueDate: '2024-12-01',
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '2024-12-02',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'partial',
    receivedAmount: 300000,
    remainingAmount: 200000,
    dueDate: '2024-12-31',
    department: { id: '2', name: '销售部' },
    salesperson: { id: '3', name: '王五' },
    attachments: revenueAttachments.filter(a => a.revenueId === '1'),
    status: 'confirmed',
    approvalHistory: revenueApprovalRecords.filter(r => r.revenueId === '1'),
    createdBy: { id: '2', name: '李四' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-03',
  },
  {
    id: '2',
    recordNumber: 'REV-2024-002',
    customer: customers[1], // 腾讯
    category: revenueCategories[1].children![0].children![0], // 系统集成
    project: { id: '2', name: '腾讯系统集成项目' },
    amount: 300000,
    taxAmount: 39000,
    netAmount: 261000,
    description: '腾讯系统集成服务收入',
    revenueDate: '2024-11-25',
    invoiceNumber: 'INV-2024-002',
    invoiceDate: '2024-11-26',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'completed',
    receivedAmount: 300000,
    remainingAmount: 0,
    dueDate: '2024-12-25',
    department: { id: '1', name: '技术部' },
    salesperson: { id: '1', name: '张三' },
    attachments: revenueAttachments.filter(a => a.revenueId === '2'),
    status: 'invoiced',
    approvalHistory: revenueApprovalRecords.filter(r => r.revenueId === '2'),
    createdBy: { id: '1', name: '张三' },
    createdAt: '2024-11-25',
    updatedAt: '2024-11-26',
  },
  {
    id: '3',
    recordNumber: 'REV-2024-003',
    customer: customers[2], // 阿里巴巴
    category: revenueCategories[0].children![0].children![2], // 客户关系管理
    project: { id: '3', name: '阿里巴巴CRM系统项目' },
    amount: 800000,
    taxAmount: 104000,
    netAmount: 696000,
    description: '阿里巴巴CRM系统销售收入',
    revenueDate: '2024-12-05',
    invoiceNumber: 'INV-2024-003',
    invoiceDate: '2024-12-06',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'pending',
    receivedAmount: 0,
    remainingAmount: 800000,
    dueDate: '2025-01-05',
    department: { id: '2', name: '销售部' },
    salesperson: { id: '3', name: '王五' },
    attachments: [],
    status: 'confirmed',
    approvalHistory: [],
    createdBy: { id: '3', name: '王五' },
    createdAt: '2024-12-05',
    updatedAt: '2024-12-06',
  },
  {
    id: '4',
    recordNumber: 'REV-2024-004',
    customer: customers[3], // 中国银行
    category: revenueCategories[0].children![0].children![1], // 财务管理软件
    project: { id: '4', name: '中行财务系统项目' },
    amount: 600000,
    taxAmount: 78000,
    netAmount: 522000,
    description: '中国银行财务管理软件销售收入',
    revenueDate: '2024-11-30',
    invoiceNumber: 'INV-2024-004',
    invoiceDate: '2024-12-01',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'partial',
    receivedAmount: 200000,
    remainingAmount: 400000,
    dueDate: '2024-12-30',
    department: { id: '2', name: '销售部' },
    salesperson: { id: '5', name: '钱七' },
    attachments: [],
    status: 'invoiced',
    approvalHistory: [],
    createdBy: { id: '5', name: '钱七' },
    createdAt: '2024-11-30',
    updatedAt: '2024-12-01',
  },
  {
    id: '5',
    recordNumber: 'REV-2024-005',
    customer: customers[4], // 北京市政府
    category: revenueCategories[1].children![0].children![1], // 技术咨询
    amount: 200000,
    taxAmount: 26000,
    netAmount: 174000,
    description: '北京市政府信息化咨询服务收入',
    revenueDate: '2024-10-20',
    invoiceNumber: 'INV-2024-005',
    invoiceDate: '2024-10-21',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'completed',
    receivedAmount: 200000,
    remainingAmount: 0,
    dueDate: '2024-11-20',
    department: { id: '1', name: '技术部' },
    salesperson: { id: '1', name: '张三' },
    attachments: [],
    status: 'invoiced',
    approvalHistory: [],
    createdBy: { id: '1', name: '张三' },
    createdAt: '2024-10-20',
    updatedAt: '2024-10-21',
  },
  {
    id: '6',
    recordNumber: 'REV-2024-006',
    customer: customers[5], // 小米
    category: revenueCategories[1].children![1].children![0], // 企业培训
    amount: 150000,
    taxAmount: 19500,
    netAmount: 130500,
    description: '小米企业培训服务收入',
    revenueDate: '2024-12-01',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'overdue',
    receivedAmount: 0,
    remainingAmount: 150000,
    dueDate: '2024-11-30',
    department: { id: '5', name: '市场部' },
    salesperson: { id: '14', name: '杨十六' },
    attachments: [],
    status: 'draft',
    approvalHistory: [],
    createdBy: { id: '14', name: '杨十六' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-01',
  },
];

// 收款分期数据
export const paymentInstallments: PaymentInstallment[] = [
  {
    id: '1',
    planId: '1',
    installmentNumber: 1,
    amount: 300000,
    dueDate: '2024-12-15',
    receivedAmount: 300000,
    receivedDate: '2024-12-10',
    status: 'completed',
    notes: '首期款已收到',
  },
  {
    id: '2',
    planId: '1',
    installmentNumber: 2,
    amount: 200000,
    dueDate: '2024-12-31',
    receivedAmount: 0,
    status: 'pending',
    notes: '尾款待收',
  },
  {
    id: '3',
    planId: '2',
    installmentNumber: 1,
    amount: 200000,
    dueDate: '2024-12-20',
    receivedAmount: 200000,
    receivedDate: '2024-12-18',
    status: 'completed',
    notes: '首期款已收到',
  },
  {
    id: '4',
    planId: '2',
    installmentNumber: 2,
    amount: 200000,
    dueDate: '2025-01-20',
    receivedAmount: 0,
    status: 'pending',
    notes: '第二期款待收',
  },
  {
    id: '5',
    planId: '2',
    installmentNumber: 3,
    amount: 200000,
    dueDate: '2025-02-20',
    receivedAmount: 0,
    status: 'pending',
    notes: '尾款待收',
  },
];

// 收款计划数据
export const paymentPlans: PaymentPlan[] = [
  {
    id: '1',
    revenueRecord: revenueRecords[0], // 华为ERP项目
    planNumber: 'PAY-2024-001',
    totalAmount: 500000,
    installments: paymentInstallments.filter(i => i.planId === '1'),
    status: 'active',
    createdBy: { id: '2', name: '李四' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-10',
  },
  {
    id: '2',
    revenueRecord: revenueRecords[3], // 中行财务系统项目
    planNumber: 'PAY-2024-002',
    totalAmount: 600000,
    installments: paymentInstallments.filter(i => i.planId === '2'),
    status: 'active',
    createdBy: { id: '5', name: '钱七' },
    createdAt: '2024-11-30',
    updatedAt: '2024-12-18',
  },
];

// 收入统计数据
export const revenueStatistics: RevenueStatistics = {
  totalRevenue: revenueRecords.reduce((sum, record) => sum + record.amount, 0),
  totalReceived: revenueRecords.reduce((sum, record) => sum + record.receivedAmount, 0),
  totalPending: revenueRecords.reduce((sum, record) => sum + record.remainingAmount, 0),
  totalOverdue: revenueRecords.filter(r => r.paymentStatus === 'overdue').reduce((sum, record) => sum + record.remainingAmount, 0),
  byCategory: [
    {
      category: '产品销售收入',
      amount: revenueRecords.filter(r => r.category.parentId === '1' || r.category.id === '1').reduce((sum, r) => sum + r.amount, 0),
      percentage: 75.2,
    },
    {
      category: '服务收入',
      amount: revenueRecords.filter(r => r.category.parentId === '2' || r.category.id === '2').reduce((sum, r) => sum + r.amount, 0),
      percentage: 24.8,
    },
  ],
  byCustomer: [
    {
      customer: '阿里巴巴集团',
      amount: 800000,
      percentage: 30.8,
    },
    {
      customer: '中国银行股份有限公司',
      amount: 600000,
      percentage: 23.1,
    },
    {
      customer: '华为技术有限公司',
      amount: 500000,
      percentage: 19.2,
    },
    {
      customer: '腾讯科技（深圳）有限公司',
      amount: 300000,
      percentage: 11.5,
    },
    {
      customer: '北京市政府信息化办公室',
      amount: 200000,
      percentage: 7.7,
    },
  ],
  byDepartment: [
    {
      department: '销售部',
      amount: revenueRecords.filter(r => r.department.id === '2').reduce((sum, r) => sum + r.amount, 0),
      percentage: 73.1,
    },
    {
      department: '技术部',
      amount: revenueRecords.filter(r => r.department.id === '1').reduce((sum, r) => sum + r.amount, 0),
      percentage: 19.2,
    },
    {
      department: '市场部',
      amount: revenueRecords.filter(r => r.department.id === '5').reduce((sum, r) => sum + r.amount, 0),
      percentage: 5.8,
    },
  ],
  byMonth: [
    {
      month: '2024-10',
      revenue: 200000,
      received: 200000,
      pending: 0,
    },
    {
      month: '2024-11',
      revenue: 900000,
      received: 500000,
      pending: 400000,
    },
    {
      month: '2024-12',
      revenue: 1450000,
      received: 300000,
      pending: 1150000,
    },
  ],
  paymentStatusDistribution: {
    pending: revenueRecords.filter(r => r.paymentStatus === 'pending').length,
    partial: revenueRecords.filter(r => r.paymentStatus === 'partial').length,
    completed: revenueRecords.filter(r => r.paymentStatus === 'completed').length,
    overdue: revenueRecords.filter(r => r.paymentStatus === 'overdue').length,
  },
  topCustomers: [
    {
      customer: customers[2], // 阿里巴巴
      totalAmount: 800000,
      transactionCount: 1,
    },
    {
      customer: customers[3], // 中国银行
      totalAmount: 600000,
      transactionCount: 1,
    },
    {
      customer: customers[0], // 华为
      totalAmount: 500000,
      transactionCount: 1,
    },
  ],
};

// 收入预测数据
export const revenueForecasts: RevenueForecast[] = [
  {
    id: '1',
    period: '2025-01',
    forecastAmount: 1200000,
    confidence: 'high',
    basis: '基于历史数据和已签合同预测',
    createdBy: { id: '1', name: '张三' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    period: '2025-02',
    forecastAmount: 1000000,
    confidence: 'medium',
    basis: '基于销售漏斗和市场趋势预测',
    createdBy: { id: '1', name: '张三' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '3',
    period: '2025-03',
    forecastAmount: 1500000,
    confidence: 'medium',
    basis: '预计新产品发布带来的收入增长',
    createdBy: { id: '1', name: '张三' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-01',
  },
];

// 收入分析报告数据
export const revenueAnalysisReports: RevenueAnalysisReport[] = [
  {
    id: '1',
    reportName: '2024年第四季度收入分析报告',
    reportType: 'quarterly',
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    summary: {
      totalRevenue: 2550000,
      totalReceived: 1000000,
      collectionRate: 39.2,
      averageCollectionDays: 25,
      customerCount: 6,
      newCustomerCount: 2,
    },
    trends: [
      {
        period: '2024-10',
        revenue: 200000,
        growth: 0,
      },
      {
        period: '2024-11',
        revenue: 900000,
        growth: 350,
      },
      {
        period: '2024-12',
        revenue: 1450000,
        growth: 61.1,
      },
    ],
    topPerformers: {
      customers: [
        {
          customer: customers[2], // 阿里巴巴
          amount: 800000,
        },
        {
          customer: customers[3], // 中国银行
          amount: 600000,
        },
        {
          customer: customers[0], // 华为
          amount: 500000,
        },
      ],
      categories: [
        {
          category: revenueCategories[0], // 产品销售收入
          amount: 1900000,
        },
        {
          category: revenueCategories[1], // 服务收入
          amount: 650000,
        },
      ],
      salespeople: [
        {
          salesperson: { id: '3', name: '王五' },
          amount: 1300000,
        },
        {
          salesperson: { id: '1', name: '张三' },
          amount: 500000,
        },
        {
          salesperson: { id: '5', name: '钱七' },
          amount: 600000,
        },
      ],
    },
    risks: [
      {
        type: 'overdue',
        description: '小米培训项目款项已逾期',
        severity: 'medium',
        recommendation: '及时跟进催收，必要时采取法律手段',
      },
      {
        type: 'concentration',
        description: '前三大客户收入占比过高，存在客户集中风险',
        severity: 'medium',
        recommendation: '加强新客户开发，分散客户风险',
      },
    ],
    generatedBy: { id: '1', name: '张三' },
    generatedAt: '2024-12-15',
  },
];
