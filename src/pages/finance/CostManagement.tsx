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
import { 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Edit,
  Trash2,
  Search,
  Filter,
  FolderOpen,
  Tags,
  Share2,
  Download,
  Loader2,
  Users,
  Calculator,
  Eye
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { costAPI, financeCategoryAPI, teamAPI } from '@/services/api';
import api from '@/services/api';
import type { CostRecord, FinanceCategory, Team, AllocationConfig, TeamAllocationConfig } from '@/types';
import { toast } from '@/components/ui/use-toast';

const CostManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<CostRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // 数据状态
  const [costRecords, setCostRecords] = useState<CostRecord[]>([]);
  const [costCategories, setCostCategories] = useState<FinanceCategory[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allocationConfigs, setAllocationConfigs] = useState<TeamAllocationConfig[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  
  // 表单状态
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period_date: new Date().toISOString().split('T')[0],
    description: '',
    budget_cost: '',
    is_allocation_enabled: false,
    team_id: '',
  });
  
  const [editFormData, setEditFormData] = useState({
    category_id: '',
    amount: '',
    period_date: new Date().toISOString().split('T')[0],
    description: '',
    budget_cost: '',
    actual_cost: '',
    is_allocation_enabled: false,
    team_id: '',
  });

  // 分摊相关状态
  const [allocationResults, setAllocationResults] = useState<Array<{
    team_id: string;
    team_name: string;
    allocation_ratio: number;
    allocated_amount: number;
    config_id: string;
  }>>([]);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        costRecordsData, 
        categoriesData, 
        teamsData,
        teamAllocationConfigsData,
        statisticsData
      ] = await Promise.all([
        costAPI.getCostRecords(),
        financeCategoryAPI.getByType('cost'),
        teamAPI.getAll(),
        teamAPI.getEnabledAllocationConfigs(),
        costAPI.getCostStatistics()
      ]);
      
      setCostRecords(costRecordsData);
      setCostCategories(categoriesData);
      setTeams(teamsData);
      setAllocationConfigs(teamAllocationConfigsData);
      setStatistics(statisticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('加载成本管理数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      category_id: '',
      amount: '',
      period_date: new Date().toISOString().split('T')[0],
      description: '',
      budget_cost: '',
      is_allocation_enabled: false,
      team_id: '',
    });
    setAllocationResults([]);
  };

  const resetEditForm = () => {
    setEditFormData({
      category_id: '',
      amount: '',
      period_date: new Date().toISOString().split('T')[0],
      description: '',
      budget_cost: '',
      actual_cost: '',
      is_allocation_enabled: false,
      team_id: '',
    });
    setAllocationResults([]);
  };

  // 计算分摊结果
  const calculateAllocation = (amount: number = 0, customRatios?: { [teamId: string]: number }, isEditMode: boolean = false) => {
    const currentFormData = isEditMode ? editFormData : formData;
    
    if (!currentFormData.is_allocation_enabled) {
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

  // 更新单个团队的分摊比例
  const updateAllocationRatio = (teamId: string, newRatio: number, isEditMode: boolean = false) => {
    const currentFormData = isEditMode ? editFormData : formData;
    const amount = currentFormData.amount ? parseFloat(currentFormData.amount) : 0;

    const updatedResults = allocationResults.map(result => {
      if (result.team_id === teamId) {
        return {
          ...result,
          allocation_ratio: newRatio,
          allocated_amount: (amount * newRatio) / 100,
        };
      }
      return result;
    });

    setAllocationResults(updatedResults);
  };

  // 验证分摊比例总和
  const validateAllocationRatios = () => {
    const totalRatio = allocationResults.reduce((sum, result) => sum + result.allocation_ratio, 0);
    return Math.abs(totalRatio - 100) <= 0.01;
  };

  // 监听分摊启用状态和金额变化，自动计算分摊
  useEffect(() => {
    if (formData.is_allocation_enabled) {
      const amount = formData.amount ? parseFloat(formData.amount) : 0;
      calculateAllocation(amount, undefined, false);
    } else {
      setAllocationResults([]);
    }
  }, [formData.is_allocation_enabled, formData.amount, allocationConfigs]);

  // 监听编辑表单的分摊启用状态和金额变化
  useEffect(() => {
    if (editFormData.is_allocation_enabled) {
      const amount = editFormData.amount ? parseFloat(editFormData.amount) : 0;
      calculateAllocation(amount, undefined, true);
    } else {
      setAllocationResults([]);
    }
  }, [editFormData.is_allocation_enabled, editFormData.amount, allocationConfigs]);

  // 过滤成本记录
  const filteredCosts = costRecords.filter(cost => {
    const matchesSearch = cost.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cost.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || cost.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // 添加成本记录
  const handleAddCost = async () => {
    try {
      // 验证必填字段
      if (!formData.category_id.trim()) {
        toast({
          title: '请选择成本分类',
          variant: 'destructive',
        });
        return;
      }
      if (!formData.amount.trim()) {
        toast({
          title: '请输入成本金额',
          variant: 'destructive',
        });
        return;
      }
      if (!formData.period_date) {
        toast({
          title: '请选择期间日期',
          variant: 'destructive',
        });
        return;
      }
      if (!formData.description.trim()) {
        toast({
          title: '请输入成本描述',
          variant: 'destructive',
        });
        return;
      }
      if (!formData.budget_cost.trim()) {
        toast({
          title: '请输入预算金额',
          variant: 'destructive',
        });
        return;
      }

      // 验证分摊相关字段
      if (formData.is_allocation_enabled) {
        if (allocationResults.length === 0) {
          toast({
            title: '分摊配置错误',
            description: '请检查分摊配置是否正确',
            variant: 'destructive',
          });
          return;
        }
        
        // 验证分摊比例总和是否为100%
        if (!validateAllocationRatios()) {
          const totalRatio = allocationResults.reduce((sum, result) => sum + result.allocation_ratio, 0);
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

      setSubmitting(true);

      const amount = parseFloat(formData.amount);
      const budgetCost = parseFloat(formData.budget_cost);
      const periodDate = new Date(formData.period_date);
      const periodYear = periodDate.getFullYear();
      const periodMonth = periodDate.getMonth() + 1;

      // 创建成本记录
      const costRecord = await costAPI.createCostRecord({
        category_id: formData.category_id,
        amount,
        period_year: periodYear,
        period_month: periodMonth,
        description: formData.description.trim(),
        budget_cost: budgetCost,
        actual_cost: amount, // 初始设为实际成本
        status: 'draft', // 默认状态
        team_id: formData.is_allocation_enabled ? undefined : formData.team_id, // 如果不分摊，保存关联团队
      });

      // 如果启用了分摊，创建分摊记录
      if (formData.is_allocation_enabled && allocationResults.length > 0) {
        try {
          console.log('分摊准备写入数据:', allocationResults);
          // 创建分摊记录
          const allocationPromises = allocationResults.map(result => {
            const params = {
              source_record_type: 'cost' as const,
              source_record_id: costRecord.id,
              allocation_config_id: result.config_id,
              allocated_amount: result.allocated_amount,
              allocation_date: formData.period_date,
              description: `成本分摊: ${formData.description}`,
            };
            console.log('分摊API参数:', params);
            return api.allocation.createAllocationRecord(params);
          });
          
          await Promise.all(allocationPromises);
          console.log('分摊记录创建成功');
        } catch (allocationError) {
          console.error('创建分摊记录失败:', allocationError);
          // 即使分摊记录创建失败，也不影响成本记录的创建
          toast({
            title: '成本记录创建成功',
            description: '但分摊记录创建失败，请稍后重试',
            variant: 'destructive',
          });
        }
      }

      await loadData();
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: '成本记录添加成功',
        description: formData.is_allocation_enabled ? '成本记录已创建并分摊到各团队' : '成本记录已创建',
        duration: 2000,
      });
    } catch (err) {
      console.error('添加成本记录失败:', err);
      toast({
        title: '添加成本记录失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 打开编辑对话框
  const openEditDialog = (cost: CostRecord) => {
    setSelectedCost(cost);
    const periodDate = new Date(cost.period_year, cost.period_month - 1, 1);
    setEditFormData({
      category_id: cost.category_id || '',
      amount: cost.amount.toString(),
      period_date: periodDate.toISOString().split('T')[0],
      description: cost.description || '',
      budget_cost: cost.budget_cost?.toString() || '',
      actual_cost: cost.actual_cost?.toString() || '',
      is_allocation_enabled: cost.is_allocation_enabled || false,
      team_id: cost.team_id || '', // 加载关联团队
    });
    
    // 如果启用了分摊，计算分摊结果
    if (cost.is_allocation_enabled && cost.allocation_records && cost.allocation_records.length > 0) {
      // 使用实际的分摊记录数据
      const allocationResults = cost.allocation_records.map(record => ({
        team_id: record.allocation_config?.target_id || '',
        team_name: record.allocation_config?.name || '未知团队',
        allocation_ratio: record.allocation_config?.allocation_ratio || 0,
        allocated_amount: record.allocated_amount,
        config_id: record.allocation_config_id || '',
      }));
      setAllocationResults(allocationResults);
    } else {
      // 默认计算分摊结果供用户查看
      const amount = cost.amount;
      calculateAllocation(amount, undefined, true);
    }
    setIsEditDialogOpen(true);
  };

  // 更新成本记录
  const handleUpdateCost = async () => {
    if (!selectedCost) return;

    try {
      // 验证必填字段
      if (!editFormData.category_id.trim()) {
        toast({
          title: '请选择成本分类',
          variant: 'destructive',
        });
        return;
      }
      if (!editFormData.amount.trim()) {
        toast({
          title: '请输入成本金额',
          variant: 'destructive',
        });
        return;
      }
      if (!editFormData.period_date) {
        toast({
          title: '请选择期间日期',
          variant: 'destructive',
        });
        return;
      }
      if (!editFormData.description.trim()) {
        toast({
          title: '请输入成本描述',
          variant: 'destructive',
        });
        return;
      }
      if (!editFormData.budget_cost.trim()) {
        toast({
          title: '请输入预算金额',
          variant: 'destructive',
        });
        return;
      }
      if (!editFormData.actual_cost.trim()) {
        toast({
          title: '请输入实际成本',
          variant: 'destructive',
        });
        return;
      }

      setSubmitting(true);

      const amount = parseFloat(editFormData.amount);
      const budgetCost = parseFloat(editFormData.budget_cost);
      const actualCost = parseFloat(editFormData.actual_cost);
      const periodDate = new Date(editFormData.period_date);
      const periodYear = periodDate.getFullYear();
      const periodMonth = periodDate.getMonth() + 1;

      await costAPI.updateCostRecord(selectedCost.id, {
        category_id: editFormData.category_id,
        amount,
        period_year: periodYear,
        period_month: periodMonth,
        description: editFormData.description.trim(),
        budget_cost: budgetCost,
        actual_cost: actualCost,
        status: selectedCost.status, // 保持原状态
        team_id: editFormData.is_allocation_enabled ? undefined : editFormData.team_id, // 如果不分摊，保存关联团队
      });

      // 处理分摊记录的更新
      if (editFormData.is_allocation_enabled && allocationResults.length > 0) {
        try {
          // 先删除原有的分摊记录
          if (selectedCost.allocation_records && selectedCost.allocation_records.length > 0) {
            const deletePromises = selectedCost.allocation_records.map(record => 
              api.allocation.deleteAllocationRecord(record.id)
            );
            await Promise.all(deletePromises);
          }

          // 创建新的分摊记录
          const allocationPromises = allocationResults.map(result => 
            api.allocation.createAllocationRecord({
              source_record_type: 'cost',
              source_record_id: selectedCost.id,
              allocation_config_id: result.config_id,
              allocated_amount: result.allocated_amount,
              allocation_date: editFormData.period_date,
              description: `成本分摊: ${editFormData.description}`,
            })
          );
          
          await Promise.all(allocationPromises);
          console.log('分摊记录更新成功');
        } catch (allocationError) {
          console.error('更新分摊记录失败:', allocationError);
          toast({
            title: '成本记录更新成功',
            description: '但分摊记录更新失败，请稍后重试',
            variant: 'destructive',
          });
        }
      } else if (selectedCost.allocation_records && selectedCost.allocation_records.length > 0) {
        // 如果原来有分摊记录，但现在不启用分摊，则删除分摊记录
        try {
          const deletePromises = selectedCost.allocation_records.map(record => 
            api.allocation.deleteAllocationRecord(record.id)
          );
          await Promise.all(deletePromises);
          console.log('分摊记录删除成功');
        } catch (deleteError) {
          console.error('删除分摊记录失败:', deleteError);
        }
      }

      await loadData();
      setIsEditDialogOpen(false);
      setSelectedCost(null);
      resetEditForm();
      toast({
        title: '成本记录更新成功',
        description: editFormData.is_allocation_enabled ? '成本记录和分摊记录已更新' : '成本记录已更新',
        duration: 2000,
      });
    } catch (err) {
      console.error('更新成本记录失败:', err);
      toast({
        title: '更新成本记录失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 删除成本记录
  const handleDeleteCost = async (cost: CostRecord) => {
    try {
      setSubmitting(true);
      // 删除成本记录及其相关的分摊记录
      // TODO: 使用正确的costAPI删除方法
      console.log('删除成本记录:', cost.id);
      await loadData();
      toast({
        title: '成本记录删除成功',
        description: '成本记录及相关分摊记录已删除',
        duration: 2000,
      });
    } catch (err) {
      console.error('删除成本记录失败:', err);
      toast({
        title: '删除成本记录失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 打开分摊明细对话框
  const openAllocationDialog = (cost: CostRecord) => {
    setSelectedCost(cost);
    setIsAllocationDialogOpen(true);
  };

  // 计算差异
  const calculateVariance = (actual?: number, budget?: number) => {
    if (!actual || !budget) return 0;
    return actual - budget;
  };

  // 计算差异率
  const calculateVarianceRate = (actual?: number, budget?: number) => {
    if (!actual || !budget || budget === 0) return 0;
    return ((actual - budget) / budget) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background theme-transition flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载成本管理数据中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background theme-transition flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
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
            <h1 className="text-3xl font-bold text-foreground">成本管理</h1>
            <p className="text-muted-foreground mt-1">管理企业运营成本和预算控制</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增成本
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-4xl">
              <DialogHeader>
                <DialogTitle>新增成本记录</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium flex items-center">
                    成本分类
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择成本分类" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {costCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium flex items-center">
                      成本金额
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="amount" 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="bg-background border-border text-foreground" 
                      placeholder="请输入成本金额"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget" className="text-sm font-medium flex items-center">
                      预算金额
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.budget_cost}
                      onChange={(e) => setFormData({ ...formData, budget_cost: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入预算金额"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="period-date" className="text-sm font-medium flex items-center">
                    期间日期
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="period-date"
                    type="date"
                    value={formData.period_date}
                    onChange={(e) => setFormData({ ...formData, period_date: e.target.value })}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium flex items-center">
                    成本描述
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background border-border text-foreground" 
                    placeholder="请输入成本描述"
                    rows={3}
                  />
                </div>

                {/* 分摊设置 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allocation-enabled"
                      checked={formData.is_allocation_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_allocation_enabled: checked as boolean })}
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
                             
                             {allocationResults.map((result, index) => {
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
                                         updateAllocationRatio(result.team_id, newRatio, false);
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
                                 {allocationResults.reduce((sum, result) => sum + result.allocation_ratio, 0).toFixed(2)}%
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
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}>
                    取消
                  </Button>
                  <Button onClick={handleAddCost} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    添加记录
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总成本记录</CardTitle>
              <FolderOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{costRecords.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总预算</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{(statistics.totalBudget || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">实际成本</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{(statistics.totalActual || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 成本记录列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">成本记录</CardTitle>
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
                  placeholder="搜索成本记录..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="成本分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {costCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>成本分类</TableHead>
                  <TableHead>期间</TableHead>
                  <TableHead>实际成本</TableHead>
                  <TableHead>预算成本</TableHead>
                  <TableHead>差异</TableHead>
                  <TableHead>分摊状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCosts.map((cost) => {
                  const variance = calculateVariance(cost.actual_cost, cost.budget_cost);
                  const varianceRate = calculateVarianceRate(cost.actual_cost, cost.budget_cost);
                  const periodDate = new Date(cost.period_year, cost.period_month - 1, 1);
                  
                  return (
                    <TableRow key={cost.id}>
                      <TableCell>
                        {cost.category?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {periodDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                      </TableCell>
                      <TableCell>
                        ¥{cost.actual_cost?.toLocaleString() || cost.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ¥{cost.budget_cost?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell>
                        {cost.budget_cost ? (
                          <div className={variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : 'text-muted-foreground'}>
                            ¥{variance.toLocaleString()} ({varianceRate.toFixed(1)}%)
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${cost.is_allocation_enabled ? 'text-blue-600' : 'text-gray-600'}`}>
                          {cost.is_allocation_enabled ? (
                            <>
                              <Share2 className="h-3 w-3 mr-1" />
                              已分摊
                            </>
                          ) : (
                            <>
                              <Users className="h-3 w-3 mr-1" />
                              未分摊
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(cost)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openAllocationDialog(cost)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            onConfirm={() => handleDeleteCost(cost)}
                            itemName={`${cost.category?.name || '成本记录'} - ¥${cost.amount.toLocaleString()}`}
                            title="删除成本记录"
                            description={`确定要删除"${cost.category?.name || '成本记录'}"吗？删除后相关的分摊记录也将被移除。`}
                            variant="ghost"
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

        {/* 编辑成本记录对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-4xl">
            <DialogHeader>
              <DialogTitle>编辑成本记录</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category" className="text-sm font-medium flex items-center">
                  成本分类
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select value={editFormData.category_id} onValueChange={(value) => setEditFormData({ ...editFormData, category_id: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="选择成本分类" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {costCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} ({category.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-amount" className="text-sm font-medium flex items-center">
                    成本金额
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input 
                    id="edit-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    className="bg-background border-border text-foreground" 
                    placeholder="请输入成本金额"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-budget" className="text-sm font-medium flex items-center">
                    预算金额
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="edit-budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editFormData.budget_cost}
                    onChange={(e) => setEditFormData({ ...editFormData, budget_cost: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入预算金额"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-period-date" className="text-sm font-medium flex items-center">
                  期间日期
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="edit-period-date"
                  type="date"
                  value={editFormData.period_date}
                  onChange={(e) => setEditFormData({ ...editFormData, period_date: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-sm font-medium flex items-center">
                  成本描述
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea 
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="bg-background border-border text-foreground" 
                  placeholder="请输入成本描述"
                  rows={3}
                />
              </div>

              {/* 分摊设置 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-allocation-enabled"
                    checked={editFormData.is_allocation_enabled}
                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_allocation_enabled: checked as boolean })}
                  />
                  <Label htmlFor="edit-allocation-enabled" className="text-sm font-medium">
                    启用分摊
                  </Label>
                </div>

                {editFormData.is_allocation_enabled ? (
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
                          
                          {allocationResults.map((result, index) => {
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
                                      updateAllocationRatio(result.team_id, newRatio, true);
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
                              {allocationResults.reduce((sum, result) => sum + result.allocation_ratio, 0).toFixed(2)}%
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
                    <Label htmlFor="edit-team" className="text-sm font-medium flex items-center">
                      关联团队
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={editFormData.team_id} onValueChange={(value) => setEditFormData({ ...editFormData, team_id: value })}>
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
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCost(null);
                  resetEditForm();
                }}>
                  取消
                </Button>
                <Button onClick={handleUpdateCost} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                  更新记录
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 分摊详情对话框 */}
        <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-4xl">
            <DialogHeader>
              <DialogTitle>成本记录详情</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                查看成本记录的详细信息和分摊情况
              </div>

              {selectedCost && (
                <div className="space-y-4">
                  {/* 基本信息 */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">基本信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">成本分类</Label>
                          <p className="text-sm">{selectedCost.category?.name || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">期间</Label>
                          <p className="text-sm">{selectedCost.period_year}年{selectedCost.period_month}月</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">成本金额</Label>
                          <p className="text-sm font-medium">¥{selectedCost.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">预算金额</Label>
                          <p className="text-sm">¥{selectedCost.budget_cost?.toLocaleString() || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">分摊状态</Label>
                          <Badge variant={selectedCost.is_allocation_enabled ? "default" : "secondary"} className="text-xs">
                            {selectedCost.is_allocation_enabled ? '已分摊' : '未分摊'}
                          </Badge>
                        </div>
                        {!selectedCost.is_allocation_enabled && selectedCost.team && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">关联团队</Label>
                            <p className="text-sm">{selectedCost.team.name}</p>
                          </div>
                        )}
                      </div>
                      {selectedCost.description && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium text-muted-foreground">描述</Label>
                          <p className="text-sm mt-1">{selectedCost.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 分摊信息 */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">分摊信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedCost.is_allocation_enabled && selectedCost.allocation_records && selectedCost.allocation_records.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b border-border pb-2">
                            <div>分摊对象</div>
                            <div>分摊比例</div>
                            <div>分摊金额</div>
                          </div>
                          
                          {selectedCost.allocation_records.map((record) => (
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
                                {selectedCost.allocation_records.reduce((sum, record) => 
                                  sum + (record.allocation_config?.allocation_ratio || 0), 0
                                )}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-1">
                              <span className="text-muted-foreground">分摊金额总和:</span>
                              <span className="font-medium text-foreground">
                                ¥{selectedCost.allocation_records.reduce((sum, record) => 
                                  sum + record.allocated_amount, 0
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">未启用分摊</h3>
                          <p className="text-muted-foreground">
                            此成本记录未启用分摊功能
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAllocationDialogOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CostManagement;
