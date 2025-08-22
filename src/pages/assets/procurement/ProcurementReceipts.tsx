import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Truck,
  User as UserIcon,
  Calendar,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { procurementAPI, supplierAPI, userAPI, assetAPI } from '@/services/api';
import { toCamelCase, toSnakeCase } from '@/lib/utils';
import type { ProcurementReceipt, ProcurementReceiptItem, ProcurementOrder, Supplier, User } from '@/types';

const ProcurementReceipts = () => {
  const [receipts, setReceipts] = useState<ProcurementReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ProcurementReceipt | null>(null);
  const [receiptItems, setReceiptItems] = useState<ProcurementReceiptItem[]>([]);

  // 新建入库单表单状态
  const [formData, setFormData] = useState({
    procurementOrderId: '',
    deliveryDate: '',
    inspectorId: '',
    notes: '',
  });

  // 状态映射
  const statusMap = {
    pending: { label: '待验收', color: 'bg-yellow-500' },
    partial: { label: '部分入库', color: 'bg-blue-500' },
    completed: { label: '已完成', color: 'bg-green-500' },
    rejected: { label: '已拒收', color: 'bg-red-500' },
  };

  // 质量状态映射
  const qualityStatusMap = {
    qualified: { label: '合格', color: 'bg-green-500' },
    unqualified: { label: '不合格', color: 'bg-red-500' },
    damaged: { label: '损坏', color: 'bg-orange-500' },
  };

  // 收货状态映射
  const receiptStatusMap = {
    normal: { label: '正常', color: 'bg-green-500' },
    partial: { label: '部分收货', color: 'bg-blue-500' },
    excess: { label: '超量', color: 'bg-orange-500' },
    shortage: { label: '短缺', color: 'bg-red-500' },
  };

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      const res = await supplierAPI.getAll();
      setSuppliers(res);
    } catch (error) {
      console.error('获取供应商列表失败:', error);
    }
  };

  // 获取采购订单列表
  const fetchOrders = async () => {
    try {
      const res = await procurementAPI.getProcurementOrders();
      setOrders(toCamelCase(res));
    } catch (error) {
      console.error('获取采购订单列表失败:', error);
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(toCamelCase(res));
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  // 获取采购入库单列表
  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await procurementAPI.getProcurementReceipts();
      console.log('获取到的入库单原始数据:', res);
      setReceipts(toCamelCase(res));
    } catch (error) {
      console.error('获取采购入库单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchSuppliers();
    fetchOrders();
    fetchUsers();
  }, []);

  // 新建入库单
  const handleAddReceipt = async (data: any) => {
    setLoading(true);
    try {
      await procurementAPI.createProcurementReceipt(toSnakeCase(data));
      fetchReceipts();
    } finally {
      setLoading(false);
    }
  };

  // 编辑入库单
  const handleEditReceipt = async (id: string, data: any) => {
    setLoading(true);
    try {
      await procurementAPI.updateProcurementReceipt(id, toSnakeCase(data));
      fetchReceipts();
    } finally {
      setLoading(false);
    }
  };

  // 删除入库单
  const handleDeleteReceipt = async (id: string) => {
    setLoading(true);
    try {
      await procurementAPI.deleteProcurementReceipt(id);
      fetchReceipts();
    } finally {
      setLoading(false);
    }
  };

  // 入库明细项相关API同理，调用 procurementAPI.createProcurementReceiptItem 等方法

  // 过滤入库单
  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch =
      (receipt.receiptNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (receipt.order?.orderNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 获取已审批的采购订单
  const approvedOrders = orders.filter(order => order.status === 'approved');

  // 根据采购订单ID获取供应商信息
  const getSupplierByOrderId = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.supplierId) return null;
    
    return suppliers.find(s => s.id === order.supplierId);
  };

  // 获取供应商名称
  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : '未知供应商';
  };

  // 创建入库单
  const createReceipt = async () => {
    if (!formData.procurementOrderId || !formData.deliveryDate || !formData.inspectorId) {
      return;
    }

    const procurementOrder = orders.find(o => o.id === formData.procurementOrderId);
    const inspector = users.find(u => u.id === formData.inspectorId);
    
    if (!procurementOrder || !inspector) {
      console.error('采购订单或验收人不存在');
      return;
    }

    // 从采购订单获取供应商信息
    const supplier = getSupplierByOrderId(formData.procurementOrderId);

    try {
      setLoading(true);
      
      // 准备入库单数据
      const receiptData = {
        receipt_number: `PR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(receipts.length + 1).padStart(3, '0')}`,
        order_id: procurementOrder.id,
        supplier_id: supplier?.id,
        delivery_date: formData.deliveryDate,
        inspector_id: inspector.id,
        total_received: procurementOrder.purchaseTotalAmount || 0,
        status: 'pending' as const,
        notes: formData.notes,
        attachments: [],
        created_by_id: users[0]?.id,
      };

      // 调用API创建入库单
      const createdReceipt = await procurementAPI.createProcurementReceipt(receiptData);
      console.log('入库单创建成功:', createdReceipt);

      // 创建入库明细
      if (procurementOrder.items && procurementOrder.items.length > 0) {
        for (const orderItem of procurementOrder.items) {
          const receiptItemData = {
            receipt_id: createdReceipt.id,
            order_item_id: orderItem.id,
            expected_quantity: orderItem.quantity,
            actual_quantity: orderItem.quantity,
            quality_status: 'qualified' as const,
            receipt_status: 'normal' as const,
            unit_price: orderItem.unitPrice || 0,
            total_amount: (orderItem.unitPrice || 0) * orderItem.quantity,
            notes: '',
          };

          try {
            await procurementAPI.createProcurementReceiptItem(receiptItemData);
            console.log('入库明细创建成功:', receiptItemData);
          } catch (error) {
            console.error('创建入库明细失败:', error);
          }
        }
      }

      // 重新获取入库单列表
      await fetchReceipts();
      
      // 重置表单
      setShowCreateDialog(false);
      setFormData({
        procurementOrderId: '',
        deliveryDate: '',
        inspectorId: '',
        notes: '',
      });

      console.log('入库单创建完成');
      
    } catch (error) {
      console.error('创建入库单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 查看入库单详情
  const viewReceiptDetail = (receipt: ProcurementReceipt) => {
    setSelectedReceipt(receipt);
    setShowDetailDialog(true);
  };

  // 完成验收
  const completeReceipt = async (receiptId: string) => {
    try {
      setLoading(true);
      
      // 1. 更新入库单状态为已完成
      await procurementAPI.updateProcurementReceipt(receiptId, { status: 'completed' });
      
      // 2. 获取入库单主信息
      const receipt = receipts.find(r => r.id === receiptId);
      if (!receipt) {
        console.error('入库单不存在');
        return;
      }
      
      // 3. 通过API获取明细
      const items = await procurementAPI.getProcurementReceiptItems(receiptId);
      if (!items || items.length === 0) {
        console.error('入库单明细不存在');
        return;
      }
      
      // 转换字段名为camelCase格式
      const camelCaseItems = toCamelCase(items);
      
      // 4. 为每个验收合格的明细项创建资产记录
      for (const receiptItem of camelCaseItems) {
        if (receiptItem.qualityStatus === 'qualified' && receiptItem.actualQuantity > 0) {
          const orderItem = receiptItem.orderItem;
          if (!orderItem) {
            console.warn('采购订单明细不存在，跳过创建资产:', receiptItem.id);
            continue;
          }
          
          for (let i = 0; i < receiptItem.actualQuantity; i++) {
            const assetData = {
              // 资产基本信息 - 从采购订单明细获取
              code: orderItem.assetCode || `AST-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              name: orderItem.assetName || '未命名资产',
              model: orderItem.specificationModel, // 使用规格型号作为型号
              specification: orderItem.specificationModel, // 使用规格型号作为规格
              
              // 分类和品牌 - 从采购订单明细获取
              category_id: orderItem.categoryId, // 使用camelCase字段名
              brand_id: orderItem.brandId, // 使用camelCase字段名
              
              // 供应商信息 - 从采购订单获取
              supplier_id: receipt.order?.supplierId,
              
              // 项目信息 - 从采购订单明细获取
              project_id: orderItem.projectId, // 使用camelCase字段名
              
              // 采购信息 - 从入库单和明细获取
              purchase_date: receipt.deliveryDate,
              purchase_price: receiptItem.unitPrice || 0,
              
              // 位置信息 - 从入库明细获取
              location_id: receiptItem.locationId,
              
              // 管理信息 - 从入库单和采购订单获取
              department_id: receipt.order?.departmentId,
              custodian_id: receipt.inspectorId,
              
              // 状态和备注
              status: 'in_use' as const,
              remarks: `从采购入库单 ${receipt.receiptNumber} 自动创建`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            
            console.log('准备创建资产，数据:', assetData);
            
            try {
              const createdAsset = await assetAPI.createAsset(assetData);
              console.log(`成功创建资产: ${createdAsset.name} (${createdAsset.code})`);
            } catch (error) {
              console.error(`创建资产失败: ${assetData.name}`, error);
            }
          }
        }
      }
      
      // 5. 重新获取入库单列表
      await fetchReceipts();
      
      console.log(`入库单 ${receipt.receiptNumber} 验收完成，已创建相关资产记录`);
      
    } catch (error) {
      console.error('完成验收失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 拒收
  const rejectReceipt = async (receiptId: string) => {
    try {
      setLoading(true);
      
      // 更新入库单状态为已拒收
      await procurementAPI.updateProcurementReceipt(receiptId, { status: 'rejected' });
      
      // 重新获取入库单列表
      await fetchReceipts();
      
      console.log(`入库单 ${receiptId} 已拒收`);
      
    } catch (error) {
      console.error('拒收入库单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">采购入库</h1>
            <p className="text-muted-foreground mt-1">管理采购验收和资产入库</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新建入库单
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">新建入库单</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="procurementOrder" className="text-foreground">采购订单 *</Label>
                    <Select value={formData.procurementOrderId} onValueChange={(value) => {
                      setFormData({ ...formData, procurementOrderId: value });
                    }}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择采购订单" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {approvedOrders.map((order) => (
                          <SelectItem key={order.id} value={order.id} className="text-popover-foreground hover:bg-accent">
                            {order.orderNumber} - {order.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* 供应商名称 - 只读显示 */}
                  <div className="space-y-2">
                    <Label className="text-foreground">供应商</Label>
                    <div className="p-2 bg-muted rounded-md border border-border">
                      <span className="text-foreground">
                        {formData.procurementOrderId 
                          ? getSupplierByOrderId(formData.procurementOrderId)?.name || '未知供应商'
                          : '请先选择采购订单'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate" className="text-foreground">到货日期 *</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inspector" className="text-foreground">验收人 *</Label>
                    <Select value={formData.inspectorId} onValueChange={(value) => setFormData({ ...formData, inspectorId: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择验收人" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id} className="text-popover-foreground hover:bg-accent">
                            {user.name} - {user.position?.name || '未设置职位'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 采购订单信息预览 */}
                {formData.procurementOrderId && (
                  <Card className="bg-muted/50 border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-foreground">采购订单信息</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {(() => {
                        const order = orders.find(o => o.id === formData.procurementOrderId);
                        const supplier = getSupplierByOrderId(formData.procurementOrderId);
                        if (!order) return null;
                        
                        return (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">订单号：</span>
                              <span className="text-foreground font-medium">{order.orderNumber}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">申请人：</span>
                              <span className="text-foreground">{order.applicant?.name || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">需求部门：</span>
                              <span className="text-foreground">{order.department?.name || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">供应商：</span>
                              <span className="text-foreground font-medium">{supplier?.name || '未知供应商'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">订单金额：</span>
                              <span className="text-foreground font-medium">¥{(order.purchaseTotalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">明细数量：</span>
                              <span className="text-foreground">{order.items?.length || 0} 项</span>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-foreground">备注</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="请输入备注信息"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-border text-foreground hover:bg-accent">
                    取消
                  </Button>
                  <Button onClick={createReceipt} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    创建入库单
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 筛选和搜索 */}
        <Card className="bg-card border-border theme-transition">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="搜索入库单号或采购单号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 bg-background border-border text-foreground">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all" className="text-popover-foreground hover:bg-accent">全部状态</SelectItem>
                    <SelectItem value="pending" className="text-popover-foreground hover:bg-accent">待验收</SelectItem>
                    <SelectItem value="partial" className="text-popover-foreground hover:bg-accent">部分入库</SelectItem>
                    <SelectItem value="completed" className="text-popover-foreground hover:bg-accent">已完成</SelectItem>
                    <SelectItem value="rejected" className="text-popover-foreground hover:bg-accent">已拒收</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 入库单列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">入库单列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">入库单号</TableHead>
                  <TableHead className="text-foreground">采购订单</TableHead>
                  <TableHead className="text-foreground">供应商</TableHead>
                  <TableHead className="text-foreground">验收人</TableHead>
                  <TableHead className="text-foreground">到货日期</TableHead>
                  <TableHead className="text-foreground">实收金额</TableHead>
                  <TableHead className="text-foreground">状态</TableHead>
                  <TableHead className="text-foreground">创建时间</TableHead>
                  <TableHead className="text-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{receipt.receiptNumber}</TableCell>
                    <TableCell className="text-foreground">{receipt.order?.orderNumber || '-'}</TableCell>
                    <TableCell className="text-foreground">{receipt.supplier?.name || '-'}</TableCell>
                    <TableCell className="text-foreground">{receipt.inspector?.name || '-'}</TableCell>
                    <TableCell className="text-foreground">{receipt.deliveryDate ? new Date(receipt.deliveryDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-foreground">¥{(receipt.totalReceived || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={`${statusMap[receipt.status].color} text-white`}>
                        {statusMap[receipt.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-foreground hover:bg-accent">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem 
                            onClick={() => viewReceiptDetail(receipt)}
                            className="text-popover-foreground hover:bg-accent cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          {receipt.status === 'pending' && (
                            <>
                              <DropdownMenuItem className="text-popover-foreground hover:bg-accent cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                编辑验收
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => completeReceipt(receipt.id)}
                                className="text-popover-foreground hover:bg-accent cursor-pointer"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                完成验收
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => rejectReceipt(receipt.id)}
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                拒收
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 入库单详情对话框 */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">入库单详情</DialogTitle>
            </DialogHeader>
            {selectedReceipt && (
              <div className="space-y-6">
                {/* 基本信息 */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">基本信息</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">入库单号</Label>
                      <p className="text-foreground font-medium">{selectedReceipt.receiptNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">采购订单</Label>
                      <p className="text-foreground">{selectedReceipt.order?.orderNumber || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">供应商</Label>
                      <p className="text-foreground">{selectedReceipt.supplier?.name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">验收人</Label>
                      <p className="text-foreground">{selectedReceipt.inspector?.name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">到货日期</Label>
                      <p className="text-foreground">{selectedReceipt.deliveryDate ? new Date(selectedReceipt.deliveryDate).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">实收金额</Label>
                      <p className="text-foreground font-medium">¥{(selectedReceipt.totalReceived || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">状态</Label>
                      <Badge className={`${statusMap[selectedReceipt.status].color} text-white`}>
                        {statusMap[selectedReceipt.status].label}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">创建时间</Label>
                      <p className="text-foreground">{selectedReceipt.createdAt ? new Date(selectedReceipt.createdAt).toLocaleString() : '-'}</p>
                    </div>
                    {selectedReceipt.notes && (
                      <div className="md:col-span-3">
                        <Label className="text-muted-foreground">备注</Label>
                        <p className="text-foreground">{selectedReceipt.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 验收明细 */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">验收明细</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-foreground">资产名称</TableHead>
                          <TableHead className="text-foreground">规格型号</TableHead>
                          <TableHead className="text-foreground">预期数量</TableHead>
                          <TableHead className="text-foreground">实际数量</TableHead>
                          <TableHead className="text-foreground">单价</TableHead>
                          <TableHead className="text-foreground">总金额</TableHead>
                          <TableHead className="text-foreground">质量状态</TableHead>
                          <TableHead className="text-foreground">收货状态</TableHead>
                          <TableHead className="text-foreground">存放位置</TableHead>
                          <TableHead className="text-foreground">保管人</TableHead>
                          <TableHead className="text-foreground">资产编号</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReceipt.items?.map((item) => (
                          <TableRow key={item.id} className="border-border">
                            <TableCell className="text-foreground">{item.orderItem?.assetName}</TableCell>
                            <TableCell className="text-foreground">{item.orderItem?.specificationModel || '-'}</TableCell>
                            <TableCell className="text-foreground">{item.expectedQuantity}</TableCell>
                            <TableCell className="text-foreground">{item.actualQuantity}</TableCell>
                            <TableCell className="text-foreground">¥{(item.unitPrice || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-foreground">¥{(item.totalAmount || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={`${qualityStatusMap[item.qualityStatus || 'qualified'].color} text-white`}>
                                {qualityStatusMap[item.qualityStatus || 'qualified'].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${receiptStatusMap[item.receiptStatus || 'normal'].color} text-white`}>
                                {receiptStatusMap[item.receiptStatus || 'normal'].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-foreground">{item.location?.name || '-'}</TableCell>
                            <TableCell className="text-foreground">-</TableCell>
                            <TableCell className="text-foreground">-</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* 采购订单信息 */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">关联采购订单</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">订单标题</Label>
                      <p className="text-foreground">{selectedReceipt.order?.title}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">申请人</Label>
                      <p className="text-foreground">{selectedReceipt.order?.applicant?.name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">需求部门</Label>
                      <p className="text-foreground">{selectedReceipt.order?.department?.name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">期望交付日期</Label>
                      <p className="text-foreground">{selectedReceipt.order?.expectedDeliveryDate || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">订单总预算</Label>
                      <p className="text-foreground">¥{(selectedReceipt.order?.purchaseTotalAmount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">关联供应商</Label>
                      <p className="text-foreground font-medium">{selectedReceipt.supplier?.name || '未知供应商'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProcurementReceipts;
