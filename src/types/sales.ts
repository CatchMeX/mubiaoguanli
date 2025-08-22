// 销售订单相关类型定义

// 销售订单主表
export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: string;
  deliveryDate?: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  shippingAddress?: string;
  notes?: string;
  createdById?: string;
  approvedById?: string;
  createdAt: string;
  updatedAt: string;
  
  // 关联字段
  customer?: Customer;
  createdBy?: User;
  approvedBy?: User;
  items?: SalesOrderItem[];
}

// 销售订单明细表
export interface SalesOrderItem {
  id: string;
  orderId: string;
  assetId: string;
  unitPrice: number;
  discountRate: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // 关联字段
  asset?: Asset;
  order?: SalesOrder;
}

// 销售订单详情（包含客户信息）
export interface SalesOrderDetail {
  id: string;
  orderNumber: string;
  orderDate: string;
  deliveryDate?: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  shippingAddress?: string;
  notes?: string;
  customerId: string;
  customerName: string;
  customerCode?: string;
  customerContact?: string;
  customerPhone?: string;
  createdByName?: string;
  approvedByName?: string;
  createdAt: string;
  updatedAt: string;
}

// 销售订单明细详情（包含资产信息）
export interface SalesOrderItemDetail {
  id: string;
  orderId: string;
  assetId: string;
  unitPrice: number;
  discountRate: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  totalAmount: number;
  notes?: string;
  assetCode: string;
  assetName: string;
  assetModel?: string;
  assetSpecification?: string;
  assetCategoryName?: string;
  assetBrandName?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建销售订单的表单数据
export interface CreateSalesOrderData {
  customerId: string;
  orderDate: string;
  deliveryDate?: string;
  shippingAddress?: string;
  notes?: string;
  items: CreateSalesOrderItemData[];
}

// 创建销售订单明细的表单数据
export interface CreateSalesOrderItemData {
  orderId?: string; // 可选，用于编辑时创建新明细
  assetId: string;
  unitPrice: number;
  discountRate?: number;
  taxRate?: number;
  notes?: string;
}

// 更新销售订单的表单数据
export interface UpdateSalesOrderData {
  customerId?: string;
  orderDate?: string;
  deliveryDate?: string;
  shippingAddress?: string;
  notes?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
}

// 销售订单统计
export interface SalesOrderStatistics {
  totalOrders: number;
  totalAmount: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  unpaidOrders: number;
  partialPaidOrders: number;
  paidOrders: number;
}

// 销售订单筛选条件
export interface SalesOrderFilters {
  search?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

// 导入相关类型
import type { Customer } from './revenue';
import type { Asset, User } from './index'; 