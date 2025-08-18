import type { ExpenseSupplier } from '@/types/expense';

// 统一的供应商数据 - 从客户供应商模块导入
export const unifiedSuppliers: ExpenseSupplier[] = [
  {
    id: '1',
    name: '北京科技有限公司',
    code: 'SUPP-2024-001',
    type: 'goods',
    industry: '信息技术',
    contact: '张经理',
    phone: '010-12345678',
    email: 'zhang@bjtech.com',
    address: '北京市海淀区中关村大街1号',
    creditLevel: 'A',
    status: 'active',
    registrationDate: '2024-01-15',
    description: '专业的IT设备供应商',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: '上海办公用品公司',
    code: 'SUPP-2024-002',
    type: 'goods',
    industry: '办公用品',
    contact: '李主管',
    phone: '021-87654321',
    email: 'li@shoffice.com',
    address: '上海市浦东新区陆家嘴金融区',
    creditLevel: 'B',
    status: 'active',
    registrationDate: '2024-02-01',
    description: '办公用品一站式采购',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: '广州清洁服务公司',
    code: 'SUPP-2024-003',
    type: 'service',
    industry: '清洁服务',
    contact: '王总监',
    phone: '020-11223344',
    email: 'wang@gzclean.com',
    address: '广州市天河区珠江新城',
    creditLevel: 'A',
    status: 'active',
    registrationDate: '2024-01-20',
    description: '专业的清洁服务提供商',
    createdAt: '2024-01-20T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '4',
    name: '深圳物流运输公司',
    code: 'SUPP-2024-004',
    type: 'service',
    industry: '物流运输',
    contact: '陈经理',
    phone: '0755-99887766',
    email: 'chen@szlogistics.com',
    address: '深圳市南山区科技园',
    creditLevel: 'B',
    status: 'active',
    registrationDate: '2024-03-01',
    description: '全国物流运输服务',
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '5',
    name: '杭州家具制造厂',
    code: 'SUPP-2024-005',
    type: 'goods',
    industry: '家具制造',
    contact: '刘厂长',
    phone: '0571-55443322',
    email: 'liu@hzfurniture.com',
    address: '杭州市余杭区经济开发区',
    creditLevel: 'A',
    status: 'active',
    registrationDate: '2024-02-15',
    description: '办公家具定制生产',
    createdAt: '2024-02-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '6',
    name: '成都维修服务中心',
    code: 'SUPP-2024-006',
    type: 'service',
    industry: '设备维修',
    contact: '赵师傅',
    phone: '028-66778899',
    email: 'zhao@cdrepair.com',
    address: '成都市锦江区春熙路',
    creditLevel: 'B',
    status: 'active',
    registrationDate: '2024-04-01',
    description: '专业设备维修保养',
    createdAt: '2024-04-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '7',
    name: '西安电子设备公司',
    code: 'SUPP-2024-007',
    type: 'goods',
    industry: '电子设备',
    contact: '孙总',
    phone: '029-33445566',
    email: 'sun@xaelectronics.com',
    address: '西安市高新区软件园',
    creditLevel: 'A',
    status: 'active',
    registrationDate: '2024-03-15',
    description: '电子设备批发零售',
    createdAt: '2024-03-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '8',
    name: '武汉咨询服务公司',
    code: 'SUPP-2024-008',
    type: 'service',
    industry: '管理咨询',
    contact: '周顾问',
    phone: '027-77889900',
    email: 'zhou@whconsulting.com',
    address: '武汉市江汉区中央商务区',
    creditLevel: 'A',
    status: 'active',
    registrationDate: '2024-05-01',
    description: '企业管理咨询服务',
    createdAt: '2024-05-01T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z',
  },
];

// 获取供应商信息
export const getSupplierById = (id: string): ExpenseSupplier | undefined => {
  return unifiedSuppliers.find(supplier => supplier.id === id);
};

// 获取所有供应商
export const getAllSuppliers = (): ExpenseSupplier[] => {
  return unifiedSuppliers;
};

// 获取活跃供应商
export const getActiveSuppliers = (): ExpenseSupplier[] => {
  return unifiedSuppliers.filter(supplier => supplier.status === 'active');
};

// 按类型获取供应商
export const getSuppliersByType = (type: 'goods' | 'service' | 'both'): ExpenseSupplier[] => {
  return unifiedSuppliers.filter(supplier => supplier.type === type);
};
