import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { departments, users, assetCategories, assetBrands, projects } from '@/data/mockdatahd';
import { procurementAPI, supplierAPI, departmentAPI, assetAPI, projectAPI } from '@/services/api';
import { toCamelCase, toSnakeCase } from '@/lib/utils';
import type { ProcurementOrder, ProcurementOrderItem, Department, User as UserType, Supplier, AssetCategory, AssetBrand, Project } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  ShoppingCart,
  Building2,
  User,
  Calendar,
  DollarSign,
  Save,
  X,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Trash2,
  Package,
} from 'lucide-react';


// 采购明细项表单验证模式 - 更新字段
const orderItemSchema = z.object({
  id: z.string().optional(), // 添加ID字段，编辑时使用
  assetCode: z.string().min(1, '资产编号不能为空'),
  assetName: z.string().min(1, '资产名称不能为空'),
  categoryId: z.string().min(1, '请选择资产分类'),
  brandId: z.string().min(1, '请选择品牌'),
  specificationModel: z.string().min(1, '规格型号不能为空'),
  quantity: z.number().min(1, '数量必须大于0'),
  unitPrice: z.number().min(0, '单价不能为负数'),
  projectId: z.string().min(1, '请选择关联项目'),
});

// 采购订单表单验证模式
const orderFormSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  orderNumber: z.string().min(1, '订单号不能为空'),
  departmentId: z.string().min(1, '请选择需求部门'),
  supplierId: z.string().min(1, '请选择供应商'),
  expectedDeliveryDate: z.string().min(1, '请选择期望交付日期'),
  items: z.array(orderItemSchema).min(1, '至少需要一个采购明细').default([]),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

export default function ProcurementOrders() {
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<ProcurementOrder | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ProcurementOrder | null>(null);
  const [isItemDeleteDialogOpen, setIsItemDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ form: any; index: number; remove: any } | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [assetBrands, setAssetBrands] = useState<AssetBrand[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // 表单实例
  const addForm = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderNumber: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7天后
      items: [
        {
          assetCode: '',
          assetName: '',
          categoryId: '',
          brandId: '',
          specificationModel: '',
          quantity: 1,
          unitPrice: 0,
          projectId: '',
        },
      ],
    },
  });

  const editForm = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      items: [
        {
          assetCode: '',
          assetName: '',
          categoryId: '',
          brandId: '',
          specificationModel: '',
          quantity: 1,
          unitPrice: 0,
          projectId: '',
        },
      ],
    },
  });

  // 采购明细字段数组
  const {
    fields: addFields,
    append: addAppend,
    remove: addRemove,
  } = useFieldArray({
    control: addForm.control,
    name: 'items',
  });

  const {
    fields: editFields,
    append: editAppend,
    remove: editRemove,
  } = useFieldArray({
    control: editForm.control,
    name: 'items',
  });

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      const res = await supplierAPI.getAll();
      setSuppliers(res);
    } catch (error) {
      console.error('获取供应商列表失败:', error);
    }
  };

  // 获取部门列表
  const fetchDepartments = async () => {
    try {
      const res = await departmentAPI.getAll();
      setDepartments(res);
    } catch (error) {
      console.error('获取部门列表失败:', error);
    }
  };

  // 获取资产分类列表
  const fetchAssetCategories = async () => {
    try {
      const res = await assetAPI.getAssetCategories();
      setAssetCategories(res);
    } catch (error) {
      console.error('获取资产分类列表失败:', error);
    }
  };

  // 获取资产品牌列表
  const fetchAssetBrands = async () => {
    try {
      const res = await assetAPI.getAssetBrands();
      setAssetBrands(res);
    } catch (error) {
      console.error('获取资产品牌列表失败:', error);
    }
  };

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res);
    } catch (error) {
      console.error('获取项目列表失败:', error);
    }
  };

  // 获取采购订单列表
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await procurementAPI.getProcurementOrders();
      setOrders(res);
    } catch (error) {
      console.error('获取采购订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchDepartments();
    fetchAssetCategories();
    fetchAssetBrands();
    fetchProjects();
  }, []);

  // 筛选订单
  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || order.department?.id === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // 获取供应商名称
  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'N/A';
  };

  // 获取部门名称
  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'N/A';
  };

  // 计算采购明细总金额
  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    const qty = quantity || 0;
    const price = unitPrice || 0;
    return qty * price;
  };

  // 计算订单总金额
  const calculateOrderTotal = (items: any[]) => {
    if (!items || !Array.isArray(items)) {
      return 0;
    }
    return items.reduce((total, item) => {
      return total + calculateItemTotal(item.quantity || 0, item.unitPrice || 0);
    }, 0);
  };

  // 状态标签样式
  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    const labels = {
      draft: '草稿',
      pending: '待审批',
      approved: '已审批',
      rejected: '已拒绝',
      cancelled: '已取消',
      completed: '已完成',
    };
    const icons = {
      draft: FileText,
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      cancelled: XCircle,
      completed: CheckCircle,
    };
    const Icon = icons[status as keyof typeof icons];
    return (
      <Badge className={`${styles[status as keyof typeof styles]} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{labels[status as keyof typeof labels]}</span>
      </Badge>
    );
  };

  // 编辑采购订单
  const handleEditOrder = async (data: OrderFormData) => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      await procurementAPI.updateProcurementOrder(selectedOrder.id, data);
      fetchOrders();
      setIsEditDialogOpen(false);
      setSelectedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // 新增采购订单
  const handleAddOrder = async (data: OrderFormData) => {
    setLoading(true);
    try {
      await procurementAPI.createProcurementOrder(data);
      fetchOrders();
      setIsAddDialogOpen(false);
      addForm.reset({
        orderNumber: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [
          {
            assetCode: '',
            assetName: '',
            categoryId: '',
            brandId: '',
            specificationModel: '',
            quantity: 1,
            unitPrice: 0,
            projectId: '',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  // 删除采购订单
  const handleDeleteOrder = async (id: string) => {
    setLoading(true);
    try {
      await procurementAPI.deleteProcurementOrder(id);
      fetchOrders();
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('删除采购订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (order: ProcurementOrder) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (order: ProcurementOrder) => {
    setSelectedOrder(order);
    
    // 填充表单数据
    editForm.reset({
      title: order.title,
      orderNumber: order.orderNumber,
      departmentId: order.department?.id || '',
      supplierId: order.supplierId || '',
      expectedDeliveryDate: order.expectedDeliveryDate || '',
      items: order.items?.map(item => ({
        id: item.id, // 添加ID字段
        assetCode: item.assetCode || '',
        assetName: item.assetName,
        categoryId: item.categoryId || '',
        brandId: item.brandId || '',
        specificationModel: item.specificationModel || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice || 0,
        projectId: item.projectId || '',
      })) || [],
    });
    
    setIsEditDialogOpen(true);
  };

  // 渲染采购明细表单 - 更新字段
  const renderItemsForm = (form: any, fields: any[], append: any, remove: any) => {
    const watchedItems = form.watch('items') || [];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">采购明细</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({
              id: '', // 添加ID字段，新项目为空字符串
              assetCode: '',
              assetName: '',
              categoryId: '',
              brandId: '',
              specificationModel: '',
              quantity: 1,
              unitPrice: 0,
              projectId: '',
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            添加明细
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">资产编号</TableHead>
              <TableHead className="w-[150px]">资产名称</TableHead>
              <TableHead className="w-[120px]">资产分类</TableHead>
              <TableHead className="w-[100px]">品牌</TableHead>
              <TableHead className="w-[150px]">规格型号</TableHead>
              <TableHead className="w-[80px]">数量</TableHead>
              <TableHead className="w-[100px]">单价</TableHead>
              <TableHead className="w-[120px]">总金额</TableHead>
              <TableHead className="w-[120px]">关联项目</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`items.${index}.assetCode`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="资产编号" className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`items.${index}.assetName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="资产名称" className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`items.${index}.categoryId`}
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="选择分类" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assetCategories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`items.${index}.brandId`}
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="选择品牌" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assetBrands.map(brand => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`items.${index}.specificationModel`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="规格型号" className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            placeholder="数量"
                            className="h-8"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="单价"
                            className="h-8"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">
                    ¥{calculateItemTotal(watchedItems[index]?.quantity || 0, watchedItems[index]?.unitPrice || 0).toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  <FormField
                    control={form.control}
                    name={`items.${index}.projectId`}
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="选择项目" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  {fields.length > 1 && (
                    <DeleteConfirmDialog
                      onConfirm={() => remove(index)}
                      title="确认删除采购明细"
                      description="您确定要删除此采购明细吗？"
                      itemName={`${watchedItems[index]?.assetName || '采购明细'}`}
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 总金额显示 */}
        <div className="flex justify-end">
          <div className="text-lg font-semibold">
            采购总额: ¥{calculateOrderTotal(watchedItems || []).toLocaleString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">采购订单管理</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新增采购订单
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总订单数</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {orders.length}
            </div>
            <p className="text-xs text-muted-foreground">
              已审批 {orders.filter(o => o.status === 'approved').length} 个
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">采购总额</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ¥{orders.reduce((sum, o) => sum + (o.purchaseTotalAmount || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              已审批 ¥{orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + (o.purchaseTotalAmount || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审批</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {orders.filter(o => o.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              草稿 {orders.filter(o => o.status === 'draft').length} 个
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="搜索订单号或标题..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="pending">待审批</SelectItem>
            <SelectItem value="approved">已审批</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="部门筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部部门</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 订单列表 */}
      <Card>
        <CardHeader>
          <CardTitle>采购订单列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>需求部门</TableHead>
                <TableHead>供应商</TableHead>
                <TableHead>采购总额</TableHead>
                <TableHead>期望交付日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.title}</TableCell>
                  <TableCell>{getDepartmentName(order.department?.id || '')}</TableCell>
                  <TableCell>{getSupplierName(order.supplierId || '')}</TableCell>
                  <TableCell>¥{(order.purchaseTotalAmount || 0).toLocaleString()}</TableCell>
                  <TableCell>{order.expectedDeliveryDate || 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedOrder(order); setIsViewDialogOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(order)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(order)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增采购订单</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddOrder)} className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>标题</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="请输入采购订单标题" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>订单号</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="订单号" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>需求部门</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择需求部门" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>供应商</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择供应商" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="expectedDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>期望交付日期</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 采购明细 */}
              {renderItemsForm(addForm, addFields, addAppend, addRemove)}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? '创建中...' : '创建订单'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑采购订单</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditOrder)} className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>标题</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="请输入采购订单标题" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>订单号</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="订单号" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>需求部门</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择需求部门" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>供应商</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择供应商" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="expectedDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>期望交付日期</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 采购明细 */}
              {renderItemsForm(editForm, editFields, editAppend, editRemove)}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? '更新中...' : '更新订单'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 查看对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>采购订单详情</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">订单号</Label>
                  <p className="text-foreground font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">标题</Label>
                  <p className="text-foreground">{selectedOrder.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">需求部门</Label>
                  <p className="text-foreground">{getDepartmentName(selectedOrder.department?.id || '')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">供应商</Label>
                  <p className="text-foreground">{getSupplierName(selectedOrder.supplierId || '')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">采购总额</Label>
                  <p className="text-foreground font-semibold">¥{(selectedOrder.purchaseTotalAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">期望交付日期</Label>
                  <p className="text-foreground">{selectedOrder.expectedDeliveryDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">订单状态</Label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>

              {/* 采购明细 */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">采购明细</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>资产编号</TableHead>
                      <TableHead>资产名称</TableHead>
                      <TableHead>资产分类</TableHead>
                      <TableHead>品牌</TableHead>
                      <TableHead>规格型号</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>单价</TableHead>
                      <TableHead>总价</TableHead>
                      <TableHead>关联项目</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.assetCode || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{item.assetName}</TableCell>
                        <TableCell>{item.category?.name || 'N/A'}</TableCell>
                        <TableCell>{item.brand?.name || 'N/A'}</TableCell>
                        <TableCell>{item.specificationModel || 'N/A'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>¥{item.unitPrice?.toLocaleString() || '-'}</TableCell>
                        <TableCell>¥{item.totalAmount?.toLocaleString() || '-'}</TableCell>
                        <TableCell>{item.project?.name || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => orderToDelete && handleDeleteOrder(orderToDelete.id)}
        title="确认删除采购订单"
        description="您确定要删除此采购订单吗？此操作不可逆。"
        itemName={orderToDelete?.title}
      />
    </div>
  );
}

