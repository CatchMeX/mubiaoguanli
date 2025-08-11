import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import {
  Plus,
  Search,
  Edit,
  Eye,
  Save,
  X,
  Package,
  User,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import api from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { 
  SalesOrderDetail, 
  SalesOrderItemDetail, 
  CreateSalesOrderData, 
  CreateSalesOrderItemData,
  SalesOrderStatistics 
} from '@/types/sales';
import type { Customer, Asset } from '@/types';

const SalesOrderManagement = () => {
  const [orders, setOrders] = useState<SalesOrderDetail[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderDetail | null>(null);
  const [orderItems, setOrderItems] = useState<SalesOrderItemDetail[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [statistics, setStatistics] = useState<SalesOrderStatistics | null>(null);

  // 表单状态
  const [addForm, setAddForm] = useState<CreateSalesOrderData>({
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    shippingAddress: '',
    notes: '',
    items: []
  });

  const [newItem, setNewItem] = useState<CreateSalesOrderItemData>({
    assetId: '',
    unitPrice: 0,
    discountRate: 0,
    taxRate: 0,
    notes: ''
  });
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<CreateSalesOrderItemData>({
    assetId: '',
    unitPrice: 0,
    discountRate: 0,
    taxRate: 0,
    notes: ''
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // 编辑弹框中的订单明细状态
  const [editingOrderItems, setEditingOrderItems] = useState<SalesOrderItemDetail[]>([]);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 开始加载销售订单数据...');
      
      const [ordersData, customersData, assetsData, statsData] = await Promise.all([
        api.salesOrder.getSalesOrderDetails(),
        api.customer.getAll(),
        api.salesOrder.getAvailableAssets(),
        api.salesOrder.getSalesOrderStatistics()
      ]);
      
      console.log('📊 加载到的销售订单数据:', ordersData);
      console.log('👥 加载到的客户数据:', customersData);
      console.log('📦 加载到的资产数据:', assetsData);
      console.log('📈 加载到的统计数据:', statsData);
      
      setOrders(ordersData);
      setCustomers(customersData);
      setAvailableAssets(assetsData);
      setStatistics(statsData);
      
      console.log('✅ 数据加载完成，订单数量:', ordersData.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('❌ 加载销售订单数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 筛选订单
  const filteredOrders = orders.filter(order => {
    const orderNumber = order.orderNumber || '';
    const customerName = order.customerName || '';
    const matchesSearch = orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPaymentStatus = paymentStatusFilter === 'all' || order.paymentStatus === paymentStatusFilter;
    return matchesSearch && matchesPaymentStatus;
  });



  // 获取付款状态徽章
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
        return <Badge variant="destructive">未付款</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-600 text-white">部分付款</Badge>;
      case 'paid':
        return <Badge className="bg-green-600 text-white">已付款</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  // 添加订单明细
  const addOrderItem = () => {
    if (!newItem.assetId || newItem.unitPrice <= 0) {
      toast({
        title: "验证失败",
        description: "请填写完整的商品信息",
        variant: "destructive",
      });
      return;
    }

    const asset = availableAssets.find(a => a.id === newItem.assetId);
    if (!asset) {
      toast({
        title: "验证失败",
        description: "选择的资产不存在",
        variant: "destructive",
      });
      return;
    }

    // 检查是否已添加过该资产
    const existingItem = addForm.items.find(item => item.assetId === newItem.assetId);
    if (existingItem) {
      toast({
        title: "验证失败",
        description: "该资产已在订单中",
        variant: "destructive",
      });
      return;
    }

    setAddForm(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem }]
    }));

    setNewItem({
      assetId: '',
      unitPrice: 0,
      discountRate: 0,
      taxRate: 0,
      notes: ''
    });
    setIsAddingItem(false);
  };

  // 取消添加明细
  const cancelAddItem = () => {
    setNewItem({
      assetId: '',
      unitPrice: 0,
      discountRate: 0,
      taxRate: 0,
      notes: ''
    });
    setIsAddingItem(false);
  };

  // 开始编辑明细
  const startEditItem = (item: SalesOrderItemDetail) => {
    setEditingItem({
      assetId: item.assetId,
      unitPrice: item.unitPrice,
      discountRate: item.discountRate,
      taxRate: item.taxRate,
      notes: item.notes || ''
    });
    setEditingItemId(item.id);
    setIsEditingItem(true);
  };

  // 保存编辑明细
  const saveEditItem = async () => {
    if (!editingItem.assetId || editingItem.unitPrice <= 0 || !editingItemId) {
      toast({
        title: "验证失败",
        description: "请填写完整的商品信息",
        variant: "destructive",
      });
      return;
    }

    try {
      // 调用API更新订单明细
      await api.salesOrder.updateSalesOrderItem(editingItemId, editingItem);
      
      // 关闭编辑状态
      setIsEditingItem(false);
      setEditingItem({
        assetId: '',
        unitPrice: 0,
        discountRate: 0,
        taxRate: 0,
        notes: ''
      });
      setEditingItemId(null);
      
      // 重新加载订单明细
      if (selectedOrder) {
        const items = await api.salesOrder.getSalesOrderItemDetails(selectedOrder.id);
        setOrderItems(items);
      }
      
      toast({
        title: "更新成功",
        description: "订单明细已更新",
        variant: "default",
      });
    } catch (err) {
      console.error('更新订单明细失败:', err);
      toast({
        title: "更新失败",
        description: err instanceof Error ? err.message : '未知错误',
        variant: "destructive",
      });
    }
  };

  // 取消编辑明细
  const cancelEditItem = () => {
    setEditingItem({
      assetId: '',
      unitPrice: 0,
      discountRate: 0,
      taxRate: 0,
      notes: ''
    });
    setEditingItemId(null);
    setIsEditingItem(false);
  };

  // 移除订单明细（新增订单时）
  const removeOrderItem = (index: number) => {
    setAddForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // 删除已保存的订单明细
  const handleDeleteOrderItem = async (itemId: string) => {
    try {
      await api.salesOrder.deleteSalesOrderItem(itemId);
      toast({
        title: "删除成功",
        description: "订单明细已删除",
        variant: "default",
      });
      // 重新加载订单明细
      if (selectedOrder) {
        const items = await api.salesOrder.getSalesOrderItemDetails(selectedOrder.id);
        setOrderItems(items);
      }
    } catch (err) {
      console.error('删除订单明细失败:', err);
      toast({
        title: "删除失败",
        description: err instanceof Error ? err.message : '未知错误',
        variant: "destructive",
      });
    }
  };

  // 处理添加订单
  const handleAddOrder = async () => {
    if (!addForm.customerId || !addForm.orderDate || addForm.items.length === 0) {
      toast({
        title: "验证失败",
        description: "请填写客户信息、订单日期并添加商品",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('创建销售订单，表单数据:', addForm);
      await api.salesOrder.createSalesOrder(addForm);
      
      await loadData();
      setIsAddDialogOpen(false);
      toast({
        title: "添加成功",
        description: "销售订单已成功创建",
        variant: "default",
      });
      
      // 重置表单
      setAddForm({
        customerId: '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        shippingAddress: '',
        notes: '',
        items: []
      });
      setIsAddingItem(false);
    } catch (err) {
      console.error('创建销售订单失败:', err);
      toast({
        title: "创建失败",
        description: err instanceof Error ? err.message : '未知错误',
        variant: "destructive",
      });
    }
  };



  // 更新付款状态
  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      await api.salesOrder.updatePaymentStatus(orderId, newPaymentStatus as any);
      await loadData();
      toast({
        title: "更新成功",
        description: "付款状态已更新",
        variant: "default",
      });
    } catch (err) {
      console.error('更新付款状态失败:', err);
      toast({
        title: "更新失败",
        description: err instanceof Error ? err.message : '未知错误',
        variant: "destructive",
      });
    }
  };

  // 打开查看对话框
  const openViewDialog = async (order: SalesOrderDetail) => {
    setSelectedOrder(order);
    try {
      const items = await api.salesOrder.getSalesOrderItemDetails(order.id);
      setOrderItems(items);
      setIsViewDialogOpen(true);
    } catch (err) {
      console.error('加载订单明细失败:', err);
      toast({
        title: "加载失败",
        description: "无法加载订单明细",
        variant: "destructive",
      });
    }
  };

  // 计算编辑中订单的总金额
  const calculateEditingOrderTotal = () => {
    return editingOrderItems.reduce((total, item) => {
      const subtotal = (item.unitPrice || 0) - ((item.unitPrice || 0) * (item.discountRate || 0) / 100);
      const tax = subtotal * (item.taxRate || 0) / 100;
      return total + subtotal + tax;
    }, 0);
  };

  // 更新编辑中的订单明细
  const updateEditingOrderItem = (index: number, field: keyof SalesOrderItemDetail, value: any) => {
    setEditingOrderItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // 重新计算小计和总计
      const item = newItems[index];
      const subtotal = (item.unitPrice || 0) - ((item.unitPrice || 0) * (item.discountRate || 0) / 100);
      const tax = subtotal * (item.taxRate || 0) / 100;
      const total = subtotal + tax;
      
      newItems[index] = {
        ...newItems[index],
        subtotal,
        taxAmount: tax,
        totalAmount: total
      };
      
      return newItems;
    });
  };

  // 打开编辑对话框
  const openEditDialog = async (order: SalesOrderDetail) => {
    setSelectedOrder(order);
    try {
      const items = await api.salesOrder.getSalesOrderItemDetails(order.id);
      setOrderItems(items);
      setEditingOrderItems([...items]); // 初始化编辑中的订单明细
      setIsEditDialogOpen(true);
    } catch (err) {
      console.error('加载订单明细失败:', err);
      toast({
        title: "加载失败",
        description: "无法加载订单明细",
        variant: "destructive",
      });
    }
  };

  // 删除销售订单
  const handleDeleteOrder = async (orderId: string) => {
    try {
      await api.salesOrder.delete(orderId);
      await loadData();
      toast({
        title: "删除成功",
        description: "销售订单已删除",
        variant: "default",
      });
    } catch (err) {
      console.error('删除销售订单失败:', err);
      toast({
        title: "删除失败",
        description: err instanceof Error ? err.message : '未知错误',
        variant: "destructive",
      });
    }
  };

  // 更新销售订单
  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      // 更新主订单信息
      await api.salesOrder.updateSalesOrder(selectedOrder.id, {
        customerId: selectedOrder.customerId,
        orderDate: selectedOrder.orderDate,
        deliveryDate: selectedOrder.deliveryDate,
        shippingAddress: selectedOrder.shippingAddress,
        notes: selectedOrder.notes,
        paymentStatus: selectedOrder.paymentStatus
      });
      
      // 更新订单明细
      for (let i = 0; i < editingOrderItems.length; i++) {
        const item = editingOrderItems[i];
        const originalItem = orderItems[i];
        
        if (item.id.startsWith('temp-')) {
          // 新增的订单明细
          await api.salesOrder.createSalesOrderItem({
            orderId: selectedOrder.id,
            assetId: item.assetId,
            unitPrice: item.unitPrice,
            discountRate: item.discountRate,
            taxRate: item.taxRate,
            notes: item.notes
          });
        } else if (originalItem && (
          item.assetId !== originalItem.assetId ||
          item.unitPrice !== originalItem.unitPrice ||
          item.discountRate !== originalItem.discountRate ||
          item.taxRate !== originalItem.taxRate ||
          item.notes !== originalItem.notes
        )) {
          // 更新现有的订单明细
          await api.salesOrder.updateSalesOrderItem(item.id, {
            assetId: item.assetId,
            unitPrice: item.unitPrice,
            discountRate: item.discountRate,
            taxRate: item.taxRate,
            notes: item.notes
          });
        }
      }
      
      // 删除多余的订单明细
      for (let i = editingOrderItems.length; i < orderItems.length; i++) {
        await api.salesOrder.deleteSalesOrderItem(orderItems[i].id);
      }
      
      // 重新计算并更新订单总金额
      const newTotalAmount = calculateEditingOrderTotal();
      const discountAmount = editingOrderItems.reduce((sum, item) => {
        const discount = (item.unitPrice || 0) * (item.discountRate || 0) / 100;
        return sum + discount;
      }, 0);
      const taxAmount = editingOrderItems.reduce((sum, item) => {
        const subtotal = (item.unitPrice || 0) - ((item.unitPrice || 0) * (item.discountRate || 0) / 100);
        const tax = subtotal * (item.taxRate || 0) / 100;
        return sum + tax;
      }, 0);
      
      // 更新订单金额
      await api.salesOrder.update(selectedOrder.id, {
        totalAmount: editingOrderItems.reduce((sum, item) => sum + (item.unitPrice || 0), 0),
        discountAmount: discountAmount,
        taxAmount: taxAmount,
        finalAmount: newTotalAmount
      });
      
      await loadData();
      setIsEditDialogOpen(false);
      toast({
        title: "更新成功",
        description: "销售订单已更新",
        variant: "default",
      });
    } catch (err) {
      console.error('更新销售订单失败:', err);
      toast({
        title: "更新失败",
        description: err instanceof Error ? err.message : '未知错误',
        variant: "destructive",
      });
    }
  };

  // 计算订单总金额
  const calculateOrderTotal = (items: CreateSalesOrderItemData[]) => {
    return items.reduce((total, item) => {
      const subtotal = item.unitPrice;
      const discount = subtotal * (item.discountRate || 0) / 100;
      const afterDiscount = subtotal - discount;
      const tax = afterDiscount * (item.taxRate || 0) / 100;
      return total + afterDiscount + tax;
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background theme-transition flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background theme-transition flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">加载失败: {error}</p>
          <Button onClick={loadData} className="mt-2">重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">销售订单管理</h1>
            <p className="text-muted-foreground">管理销售订单和客户交易</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增订单
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增销售订单</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* 订单基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerId">
                      客户 <span className="text-red-500">*</span>
                    </Label>
                    <Select value={addForm.customerId} onValueChange={(value) => setAddForm(prev => ({ ...prev, customerId: value }))}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="请选择客户" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} {customer.code && `(${customer.code})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="orderDate">
                      订单日期 <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="orderDate" 
                      type="date"
                      value={addForm.orderDate}
                      onChange={(e) => setAddForm(prev => ({ ...prev, orderDate: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryDate">交货日期</Label>
                    <Input 
                      id="deliveryDate" 
                      type="date"
                      value={addForm.deliveryDate}
                      onChange={(e) => setAddForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingAddress">收货地址</Label>
                    <Textarea 
                      id="shippingAddress" 
                      value={addForm.shippingAddress}
                      onChange={(e) => setAddForm(prev => ({ ...prev, shippingAddress: e.target.value }))}
                      placeholder="请输入收货地址"
                      className="bg-background border-border text-foreground" 
                      rows={2}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">备注</Label>
                  <Textarea 
                    id="notes" 
                    value={addForm.notes}
                    onChange={(e) => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="请输入备注信息"
                    className="bg-background border-border text-foreground" 
                    rows={2}
                  />
                </div>

                {/* 订单明细 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">订单明细</Label>
                    <div className="text-sm text-muted-foreground">
                      总金额: ¥{calculateOrderTotal(addForm.items).toFixed(2)}
                    </div>
                  </div>
                  


                  {/* 明细列表 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-end">
                      <Button 
                        onClick={() => setIsAddingItem(true)} 
                        size="sm"
                        className="h-8"
                        disabled={isAddingItem}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        添加明细
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>资产名称</TableHead>
                          <TableHead>单价</TableHead>
                          <TableHead>折扣率</TableHead>
                          <TableHead>税率</TableHead>
                          <TableHead>小计</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* 添加新明细的行 */}
                        {isAddingItem && (
                          <TableRow className="bg-muted/50">
                            <TableCell>
                              <Select value={newItem.assetId} onValueChange={(value) => setNewItem(prev => ({ ...prev, assetId: value }))}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="选择资产" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableAssets.map(asset => (
                                    <SelectItem key={asset.id} value={asset.id}>
                                      {asset.name} ({asset.code})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                min="0"
                                step="0.01"
                                value={newItem.unitPrice}
                                onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                                className="h-8" 
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={newItem.discountRate}
                                onChange={(e) => setNewItem(prev => ({ ...prev, discountRate: parseFloat(e.target.value) || 0 }))}
                                className="h-8" 
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={newItem.taxRate}
                                onChange={(e) => setNewItem(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                                className="h-8" 
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              ¥{(() => {
                                const subtotal = newItem.unitPrice;
                                const discount = subtotal * (newItem.discountRate || 0) / 100;
                                const afterDiscount = subtotal - discount;
                                const tax = afterDiscount * (newItem.taxRate || 0) / 100;
                                return (afterDiscount + tax).toFixed(2);
                              })()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  onClick={addOrderItem}
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={cancelAddItem}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        
                        {/* 现有明细 */}
                        {addForm.items.map((item, index) => {
                          const asset = availableAssets.find(a => a.id === item.assetId);
                          const subtotal = item.unitPrice;
                          const discount = subtotal * (item.discountRate || 0) / 100;
                          const afterDiscount = subtotal - discount;
                          const tax = afterDiscount * (item.taxRate || 0) / 100;
                          const total = afterDiscount + tax;

                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{asset?.name || '-'}</TableCell>
                              <TableCell>¥{(item.unitPrice || 0).toFixed(2)}</TableCell>
                              <TableCell>{(item.discountRate || 0)}%</TableCell>
                              <TableCell>{(item.taxRate || 0)}%</TableCell>
                              <TableCell className="font-medium">¥{(total || 0).toFixed(2)}</TableCell>
                              <TableCell>
                                <DeleteButton
                                  onConfirm={() => removeOrderItem(index)}
                                  title="删除明细"
                                  description="确定要删除这个明细吗？"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    setIsAddingItem(false);
                  }}>
                    <X className="mr-2 h-4 w-4" />
                    取消
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleAddOrder}
                    disabled={addForm.items.length === 0}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    创建订单
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 统计卡片 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border theme-transition">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总订单数</p>
                    <p className="text-2xl font-bold text-foreground">{statistics.totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border theme-transition">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总金额</p>
                    <p className="text-2xl font-bold text-foreground">¥{(statistics.totalAmount || 0).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border theme-transition">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总订单</p>
                    <p className="text-2xl font-bold text-foreground">{statistics.totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border theme-transition">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">已付款</p>
                    <p className="text-2xl font-bold text-foreground">{statistics.paidOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 订单列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">销售订单列表</CardTitle>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索订单号或客户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>

              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-32 bg-background border-border text-foreground">
                  <SelectValue placeholder="付款" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">全部付款</SelectItem>
                  <SelectItem value="unpaid">未付款</SelectItem>
                  <SelectItem value="partial">部分付款</SelectItem>
                  <SelectItem value="paid">已付款</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>订单日期</TableHead>
                  <TableHead>交货日期</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>付款状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>加载中...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无数据 (共 {orders.length} 条原始数据)
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName || '-'}</div>
                          <div className="text-sm text-muted-foreground">{order.customerContact || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="font-medium">¥{(order.finalAmount || 0).toFixed(2)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus || 'unpaid')}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(order)}
                            title="查看详情"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(order)}
                            title="编辑订单"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            onConfirm={() => handleDeleteOrder(order.id)}
                            title="删除销售订单"
                            description="确定要删除这个销售订单吗？此操作不可撤销。"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 编辑订单对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑销售订单</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* 订单基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editCustomerId">
                      客户 <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={selectedOrder.customerId} 
                      onValueChange={(value) => setSelectedOrder(prev => prev ? { ...prev, customerId: value } : null)}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择客户" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} ({customer.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editOrderDate">
                      订单日期 <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="editOrderDate" 
                      type="date"
                      value={selectedOrder.orderDate}
                      onChange={(e) => setSelectedOrder(prev => prev ? { ...prev, orderDate: e.target.value } : null)}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editDeliveryDate">交货日期</Label>
                    <Input 
                      id="editDeliveryDate" 
                      type="date"
                      value={selectedOrder.deliveryDate || ''}
                      onChange={(e) => setSelectedOrder(prev => prev ? { ...prev, deliveryDate: e.target.value } : null)}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="editShippingAddress">收货地址</Label>
                    <Input 
                      id="editShippingAddress" 
                      value={selectedOrder.shippingAddress || ''}
                      onChange={(e) => setSelectedOrder(prev => prev ? { ...prev, shippingAddress: e.target.value } : null)}
                      placeholder="请输入收货地址"
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editPaymentStatus">付款状态</Label>
                  <Select 
                    value={selectedOrder.paymentStatus} 
                    onValueChange={(value) => setSelectedOrder(prev => prev ? { ...prev, paymentStatus: value as any } : null)}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="unpaid">未付款</SelectItem>
                      <SelectItem value="partial">部分付款</SelectItem>
                      <SelectItem value="paid">已付款</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editNotes">备注</Label>
                  <Textarea 
                    id="editNotes" 
                    value={selectedOrder.notes || ''}
                    onChange={(e) => setSelectedOrder(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    placeholder="请输入备注信息"
                    className="bg-background border-border text-foreground" 
                    rows={2}
                  />
                </div>

                {/* 订单明细 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">订单明细</Label>
                    <div className="text-sm text-muted-foreground">
                      总金额: ¥{calculateEditingOrderTotal().toFixed(2)}
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>资产信息</TableHead>
                        <TableHead>单价</TableHead>
                        <TableHead>折扣率</TableHead>
                        <TableHead>税率</TableHead>
                        <TableHead>小计</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingOrderItems.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Select 
                              value={item.assetId} 
                              onValueChange={(value) => updateEditingOrderItem(index, 'assetId', value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="选择资产" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableAssets.map(asset => (
                                  <SelectItem key={asset.id} value={asset.id}>
                                    {asset.name} ({asset.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitPrice || 0}
                              onChange={(e) => updateEditingOrderItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="h-8 w-20"
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.discountRate || 0}
                              onChange={(e) => updateEditingOrderItem(index, 'discountRate', parseFloat(e.target.value) || 0)}
                              className="h-8 w-16"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.taxRate || 0}
                              onChange={(e) => updateEditingOrderItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                              className="h-8 w-16"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            ¥{(item.subtotal || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <DeleteButton
                              onConfirm={() => {
                                setEditingOrderItems(prev => prev.filter((_, i) => i !== index));
                              }}
                              title="删除订单明细"
                              description="确定要删除这个订单明细吗？此操作不可撤销。"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newItem: SalesOrderItemDetail = {
                        id: `temp-${Date.now()}`,
                        orderId: selectedOrder.id,
                        assetId: '',
                        unitPrice: 0,
                        discountRate: 0,
                        discountAmount: 0,
                        taxRate: 0,
                        taxAmount: 0,
                        subtotal: 0,
                        totalAmount: 0,
                        notes: '',
                        assetCode: '',
                        assetName: '',
                        assetModel: '',
                        assetSpecification: '',
                        assetCategoryName: '',
                        assetBrandName: '',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      };
                      setEditingOrderItems(prev => [...prev, newItem]);
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加明细
                  </Button>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={() => handleUpdateOrder()}>
                    <Save className="h-4 w-4 mr-1" />
                    保存修改
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 查看订单详情对话框 */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>订单详情</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* 订单基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">订单号</Label>
                    <p className="text-foreground">{selectedOrder.orderNumber || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">客户</Label>
                    <p className="text-foreground">{selectedOrder.customerName || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">订单日期</Label>
                    <p className="text-foreground">{selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">交货日期</Label>
                    <p className="text-foreground">
                      {selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString() : '-'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">付款状态</Label>
                    <div>{getPaymentStatusBadge(selectedOrder.paymentStatus || 'unpaid')}</div>
                  </div>
                </div>

                {/* 订单明细 */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">订单明细</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>资产信息</TableHead>
                        <TableHead>单价</TableHead>
                        <TableHead>折扣率</TableHead>
                        <TableHead>税率</TableHead>
                        <TableHead>小计</TableHead>
                        <TableHead>总计</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.assetName || '-'}</div>
                              <div className="text-sm text-muted-foreground">{item.assetCode || '-'}</div>
                              {item.assetModel && (
                                <div className="text-sm text-muted-foreground">{item.assetModel}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>¥{(item.unitPrice || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            {(item.discountRate || 0) > 0 ? `${item.discountRate}%` : '-'}
                          </TableCell>
                          <TableCell>
                            {(item.taxRate || 0) > 0 ? `${item.taxRate}%` : '-'}
                          </TableCell>
                          <TableCell>¥{(item.subtotal || 0).toFixed(2)}</TableCell>
                          <TableCell className="font-medium">¥{(item.totalAmount || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 订单汇总 */}
                <div className="flex justify-end">
                  <div className="space-y-2 text-right">
                    <div className="text-sm">
                      总金额: <span className="font-medium">¥{(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-sm">
                      折扣金额: <span className="font-medium">¥{(selectedOrder.discountAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-sm">
                      税额: <span className="font-medium">¥{(selectedOrder.taxAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-lg font-bold">
                      最终金额: <span className="text-primary">¥{(selectedOrder.finalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    关闭
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SalesOrderManagement; 