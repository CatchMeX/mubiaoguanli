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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  X,
  Calendar,
  User,
  MapPin,
  Building2,
  Briefcase,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { assetAPI, userAPI, departmentAPI, projectAPI } from '@/services/api';
import { users, departments, assetLocations, projects } from '@/data/mockData';
import type { InventoryRecord, QuickInventoryForm, InventoryType, InventoryReason, InventoryStatus } from '@/types/inventory';
import { toast } from '@/components/ui/use-toast';

// 表单验证模式
const inventoryFormSchema = z.object({
  type: z.enum(['in', 'out']),
  reason: z.enum(['purchase', 'return', 'transfer_in', 'allocation', 'transfer_out', 'repair_out', 'repair_in', 'scrap', 'loss', 'other']),
  assetId: z.string().min(1, '请选择资产'),
  quantity: z.number().min(1, '数量必须大于0'),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  fromDepartmentId: z.string().optional(),
  toDepartmentId: z.string().optional(),
  fromCustodianId: z.string().optional(),
  toCustodianId: z.string().optional(),
  projectId: z.string().optional(),
  operationDate: z.string().min(1, '请选择操作日期'),
  notes: z.string().optional(),
});

type InventoryFormData = z.infer<typeof inventoryFormSchema>;

const AssetInventoryManagement = () => {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<InventoryRecord | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // 获取统计数据和可用资产
  const getStatistics = async () => {
    try {
      const res = await assetAPI.getInventoryStatistics();
      if (res.success) {
        // Assuming res.data is an object with the desired statistics
        // For now, we'll use mock data or derive from records if available
        // This part needs to be updated to fetch actual statistics from the backend
        // For now, we'll keep the mock data structure
        return {
          totalRecords: 0, // Placeholder, will be updated
          inRecords: 0, // Placeholder, will be updated
          outRecords: 0, // Placeholder, will be updated
          pendingRecords: 0, // Placeholder, will be updated
          todayRecords: 0, // Placeholder, will be updated
          thisMonthRecords: 0, // Placeholder, will be updated
        };
      } else {
        toast({
          title: '获取统计数据失败',
          description: res.message || '未知错误',
          variant: 'destructive',
        });
        return {
          totalRecords: 0,
          inRecords: 0,
          outRecords: 0,
          pendingRecords: 0,
          todayRecords: 0,
          thisMonthRecords: 0,
        };
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: '获取统计数据失败',
        description: '服务器错误',
        variant: 'destructive',
      });
      return {
        totalRecords: 0,
        inRecords: 0,
        outRecords: 0,
        pendingRecords: 0,
        todayRecords: 0,
        thisMonthRecords: 0,
      };
    }
  };

  const getAvailableAssets = async () => {
    try {
      const res = await assetAPI.getAvailableAssets();
      if (res.success) {
        return res.data;
      } else {
        toast({
          title: '获取可用资产失败',
          description: res.message || '未知错误',
          variant: 'destructive',
        });
        return [];
      }
    } catch (error) {
      console.error('Error fetching available assets:', error);
      toast({
        title: '获取可用资产失败',
        description: '服务器错误',
        variant: 'destructive',
      });
      return [];
    }
  };

  const addInventoryRecord = async (record: InventoryRecord) => {
    try {
      const res = await assetAPI.addInventoryRecord(record);
      if (res.success) {
        setRecords(prev => [res.data, ...prev]);
        toast({
          title: '入库成功',
          description: `记录 ${res.data.recordNumber} 已添加`,
          duration: 2000,
        });
      } else {
        toast({
          title: '入库失败',
          description: res.message || '未知错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding inventory record:', error);
      toast({
        title: '入库失败',
        description: '服务器错误',
        variant: 'destructive',
      });
    }
  };

  const updateInventoryRecord = async (recordId: string, updates: Partial<InventoryRecord>) => {
    try {
      const res = await assetAPI.updateInventoryRecord(recordId, updates);
      if (res.success) {
        setRecords(prev => prev.map(record => record.id === recordId ? res.data : record));
        toast({
          title: '更新成功',
          description: `记录 ${res.data.recordNumber} 已更新`,
          duration: 2000,
        });
      } else {
        toast({
          title: '更新失败',
          description: res.message || '未知错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating inventory record:', error);
      toast({
        title: '更新失败',
        description: '服务器错误',
        variant: 'destructive',
      });
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await assetAPI.getInventoryRecords();
      if (res.success) {
        setRecords(res.data);
      } else {
        toast({
          title: '获取记录失败',
          description: res.message || '未知错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        title: '获取记录失败',
        description: '服务器错误',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchRecords();
    getStatistics().then(stats => {
      // Update mock data with actual statistics
      // This part needs to be updated to reflect actual backend data
      // For now, we'll keep the mock data structure
      // setStatistics(stats); 
    });
    getAvailableAssets().then(assets => {
      // setAvailableAssets(assets);
    });
  }, []);

  // 表单实例
  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      type: 'in',
      reason: 'purchase',
      quantity: 1,
      operationDate: new Date().toISOString().split('T')[0],
    },
  });

  // 监听类型变化，自动调整原因选项
  const watchType = form.watch('type');

  // 出入库原因映射
  const reasonMap = {
    in: {
      purchase: '采购入库',
      return: '退货入库',
      transfer_in: '调拨入库',
      repair_in: '维修入库',
      other: '其他入库',
    },
    out: {
      allocation: '分配出库',
      transfer_out: '调拨出库',
      repair_out: '维修出库',
      scrap: '报废出库',
      loss: '丢失出库',
      other: '其他出库',
    },
  };

  // 状态映射
  const statusMap = {
    pending: { label: '待审批', color: 'bg-yellow-500', icon: Clock },
    approved: { label: '已审批', color: 'bg-blue-500', icon: CheckCircle },
    completed: { label: '已完成', color: 'bg-green-500', icon: CheckCircle },
    cancelled: { label: '已取消', color: 'bg-red-500', icon: XCircle },
  };

  // 筛选记录
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.recordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesReason = reasonFilter === 'all' || record.reason === reasonFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesReason;
  });

  // 获取状态标签
  const getStatusBadge = (status: InventoryStatus) => {
    const statusInfo = statusMap[status];
    const Icon = statusInfo.icon;
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        <Icon className="mr-1 h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  // 获取类型标签
  const getTypeBadge = (type: InventoryType) => {
    return type === 'in' ? (
      <Badge className="bg-green-100 text-green-800">
        <ArrowDown className="mr-1 h-3 w-3" />
        入库
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <ArrowUp className="mr-1 h-3 w-3" />
        出库
      </Badge>
    );
  };

  // 获取原因标签
  const getReasonLabel = (type: InventoryType, reason: InventoryReason) => {
    return reasonMap[type][reason as keyof typeof reasonMap[typeof type]] || reason;
  };

  // 处理新增记录
  const handleAddRecord = async (data: InventoryFormData) => {
    const asset = await getAvailableAssets().then(assets => assets.find(a => a.id === data.assetId));
    if (!asset) {
      toast({
        title: '资产不存在',
        description: '请选择一个有效的资产',
        variant: 'destructive',
      });
      return;
    }

    const newRecord: InventoryRecord = {
      id: Date.now().toString(), // Placeholder, will be updated by backend
      recordNumber: `INV-${data.type.toUpperCase()}-2024-${String(records.length + 1).padStart(3, '0')}`, // Placeholder, will be updated by backend
      type: data.type,
      reason: data.reason,
      asset: asset as any,
      quantity: data.quantity,
      fromLocation: data.fromLocationId ? assetLocations.find(l => l.id === data.fromLocationId) : undefined,
      toLocation: data.toLocationId ? assetLocations.find(l => l.id === data.toLocationId) : undefined,
      fromDepartment: data.fromDepartmentId ? departments.find(d => d.id === data.fromDepartmentId) : undefined,
      toDepartment: data.toDepartmentId ? departments.find(d => d.id === data.toDepartmentId) : undefined,
      fromCustodian: data.fromCustodianId ? users.find(u => u.id === data.fromCustodianId) : undefined,
      toCustodian: data.toCustodianId ? users.find(u => u.id === data.toCustodianId) : undefined,
      project: data.projectId ? projects.find(p => p.id === data.projectId) : undefined,
      operator: users[0], // 当前用户
      status: 'pending',
      operationDate: data.operationDate,
      notes: data.notes,
      attachments: [],
      createdAt: new Date().toISOString(), // Placeholder, will be updated by backend
      updatedAt: new Date().toISOString(), // Placeholder, will be updated by backend
    };

    await addInventoryRecord(newRecord);
    setIsAddDialogOpen(false);
    form.reset();
    fetchRecords(); // Refresh records after adding
  };

  // 查看记录详情
  const viewRecord = (record: InventoryRecord) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  // 审批记录
  const approveRecord = async (recordId: string) => {
    const updatedRecord = await updateInventoryRecord(recordId, { status: 'approved' as InventoryStatus });
    if (updatedRecord) {
      toast({
        title: '审批成功',
        description: `记录 ${updatedRecord.recordNumber} 已审批`,
        duration: 2000,
      });
      fetchRecords(); // Refresh records after approval
    }
  };

  // 完成记录
  const completeRecord = async (recordId: string) => {
    const updatedRecord = await updateInventoryRecord(recordId, { status: 'completed' as InventoryStatus });
    if (updatedRecord) {
      toast({
        title: '完成成功',
        description: `记录 ${updatedRecord.recordNumber} 已标记完成`,
        duration: 2000,
      });
      fetchRecords(); // Refresh records after completion
    }
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">出入库管理</h1>
            <p className="text-muted-foreground mt-1">管理资产的出入库操作和记录</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                快速出入库
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>快速出入库</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddRecord)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 出入库类型 */}
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>出入库类型 *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="请选择出入库类型" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="in">入库</SelectItem>
                              <SelectItem value="out">出库</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 出入库原因 */}
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>出入库原因 *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="请选择出入库原因" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(reasonMap[watchType]).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 选择资产 */}
                    <FormField
                      control={form.control}
                      name="assetId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>选择资产 *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="请选择资产" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* This will need to be updated to fetch assets from backend */}
                              {/* For now, using mock data */}
                              {users.map(asset => (
                                <SelectItem key={asset.id} value={asset.id}>
                                  {asset.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 数量 */}
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>数量 *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              placeholder="请输入数量" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 原位置（出库时） */}
                    {watchType === 'out' && (
                      <FormField
                        control={form.control}
                        name="fromLocationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>原位置</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择原位置" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">无</SelectItem>
                                {/* This will need to be updated to fetch locations from backend */}
                                {/* For now, using mock data */}
                                {departments.map(location => (
                                  <SelectItem key={location.id} value={location.id}>
                                    {location.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* 目标位置（入库时） */}
                    {watchType === 'in' && (
                      <FormField
                        control={form.control}
                        name="toLocationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>目标位置</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择目标位置" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">无</SelectItem>
                                {/* This will need to be updated to fetch locations from backend */}
                                {/* For now, using mock data */}
                                {departments.map(location => (
                                  <SelectItem key={location.id} value={location.id}>
                                    {location.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* 原部门（出库时） */}
                    {watchType === 'out' && (
                      <FormField
                        control={form.control}
                        name="fromDepartmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>原部门</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择原部门" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">无</SelectItem>
                                {/* This will need to be updated to fetch departments from backend */}
                                {/* For now, using mock data */}
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
                    )}

                    {/* 目标部门（入库时） */}
                    {watchType === 'in' && (
                      <FormField
                        control={form.control}
                        name="toDepartmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>目标部门</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择目标部门" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">无</SelectItem>
                                {/* This will need to be updated to fetch departments from backend */}
                                {/* For now, using mock data */}
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
                    )}

                    {/* 原保管人（出库时） */}
                    {watchType === 'out' && (
                      <FormField
                        control={form.control}
                        name="fromCustodianId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>原保管人</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择原保管人" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">无</SelectItem>
                                {/* This will need to be updated to fetch users from backend */}
                                {/* For now, using mock data */}
                                {users.map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* 目标保管人（入库时） */}
                    {watchType === 'in' && (
                      <FormField
                        control={form.control}
                        name="toCustodianId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>目标保管人</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择目标保管人" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">无</SelectItem>
                                {/* This will need to be updated to fetch users from backend */}
                                {/* For now, using mock data */}
                                {users.map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* 关联项目 */}
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>关联项目</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="请选择关联项目（可选）" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">无关联项目</SelectItem>
                              {/* This will need to be updated to fetch projects from backend */}
                              {/* For now, using mock data */}
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

                    {/* 操作日期 */}
                    <FormField
                      control={form.control}
                      name="operationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>操作日期 *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 备注 */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>备注</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="请输入备注信息" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      <X className="mr-2 h-4 w-4" />
                      取消
                    </Button>
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      保存
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总记录数</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{records.length}</div>
              <p className="text-xs text-muted-foreground">
                入库 {records.filter(r => r.type === 'in').length} | 出库 {records.filter(r => r.type === 'out').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">待处理</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{records.filter(r => r.status === 'pending').length}</div>
              <p className="text-xs text-muted-foreground">
                需要审批的记录
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">今日记录</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{records.filter(r => r.operationDate === new Date().toISOString().split('T')[0]).length}</div>
              <p className="text-xs text-muted-foreground">
                今天的出入库操作
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">本月记录</CardTitle>
              <AlertTriangle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{records.filter(r => r.operationDate >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]).length}</div>
              <p className="text-xs text-muted-foreground">
                本月累计操作
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 出入库记录列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">出入库记录</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  导出
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  高级筛选
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索记录..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="in">入库</SelectItem>
                  <SelectItem value="out">出库</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待审批</SelectItem>
                  <SelectItem value="approved">已审批</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="原因" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部原因</SelectItem>
                  <SelectItem value="purchase">采购入库</SelectItem>
                  <SelectItem value="allocation">分配出库</SelectItem>
                  <SelectItem value="transfer_in">调拨入库</SelectItem>
                  <SelectItem value="transfer_out">调拨出库</SelectItem>
                  <SelectItem value="repair_in">维修入库</SelectItem>
                  <SelectItem value="repair_out">维修出库</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>记录编号</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>原因</TableHead>
                  <TableHead>资产信息</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>位置变更</TableHead>
                  <TableHead>部门变更</TableHead>
                  <TableHead>操作人</TableHead>
                  <TableHead>操作日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.recordNumber}</TableCell>
                    <TableCell>{getTypeBadge(record.type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getReasonLabel(record.type, record.reason)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.asset.name}</div>
                        <div className="text-sm text-muted-foreground">{record.asset.assetCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>{record.quantity}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {record.fromLocation && (
                          <div className="text-muted-foreground">从: {record.fromLocation.name}</div>
                        )}
                        {record.toLocation && (
                          <div className="text-foreground">到: {record.toLocation.name}</div>
                        )}
                        {!record.fromLocation && !record.toLocation && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {record.fromDepartment && (
                          <div className="text-muted-foreground">从: {record.fromDepartment.name}</div>
                        )}
                        {record.toDepartment && (
                          <div className="text-foreground">到: {record.toDepartment.name}</div>
                        )}
                        {!record.fromDepartment && !record.toDepartment && '-'}
                      </div>
                    </TableCell>
                    <TableCell>{record.operator.name}</TableCell>
                    <TableCell>{record.operationDate}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewRecord(record)}>
                            <Eye className="mr-2 h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          {record.status === 'pending' && (
                            <DropdownMenuItem onClick={() => approveRecord(record.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              审批通过
                            </DropdownMenuItem>
                          )}
                          {record.status === 'approved' && (
                            <DropdownMenuItem onClick={() => completeRecord(record.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              标记完成
                            </DropdownMenuItem>
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

        {/* 查看详情对话框 */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>出入库记录详情</DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">记录编号</Label>
                    <p className="text-foreground font-medium">{selectedRecord.recordNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">出入库类型</Label>
                    <div className="mt-1">{getTypeBadge(selectedRecord.type)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">出入库原因</Label>
                    <p className="text-foreground">{getReasonLabel(selectedRecord.type, selectedRecord.reason)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">资产信息</Label>
                    <p className="text-foreground">{selectedRecord.asset.assetCode} - {selectedRecord.asset.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">数量</Label>
                    <p className="text-foreground">{selectedRecord.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">操作人</Label>
                    <p className="text-foreground">{selectedRecord.operator.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">操作日期</Label>
                    <p className="text-foreground">{selectedRecord.operationDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">状态</Label>
                    <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                  </div>
                  {selectedRecord.fromLocation && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">原位置</Label>
                      <p className="text-foreground">{selectedRecord.fromLocation.name}</p>
                    </div>
                  )}
                  {selectedRecord.toLocation && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">目标位置</Label>
                      <p className="text-foreground">{selectedRecord.toLocation.name}</p>
                    </div>
                  )}
                  {selectedRecord.fromDepartment && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">原部门</Label>
                      <p className="text-foreground">{selectedRecord.fromDepartment.name}</p>
                    </div>
                  )}
                  {selectedRecord.toDepartment && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">目标部门</Label>
                      <p className="text-foreground">{selectedRecord.toDepartment.name}</p>
                    </div>
                  )}
                  {selectedRecord.fromCustodian && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">原保管人</Label>
                      <p className="text-foreground">{selectedRecord.fromCustodian.name}</p>
                    </div>
                  )}
                  {selectedRecord.toCustodian && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">目标保管人</Label>
                      <p className="text-foreground">{selectedRecord.toCustodian.name}</p>
                    </div>
                  )}
                  {selectedRecord.project && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">关联项目</Label>
                      <p className="text-foreground">{selectedRecord.project.name}</p>
                    </div>
                  )}
                  {selectedRecord.approver && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">审批人</Label>
                      <p className="text-foreground">{selectedRecord.approver.name}</p>
                    </div>
                  )}
                  {selectedRecord.approvalDate && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">审批日期</Label>
                      <p className="text-foreground">{selectedRecord.approvalDate}</p>
                    </div>
                  )}
                  {selectedRecord.completionDate && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">完成日期</Label>
                      <p className="text-foreground">{selectedRecord.completionDate}</p>
                    </div>
                  )}
                </div>
                {selectedRecord.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">备注</Label>
                    <p className="text-foreground mt-1">{selectedRecord.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AssetInventoryManagement;
