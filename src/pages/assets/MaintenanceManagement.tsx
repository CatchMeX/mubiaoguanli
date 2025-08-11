import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Calendar,
  Settings,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Package,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import api, { maintenancePlanAPI, maintenanceRecordAPI, assetAPI, userAPI, supplierAPI } from '@/services/api';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import type { MaintenancePlan, MaintenanceRecord, Asset, User as UserType, Supplier } from '@/types';

const MaintenanceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isCreateRecordOpen, setIsCreateRecordOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null>(null);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPlan, setNewPlan] = useState({
    assetId: '',
    planName: '',
    type: 'preventive' as 'preventive' | 'corrective' | 'emergency',
    frequency: 'quarterly' as 'monthly' | 'quarterly' | 'semi_annual' | 'annual',
    nextDate: '',
    responsibleId: '',
    description: '',
    cost: 0,
    status: 'active' as 'active' | 'inactive',
  });

  const [newRecord, setNewRecord] = useState({
    assetId: '',
    planId: '',
    type: 'preventive' as 'preventive' | 'corrective' | 'emergency',
    description: '',
    startDate: '',
    endDate: '',
    cost: 0,
    supplierId: '',
    technicianId: '',
    result: 'completed' as 'completed' | 'failed' | 'partial',
    nextMaintenanceDate: '',
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
              const [plansData, recordsData, assetsData, usersData, suppliersData] = await Promise.all([
          maintenancePlanAPI.getMaintenancePlans(),
          maintenanceRecordAPI.getMaintenanceRecords(),
          assetAPI.getAssets(),
          userAPI.getUsersWithRelations(),
          supplierAPI.getAll()
        ]);
      setPlans(plansData);
      setRecords(recordsData);
      setAssets(assetsData);
      setUsers(usersData);
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('加载数据失败:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
      toast({
        title: '加载数据失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 过滤维保计划
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.asset.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    const matchesType = typeFilter === 'all' || plan.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // 过滤维保记录
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // 获取类型名称
  const getTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'preventive': '预防性维护',
      'corrective': '纠正性维护',
      'emergency': '紧急维护'
    };
    return typeMap[type] || type;
  };

  // 获取频率名称
  const getFrequencyName = (frequency: string) => {
    const frequencyMap: { [key: string]: string } = {
      'monthly': '每月',
      'quarterly': '每季度',
      'semi_annual': '每半年',
      'annual': '每年'
    };
    return frequencyMap[frequency] || frequency;
  };

  // 获取结果名称
  const getResultName = (result: string) => {
    const resultMap: { [key: string]: string } = {
      'completed': '已完成',
      'failed': '失败',
      'partial': '部分完成'
    };
    return resultMap[result] || result;
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取类型样式
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'preventive': return 'bg-blue-100 text-blue-800';
      case 'corrective': return 'bg-yellow-100 text-yellow-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取结果样式
  const getResultStyle = (result: string) => {
    switch (result) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 创建维保计划
  const handleCreatePlan = async () => {
    try {
      // 验证必填字段
      if (!newPlan.assetId) {
        toast({
          title: '请选择资产',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.planName) {
        toast({
          title: '请输入计划名称',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.type) {
        toast({
          title: '请选择维保类型',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.frequency) {
        toast({
          title: '请选择维保频率',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.nextDate) {
        toast({
          title: '请选择下次维保日期',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.responsibleId) {
        toast({
          title: '请选择负责人',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.description) {
        toast({
          title: '请输入维保内容',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.status) {
        toast({
          title: '请选择状态',
          variant: 'destructive',
        });
        return;
      }

      await maintenancePlanAPI.createMaintenancePlan({
        asset_id: newPlan.assetId,
        plan_name: newPlan.planName,
        type: newPlan.type,
        frequency: newPlan.frequency,
        next_date: newPlan.nextDate,
        responsible_id: newPlan.responsibleId,
        description: newPlan.description,
        cost: newPlan.cost,
        status: newPlan.status,
      });

      await loadData();
      setIsCreatePlanOpen(false);
      setNewPlan({
        assetId: '',
        planName: '',
        type: 'preventive',
        frequency: 'quarterly',
        nextDate: '',
        responsibleId: '',
        description: '',
        cost: 0,
        status: 'active',
      });
      toast({
        title: '创建成功',
        description: '维保计划已创建',
        duration: 2000,
      });
    } catch (err) {
      console.error('创建维保计划失败:', err);
      toast({
        title: '创建失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 创建维保记录
  const handleCreateRecord = async () => {
    try {
      // 验证必填字段
      if (!newRecord.assetId) {
        toast({
          title: '请选择资产',
          variant: 'destructive',
        });
        return;
      }
      if (!newRecord.planId || newRecord.planId === 'none') {
        toast({
          title: '请选择关联计划',
          variant: 'destructive',
        });
        return;
      }
      if (!newRecord.type) {
        toast({
          title: '请选择维保类型',
          variant: 'destructive',
        });
        return;
      }
      if (!newRecord.result) {
        toast({
          title: '请选择维保结果',
          variant: 'destructive',
        });
        return;
      }
      if (!newRecord.startDate) {
        toast({
          title: '请选择开始日期',
          variant: 'destructive',
        });
        return;
      }
      if (!newRecord.endDate) {
        toast({
          title: '请选择结束日期',
          variant: 'destructive',
        });
        return;
      }
      if (!newRecord.technicianId) {
        toast({
          title: '请选择技术员',
          variant: 'destructive',
        });
        return;
      }
      if (!newRecord.cost || newRecord.cost === 0) {
        toast({
          title: '请输入实际费用',
          variant: 'destructive',
        });
        return;
      }
      if (!newRecord.supplierId || newRecord.supplierId === 'none') {
        toast({
          title: '请选择供应商',
          variant: 'destructive',
        });
        return;
      }
      if (!newRecord.nextMaintenanceDate) {
        toast({
          title: '请选择下次维保日期',
          variant: 'destructive',
        });
        return;
      }
      if (!newRecord.description) {
        toast({
          title: '请输入维保内容',
          variant: 'destructive',
        });
        return;
      }

      await maintenanceRecordAPI.createMaintenanceRecord({
        asset_id: newRecord.assetId,
        plan_id: newRecord.planId === 'none' ? undefined : newRecord.planId,
        type: newRecord.type,
        description: newRecord.description,
        start_date: newRecord.startDate,
        end_date: newRecord.endDate,
        cost: newRecord.cost,
        supplier_id: newRecord.supplierId === 'none' ? undefined : newRecord.supplierId,
        technician: newRecord.technicianId,
        result: newRecord.result,
        next_maintenance_date: newRecord.nextMaintenanceDate,
      });

      await loadData();
      setIsCreateRecordOpen(false);
      setNewRecord({
        assetId: '',
        planId: '',
        type: 'preventive',
        description: '',
        startDate: '',
        endDate: '',
        cost: 0,
        supplierId: '',
        technicianId: '',
        result: 'completed',
        nextMaintenanceDate: '',
      });
      toast({
        title: '创建成功',
        description: '维保记录已创建',
        duration: 2000,
      });
    } catch (err) {
      console.error('创建维保记录失败:', err);
      toast({
        title: '创建失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 编辑维保计划
  const handleEditPlan = (plan: MaintenancePlan) => {
    setEditingPlan(plan);
    setNewPlan({
      assetId: plan.asset_id,
      planName: plan.plan_name,
      type: plan.type,
      frequency: plan.frequency,
      nextDate: plan.next_date,
      responsibleId: plan.responsible_id,
      description: plan.description || '',
      cost: plan.cost || 0,
      status: plan.status,
    });
  };

  // 更新维保计划
  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    try {
      // 验证必填字段
      if (!newPlan.assetId) {
        toast({
          title: '请选择资产',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.planName) {
        toast({
          title: '请输入计划名称',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.type) {
        toast({
          title: '请选择维保类型',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.frequency) {
        toast({
          title: '请选择维保频率',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.nextDate) {
        toast({
          title: '请选择下次维保日期',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.responsibleId) {
        toast({
          title: '请选择负责人',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.description) {
        toast({
          title: '请输入维保内容',
          variant: 'destructive',
        });
        return;
      }
      if (!newPlan.status) {
        toast({
          title: '请选择状态',
          variant: 'destructive',
        });
        return;
      }

      await maintenancePlanAPI.updateMaintenancePlan(editingPlan.id, {
        asset_id: newPlan.assetId,
        plan_name: newPlan.planName,
        type: newPlan.type,
        frequency: newPlan.frequency,
        next_date: newPlan.nextDate,
        responsible_id: newPlan.responsibleId,
        description: newPlan.description,
        cost: newPlan.cost,
        status: newPlan.status,
      });

      await loadData();
      setEditingPlan(null);
      setNewPlan({
        assetId: '',
        planName: '',
        type: 'preventive',
        frequency: 'quarterly',
        nextDate: '',
        responsibleId: '',
        description: '',
        cost: 0,
        status: 'active',
      });
      toast({
        title: '更新成功',
        description: '维保计划已更新',
        duration: 2000,
      });
    } catch (err) {
      console.error('更新维保计划失败:', err);
      toast({
        title: '更新失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 删除维保计划
  const handleDeletePlan = async (id: string) => {
    try {
      await maintenancePlanAPI.delete(id);
      await loadData();
      toast({
        title: '删除成功',
        description: '维保计划已删除',
        duration: 2000,
      });
    } catch (err) {
      console.error('删除维保计划失败:', err);
      toast({
        title: '删除失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 删除维保记录
  const handleDeleteRecord = async (id: string) => {
    try {
      await maintenanceRecordAPI.delete(id);
      await loadData();
      toast({
        title: '删除成功',
        description: '维保记录已删除',
        duration: 2000,
      });
    } catch (err) {
      console.error('删除维保记录失败:', err);
      toast({
        title: '删除失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 渲染维保记录表格行
  const renderRecordRow = (record: MaintenanceRecord) => (
    <TableRow key={record.id}>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{record.asset.name}</div>
            <div className="text-sm text-muted-foreground">{record.asset.code}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getTypeStyle(record.type)}>
          {getTypeName(record.type)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{record.start_date}</span>
          {record.end_date && (
            <>
              <span>~</span>
              <span>{record.end_date}</span>
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <span className="text-foreground">{record.technician}</span>
          {record.supplier && (
            <div className="text-muted-foreground text-xs">{record.supplier.name}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">¥{(record.cost || 0).toLocaleString()}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={getResultStyle(record.result)}>
          {getResultName(record.result)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <DeleteButton 
            onConfirm={() => handleDeleteRecord(record.id)}
            itemName="维保记录"
            description="删除后将无法恢复该维保记录"
            size="sm" 
          />
        </div>
      </TableCell>
    </TableRow>
  );

  // 渲染维保计划表格行
  const renderPlanRow = (plan: MaintenancePlan) => (
    <TableRow key={plan.id}>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{plan.asset.name}</div>
            <div className="text-sm text-muted-foreground">{plan.asset.code}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{plan.plan_name}</div>
      </TableCell>
      <TableCell>
        <Badge className={getTypeStyle(plan.type)}>
          {getTypeName(plan.type)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{getFrequencyName(plan.frequency)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{plan.next_date}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{plan.responsible.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">¥{(plan.cost || 0).toLocaleString()}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={getStatusStyle(plan.status)}>
          {plan.status === 'active' ? '启用' : '停用'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleEditPlan(plan)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            onClick={() => handleDeletePlan(plan.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">维保管理</h1>
            <p className="text-muted-foreground mt-1">管理资产维保计划和记录</p>
          </div>
        </div>

        {/* 搜索和筛选栏 */}
        <Card className="bg-card border-border theme-transition">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索资产名称、编号或维保内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="preventive">预防性维保</SelectItem>
                  <SelectItem value="corrective">纠正性维保</SelectItem>
                  <SelectItem value="emergency">紧急维保</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 维保管理标签页 */}
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="plans" className="data-[state=active]:bg-background">维保计划</TabsTrigger>
            <TabsTrigger value="records" className="data-[state=active]:bg-background">维保记录</TabsTrigger>
          </TabsList>

          {/* 维保计划 */}
          <TabsContent value="plans" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4" />
                    新增计划
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>新增维保计划</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="asset">选择资产 <span className="text-red-500">*</span></Label>
                        <Select value={newPlan.assetId} onValueChange={(value) => setNewPlan(prev => ({ ...prev, assetId: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="选择资产" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {assets.map(asset => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {asset.code} - {asset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="planName">计划名称 <span className="text-red-500">*</span></Label>
                        <Input
                          id="planName"
                          value={newPlan.planName}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, planName: e.target.value }))}
                          className="bg-background border-border text-foreground"
                          placeholder="请输入计划名称"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">维保类型 <span className="text-red-500">*</span></Label>
                        <Select value={newPlan.type} onValueChange={(value: 'preventive' | 'corrective' | 'emergency') => setNewPlan(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="preventive">预防性维保</SelectItem>
                            <SelectItem value="corrective">纠正性维保</SelectItem>
                            <SelectItem value="emergency">紧急维保</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="frequency">维保频率 <span className="text-red-500">*</span></Label>
                        <Select value={newPlan.frequency} onValueChange={(value: 'monthly' | 'quarterly' | 'semi_annual' | 'annual') => setNewPlan(prev => ({ ...prev, frequency: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="monthly">每月</SelectItem>
                            <SelectItem value="quarterly">每季度</SelectItem>
                            <SelectItem value="semi_annual">每半年</SelectItem>
                            <SelectItem value="annual">每年</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nextDate">下次维保日期 <span className="text-red-500">*</span></Label>
                        <Input
                          id="nextDate"
                          type="date"
                          value={newPlan.nextDate}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, nextDate: e.target.value }))}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div>
                        <Label htmlFor="responsible">负责人 <span className="text-red-500">*</span></Label>
                        <Select value={newPlan.responsibleId} onValueChange={(value) => setNewPlan(prev => ({ ...prev, responsibleId: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="选择负责人" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} - {user.position?.name || '无职位'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cost">预计费用 <span className="text-red-500">*</span></Label>
                        <Input
                          id="cost"
                          type="number"
                          value={newPlan.cost}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, cost: Number(e.target.value) }))}
                          className="bg-background border-border text-foreground"
                          placeholder="请输入预计费用"
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">状态 <span className="text-red-500">*</span></Label>
                        <Select value={newPlan.status} onValueChange={(value: 'active' | 'inactive') => setNewPlan(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="active">启用</SelectItem>
                            <SelectItem value="inactive">停用</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">维保内容 <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="description"
                        value={newPlan.description}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-background border-border text-foreground"
                        placeholder="请输入维保内容描述"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleCreatePlan} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        创建
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-card border-border theme-transition">
              <CardHeader>
                <CardTitle className="text-foreground">维保计划列表</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">资产信息</TableHead>
                      <TableHead className="text-muted-foreground">计划名称</TableHead>
                      <TableHead className="text-muted-foreground">维保类型</TableHead>
                      <TableHead className="text-muted-foreground">频率</TableHead>
                      <TableHead className="text-muted-foreground">下次维保</TableHead>
                      <TableHead className="text-muted-foreground">负责人</TableHead>
                      <TableHead className="text-muted-foreground">预计费用</TableHead>
                      <TableHead className="text-muted-foreground">状态</TableHead>
                      <TableHead className="text-muted-foreground">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.map((plan) => {
                      const nextDate = new Date(plan.next_date);
                      const today = new Date();
                      const diffTime = nextDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const isOverdue = diffDays < 0;
                      const isUpcoming = diffDays <= 30 && diffDays >= 0;

                      return (
                        <TableRow key={plan.id} className="border-border">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground font-medium">{plan.asset.name}</span>
                              </div>
                              <Badge variant="outline" className="border-blue-500 text-blue-500">
                                {plan.asset.code}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-foreground">{plan.plan_name}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getTypeStyle(plan.type)}>
                              {getTypeName(plan.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">{getFrequencyName(plan.frequency)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className={`text-sm ${isOverdue ? 'text-red-500' : isUpcoming ? 'text-orange-500' : 'text-foreground'}`}>
                                {new Date(plan.next_date).toLocaleDateString('zh-CN')}
                              </span>
                              {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              {isUpcoming && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">{plan.responsible.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">¥{(plan.cost || 0).toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={plan.status === 'active' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}>
                              {plan.status === 'active' ? '启用' : '停用'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog open={editingPlan?.id === plan.id} onOpenChange={(open) => !open && setEditingPlan(null)}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                                    onClick={() => handleEditPlan(plan)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>编辑维保计划</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="edit-asset">选择资产</Label>
                                        <Select value={newPlan.assetId} onValueChange={(value) => setNewPlan(prev => ({ ...prev, assetId: value }))}>
                                          <SelectTrigger className="bg-background border-border text-foreground">
                                            <SelectValue placeholder="选择资产" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-popover border-border">
                                            {assets.map(asset => (
                                              <SelectItem key={asset.id} value={asset.id}>
                                                {asset.code} - {asset.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-planName">计划名称</Label>
                                        <Input
                                          id="edit-planName"
                                          value={newPlan.planName}
                                          onChange={(e) => setNewPlan(prev => ({ ...prev, planName: e.target.value }))}
                                          className="bg-background border-border text-foreground"
                                          placeholder="请输入计划名称"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="edit-type">维保类型</Label>
                                        <Select value={newPlan.type} onValueChange={(value: 'preventive' | 'corrective' | 'emergency') => setNewPlan(prev => ({ ...prev, type: value }))}>
                                          <SelectTrigger className="bg-background border-border text-foreground">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="bg-popover border-border">
                                            <SelectItem value="preventive">预防性维保</SelectItem>
                                            <SelectItem value="corrective">纠正性维保</SelectItem>
                                            <SelectItem value="emergency">紧急维保</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-frequency">维保频率</Label>
                                        <Select value={newPlan.frequency} onValueChange={(value: 'monthly' | 'quarterly' | 'semi_annual' | 'annual') => setNewPlan(prev => ({ ...prev, frequency: value }))}>
                                          <SelectTrigger className="bg-background border-border text-foreground">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="bg-popover border-border">
                                            <SelectItem value="monthly">每月</SelectItem>
                                            <SelectItem value="quarterly">每季度</SelectItem>
                                            <SelectItem value="semi_annual">每半年</SelectItem>
                                            <SelectItem value="annual">每年</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="edit-nextDate">下次维保日期</Label>
                                        <Input
                                          id="edit-nextDate"
                                          type="date"
                                          value={newPlan.nextDate}
                                          onChange={(e) => setNewPlan(prev => ({ ...prev, nextDate: e.target.value }))}
                                          className="bg-background border-border text-foreground"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-responsible">负责人</Label>
                                        <Select value={newPlan.responsibleId} onValueChange={(value) => setNewPlan(prev => ({ ...prev, responsibleId: value }))}>
                                          <SelectTrigger className="bg-background border-border text-foreground">
                                            <SelectValue placeholder="选择负责人" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-popover border-border">
                                            {users.map(user => (
                                              <SelectItem key={user.id} value={user.id}>
                                                {user.name} - {user.position?.name || '无职位'}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="edit-cost">预计费用</Label>
                                        <Input
                                          id="edit-cost"
                                          type="number"
                                          value={newPlan.cost}
                                          onChange={(e) => setNewPlan(prev => ({ ...prev, cost: Number(e.target.value) }))}
                                          className="bg-background border-border text-foreground"
                                          placeholder="请输入预计费用"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-status">状态</Label>
                                        <Select value={newPlan.status} onValueChange={(value: 'active' | 'inactive') => setNewPlan(prev => ({ ...prev, status: value }))}>
                                          <SelectTrigger className="bg-background border-border text-foreground">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="bg-popover border-border">
                                            <SelectItem value="active">启用</SelectItem>
                                            <SelectItem value="inactive">停用</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-description">维保内容</Label>
                                      <Textarea
                                        id="edit-description"
                                        value={newPlan.description}
                                        onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                                        className="bg-background border-border text-foreground"
                                        placeholder="请输入维保内容描述"
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline" onClick={() => setEditingPlan(null)}>
                                        取消
                                      </Button>
                                      <Button onClick={handleUpdatePlan} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                        更新
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <DeleteButton 
                                onConfirm={() => handleDeletePlan(plan.id)}
                                itemName="维保计划"
                                description="删除后将无法恢复该维保计划"
                                size="sm" 
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 维保记录 */}
          <TabsContent value="records" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={isCreateRecordOpen} onOpenChange={setIsCreateRecordOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4" />
                    新增记录
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>新增维保记录</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="record-asset">选择资产 <span className="text-red-500">*</span></Label>
                        <Select value={newRecord.assetId} onValueChange={(value) => {
                          setNewRecord(prev => ({ ...prev, assetId: value, planId: '' }));
                          // 当选择资产时，自动设置维保类型为预防性维保
                          setNewRecord(prev => ({ ...prev, type: 'preventive' }));
                        }}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="选择资产" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {assets.map(asset => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {asset.code} - {asset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="record-plan">关联计划 <span className="text-red-500">*</span></Label>
                        <Select value={newRecord.planId} onValueChange={(value) => {
                          setNewRecord(prev => ({ ...prev, planId: value }));
                          // 当选择计划时，自动设置维保类型
                          if (value !== 'none') {
                            const selectedPlan = plans.find(plan => plan.id === value);
                            if (selectedPlan) {
                              setNewRecord(prev => ({ ...prev, type: selectedPlan.type }));
                            }
                          }
                        }}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="选择计划" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="none">无关联计划</SelectItem>
                            {plans.filter(plan => plan.asset_id === newRecord.assetId).map(plan => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.plan_name} ({getTypeName(plan.type)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="record-type">维保类型 <span className="text-red-500">*</span></Label>
                        <Select value={newRecord.type} onValueChange={(value: 'preventive' | 'corrective' | 'emergency') => setNewRecord(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="preventive">预防性维保</SelectItem>
                            <SelectItem value="corrective">纠正性维保</SelectItem>
                            <SelectItem value="emergency">紧急维保</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="record-result">维保结果 <span className="text-red-500">*</span></Label>
                        <Select value={newRecord.result} onValueChange={(value: 'completed' | 'failed' | 'partial') => setNewRecord(prev => ({ ...prev, result: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="completed">已完成</SelectItem>
                            <SelectItem value="failed">失败</SelectItem>
                            <SelectItem value="partial">部分完成</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="record-startDate">开始日期 <span className="text-red-500">*</span></Label>
                        <Input
                          id="record-startDate"
                          type="date"
                          value={newRecord.startDate}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, startDate: e.target.value }))}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div>
                        <Label htmlFor="record-endDate">结束日期 <span className="text-red-500">*</span></Label>
                        <Input
                          id="record-endDate"
                          type="date"
                          value={newRecord.endDate}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, endDate: e.target.value }))}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                                              <div>
                          <Label htmlFor="record-technician">技术员 <span className="text-red-500">*</span></Label>
                          <Select value={newRecord.technicianId} onValueChange={(value) => setNewRecord(prev => ({ ...prev, technicianId: value }))}>
                            <SelectTrigger className="bg-background border-border text-foreground">
                              <SelectValue placeholder="选择技术员" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} - {user.position?.name || '无职位'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      <div>
                        <Label htmlFor="record-cost">实际费用 <span className="text-red-500">*</span></Label>
                        <Input
                          id="record-cost"
                          type="number"
                          value={newRecord.cost}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, cost: Number(e.target.value) }))}
                          className="bg-background border-border text-foreground"
                          placeholder="请输入实际费用"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="record-supplier">供应商 <span className="text-red-500">*</span></Label>
                        <Select value={newRecord.supplierId} onValueChange={(value) => setNewRecord(prev => ({ ...prev, supplierId: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="选择供应商" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="none">无供应商</SelectItem>
                            {suppliers.map(supplier => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="record-nextDate">下次维保日期 <span className="text-red-500">*</span></Label>
                        <Input
                          id="record-nextDate"
                          type="date"
                          value={newRecord.nextMaintenanceDate}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="record-description">维保内容 <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="record-description"
                        value={newRecord.description}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-background border-border text-foreground"
                        placeholder="请输入维保内容描述"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateRecordOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleCreateRecord} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        创建
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-card border-border theme-transition">
              <CardHeader>
                <CardTitle className="text-foreground">维保记录列表</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">资产信息</TableHead>
                      <TableHead className="text-muted-foreground">维保类型</TableHead>
                      <TableHead className="text-muted-foreground">维保内容</TableHead>
                      <TableHead className="text-muted-foreground">维保时间</TableHead>
                      <TableHead className="text-muted-foreground">技术员</TableHead>
                      <TableHead className="text-muted-foreground">费用</TableHead>
                      <TableHead className="text-muted-foreground">结果</TableHead>
                      <TableHead className="text-muted-foreground">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id} className="border-border">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground font-medium">{record.asset.name}</span>
                            </div>
                            <Badge variant="outline" className="border-blue-500 text-blue-500">
                              {record.asset.code}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTypeStyle(record.type)}>
                            {getTypeName(record.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground text-sm">{record.description}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground text-sm">
                                {new Date(record.start_date).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                            <span className="text-muted-foreground text-xs">
                              至 {new Date(record.end_date || '').toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="text-foreground">
                              {users.find(user => user.id === record.technician)?.name || record.technician || '未指定'}
                            </span>
                            {record.supplier && (
                              <div className="text-muted-foreground text-xs">{record.supplier.name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">¥{(record.cost || 0).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getResultStyle(record.result)}>
                            {getResultName(record.result)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <DeleteButton 
                              onConfirm={() => handleDeleteRecord(record.id)}
                              itemName="维保记录"
                              description="删除后将无法恢复该维保记录"
                              size="sm" 
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MaintenanceManagement;
