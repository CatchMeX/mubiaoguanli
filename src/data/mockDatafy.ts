// 费用管理模块的模拟数据
import { 
  ExpenseCategory, ExpenseSupplier, ExpenseRecord, ExpenseAttachment,
  ExpenseApprovalRecord, PaymentPlan, PaymentInstallment,
  ExpenseStatistics, ExpenseForecast, ExpenseAnalysisReport
} from '@/types/expense';

// 费用分类数据
export const expenseCategories: ExpenseCategory[] = [
  {
    id: '1',
    name: '办公费用',
    code: 'OFFICE',
    level: 1,
    description: '日常办公相关费用',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '11',
        name: '办公用品',
        code: 'SUPPLIES',
        level: 2,
        parentId: '1',
        description: '办公用品采购费用',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '111', name: '文具用品', code: 'STATIONERY', level: 3, parentId: '11', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '112', name: '打印耗材', code: 'PRINTING', level: 3, parentId: '11', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '113', name: '电脑设备', code: 'COMPUTER', level: 3, parentId: '11', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
      {
        id: '12',
        name: '办公租金',
        code: 'RENT',
        level: 2,
        parentId: '1',
        description: '办公场所租赁费用',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '121', name: '房租', code: 'OFFICE_RENT', level: 3, parentId: '12', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '122', name: '物业费', code: 'PROPERTY_FEE', level: 3, parentId: '12', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
    ]
  },
  {
    id: '2',
    name: '差旅费用',
    code: 'TRAVEL',
    level: 1,
    description: '员工出差相关费用',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '21',
        name: '交通费',
        code: 'TRANSPORT',
        level: 2,
        parentId: '2',
        description: '交通出行费用',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '211', name: '机票', code: 'FLIGHT', level: 3, parentId: '21', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '212', name: '火车票', code: 'TRAIN', level: 3, parentId: '21', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '213', name: '出租车', code: 'TAXI', level: 3, parentId: '21', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
      {
        id: '22',
        name: '住宿费',
        code: 'ACCOMMODATION',
        level: 2,
        parentId: '2',
        description: '住宿相关费用',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '221', name: '酒店费用', code: 'HOTEL', level: 3, parentId: '22', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
    ]
  },
  {
    id: '3',
    name: '营销费用',
    code: 'MARKETING',
    level: 1,
    description: '市场营销相关费用',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '31',
        name: '广告费',
        code: 'ADVERTISING',
        level: 2,
        parentId: '3',
        description: '广告投放费用',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
        children: [
          { id: '311', name: '线上广告', code: 'ONLINE_AD', level: 3, parentId: '31', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
          { id: '312', name: '线下广告', code: 'OFFLINE_AD', level: 3, parentId: '31', createdAt: '2024-01-01', updatedAt: '2024-12-01' },
        ]
      },
      {
        id: '32',
        name: '活动费用',
        code: 'EVENT',
        level: 2,
        parentId: '3',
        description: '市场活动费用',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
      },
    ]
  },
  {
    id: '4',
    name: '运营费用',
    code: 'OPERATION',
    level: 1,
    description: '日常运营费用',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    children: [
      {
        id: '41',
        name: '水电费',
        code: 'UTILITIES',
        level: 2,
        parentId: '4',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
      },
      {
        id: '42',
        name: '通讯费',
        code: 'COMMUNICATION',
        level: 2,
        parentId: '4',
        createdAt: '2024-01-01',
        updatedAt: '2024-12-01',
      },
    ]
  },
];

// 供应商数据
export const expenseSuppliers: ExpenseSupplier[] = [
  {
    id: '1',
    name: '北京办公用品有限公司',
    code: 'BJOFFICE001',
    contact: '张经理',
    phone: '010-12345678',
    email: 'zhang@bjoffice.com',
    address: '北京市朝阳区建国路88号',
    taxNumber: '91110000123456789X',
    bankAccount: '1234567890123456789',
    status: 'active',
    createdAt: '2023-01-15',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    name: '深圳科技设备公司',
    code: 'SZTECH001',
    contact: '李总监',
    phone: '0755-87654321',
    email: 'li@sztech.com',
    address: '深圳市南山区科技园南区',
    taxNumber: '91440300987654321A',
    bankAccount: '9876543210987654321',
    status: 'active',
    createdAt: '2023-03-20',
    updatedAt: '2024-11-25',
  },
  {
    id: '3',
    name: '上海广告传媒集团',
    code: 'SHMEDIA001',
    contact: '王部长',
    phone: '021-55667788',
    email: 'wang@shmedia.com',
    address: '上海市浦东新区陆家嘴金融区',
    taxNumber: '91310000456789123B',
    bankAccount: '4567891234567891234',
    status: 'active',
    createdAt: '2023-05-10',
    updatedAt: '2024-12-05',
  },
  {
    id: '4',
    name: '中国移动通信集团',
    code: 'CMCC001',
    contact: '赵经理',
    phone: '10086',
    email: 'zhao@cmcc.com',
    address: '北京市西城区金融大街29号',
    taxNumber: '91100000111222333C',
    bankAccount: '1112223334445556667',
    status: 'active',
    createdAt: '2023-02-28',
    updatedAt: '2024-11-30',
  },
  {
    id: '5',
    name: '杭州酒店管理公司',
    code: 'HZHOTEL001',
    contact: '孙主管',
    phone: '0571-88889999',
    email: 'sun@hzhotel.com',
    address: '杭州市西湖区文三路168号',
    taxNumber: '91330000777888999D',
    bankAccount: '7778889990001112223',
    status: 'active',
    createdAt: '2023-06-15',
    updatedAt: '2024-10-20',
  },
  {
    id: '6',
    name: '广州物业服务有限公司',
    code: 'GZPROP001',
    contact: '周经理',
    phone: '020-66778899',
    email: 'zhou@gzprop.com',
    address: '广州市天河区珠江新城',
    taxNumber: '91440100333444555E',
    bankAccount: '3334445556667778889',
    status: 'active',
    createdAt: '2023-08-01',
    updatedAt: '2024-12-01',
  },
];

// 费用附件数据
export const expenseAttachments: ExpenseAttachment[] = [
  {
    id: '1',
    expenseId: '1',
    name: '办公用品采购发票.pdf',
    type: 'invoice',
    url: '/attachments/expense/invoice_001.pdf',
    uploadedBy: { id: '2', name: '李四' },
    uploadedAt: '2024-12-01',
  },
  {
    id: '2',
    expenseId: '1',
    name: '采购合同.pdf',
    type: 'contract',
    url: '/attachments/expense/contract_001.pdf',
    uploadedBy: { id: '2', name: '李四' },
    uploadedAt: '2024-12-01',
  },
  {
    id: '3',
    expenseId: '2',
    name: '差旅报销单.jpg',
    type: 'receipt',
    url: '/attachments/expense/receipt_002.jpg',
    uploadedBy: { id: '3', name: '王五' },
    uploadedAt: '2024-11-25',
  },
  {
    id: '4',
    expenseId: '3',
    name: '广告投放审批单.pdf',
    type: 'approval',
    url: '/attachments/expense/approval_003.pdf',
    uploadedBy: { id: '5', name: '钱七' },
    uploadedAt: '2024-12-05',
  },
];

// 费用审批记录数据
export const expenseApprovalRecords: ExpenseApprovalRecord[] = [
  {
    id: '1',
    expenseId: '1',
    approver: { id: '1', name: '张三' },
    approvalLevel: 'department',
    action: 'approved',
    comment: '办公用品采购合理，同意报销',
    approvedAt: '2024-12-02',
    createdAt: '2024-12-01',
  },
  {
    id: '2',
    expenseId: '1',
    approver: { id: '4', name: '赵六' },
    approvalLevel: 'finance',
    action: 'approved',
    comment: '财务审核通过，可以付款',
    approvedAt: '2024-12-03',
    createdAt: '2024-12-02',
  },
  {
    id: '3',
    expenseId: '2',
    approver: { id: '2', name: '李四' },
    approvalLevel: 'department',
    action: 'pending',
    comment: '',
    createdAt: '2024-11-25',
  },
  {
    id: '4',
    expenseId: '3',
    approver: { id: '1', name: '张三' },
    approvalLevel: 'department',
    action: 'approved',
    comment: '广告投放效果良好，同意付款',
    approvedAt: '2024-12-06',
    createdAt: '2024-12-05',
  },
];

// 费用记录数据
export const expenseRecords: ExpenseRecord[] = [
  {
    id: '1',
    expenseNumber: 'EXP-2024-001',
    category: expenseCategories[0].children![0].children![0], // 文具用品
    supplier: expenseSuppliers[0], // 北京办公用品有限公司
    amount: 15000,
    taxAmount: 1950,
    netAmount: 13050,
    description: '采购办公文具用品，包括笔、纸张、文件夹等',
    expenseDate: '2024-12-01',
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '2024-12-01',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'partial',
    paidAmount: 10000,
    remainingAmount: 5000,
    dueDate: '2024-12-31',
    department: { id: '1', name: '行政部' },
    applicant: { id: '2', name: '李四' },
    project: { id: '1', name: '办公环境改善项目' },
    attachments: expenseAttachments.filter(a => a.expenseId === '1'),
    status: 'approved',
    approvalHistory: expenseApprovalRecords.filter(r => r.expenseId === '1'),
    urgency: 'medium',
    businessPurpose: '改善办公环境，提高工作效率',
    createdBy: { id: '2', name: '李四' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-03',
  },
  {
    id: '2',
    expenseNumber: 'EXP-2024-002',
    category: expenseCategories[1].children![0].children![0], // 机票
    amount: 3200,
    taxAmount: 416,
    netAmount: 2784,
    description: '北京-上海出差机票费用',
    expenseDate: '2024-11-25',
    invoiceNumber: 'TKT-2024-002',
    invoiceDate: '2024-11-25',
    paymentMethod: 'credit_card',
    paymentStatus: 'completed',
    paidAmount: 3200,
    remainingAmount: 0,
    dueDate: '2024-12-25',
    department: { id: '2', name: '销售部' },
    applicant: { id: '3', name: '王五' },
    attachments: expenseAttachments.filter(a => a.expenseId === '2'),
    status: 'paid',
    approvalHistory: expenseApprovalRecords.filter(r => r.expenseId === '2'),
    urgency: 'high',
    businessPurpose: '客户拜访，洽谈合作事宜',
    createdBy: { id: '3', name: '王五' },
    createdAt: '2024-11-25',
    updatedAt: '2024-11-26',
  },
  {
    id: '3',
    expenseNumber: 'EXP-2024-003',
    category: expenseCategories[2].children![0].children![0], // 线上广告
    supplier: expenseSuppliers[2], // 上海广告传媒集团
    amount: 50000,
    taxAmount: 6500,
    netAmount: 43500,
    description: '线上广告投放费用，包括百度、腾讯等平台',
    expenseDate: '2024-12-05',
    invoiceNumber: 'AD-2024-003',
    invoiceDate: '2024-12-05',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'pending',
    paidAmount: 0,
    remainingAmount: 50000,
    dueDate: '2025-01-05',
    department: { id: '3', name: '市场部' },
    applicant: { id: '5', name: '钱七' },
    project: { id: '2', name: '品牌推广项目' },
    attachments: expenseAttachments.filter(a => a.expenseId === '3'),
    status: 'approved',
    approvalHistory: expenseApprovalRecords.filter(r => r.expenseId === '3'),
    urgency: 'high',
    businessPurpose: '提升品牌知名度，扩大市场影响力',
    createdBy: { id: '5', name: '钱七' },
    createdAt: '2024-12-05',
    updatedAt: '2024-12-06',
  },
  {
    id: '4',
    expenseNumber: 'EXP-2024-004',
    category: expenseCategories[3].children![0], // 水电费
    supplier: expenseSuppliers[5], // 广州物业服务有限公司
    amount: 8000,
    taxAmount: 1040,
    netAmount: 6960,
    description: '办公室11月份水电费',
    expenseDate: '2024-11-30',
    invoiceNumber: 'UTIL-2024-004',
    invoiceDate: '2024-12-01',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'completed',
    paidAmount: 8000,
    remainingAmount: 0,
    dueDate: '2024-12-15',
    department: { id: '1', name: '行政部' },
    applicant: { id: '6', name: '孙八' },
    attachments: [],
    status: 'paid',
    approvalHistory: [],
    urgency: 'medium',
    businessPurpose: '维持办公室正常运营',
    createdBy: { id: '6', name: '孙八' },
    createdAt: '2024-11-30',
    updatedAt: '2024-12-01',
  },
  {
    id: '5',
    expenseNumber: 'EXP-2024-005',
    category: expenseCategories[0].children![0].children![2], // 电脑设备
    supplier: expenseSuppliers[1], // 深圳科技设备公司
    amount: 25000,
    taxAmount: 3250,
    netAmount: 21750,
    description: '采购员工办公电脑5台',
    expenseDate: '2024-12-10',
    invoiceNumber: 'COMP-2024-005',
    invoiceDate: '2024-12-10',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'pending',
    paidAmount: 0,
    remainingAmount: 25000,
    dueDate: '2024-12-31',
    department: { id: '4', name: '技术部' },
    applicant: { id: '7', name: '周九' },
    project: { id: '3', name: '技术团队扩建项目' },
    attachments: [],
    status: 'submitted',
    approvalHistory: [],
    urgency: 'high',
    businessPurpose: '支持技术团队扩建，提升开发效率',
    createdBy: { id: '7', name: '周九' },
    createdAt: '2024-12-10',
    updatedAt: '2024-12-10',
  },
  {
    id: '6',
    expenseNumber: 'EXP-2024-006',
    category: expenseCategories[3].children![1], // 通讯费
    supplier: expenseSuppliers[3], // 中国移动通信集团
    amount: 2400,
    taxAmount: 312,
    netAmount: 2088,
    description: '公司手机通讯费用12月份',
    expenseDate: '2024-12-01',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'overdue',
    paidAmount: 0,
    remainingAmount: 2400,
    dueDate: '2024-11-30',
    department: { id: '1', name: '行政部' },
    applicant: { id: '8', name: '吴十' },
    attachments: [],
    status: 'draft',
    approvalHistory: [],
    urgency: 'low',
    businessPurpose: '维持公司通讯服务正常运行',
    createdBy: { id: '8', name: '吴十' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-01',
  },
];

// 付款分期数据
export const paymentInstallments: PaymentInstallment[] = [
  {
    id: '1',
    planId: '1',
    installmentNumber: 1,
    amount: 10000,
    dueDate: '2024-12-15',
    paidAmount: 10000,
    paidDate: '2024-12-10',
    status: 'completed',
    notes: '首期款已付',
  },
  {
    id: '2',
    planId: '1',
    installmentNumber: 2,
    amount: 5000,
    dueDate: '2024-12-31',
    paidAmount: 0,
    status: 'pending',
    notes: '尾款待付',
  },
  {
    id: '3',
    planId: '2',
    installmentNumber: 1,
    amount: 25000,
    dueDate: '2024-12-20',
    paidAmount: 0,
    status: 'pending',
    notes: '设备采购款待付',
  },
];

// 付款计划数据
export const paymentPlans: PaymentPlan[] = [
  {
    id: '1',
    expenseRecord: expenseRecords[0], // 办公用品采购
    planNumber: 'PAY-EXP-2024-001',
    totalAmount: 15000,
    installments: paymentInstallments.filter(i => i.planId === '1'),
    status: 'active',
    createdBy: { id: '2', name: '李四' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-10',
  },
  {
    id: '2',
    expenseRecord: expenseRecords[4], // 电脑设备采购
    planNumber: 'PAY-EXP-2024-002',
    totalAmount: 25000,
    installments: paymentInstallments.filter(i => i.planId === '2'),
    status: 'active',
    createdBy: { id: '7', name: '周九' },
    createdAt: '2024-12-10',
    updatedAt: '2024-12-10',
  },
];

// 费用统计数据
export const expenseStatistics: ExpenseStatistics = {
  totalExpense: expenseRecords.reduce((sum, record) => sum + record.amount, 0),
  totalPaid: expenseRecords.reduce((sum, record) => sum + record.paidAmount, 0),
  totalPending: expenseRecords.reduce((sum, record) => sum + record.remainingAmount, 0),
  totalOverdue: expenseRecords.filter(r => r.paymentStatus === 'overdue').reduce((sum, record) => sum + record.remainingAmount, 0),
  byCategory: [
    {
      category: '办公费用',
      amount: expenseRecords.filter(r => r.category.parentId === '1' || r.category.id === '1').reduce((sum, r) => sum + r.amount, 0),
      percentage: 38.5,
    },
    {
      category: '营销费用',
      amount: expenseRecords.filter(r => r.category.parentId === '3' || r.category.id === '3').reduce((sum, r) => sum + r.amount, 0),
      percentage: 48.1,
    },
    {
      category: '差旅费用',
      amount: expenseRecords.filter(r => r.category.parentId === '2' || r.category.id === '2').reduce((sum, r) => sum + r.amount, 0),
      percentage: 3.1,
    },
    {
      category: '运营费用',
      amount: expenseRecords.filter(r => r.category.parentId === '4' || r.category.id === '4').reduce((sum, r) => sum + r.amount, 0),
      percentage: 10.0,
    },
  ],
  bySupplier: [
    {
      supplier: '上海广告传媒集团',
      amount: 50000,
      percentage: 48.1,
    },
    {
      supplier: '深圳科技设备公司',
      amount: 25000,
      percentage: 24.0,
    },
    {
      supplier: '北京办公用品有限公司',
      amount: 15000,
      percentage: 14.4,
    },
    {
      supplier: '广州物业服务有限公司',
      amount: 8000,
      percentage: 7.7,
    },
    {
      supplier: '中国移动通信集团',
      amount: 2400,
      percentage: 2.3,
    },
  ],
  byDepartment: [
    {
      department: '市场部',
      amount: expenseRecords.filter(r => r.department.id === '3').reduce((sum, r) => sum + r.amount, 0),
      percentage: 48.1,
    },
    {
      department: '技术部',
      amount: expenseRecords.filter(r => r.department.id === '4').reduce((sum, r) => sum + r.amount, 0),
      percentage: 24.0,
    },
    {
      department: '行政部',
      amount: expenseRecords.filter(r => r.department.id === '1').reduce((sum, r) => sum + r.amount, 0),
      percentage: 24.5,
    },
    {
      department: '销售部',
      amount: expenseRecords.filter(r => r.department.id === '2').reduce((sum, r) => sum + r.amount, 0),
      percentage: 3.1,
    },
  ],
  byMonth: [
    {
      month: '2024-10',
      expense: 0,
      paid: 0,
      pending: 0,
    },
    {
      month: '2024-11',
      expense: 13600,
      paid: 11200,
      pending: 2400,
    },
    {
      month: '2024-12',
      expense: 90000,
      paid: 10000,
      pending: 80000,
    },
  ],
  paymentStatusDistribution: {
    pending: expenseRecords.filter(r => r.paymentStatus === 'pending').length,
    partial: expenseRecords.filter(r => r.paymentStatus === 'partial').length,
    completed: expenseRecords.filter(r => r.paymentStatus === 'completed').length,
    overdue: expenseRecords.filter(r => r.paymentStatus === 'overdue').length,
  },
  topSuppliers: [
    {
      supplier: expenseSuppliers[2], // 上海广告传媒集团
      totalAmount: 50000,
      transactionCount: 1,
    },
    {
      supplier: expenseSuppliers[1], // 深圳科技设备公司
      totalAmount: 25000,
      transactionCount: 1,
    },
    {
      supplier: expenseSuppliers[0], // 北京办公用品有限公司
      totalAmount: 15000,
      transactionCount: 1,
    },
  ],
};

// 费用预测数据
export const expenseForecasts: ExpenseForecast[] = [
  {
    id: '1',
    period: '2025-01',
    forecastAmount: 80000,
    confidence: 'high',
    basis: '基于历史数据和预算计划预测',
    createdBy: { id: '1', name: '张三' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    period: '2025-02',
    forecastAmount: 75000,
    confidence: 'medium',
    basis: '基于季度预算和业务计划预测',
    createdBy: { id: '1', name: '张三' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '3',
    period: '2025-03',
    forecastAmount: 90000,
    confidence: 'medium',
    basis: '预计春季营销活动增加费用支出',
    createdBy: { id: '1', name: '张三' },
    createdAt: '2024-12-01',
    updatedAt: '2024-12-01',
  },
];

// 费用分析报告数据
export const expenseAnalysisReports: ExpenseAnalysisReport[] = [
  {
    id: '1',
    reportName: '2024年第四季度费用分析报告',
    reportType: 'quarterly',
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    summary: {
      totalExpense: 103600,
      totalPaid: 21200,
      paymentRate: 20.5,
      averagePaymentDays: 15,
      supplierCount: 6,
      newSupplierCount: 1,
    },
    trends: [
      {
        period: '2024-10',
        expense: 0,
        growth: 0,
      },
      {
        period: '2024-11',
        expense: 13600,
        growth: 100,
      },
      {
        period: '2024-12',
        expense: 90000,
        growth: 561.8,
      },
    ],
    topPerformers: {
      suppliers: [
        {
          supplier: expenseSuppliers[2], // 上海广告传媒集团
          amount: 50000,
        },
        {
          supplier: expenseSuppliers[1], // 深圳科技设备公司
          amount: 25000,
        },
        {
          supplier: expenseSuppliers[0], // 北京办公用品有限公司
          amount: 15000,
        },
      ],
      categories: [
        {
          category: expenseCategories[2], // 营销费用
          amount: 50000,
        },
        {
          category: expenseCategories[0], // 办公费用
          amount: 40000,
        },
      ],
      departments: [
        {
          department: '市场部',
          amount: 50000,
        },
        {
          department: '技术部',
          amount: 25000,
        },
        {
          department: '行政部',
          amount: 25400,
        },
      ],
    },
    risks: [
      {
        type: 'overdue',
        description: '通讯费用已逾期，需及时处理',
        severity: 'medium',
        recommendation: '联系供应商协商付款计划，避免服务中断',
      },
      {
        type: 'concentration',
        description: '营销费用占比过高，需要控制预算',
        severity: 'medium',
        recommendation: '制定更详细的营销预算计划，分阶段投入',
      },
      {
        type: 'budget_overrun',
        description: '12月份费用支出超出预算',
        severity: 'high',
        recommendation: '审查费用审批流程，加强预算控制',
      },
    ],
    generatedBy: { id: '1', name: '张三' },
    generatedAt: '2024-12-15',
  },
];
