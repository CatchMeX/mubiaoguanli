import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Building2,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  Receipt,
  Clock,
  CheckSquare,
  XCircle,
  Loader2,
  Calculator,
  Users,
  MoreHorizontal,
  Eye,
  Trash
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { revenueAPI, customerAPI, projectAPI, teamAPI, financeCategoryAPI } from '@/services/api';
import api from '@/services/api';
import type { Customer, Project, Team, TeamAllocationConfig, FinanceCategory } from '@/types';
import type { RevenueRecord } from '@/types/revenue';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';


const RevenueManagement = () => {
  const [revenues, setRevenues] = useState<RevenueRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<RevenueRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    customer_id: '',
    project_id: '',
    category_id: '',
    amount: '',
    revenue_date: new Date().toISOString().split('T')[0],
    description: '',
    is_allocation_enabled: false,
    team_id: ''
  });

  // 分摊相关状态
  const [teams, setTeams] = useState<Team[]>([]);
  const [allocationConfigs, setAllocationConfigs] = useState<TeamAllocationConfig[]>([]);
  const [allocationResults, setAllocationResults] = useState<Array<{
    team_id: string;
    team_name: string;
    allocation_ratio: number;
    allocated_amount: number;
    config_id: string;
  }>>([]);

  // 添加查看详情状态
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedRevenueForView, setSelectedRevenueForView] = useState<RevenueRecord | null>(null);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [revenueData, customersData, projectsData, categoriesData, teamsData, allocationConfigsData] = await Promise.all([
        revenueAPI.getRevenueRecords(),
        customerAPI.getAll(),
        projectAPI.getAll(),
        // 获取收入类别（finance_categories，type=income）
        financeCategoryAPI.getByType('income'),
        teamAPI.getAll(),
        teamAPI.getEnabledAllocationConfigs()
      ]);

      setRevenues(revenueData || []);
      setCustomers(customersData || []);
      setProjects(projectsData || []);
      setCategories(categoriesData || []);
      setTeams(teamsData || []);
      setAllocationConfigs(allocationConfigsData || []);
    } catch (err) {
      setError('加载数据失败，请重试');
      console.error('加载收入数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      console.log('开始创建收入记录，表单数据:', formData);
      
      if (!formData.customer_id || !formData.amount || !formData.description) {
        console.log('必填字段验证失败:', {
          customer_id: formData.customer_id,
          amount: formData.amount,
          description: formData.description
        });
        setError('请填写所有必填字段');
        return;
      }

      // 验证分摊相关字段
      if (formData.is_allocation_enabled) {
        const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
        console.log('分摊配置检查:', {
          enabledConfigsCount: enabledConfigs.length,
          allocationResultsCount: allocationResults.length
        });
        
        if (enabledConfigs.length === 0) {
          toast({
            title: '分摊配置错误',
            description: '请先在团队管理中配置分摊比例',
            variant: 'destructive',
          });
          return;
        }
        
        // 验证分摊比例总和是否为100%
        if (!validateAllocationRatios()) {
          const totalRatio = allocationResults.length > 0 ? 
            allocationResults.reduce((sum, result) => sum + result.allocation_ratio, 0) :
            enabledConfigs.reduce((sum, config) => sum + config.allocation_ratio, 0);
          toast({
            title: '分摊比例不正确',
            description: `当前分摊比例总和为 ${totalRatio.toFixed(2)}%，应为 100%`,
            variant: 'destructive',
          });
          return;
        }
      } else {
        if (!formData.team_id.trim()) {
          toast({
            title: '请选择关联团队',
            variant: 'destructive',
          });
          return;
        }
      }

      const revenueData = {
        customer_id: formData.customer_id,
        amount: parseFloat(formData.amount),
        revenue_date: formData.revenue_date,
        description: formData.description,
        project_id: formData.project_id === 'none' || !formData.project_id ? null : formData.project_id,
        category_id:
          !formData.category_id || formData.category_id === 'none'
            ? null
            : formData.category_id,
        // 添加必要的默认字段
        tax_amount: 0,
        net_amount: parseFloat(formData.amount),
        payment_method: 'bank_transfer' as const,
        payment_status: 'pending' as const,
        received_amount: 0,
        remaining_amount: parseFloat(formData.amount),
        record_number: `REV-${Date.now()}`,
        team_id: formData.is_allocation_enabled ? undefined : formData.team_id, // 如果不分摊，保存关联团队
        is_allocation_enabled: formData.is_allocation_enabled
      };

      console.log('准备创建收入记录:', revenueData);
      console.log('category_id 原始值:', formData.category_id);
      console.log('category_id 处理后值:', revenueData.category_id);

      // 创建收入记录
      const revenueRecord = await revenueAPI.createRevenueRecord(revenueData);
      console.log('收入记录创建成功:', revenueRecord);

      // 如果启用了分摊，创建分摊记录
      if (formData.is_allocation_enabled) {
        try {
          // 获取分摊配置
          const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
          const amount = parseFloat(formData.amount) || 0;
          
          console.log('准备创建分摊记录:', {
            enabledConfigsCount: enabledConfigs.length,
            amount: amount
          });
          
          // 创建分摊记录
          const allocationPromises = enabledConfigs.map(config => {
            const allocatedAmount = (amount * config.allocation_ratio) / 100;
            const params = {
              source_record_type: 'revenue' as const,
              source_record_id: revenueRecord.id,
              allocation_config_id: config.id,
              allocated_amount: allocatedAmount,
              allocation_date: formData.revenue_date,
              description: `收入分摊: ${formData.description}`,
            };
            return api.allocation.createAllocationRecord(params);
          });
          
          await Promise.all(allocationPromises);
          console.log('分摊记录创建成功');
        } catch (allocationError) {
          console.error('创建分摊记录失败:', allocationError);
          toast({
            title: '收入记录创建成功',
            description: '但分摊记录创建失败，请稍后重试',
            variant: 'destructive',
          });
        }
      }

      await loadData();
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: '收入记录添加成功',
        description: formData.is_allocation_enabled ? '收入记录已创建并分摊到各团队' : '收入记录已创建',
        duration: 2000,
      });
    } catch (err) {
      console.error('创建收入记录失败:', err);
      setError('创建收入记录失败，请重试');
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selectedRevenue || !formData.customer_id || !formData.amount || !formData.description) {
        setError('请填写所有必填字段');
        return;
      }

      // 验证分摊相关字段
      if (formData.is_allocation_enabled) {
        const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
        if (enabledConfigs.length === 0) {
          toast({
            title: '分摊配置错误',
            description: '请先在团队管理中配置分摊比例',
            variant: 'destructive',
          });
          return;
        }
        
        // 验证分摊比例总和是否为100%
        if (!validateAllocationRatios()) {
          const totalRatio = allocationResults.length > 0 ? 
            allocationResults.reduce((sum, result) => sum + result.allocation_ratio, 0) :
            enabledConfigs.reduce((sum, config) => sum + config.allocation_ratio, 0);
          toast({
            title: '分摊比例不正确',
            description: `当前分摊比例总和为 ${totalRatio.toFixed(2)}%，应为 100%`,
            variant: 'destructive',
          });
          return;
        }
      } else {
        if (!formData.team_id.trim()) {
          toast({
            title: '请选择关联团队',
            variant: 'destructive',
          });
          return;
        }
      }

      const revenueData = {
        customer_id: formData.customer_id,
        amount: parseFloat(formData.amount),
        revenue_date: formData.revenue_date,
        description: formData.description,
        project_id: formData.project_id === 'none' || !formData.project_id ? null : formData.project_id,
        category_id:
          !formData.category_id || formData.category_id === 'none'
            ? null
            : formData.category_id,
        // 添加必要的默认字段
        tax_amount: 0,
        net_amount: parseFloat(formData.amount),
        payment_method: 'bank_transfer' as const,
        payment_status: 'pending' as const,
        received_amount: 0,
        remaining_amount: parseFloat(formData.amount),
        team_id: formData.is_allocation_enabled ? undefined : formData.team_id, // 如果不分摊，保存关联团队
        is_allocation_enabled: formData.is_allocation_enabled
      };

      // 更新收入记录
      await revenueAPI.updateRevenueRecord(selectedRevenue.id, revenueData);

      // 如果启用了分摊，更新分摊记录
      if (formData.is_allocation_enabled) {
        try {
          // 先获取并删除原有的分摊记录
          const existingAllocations = await api.revenue.getAllocationRecordsByRevenueId(selectedRevenue.id);
          for (const allocation of existingAllocations) {
            await api.allocation.deleteAllocationRecord(allocation.id);
          }
          
          // 获取分摊配置
          const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
          const amount = parseFloat(formData.amount) || 0;
          
          // 创建新的分摊记录
          const allocationPromises = enabledConfigs.map(config => {
            const allocatedAmount = (amount * config.allocation_ratio) / 100;
            const params = {
              source_record_type: 'revenue' as const,
              source_record_id: selectedRevenue.id,
              allocation_config_id: config.id,
              allocated_amount: allocatedAmount,
              allocation_date: formData.revenue_date,
              description: `收入分摊: ${formData.description}`,
            };
            return api.allocation.createAllocationRecord(params);
          });
          
          await Promise.all(allocationPromises);
        } catch (allocationError) {
          console.error('更新分摊记录失败:', allocationError);
          toast({
            title: '收入记录更新成功',
            description: '但分摊记录更新失败，请稍后重试',
            variant: 'destructive',
          });
        }
      } else {
        // 如果不分摊，删除原有的分摊记录
        try {
          const existingAllocations = await api.revenue.getAllocationRecordsByRevenueId(selectedRevenue.id);
          for (const allocation of existingAllocations) {
            await api.allocation.deleteAllocationRecord(allocation.id);
          }
        } catch (error) {
          console.error('删除分摊记录失败:', error);
        }
      }

      await loadData();
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: '收入记录更新成功',
        description: formData.is_allocation_enabled ? '收入记录已更新并重新分摊到各团队' : '收入记录已更新',
        duration: 2000,
      });
    } catch (err) {
      setError('更新收入记录失败，请重试');
      console.error('更新收入记录失败:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await revenueAPI.delete(id);
      loadData();
      toast({
        title: '收入记录删除成功',
        description: '收入记录及相关分摊记录已删除',
        duration: 2000,
      });
    } catch (err) {
      setError('删除收入记录失败，请重试');
      console.error('删除收入记录失败:', err);
      toast({
        title: '删除收入记录失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      project_id: '',
      category_id: '',
      amount: '',
      revenue_date: new Date().toISOString().split('T')[0],
      description: '',
      is_allocation_enabled: false,
      team_id: ''
    });
    setSelectedRevenue(null);
    setAllocationResults([]);
  };

  // 计算分摊结果
  const calculateAllocation = (amount: number = 0, customRatios?: { [teamId: string]: number }) => {
    if (!formData.is_allocation_enabled) {
      setAllocationResults([]);
      return;
    }

    const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);

    if (enabledConfigs.length === 0) {
      toast({
        title: '没有可用的分摊配置',
        description: '请先在团队管理中配置分摊比例',
        variant: 'destructive',
      });
      setAllocationResults([]);
      return;
    }

    const results = enabledConfigs.map(config => {
      const team = teams.find(t => t.id === config.team_id);
      const ratio = customRatios?.[config.team_id] ?? config.allocation_ratio;
      return {
        team_id: config.team_id,
        team_name: team?.name || '未知团队',
        allocation_ratio: ratio,
        allocated_amount: (amount * ratio) / 100,
        config_id: config.id,
      };
    });

    setAllocationResults(results);
  };

  // 更新分摊比例
  const updateAllocationRatio = (teamId: string, newRatio: number) => {
    setAllocationResults(prev => 
      prev.map(result => 
        result.team_id === teamId 
          ? { ...result, allocation_ratio: newRatio, allocated_amount: (parseFloat(formData.amount) * newRatio) / 100 }
          : result
      )
    );
  };

  // 验证分摊比例总和是否为100%
  const validateAllocationRatios = () => {
    let totalRatio = 0;
    
    if (allocationResults.length > 0) {
      totalRatio = allocationResults.reduce((sum, result) => sum + result.allocation_ratio, 0);
    } else {
      totalRatio = allocationConfigs.filter(config => config.is_enabled).reduce((sum, config) => sum + config.allocation_ratio, 0);
    }
    
    return Math.abs(totalRatio - 100) < 0.01; // 允许0.01%的误差
  };

  const openEditDialog = (revenue: RevenueRecord) => {
    setSelectedRevenue(revenue);
    setFormData({
      customer_id: revenue.customer.id,
      project_id: revenue.project?.id || '',
      category_id: revenue.category?.id || '',
      amount: revenue.amount.toString(),
      revenue_date: revenue.revenue_date,
      description: revenue.description,
      is_allocation_enabled: revenue.is_allocation_enabled || false,
      team_id: revenue.team_id || ''
    });
    
    // 如果启用了分摊，计算分摊结果
    if (revenue.is_allocation_enabled) {
      const amount = revenue.amount;
      calculateAllocation(amount);
    } else {
      setAllocationResults([]);
    }
    setIsEditDialogOpen(true);
  };

  // 过滤收入
  const filteredRevenues = revenues.filter(revenue => {
    const matchesSearch = revenue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         revenue.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         revenue.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || revenue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 修改状态相关函数
  const getStatusColor = (revenue: RevenueRecord) => {
    // 根据分摊记录判断状态
    const hasAllocations = revenue.allocation_records && revenue.allocation_records.length > 0;
    return hasAllocations ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500';
  };

  const getStatusName = (revenue: RevenueRecord) => {
    // 根据分摊记录判断状态
    const hasAllocations = revenue.allocation_records && revenue.allocation_records.length > 0;
    return hasAllocations ? '已分摊' : '未分摊';
  };

  const getStatusIcon = (revenue: RevenueRecord) => {
    // 根据分摊记录判断状态
    const hasAllocations = revenue.allocation_records && revenue.allocation_records.length > 0;
    return hasAllocations ? <CheckSquare className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  // 查看详情函数
  const openViewDialog = (revenue: RevenueRecord) => {
    setSelectedRevenueForView(revenue);
    setIsViewDialogOpen(true);
  };

  // 统计数据
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const allocatedRevenue = revenues.filter(r => r.allocation_records && r.allocation_records.length > 0).reduce((sum, r) => sum + r.amount, 0);
  const unallocatedRevenue = revenues.filter(r => !r.allocation_records || r.allocation_records.length === 0).reduce((sum, r) => sum + r.amount, 0);
  const overdueRevenue = revenues.filter(r => r.status === 'cancelled').reduce((sum, r) => sum + r.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadData}>重试</Button>
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
            <h1 className="text-3xl font-bold text-foreground">收入管理</h1>
            <p className="text-muted-foreground mt-1">管理客户收入和项目收款</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增收入
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle>新增收入记录</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer" className="text-sm font-medium flex items-center">
                      客户
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择客户" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium flex items-center">
                      收入金额
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="amount" 
                      type="number"
                      placeholder="请输入收入金额"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project" className="text-sm font-medium flex items-center">
                      关联项目
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择项目（可选）" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="none">无关联项目</SelectItem>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium flex items-center">
                      财务科目
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? '' : value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择财务科目（可选）" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="none">请选择收入类别</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium flex items-center">
                      收入日期
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={formData.revenue_date}
                      onChange={(e) => setFormData({ ...formData, revenue_date: e.target.value })}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>

                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium flex items-center">
                    收入描述
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea 
                    id="description" 
                    placeholder="请输入收入描述"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background border-border text-foreground" 
                  />
                </div>

                {/* 分摊设置 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allocation-enabled"
                      checked={formData.is_allocation_enabled}
                      onCheckedChange={(checked) => {
                        const newFormData = { ...formData, is_allocation_enabled: checked as boolean };
                        setFormData(newFormData);
                        if (checked) {
                          // 立即计算分摊结果，即使金额为0也要显示配置
                          calculateAllocation(parseFloat(formData.amount) || 0);
                        } else {
                          setAllocationResults([]);
                        }
                      }}
                    />
                    <Label htmlFor="allocation-enabled" className="text-sm font-medium">
                      启用分摊
                    </Label>
                  </div>

                  {formData.is_allocation_enabled ? (
                    <div className="space-y-4">
                      {allocationConfigs.filter(config => config.is_enabled).length > 0 ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <Calculator className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">分摊配置</span>
                          </div>
                          <p className="text-sm text-blue-700 mb-4">
                            可修改各团队的分摊比例，系统将自动计算分配金额
                          </p>
                          
                          {/* 分摊配置表格 */}
                          <div className="space-y-3">
                            <div className="grid grid-cols-4 gap-4 text-xs font-medium text-blue-800 border-b border-blue-200 pb-2">
                              <div>团队名称</div>
                              <div>默认比例</div>
                              <div>本次比例</div>
                              <div>分配金额</div>
                            </div>
                            
                            {allocationResults.length > 0 ? (
                              allocationResults.map((result, index) => {
                                const originalConfig = allocationConfigs.find(config => config.team_id === result.team_id);
                                return (
                                  <div key={result.team_id} className="grid grid-cols-4 gap-4 items-center text-sm">
                                    <div className="text-blue-700 font-medium">{result.team_name}</div>
                                    <div className="text-blue-600">{originalConfig?.allocation_ratio || 0}%</div>
                <div>
                  <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={result.allocation_ratio}
                                        onChange={(e) => {
                                          const newRatio = parseFloat(e.target.value) || 0;
                                          updateAllocationRatio(result.team_id, newRatio);
                                        }}
                                        className="w-20 h-8 text-xs bg-white border-blue-300"
                                      />
                                      <span className="text-blue-600 ml-1">%</span>
                                    </div>
                                    <div className="text-green-600 font-medium">
                                      ¥{result.allocated_amount.toFixed(2)}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              // 如果allocationResults为空，显示默认配置
                              allocationConfigs.filter(config => config.is_enabled).map((config) => {
                                const team = teams.find(t => t.id === config.team_id);
                                return (
                                  <div key={config.team_id} className="grid grid-cols-4 gap-4 items-center text-sm">
                                    <div className="text-blue-700 font-medium">{team?.name || '未知团队'}</div>
                                    <div className="text-blue-600">{config.allocation_ratio}%</div>
                                    <div>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={config.allocation_ratio}
                                        onChange={(e) => {
                                          const newRatio = parseFloat(e.target.value) || 0;
                                          updateAllocationRatio(config.team_id, newRatio);
                                        }}
                                        className="w-20 h-8 text-xs bg-white border-blue-300"
                                      />
                                      <span className="text-blue-600 ml-1">%</span>
                                    </div>
                                    <div className="text-green-600 font-medium">
                                      ¥{((parseFloat(formData.amount) || 0) * config.allocation_ratio / 100).toFixed(2)}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                          
                          {/* 分摊比例验证 */}
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-blue-700">分摊比例总和:</span>
                              <span className={`font-medium ${validateAllocationRatios() ? 'text-green-600' : 'text-red-600'}`}>
                                {(allocationResults.length > 0 ? 
                                  allocationResults.reduce((sum, result) => sum + result.allocation_ratio, 0) :
                                  allocationConfigs.filter(config => config.is_enabled).reduce((sum, config) => sum + config.allocation_ratio, 0)
                                ).toFixed(2)}%
                              </span>
                            </div>
                            {!validateAllocationRatios() && (
                              <p className="text-red-600 text-xs mt-1">
                                分摊比例总和必须为100%
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">没有可用的分摊配置</span>
                          </div>
                          <p className="text-sm text-yellow-700 mt-1">
                            请先在团队管理中配置分摊比例
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="team">关联团队</Label>
                      <Select value={formData.team_id} onValueChange={(value) => setFormData({ ...formData, team_id: value })}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="选择关联团队" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {teams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    创建收入
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总收入</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">¥{totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">已分摊收入</CardTitle>
              <CheckSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">¥{allocatedRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">未分摊收入</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">¥{unallocatedRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">逾期</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">¥{overdueRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和过滤 */}
        <div className="flex items-center space-x-4">
              <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
              placeholder="搜索收入记录..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-background border-border text-foreground">
              <SelectValue placeholder="状态过滤" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="confirmed">已确认</SelectItem>
              <SelectItem value="invoiced">已开票</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>

        {/* 收入记录表格 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">收入记录</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">日期</TableHead>
                  <TableHead className="text-muted-foreground">收入描述</TableHead>
                  <TableHead className="text-muted-foreground">客户</TableHead>
                  <TableHead className="text-muted-foreground">项目</TableHead>
                  <TableHead className="text-muted-foreground">金额</TableHead>
                  <TableHead className="text-muted-foreground">状态</TableHead>
                  <TableHead className="text-muted-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRevenues.map((revenue) => (
                  <TableRow key={revenue.id} className="border-border">
                    <TableCell className="text-muted-foreground">
                      {new Date(revenue.revenue_date).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {revenue.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {revenue.customer?.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {revenue.project?.name || '无'}
                    </TableCell>
                    <TableCell className="text-foreground font-bold">
                      ¥{revenue.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(revenue)} bg-transparent`}>
                        {getStatusIcon(revenue)}
                        <span className="ml-1">{getStatusName(revenue)}</span>
                        </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openViewDialog(revenue)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(revenue)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          onConfirm={() => handleDelete(revenue.id)}
                          itemName={`${revenue.customer?.name} - ¥${revenue.amount.toLocaleString()}`}
                          title="删除收入记录"
                          description={`确定要删除"${revenue.description}"吗？删除后相关的分摊记录也将被移除。`}
                          variant="ghost"
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

        {/* 编辑对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑收入记录</DialogTitle>
            </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                  <Label htmlFor="editCustomer" className="text-sm font-medium flex items-center">
                    客户
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择客户" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editAmount" className="text-sm font-medium flex items-center">
                      收入金额
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="editAmount" 
                      type="number"
                    placeholder="请输入收入金额"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                  <Label htmlFor="editProject" className="text-sm font-medium flex items-center">
                    关联项目
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择项目（可选）" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                      <SelectItem value="none">无关联项目</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  </div>
                <div>
                  <Label htmlFor="editCategory" className="text-sm font-medium flex items-center">
                    财务科目
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? '' : value })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择财务科目（可选）" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="none">请选择收入类别</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editDate" className="text-sm font-medium flex items-center">
                      收入日期
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="editDate" 
                      type="date"
                    value={formData.revenue_date}
                    onChange={(e) => setFormData({ ...formData, revenue_date: e.target.value })}
                      className="bg-background border-border text-foreground" 
                    />
                </div>
                </div>
                <div>
                  <Label htmlFor="editDescription" className="text-sm font-medium flex items-center">
                    收入描述
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea 
                    id="editDescription" 
                  placeholder="请输入收入描述"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>

              {/* 分摊设置 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-allocation-enabled"
                    checked={formData.is_allocation_enabled}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, is_allocation_enabled: checked as boolean });
                      if (checked) {
                        // 立即计算分摊结果，即使金额为0也要显示配置
                        calculateAllocation(parseFloat(formData.amount) || 0);
                      } else {
                        setAllocationResults([]);
                      }
                    }}
                  />
                  <Label htmlFor="edit-allocation-enabled" className="text-sm font-medium">
                    启用分摊
                  </Label>
                </div>

                {formData.is_allocation_enabled ? (
                  <div className="space-y-4">
                    {allocationConfigs.filter(config => config.is_enabled).length > 0 ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Calculator className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">分摊配置</span>
                        </div>
                        <p className="text-sm text-blue-700 mb-4">
                          可修改各团队的分摊比例，系统将自动计算分配金额
                        </p>
                        
                        {/* 分摊配置表格 */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-4 text-xs font-medium text-blue-800 border-b border-blue-200 pb-2">
                            <div>团队名称</div>
                            <div>默认比例</div>
                            <div>本次比例</div>
                            <div>分配金额</div>
                          </div>
                          
                          {allocationResults.length > 0 ? (
                            allocationResults.map((result, index) => {
                              const originalConfig = allocationConfigs.find(config => config.team_id === result.team_id);
                              return (
                                <div key={result.team_id} className="grid grid-cols-4 gap-4 items-center text-sm">
                                  <div className="text-blue-700 font-medium">{result.team_name}</div>
                                  <div className="text-blue-600">{originalConfig?.allocation_ratio || 0}%</div>
              <div>
                <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={result.allocation_ratio}
                                      onChange={(e) => {
                                        const newRatio = parseFloat(e.target.value) || 0;
                                        updateAllocationRatio(result.team_id, newRatio);
                                      }}
                                      className="w-20 h-8 text-xs bg-white border-blue-300"
                                    />
                                    <span className="text-blue-600 ml-1">%</span>
                                  </div>
                                  <div className="text-green-600 font-medium">
                                    ¥{result.allocated_amount.toFixed(2)}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            // 如果allocationResults为空，显示默认配置
                            allocationConfigs.filter(config => config.is_enabled).map((config) => {
                              const team = teams.find(t => t.id === config.team_id);
                              return (
                                <div key={config.team_id} className="grid grid-cols-4 gap-4 items-center text-sm">
                                  <div className="text-blue-700 font-medium">{team?.name || '未知团队'}</div>
                                  <div className="text-blue-600">{config.allocation_ratio}%</div>
                                  <div>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={config.allocation_ratio}
                                      onChange={(e) => {
                                        const newRatio = parseFloat(e.target.value) || 0;
                                        updateAllocationRatio(config.team_id, newRatio);
                                      }}
                                      className="w-20 h-8 text-xs bg-white border-blue-300"
                                    />
                                    <span className="text-blue-600 ml-1">%</span>
                                  </div>
                                  <div className="text-green-600 font-medium">
                                    ¥{((parseFloat(formData.amount) || 0) * config.allocation_ratio / 100).toFixed(2)}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                        
                        {/* 分摊比例验证 */}
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-700">分摊比例总和:</span>
                            <span className={`font-medium ${validateAllocationRatios() ? 'text-green-600' : 'text-red-600'}`}>
                              {(allocationResults.length > 0 ? 
                                allocationResults.reduce((sum, result) => sum + result.allocation_ratio, 0) :
                                allocationConfigs.filter(config => config.is_enabled).reduce((sum, config) => sum + config.allocation_ratio, 0)
                              ).toFixed(2)}%
                            </span>
                          </div>
                          {!validateAllocationRatios() && (
                            <p className="text-red-600 text-xs mt-1">
                              分摊比例总和必须为100%
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">没有可用的分摊配置</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          请先在团队管理中配置分摊比例
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="editTeam">关联团队</Label>
                    <Select value={formData.team_id} onValueChange={(value) => setFormData({ ...formData, team_id: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择关联团队" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    取消
                  </Button>
                <Button onClick={handleUpdate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  更新收入
                  </Button>
                </div>
              </div>
          </DialogContent>
        </Dialog>

        {/* 查看详情对话框 */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle>收入记录详情</DialogTitle>
            </DialogHeader>
            {selectedRevenueForView && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">客户</Label>
                    <p className="text-sm">{selectedRevenueForView.customer?.name || '未知客户'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">收入金额</Label>
                    <p className="text-sm">¥{selectedRevenueForView.amount?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">关联项目</Label>
                    <p className="text-sm">{selectedRevenueForView.project?.name || '无关联项目'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">财务科目</Label>
                    <p className="text-sm">{selectedRevenueForView.category?.name || '未分类'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">收入日期</Label>
                    <p className="text-sm">{selectedRevenueForView.revenue_date}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">分摊状态</Label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedRevenueForView)}
                      <span className={`text-sm px-2 py-1 rounded-full border ${getStatusColor(selectedRevenueForView)}`}>
                        {getStatusName(selectedRevenueForView)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">收入描述</Label>
                  <p className="text-sm">{selectedRevenueForView.description}</p>
                </div>
                
                {/* 分摊详情 */}
                {selectedRevenueForView.allocation_records && selectedRevenueForView.allocation_records.length > 0 ? (
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">分摊信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b border-border pb-2">
                          <div>分摊对象</div>
                          <div>分摊比例</div>
                          <div>分摊金额</div>
                        </div>
                        
                        {selectedRevenueForView.allocation_records.map((record) => (
                          <div key={record.id} className="grid grid-cols-3 gap-4 items-center text-sm">
                            <div className="font-medium text-foreground">
                              {record.allocation_config?.name || '未知配置'}
                            </div>
                            <div className="text-muted-foreground">
                              {record.allocation_config?.allocation_ratio || 0}%
                            </div>
                            <div className="text-green-600 font-medium">
                              ¥{record.allocated_amount.toLocaleString()}
                            </div>
                          </div>
                        ))}
                        
                        <div className="pt-4 border-t border-border">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">分摊比例总和:</span>
                            <span className="font-medium text-foreground">
                              {selectedRevenueForView.allocation_records.reduce((sum, record) => 
                                sum + (record.allocation_config?.allocation_ratio || 0), 0
                              )}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-muted-foreground">分摊金额总和:</span>
                            <span className="font-medium text-foreground">
                              ¥{selectedRevenueForView.allocation_records.reduce((sum, record) => 
                                sum + record.allocated_amount, 0
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">分摊信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">未启用分摊</h3>
                        <p className="text-muted-foreground">
                          此收入记录未启用分摊功能
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {filteredRevenues.length === 0 && (
          <Card className="bg-card border-border theme-transition">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">暂无收入记录</h3>
                <p className="text-muted-foreground">创建第一条收入记录开始管理</p>
              </div>
            </CardContent>
          </Card>
            )}
      </div>
    </div>
  );
};

export default RevenueManagement;
