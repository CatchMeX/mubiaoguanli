import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { 
  Plus, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Building2,
  Edit,
  Trash,
  Trash2,
  Search,
  Filter,
  Receipt,
  Clock,
  CheckSquare,
  XCircle,
  FileText,
  Loader2,
  Calculator,
  Eye,
  Users
} from 'lucide-react';
import { expenseAPI, supplierAPI, projectAPI, teamAPI, financeCategoryAPI, allocationAPI } from '@/services/api';
import { supabase, executeQuery } from '@/lib/supabase';
import type { Supplier, Project, Team, TeamAllocationConfig, FinanceCategory } from '@/types';
import type { ExpenseRecord } from '@/types/expense';
import { useToast } from '@/components/ui/use-toast';

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allocationConfigs, setAllocationConfigs] = useState<TeamAllocationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  const [expenseAllocations, setExpenseAllocations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    financial_category_id: '',
    amount: '',
    supplier_id: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    description: '',
    receipt_url: '',
    is_allocation_enabled: false,
    team_id: ''
  });

  // 分摊相关状态
  const [allocationResults, setAllocationResults] = useState<Array<{
    team_id: string;
    team_name: string;
    allocation_ratio: number;
    allocated_amount: number;
    config_id: string;
  }>>([]);

  const { toast } = useToast();

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [expenseData, categoriesData, suppliersData, projectsData, teamsData, allocationConfigsData] = await Promise.all([
        expenseAPI.getExpenseRecords(),
        financeCategoryAPI.getByType('expense'), // 使用统一的财务分类系统
        supplierAPI.getAll(),
        projectAPI.getAll(),
        teamAPI.getAll(),
        teamAPI.getEnabledAllocationConfigs()
      ]);
      
      setExpenses(expenseData || []);
      setCategories(categoriesData || []);
      setSuppliers(suppliersData || []);
      setProjects(projectsData || []);
      setTeams(teamsData || []);
      setAllocationConfigs(allocationConfigsData || []);
      
      // 添加调试日志
      console.log('加载的费用数据:', expenseData);
      console.log('第一条费用记录:', expenseData?.[0]);
      console.log('加载的财务科目:', categoriesData);
      console.log('加载的分摊配置:', allocationConfigsData);
      console.log('启用的分摊配置:', allocationConfigsData?.filter(config => config.is_enabled));
    } catch (err) {
      setError('加载数据失败，请重试');
      console.error('加载费用数据失败:', err);
    } finally {
      setLoading(false);
    }
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

  const handleCreate = async () => {
    try {
      if (!formData.financial_category_id || !formData.amount || !formData.description) {
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

      const amount = parseFloat(formData.amount);
      const taxAmount = 0; // 暂时设为0，后续可以添加税费输入
      const netAmount = amount + taxAmount;
      
      const expenseData = {
        financial_category_id: formData.financial_category_id,
        amount: parseFloat(formData.amount),
        supplier_id: formData.supplier_id || null,
        project_id: formData.project_id || null,
        date: formData.date,
        status: formData.status as 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'cancelled',
        description: formData.description,
        receipt_url: formData.receipt_url,
        team_id: formData.is_allocation_enabled ? undefined : formData.team_id,
        is_allocation_enabled: formData.is_allocation_enabled
      };

      // 创建费用记录
      const expenseRecord = await expenseAPI.createExpenseRecord(expenseData);

      // 如果启用了分摊，创建分摊记录
      if (formData.is_allocation_enabled) {
        try {
          // 获取分摊配置
          const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
          const amount = parseFloat(formData.amount) || 0;
          
          // 创建分摊记录
          const allocationPromises = enabledConfigs.map(config => {
            const allocatedAmount = (amount * config.allocation_ratio) / 100;
            const params = {
              source_record_type: 'expense' as const,
              source_record_id: expenseRecord.id,
              allocation_config_id: config.id,
              allocated_amount: allocatedAmount,
              allocation_date: formData.date,
              description: `费用分摊: ${formData.description}`,
            };
            return allocationAPI.createAllocationRecord(params);
          });
          
          await Promise.all(allocationPromises);
        } catch (allocationError) {
          console.error('创建分摊记录失败:', allocationError);
          toast({
            title: '费用记录创建成功',
            description: '但分摊记录创建失败，请稍后重试',
            variant: 'destructive',
          });
        }
      }

      setIsAddDialogOpen(false);
      resetForm();
      loadData();
      toast({
        title: '费用记录添加成功',
        description: formData.is_allocation_enabled ? '费用记录已创建并分摊到各团队' : '费用记录已创建',
        duration: 2000,
      });
    } catch (err) {
      setError('创建费用记录失败，请重试');
      console.error('创建费用记录失败:', err);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selectedExpense || !formData.financial_category_id || !formData.amount || !formData.description) {
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

      const expenseData = {
        financial_category_id: formData.financial_category_id,
        amount: parseFloat(formData.amount),
        supplier_id: formData.supplier_id || null,
        project_id: formData.project_id || null,
        date: formData.date,
        status: formData.status as 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'cancelled',
        description: formData.description,
        receipt_url: formData.receipt_url,
        team_id: formData.is_allocation_enabled ? undefined : formData.team_id,
        is_allocation_enabled: formData.is_allocation_enabled
      };

      // 更新费用记录
      await expenseAPI.updateExpenseRecord(selectedExpense.id, expenseData);

      // 如果启用了分摊，更新分摊记录
      if (formData.is_allocation_enabled) {
        try {
          // 先获取并删除原有的分摊记录
          const existingAllocations = await expenseAPI.getAllocationRecordsByExpenseId(selectedExpense.id);
          for (const allocation of existingAllocations) {
            await allocationAPI.deleteAllocationRecord(allocation.id);
          }
          
          // 获取分摊配置
          const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
          const amount = parseFloat(formData.amount) || 0;
          
          // 创建新的分摊记录
          const allocationPromises = enabledConfigs.map(config => {
            const allocatedAmount = (amount * config.allocation_ratio) / 100;
            const params = {
              source_record_type: 'expense' as const,
              source_record_id: selectedExpense.id,
              allocation_config_id: config.id,
              allocated_amount: allocatedAmount,
              allocation_date: formData.date,
              description: `费用分摊: ${formData.description}`,
            };
            return allocationAPI.createAllocationRecord(params);
          });
          
          await Promise.all(allocationPromises);
        } catch (allocationError) {
          console.error('更新分摊记录失败:', allocationError);
          toast({
            title: '费用记录更新成功',
            description: '但分摊记录更新失败，请稍后重试',
            variant: 'destructive',
          });
        }
      } else {
        // 如果不分摊，删除原有的分摊记录
        try {
          const existingAllocations = await expenseAPI.getAllocationRecordsByExpenseId(selectedExpense.id);
          for (const allocation of existingAllocations) {
            await allocationAPI.deleteAllocationRecord(allocation.id);
          }
        } catch (error) {
          console.error('删除分摊记录失败:', error);
        }
      }

      setIsEditDialogOpen(false);
      resetForm();
      loadData();
      toast({
        title: '费用记录更新成功',
        description: formData.is_allocation_enabled ? '费用记录已更新并重新分摊到各团队' : '费用记录已更新',
        duration: 2000,
      });
    } catch (err) {
      setError('更新费用记录失败，请重试');
      console.error('更新费用记录失败:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // 使用BaseAPI的delete方法
      await executeQuery(
        supabase.from('expense_records').delete().eq('id', id)
      );
      loadData();
      toast({
        title: '删除成功',
        description: '费用记录已删除',
        duration: 2000,
      });
    } catch (err) {
      setError('删除费用记录失败，请重试');
      console.error('删除费用记录失败:', err);
      toast({
        title: '删除失败',
        description: '删除费用记录时出现错误，请重试',
        variant: 'destructive',
      });
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      financial_category_id: '',
      amount: '',
      supplier_id: '',
      project_id: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      description: '',
      receipt_url: '',
      is_allocation_enabled: false,
      team_id: ''
    });
    setAllocationResults([]);
  };

  // 打开编辑对话框
  const openEditDialog = (expense: ExpenseRecord) => {
    setSelectedExpense(expense);
    setFormData({
      financial_category_id: expense.category?.id || '',
      amount: expense.amount.toString(),
      supplier_id: expense.supplier?.id || '',
      project_id: expense.project?.id || '',
      date: (expense as any).expense_date || new Date().toISOString().split('T')[0],
      status: expense.status || 'pending',
      description: expense.description || '',
      receipt_url: '', // ExpenseRecord doesn't have receiptUrl field
      is_allocation_enabled: expense.is_allocation_enabled || false,
      team_id: expense.team_id || ''
    });
    
    // 如果启用了分摊，计算分摊结果
    if (expense.is_allocation_enabled) {
      calculateAllocation(expense.amount);
    } else {
      setAllocationResults([]);
    }
    
    setIsEditDialogOpen(true);
  };

  // 打开详情对话框
  const openDetailDialog = async (expense: ExpenseRecord) => {
    setSelectedExpense(expense);
    
    // 如果启用了分摊，获取分摊记录
    if (expense.is_allocation_enabled) {
      try {
        const allocations = await expenseAPI.getAllocationRecordsByExpenseId(expense.id);
        setExpenseAllocations(allocations || []);
      } catch (error) {
        console.error('获取分摊记录失败:', error);
        setExpenseAllocations([]);
      }
    } else {
      setExpenseAllocations([]);
    }
    
    setIsDetailDialogOpen(true);
  };

  // 过滤费用
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 统计数据
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const allocatedExpense = expenses.filter(e => e.is_allocation_enabled).reduce((sum, e) => sum + e.amount, 0);
  const unallocatedExpense = expenses.filter(e => !e.is_allocation_enabled).reduce((sum, e) => sum + e.amount, 0);

  // 获取状态标签颜色 - 改为分摊状态
  const getStatusColor = (expense: ExpenseRecord) => {
    // 根据分摊状态判断
    const hasAllocations = expense.is_allocation_enabled;
    return hasAllocations ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500';
  };

  // 获取状态名称 - 改为分摊状态
  const getStatusName = (expense: ExpenseRecord) => {
    // 根据分摊状态判断
    const hasAllocations = expense.is_allocation_enabled;
    return hasAllocations ? '已分摊' : '未分摊';
  };

  // 获取状态图标 - 改为分摊状态
  const getStatusIcon = (expense: ExpenseRecord) => {
    // 根据分摊状态判断
    const hasAllocations = expense.is_allocation_enabled;
    return hasAllocations ? <CheckSquare className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

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
            <h1 className="text-3xl font-bold text-foreground">费用管理</h1>
            <p className="text-muted-foreground mt-1">管理日常费用和供应商付款</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增费用
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle>新增费用记录</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="financialCategory">财务科目</Label>
                    <Select value={formData.financial_category_id} onValueChange={(value) => setFormData({...formData, financial_category_id: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择财务科目" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium flex items-center">
                      金额
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="请输入金额"
                      value={formData.amount}
                      onChange={(e) => {
                        const newAmount = e.target.value;
                        setFormData({...formData, amount: newAmount});
                        // 如果启用了分摊，立即计算分摊结果
                        if (formData.is_allocation_enabled) {
                          calculateAllocation(parseFloat(newAmount) || 0);
                        }
                      }}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier">供应商</Label>
                    <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择供应商（可选）" />
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
                    <Label htmlFor="project">关联项目</Label>
                    <Select value={formData.project_id} onValueChange={(value) => setFormData({...formData, project_id: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择关联项目（可选）" />
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">费用日期</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">付款状态</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择付款状态" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="pending">待付款</SelectItem>
                        <SelectItem value="approved">已审批</SelectItem>
                        <SelectItem value="paid">已付款</SelectItem>
                        <SelectItem value="overdue">逾期</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">费用描述</Label>
                  <Textarea 
                    id="description" 
                    placeholder="请输入费用描述"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                  <Label htmlFor="receiptUrl">收据URL</Label>
                  <Input
                    id="receiptUrl"
                    placeholder="请输入收据URL（可选）"
                    value={formData.receipt_url}
                    onChange={(e) => setFormData({...formData, receipt_url: e.target.value})}
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
                            
                            {(allocationResults.length > 0 ? allocationResults : allocationConfigs.filter(config => config.is_enabled).map(config => {
                              const team = teams.find(t => t.id === config.team_id);
                              const amount = parseFloat(formData.amount) || 0;
                              return {
                                team_id: config.team_id,
                                team_name: team?.name || '未知团队',
                                allocation_ratio: config.allocation_ratio,
                                allocated_amount: (amount * config.allocation_ratio) / 100,
                                config_id: config.id,
                              };
                            })).map((result, index) => {
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
                            })}
                          </div>
                          
                          {/* 分摊比例验证 */}
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-blue-700">分摊比例总和:</span>
                              <span className={`font-medium ${validateAllocationRatios() ? 'text-green-600' : 'text-red-600'}`}>
                                {(allocationResults.length > 0 ? allocationResults : allocationConfigs.filter(config => config.is_enabled)).reduce((sum, result) => sum + result.allocation_ratio, 0).toFixed(2)}%
                              </span>
                            </div>
                            {!validateAllocationRatios() && (
                              <p className="text-xs text-red-600 mt-1">
                                分摊比例总和应为100%，请调整比例
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-sm text-red-600">暂无启用的分摊配置，请在团队管理中配置</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="team" className="text-sm font-medium flex items-center">
                        关联团队
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select value={formData.team_id} onValueChange={(value) => setFormData({...formData, team_id: value})}>
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
                    创建费用
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
              <CardTitle className="text-sm font-medium text-muted-foreground">总费用</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">¥{totalExpense.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">已分摊</CardTitle>
              <CheckSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">¥{allocatedExpense.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">未分摊</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">¥{unallocatedExpense.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">逾期</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">¥{expenses.filter(e => e.status === 'cancelled').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和过滤 */}
        <div className="flex items-center space-x-4">
              <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
              placeholder="搜索费用记录..."
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
                    <SelectItem value="pending">待付款</SelectItem>
                    <SelectItem value="approved">已审批</SelectItem>
                    <SelectItem value="paid">已付款</SelectItem>
                    <SelectItem value="overdue">逾期</SelectItem>
                  </SelectContent>
                </Select>
              </div>

        {/* 费用记录表格 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">费用记录</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">日期</TableHead>
                  <TableHead className="text-muted-foreground">费用描述</TableHead>
                  <TableHead className="text-muted-foreground">财务科目</TableHead>
                  <TableHead className="text-muted-foreground">供应商</TableHead>
                  <TableHead className="text-muted-foreground">金额</TableHead>
                  <TableHead className="text-muted-foreground">状态</TableHead>
                  <TableHead className="text-muted-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="border-border">
                    <TableCell className="text-muted-foreground">
                      {(expense as any).expense_date ? new Date((expense as any).expense_date).toLocaleDateString('zh-CN') : '无'}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {expense.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {expense.category?.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {expense.supplier?.name || '无'}
                    </TableCell>
                    <TableCell className="text-foreground font-bold">
                      ¥{expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(expense)} bg-transparent`}>
                        {getStatusIcon(expense)}
                        <span className="ml-1">{getStatusName(expense)}</span>
                        </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openDetailDialog(expense)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(expense)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteButton 
                          onConfirm={() => handleDelete(expense.id)}
                          itemName="费用记录"
                          description="删除后，相关的分摊记录也将被移除"
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
              <DialogTitle>编辑费用记录</DialogTitle>
            </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFinancialCategory">财务科目</Label>
                  <Select value={formData.financial_category_id} onValueChange={(value) => setFormData({...formData, financial_category_id: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择财务科目" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                      {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                          {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editAmount">费用金额</Label>
                    <Input 
                      id="editAmount" 
                      type="number"
                    placeholder="请输入费用金额"
                    value={formData.amount}
                    onChange={(e) => {
                      const newAmount = e.target.value;
                      setFormData({...formData, amount: newAmount});
                      // 如果启用了分摊，立即计算分摊结果
                      if (formData.is_allocation_enabled) {
                        calculateAllocation(parseFloat(newAmount) || 0);
                      }
                    }}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editSupplier">供应商</Label>
                  <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择供应商（可选）" />
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
                  <Label htmlFor="editProject">关联项目</Label>
                  <Select value={formData.project_id} onValueChange={(value) => setFormData({...formData, project_id: value})}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择关联项目（可选）" />
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editDate">费用日期</Label>
                  <Input 
                    id="editDate" 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="bg-background border-border text-foreground" 
                  />
                  </div>
                  <div>
                    <Label htmlFor="editStatus">付款状态</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择付款状态" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="submitted">已提交</SelectItem>
                        <SelectItem value="approved">已审批</SelectItem>
                        <SelectItem value="rejected">已拒绝</SelectItem>
                        <SelectItem value="paid">已付款</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                <Label htmlFor="editDescription">费用描述</Label>
                <Textarea
                  id="editDescription"
                  placeholder="请输入费用描述"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-background border-border text-foreground" 
                  />
                </div>
                <div>
                <Label htmlFor="editReceiptUrl">收据URL</Label>
                <Input
                  id="editReceiptUrl"
                  placeholder="请输入收据URL（可选）"
                  value={formData.receipt_url}
                  onChange={(e) => setFormData({...formData, receipt_url: e.target.value})}
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
                            
                            {(allocationResults.length > 0 ? allocationResults : allocationConfigs.filter(config => config.is_enabled).map(config => {
                              const team = teams.find(t => t.id === config.team_id);
                              const amount = parseFloat(formData.amount) || 0;
                              return {
                                team_id: config.team_id,
                                team_name: team?.name || '未知团队',
                                allocation_ratio: config.allocation_ratio,
                                allocated_amount: (amount * config.allocation_ratio) / 100,
                                config_id: config.id,
                              };
                            })).map((result, index) => {
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
                            })}
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
                  更新费用
                  </Button>
                </div>
              </div>
          </DialogContent>
        </Dialog>

        {/* 详情对话框 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-4xl">
            <DialogHeader>
              <DialogTitle>费用详情</DialogTitle>
            </DialogHeader>
            {selectedExpense && (
              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">费用描述</Label>
                      <p className="text-sm">{selectedExpense.description}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">财务科目</Label>
                      <p className="text-sm">{selectedExpense.category?.name || '未分类'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">供应商</Label>
                      <p className="text-sm">{selectedExpense.supplier?.name || '无'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">关联项目</Label>
                      <p className="text-sm">{selectedExpense.project?.name || '无关联项目'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">费用金额</Label>
                      <p className="text-lg font-bold text-green-600">¥{selectedExpense.amount.toLocaleString()}</p>
                    </div>
                                          <div>
                        <Label className="text-sm font-medium text-muted-foreground">费用日期</Label>
                        <p className="text-sm">{(selectedExpense as any).expense_date ? new Date((selectedExpense as any).expense_date).toLocaleDateString('zh-CN') : '无'}</p>
                      </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">状态</Label>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedExpense)}
                        <span className={`text-sm px-2 py-1 rounded-full border ${getStatusColor(selectedExpense)}`}>
                          {getStatusName(selectedExpense)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">业务用途</Label>
                      <p className="text-sm">{selectedExpense.businessPurpose || '无'}</p>
                    </div>
                  </div>
                </div>

                {/* 分摊详情 */}
                {selectedExpense.is_allocation_enabled && expenseAllocations.length > 0 ? (
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
                        
                        {expenseAllocations.map((allocation) => (
                          <div key={allocation.id} className="grid grid-cols-3 gap-4 items-center text-sm">
                            <div className="font-medium text-foreground">
                              {allocation.allocation_config?.name || '未知配置'}
                            </div>
                            <div className="text-muted-foreground">
                              {allocation.allocation_config?.allocation_ratio || 0}%
                            </div>
                            <div className="text-green-600 font-medium">
                              ¥{allocation.allocated_amount.toLocaleString()}
                            </div>
                          </div>
                        ))}
                        
                        <div className="pt-4 border-t border-border">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">分摊比例总和:</span>
                            <span className="font-medium text-foreground">
                              {expenseAllocations.reduce((sum, record) => 
                                sum + (record.allocation_config?.allocation_ratio || 0), 0
                              )}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-muted-foreground">分摊金额总和:</span>
                            <span className="font-medium text-foreground">
                              ¥{expenseAllocations.reduce((sum, record) => 
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
                          此费用记录未启用分摊功能
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                    关闭
                  </Button>
                  <Button onClick={() => {
                    setIsDetailDialogOpen(false);
                    openEditDialog(selectedExpense);
                  }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    编辑
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {filteredExpenses.length === 0 && (
          <Card className="bg-card border-border theme-transition">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">暂无费用记录</h3>
                <p className="text-muted-foreground">创建第一条费用记录开始管理</p>
              </div>
            </CardContent>
          </Card>
            )}
      </div>
    </div>
  );
};

export default ExpenseManagement;
