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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Building2,
  Edit,
  Trash2,
  Search,
  Filter,
  FolderOpen,
  Tags,
  Share2,
  Eye,
  Download,
  RotateCcw,
  Building,
  Percent,
  AlertTriangle,
  CheckCircle,
  Receipt,
  Clock,
  CheckSquare,
  XCircle,
  FileText,
  Users,
  Calculator,
} from 'lucide-react';
import { accountsAPI, customerAPI, supplierAPI, projectAPI, departmentAPI, teamAPI, allocationAPI } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import type { AccountsRecord, SettlementRecord } from '@/types/accounts';
import type { Customer, Supplier, Project, Department, User, Team, TeamAllocationConfig } from '@/types';

const AccountsManagement = () => {
  const [activeTab, setActiveTab] = useState('receivable');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountsRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 数据状态
  const [accountsRecords, setAccountsRecords] = useState<AccountsRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allocationConfigs, setAllocationConfigs] = useState<TeamAllocationConfig[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  
  // 分摊相关状态
  const [allocationResults, setAllocationResults] = useState<Array<{
    team_id: string;
    team_name: string;
    allocation_ratio: number;
    allocated_amount: number;
    config_id: string;
  }>>([]);
  
  // 编辑表单状态
  const [editFormData, setEditFormData] = useState({
    counterparty_id: '',
    counterparty_type: 'customer' as 'customer' | 'supplier',
    amount: '',
    type: 'receivable' as 'receivable' | 'payable',
    description: '',
    document_number: '',
    document_type: 'invoice' as const,
    occurred_date: '',
    due_date: '',
    department_id: '',
    project_id: '',
    is_allocation_enabled: false,
    team_id: '',
    status: 'pending' as 'pending' | 'partial' | 'settled' | 'overdue',
  });

  // 编辑分摊结果状态
  const [editAllocationResults, setEditAllocationResults] = useState<Array<{
    team_id: string;
    team_name: string;
    allocation_ratio: number;
    allocated_amount: number;
    config_id: string;
  }>>([]);
  
  // 表单状态
  const [formData, setFormData] = useState({
    counterparty_id: '',
    counterparty_type: 'customer' as 'customer' | 'supplier',
    amount: '',
    type: 'receivable' as 'receivable' | 'payable',
    description: '',
    document_number: '',
    document_type: 'invoice' as const,
    occurred_date: new Date().toISOString().split('T')[0],
    due_date: '',
    department_id: '',
    project_id: '',
    is_allocation_enabled: false,
    team_id: '',
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('开始加载数据...');
      
      const [
        accountsData,
        customersData,
        suppliersData,
        projectsData,
        departmentsData,
        statisticsData,
        teamsData,
        allocationConfigsData
      ] = await Promise.all([
        accountsAPI.getAccountsRecords(),
        customerAPI.getAll(),
        supplierAPI.getAll(),
        projectAPI.getAll(),
        departmentAPI.getAll(),
        accountsAPI.getAccountsStatistics(),
        teamAPI.getAll(),
        teamAPI.getEnabledAllocationConfigs()
      ]);
      
      console.log('数据加载完成:', {
        accountsCount: accountsData.length,
        customersCount: customersData.length,
        suppliersCount: suppliersData.length,
        teamsCount: teamsData?.length || 0,
        allocationConfigsCount: allocationConfigsData?.length || 0,
        allocationConfigs: allocationConfigsData
      });
      
      setAccountsRecords(accountsData);
      setCustomers(customersData);
      setSuppliers(suppliersData);
      setProjects(projectsData);
      setDepartments(departmentsData);
      setStatistics(statisticsData);
      setTeams(teamsData || []);
      setAllocationConfigs(allocationConfigsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('加载往来账款数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 过滤应收账款
  const filteredReceivables = accountsRecords.filter(account => {
    const matchesType = account.type === 'receivable';
    const matchesSearch = account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (account.counterparty?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    return matchesType && matchesSearch && matchesStatus;
  });

  // 过滤应付账款
  const filteredPayables = accountsRecords.filter(account => {
    const matchesType = account.type === 'payable';
    const matchesSearch = account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (account.counterparty?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    return matchesType && matchesSearch && matchesStatus;
  });

  // 统计数据 - 从API获取
  const totalReceivable = statistics.totalReceivable || 0;
  const settledReceivable = statistics.totalSettledReceivable || 0;
  const pendingReceivable = statistics.totalPendingReceivable || 0;
  const overdueReceivable = statistics.totalOverdueReceivable || 0;

  // 统计数据 - 应付账款
  const totalPayable = statistics.totalPayable || 0;
  const settledPayable = statistics.totalSettledPayable || 0;
  const pendingPayable = statistics.totalPendingPayable || 0;
  const overduePayable = statistics.totalOverduePayable || 0;

  // 重置表单
  const resetForm = () => {
    setFormData({
      counterparty_id: '',
      counterparty_type: 'customer',
      amount: '',
      type: activeTab === 'receivable' ? 'receivable' : 'payable',
      description: '',
      document_number: '',
      document_type: 'invoice',
      occurred_date: new Date().toISOString().split('T')[0],
      due_date: '',
      department_id: '',
      project_id: '',
      is_allocation_enabled: false,
      team_id: '',
    });
    setAllocationResults([]);
  };

  // 分摊计算函数
  const calculateAllocation = (amount: number) => {
    console.log('开始计算分摊:', {
      is_allocation_enabled: formData.is_allocation_enabled,
      amount: amount,
      allocationConfigsCount: allocationConfigs.length,
      allocationConfigs: allocationConfigs
    });
    
    if (!formData.is_allocation_enabled || amount <= 0) {
      console.log('分摊未启用或金额无效，清空分摊结果');
      setAllocationResults([]);
      return;
    }

    const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
    console.log('启用的分摊配置:', enabledConfigs);
    
    if (enabledConfigs.length === 0) {
      console.log('没有启用的分摊配置，清空分摊结果');
      setAllocationResults([]);
      return;
    }

    const results = enabledConfigs.map(config => {
      const team = teams.find(t => t.id === config.team_id);
      const result = {
        team_id: config.team_id,
        team_name: team?.name || '未知团队',
        allocation_ratio: config.allocation_ratio,
        allocated_amount: (amount * config.allocation_ratio / 100),
        config_id: config.id || ''
      };
      console.log('分摊结果项:', result);
      return result;
    });

    console.log('最终分摊结果:', results);
    setAllocationResults(results);
  };

  // 更新分摊比例
  const updateAllocationRatio = (teamId: string, newRatio: number) => {
    setAllocationResults(prev => 
      prev.map(result => 
        result.team_id === teamId 
          ? { ...result, allocation_ratio: newRatio, allocated_amount: (parseFloat(formData.amount) || 0) * newRatio / 100 }
          : result
      )
    );
  };

  // 验证分摊比例
  const validateAllocationRatios = () => {
    if (!formData.is_allocation_enabled) return true;
    
    const totalRatio = allocationResults.length > 0 ? 
      allocationResults.reduce((sum, result) => sum + result.allocation_ratio, 0) :
      allocationConfigs.reduce((sum, config) => sum + config.allocation_ratio, 0);
    
    return Math.abs(totalRatio - 100) < 0.01;
  };

  // 添加账款记录
  const handleAddAccount = async () => {
    try {
      // 验证必填字段
      if (!formData.counterparty_id || !formData.amount || !formData.description || !formData.occurred_date || !formData.department_id) {
        const missingFields = [];
        if (!formData.counterparty_id) missingFields.push(activeTab === 'receivable' ? '客户' : '供应商');
        if (!formData.amount) missingFields.push('账款金额');
        if (!formData.description) missingFields.push('账款描述');
        if (!formData.occurred_date) missingFields.push('账款日期');
        if (!formData.department_id) missingFields.push('关联部门');
        
        toast({
          title: '请填写所有必填字段',
          description: `缺少：${missingFields.join('、')}`,
          variant: 'destructive',
        });
        return;
      }

      // 验证分摊配置
      if (formData.is_allocation_enabled) {
        if (!validateAllocationRatios()) {
          toast({
            title: '分摊比例不正确',
            description: '分摊比例总和必须为100%',
            variant: 'destructive',
          });
          return;
        }
      }
      // 移除错误的团队验证逻辑

      const counterparty = formData.counterparty_type === 'customer' 
        ? customers.find(c => c.id === formData.counterparty_id)
        : suppliers.find(s => s.id === formData.counterparty_id);

      if (!counterparty) {
        alert('请选择有效的客户或供应商');
        return;
      }

      const amount = parseFloat(formData.amount);

      const accountData = {
        // 必填字段
        record_number: `AR${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        counterparty_id: counterparty.id,
        counterparty_type: formData.counterparty_type,
        occurred_date: formData.occurred_date,
        amount: amount,
        type: formData.type,
        
        // 金额相关字段
        settled_amount: 0,
        balance: amount,
        
        // 描述和文档信息
        description: formData.description,
        document_number: formData.document_number || undefined,
        document_type: formData.document_type,
        
        // 日期
        due_date: formData.due_date || undefined,
        
        // 关联信息
        department_id: formData.department_id,
        
        // 分摊设置
        is_allocation_enabled: formData.is_allocation_enabled,
        
        // 状态和账龄
        status: 'pending' as const,
        aging_days: 0,
        aging_category: '30天内' as const,
        
        // 创建信息（让数据库自动处理）
        created_by: undefined // 数据库会自动处理
      };

      await accountsAPI.createAccountsRecord(accountData);
      
      // 如果启用了分摊，创建分摊记录
      if (formData.is_allocation_enabled && allocationResults.length > 0) {
        console.log('准备创建分摊记录:', {
          is_allocation_enabled: formData.is_allocation_enabled,
          allocationResults: allocationResults,
          allocationConfigs: allocationConfigs,
          allocationResultsLength: allocationResults.length
        });
        
        try {
          // 重新获取最新的账款记录，找到刚创建的记录
          const allAccounts = await accountsAPI.getAccountsRecords();
          const newAccount = allAccounts.find(acc => 
            acc.recordNumber === accountData.record_number &&
            acc.amount === amount &&
            acc.description === formData.description
          );
          
          console.log('找到新创建的账款记录:', newAccount);
          
          if (newAccount) {
            // 创建分摊记录 - 使用accounts类型，因为数据库schema现在支持accounts类型
            const allocationPromises = allocationResults.map(result => {
              const params = {
                source_record_type: 'accounts' as const, // 使用accounts类型
                source_record_id: newAccount.id,
                allocation_config_id: result.config_id,
                allocated_amount: result.allocated_amount,
                allocation_date: formData.occurred_date,
                description: `账款分摊: ${formData.description}`,
              };
              console.log('创建分摊记录参数:', params);
              return allocationAPI.createAllocationRecord(params);
            });
            
            const createdAllocations = await Promise.all(allocationPromises);
            console.log('分摊记录创建成功:', createdAllocations);
          } else {
            console.log('未找到新创建的账款记录');
          }
        } catch (allocationError) {
          console.error('创建分摊记录失败:', allocationError);
          toast({
            title: '账款记录创建成功',
            description: '但分摊记录创建失败，请稍后重试',
            variant: 'destructive',
          });
        }
      } else {
        console.log('未启用分摊或分摊结果为空:', {
          is_allocation_enabled: formData.is_allocation_enabled,
          allocationResultsLength: allocationResults.length,
          allocationResults: allocationResults
        });
      }
      
      toast({
        title: '创建成功',
        description: `${activeTab === 'receivable' ? '应收' : '应付'}账款记录已创建`,
        duration: 2000,
      });
      
      await loadData();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error('添加账款失败:', err);
      
      // 提供详细的错误信息
      let errorMessage = '添加账款失败';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as any).message;
      }
      
      toast({
        title: '添加账款失败',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // 打开编辑对话框
  const openEditDialog = (account: AccountsRecord) => {
    setSelectedAccount(account);
    
    // 初始化编辑表单数据
    setEditFormData({
      counterparty_id: account.counterparty?.id || '',
      counterparty_type: account.counterparty?.type || 'customer',
      amount: account.amount.toString(),
      type: account.type,
      description: account.description,
      document_number: account.documentNumber,
      document_type: account.documentType,
      occurred_date: account.occurredDate,
      due_date: account.dueDate || '',
      department_id: account.department?.id || '',
      project_id: account.project?.id || '',
      is_allocation_enabled: account.is_allocation_enabled || false,
      team_id: account.team_id || '',
      status: account.status,
    });

    // 如果启用了分摊，计算分摊结果
    if (account.is_allocation_enabled) {
      calculateEditAllocation(account.amount);
    } else {
      setEditAllocationResults([]);
    }
    
    setIsEditDialogOpen(true);
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'settled': return 'border-green-500 text-green-500';
      case 'pending': return 'border-yellow-500 text-yellow-500';
      case 'overdue': return 'border-red-500 text-red-500';
      default: return 'border-muted-foreground text-muted-foreground';
    }
  };

  // 获取状态名称
  const getStatusName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'settled': '已结清',
      'pending': '待处理',
      'overdue': '逾期',
    };
    return statusMap[status] || status;
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'settled': return <CheckSquare className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'overdue': return <XCircle className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  // 分摊相关函数
  const handleAllocationToggle = (checked: boolean) => {
    console.log('分摊切换:', {
      checked: checked,
      currentAmount: formData.amount,
      allocationConfigsCount: allocationConfigs.length
    });
    
    setFormData(prev => ({ ...prev, is_allocation_enabled: checked }));
    
    // 如果启用分摊，立即计算分摊结果
    if (checked) {
      console.log('启用分摊，开始计算分摊结果');
      const amount = parseFloat(formData.amount) || 0;
      calculateAllocation(amount);
      
      // 如果金额为0但有分摊配置，也要初始化分摊结果
      if (amount === 0) {
        const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
        if (enabledConfigs.length > 0) {
          const initialResults = enabledConfigs.map(config => {
            const team = teams.find(t => t.id === config.team_id);
            return {
              team_id: config.team_id,
              team_name: team?.name || '未知团队',
              allocation_ratio: config.allocation_ratio,
              allocated_amount: 0,
              config_id: config.id || ''
            };
          });
          setAllocationResults(initialResults);
        }
      }
    } else {
      console.log('禁用分摊，清空分摊结果');
      setAllocationResults([]);
    }
  };

  const calculateTeamAllocationAmount = (teamId: string) => {
    const config = allocationConfigs.find(c => c.team_id === teamId);
    if (!config || !formData.amount) return 0;
    return (parseFloat(formData.amount) * config.allocation_ratio) / 100;
  };

  const getTotalAllocationAmount = () => {
    if (!formData.amount) return 0;
    return allocationConfigs.reduce((total, config) => {
      return total + (parseFloat(formData.amount) * config.allocation_ratio) / 100;
    }, 0);
  };

  const getTotalRatio = () => {
    return allocationConfigs.reduce((total, config) => total + config.allocation_ratio, 0);
  };

  const isRatioBalanced = () => {
    return Math.abs(getTotalRatio() - 100) < 0.01;
  };

  // 编辑分摊计算函数
  const calculateEditAllocation = (amount: number) => {
    if (!editFormData.is_allocation_enabled || amount <= 0) {
      setEditAllocationResults([]);
      return;
    }

    const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
    if (enabledConfigs.length === 0) {
      setEditAllocationResults([]);
      return;
    }

    const results = enabledConfigs.map(config => {
      const team = teams.find(t => t.id === config.team_id);
      return {
        team_id: config.team_id,
        team_name: team?.name || '未知团队',
        allocation_ratio: config.allocation_ratio,
        allocated_amount: (amount * config.allocation_ratio / 100),
        config_id: config.id || ''
      };
    });

    setEditAllocationResults(results);
  };

  // 更新编辑分摊比例
  const updateEditAllocationRatio = (teamId: string, newRatio: number) => {
    setEditAllocationResults(prev => 
      prev.map(result => 
        result.team_id === teamId 
          ? { ...result, allocation_ratio: newRatio, allocated_amount: (parseFloat(editFormData.amount) || 0) * newRatio / 100 }
          : result
      )
    );
  };

  // 验证编辑分摊比例
  const validateEditAllocationRatios = () => {
    if (!editFormData.is_allocation_enabled) return true;
    
    const totalRatio = editAllocationResults.length > 0 ? 
      editAllocationResults.reduce((sum, result) => sum + result.allocation_ratio, 0) :
      allocationConfigs.reduce((sum, config) => sum + config.allocation_ratio, 0);
    
    return Math.abs(totalRatio - 100) < 0.01;
  };

  // 重置编辑表单
  const resetEditForm = () => {
    setEditFormData({
      counterparty_id: '',
      counterparty_type: 'customer',
      amount: '',
      type: 'receivable',
      description: '',
      document_number: '',
      document_type: 'invoice',
      occurred_date: '',
      due_date: '',
      department_id: '',
      project_id: '',
      is_allocation_enabled: false,
      team_id: '',
      status: 'pending',
    });
    setEditAllocationResults([]);
  };

  // 获取分摊明细
  const getAllocationDetails = (account: AccountsRecord) => {
    // 如果账款记录没有启用分摊，返回空数组
    if (!account.is_allocation_enabled) {
      return [];
    }

    // 模拟分摊记录 - 实际应该从API获取
    return allocationConfigs.map(config => {
      const team = teams.find(t => t.id === config.team_id);
      const allocatedAmount = (account.amount * config.allocation_ratio) / 100;
      
      return {
        id: `${account.id}-${config.id}`,
        account_id: account.id,
        allocation_config_id: config.id,
        allocated_amount: allocatedAmount,
        date: account.date,
        description: `${account.description} - ${team?.name}分摊`,
        allocation_config: config
      };
    });
  };

  // 导出分摊明细
  const exportAllocationDetails = (account: AccountsRecord) => {
    const details = getAllocationDetails(account);
    
    if (details.length === 0) {
      toast({
        title: '无分摊明细',
        description: '该账款记录没有分摊信息',
        variant: 'default',
      });
      return;
    }

    // 创建CSV内容
    const headers = ['团队名称', '分摊比例(%)', '分摊金额(￥)', '分摊时间', '描述'];
    const csvData = details.map(detail => {
      const team = teams.find(t => t.id === detail.allocation_config?.team_id);
      return [
        team?.name || '未知团队',
        detail.allocation_config?.allocation_ratio || 0,
        detail.allocated_amount,
        detail.date,
        detail.description
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `账款分摊明细_${account.recordNumber}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: '导出成功',
      description: '分摊明细已导出到CSV文件',
      variant: 'default',
    });
  };

  const getRatioStatusStyle = () => {
    return isRatioBalanced() ? 'text-green-600' : 'text-red-600';
  };

  const handleSaveAccount = () => {
    // 这里应该调用 handleAddAccount 或类似的保存函数
    handleAddAccount();
  };

  // 编辑保存账款记录
  const handleEditAccount = async () => {
    try {
      if (!selectedAccount) return;

      // 验证必填字段
      if (!editFormData.counterparty_id || !editFormData.amount || !editFormData.description || !editFormData.occurred_date || !editFormData.department_id) {
        const missingFields = [];
        if (!editFormData.counterparty_id) missingFields.push(activeTab === 'receivable' ? '客户' : '供应商');
        if (!editFormData.amount) missingFields.push('账款金额');
        if (!editFormData.description) missingFields.push('账款描述');
        if (!editFormData.occurred_date) missingFields.push('账款日期');
        if (!editFormData.department_id) missingFields.push('关联部门');
        
        toast({
          title: '请填写所有必填字段',
          description: `缺少字段: ${missingFields.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      // 验证分摊比例
      if (editFormData.is_allocation_enabled && !validateEditAllocationRatios()) {
        toast({
          title: '分摊比例错误',
          description: '分摊比例总和必须为100%',
          variant: 'destructive',
        });
        return;
      }

      // 构建更新数据
      const updateData = {
        counterparty_id: editFormData.counterparty_id,
        counterparty_type: editFormData.counterparty_type,
        amount: parseFloat(editFormData.amount),
        type: editFormData.type,
        description: editFormData.description,
        document_number: editFormData.document_number,
        document_type: editFormData.document_type,
        occurred_date: editFormData.occurred_date,
        due_date: editFormData.due_date || null,
        department_id: editFormData.department_id,
        is_allocation_enabled: editFormData.is_allocation_enabled,
        status: editFormData.status === 'partial' ? 'pending' : editFormData.status, // 将partial映射为pending
      };

      // 调用API更新账款记录
      await accountsAPI.updateAccountsRecord(selectedAccount.id, updateData);

      // 如果启用了分摊，更新分摊记录
      if (editFormData.is_allocation_enabled) {
        console.log('准备更新分摊记录:', {
          is_allocation_enabled: editFormData.is_allocation_enabled,
          editAllocationResults: editAllocationResults,
          selectedAccountId: selectedAccount.id
        });
        
        try {
          // 先删除原有的分摊记录 - 使用accounts类型查询
          const existingAllocations = await allocationAPI.getAllocationRecords({
            source_record_type: 'accounts',
            source_record_id: selectedAccount.id
          });
          console.log('现有分摊记录:', existingAllocations);
          
          for (const allocation of existingAllocations) {
            await allocationAPI.deleteAllocationRecord(allocation.id);
          }
          
          // 创建新的分摊记录（只有当有分摊结果时才创建）
          if (editAllocationResults.length > 0) {
            const allocationPromises = editAllocationResults.map(result => {
              const params = {
                source_record_type: 'accounts' as const, // 使用accounts类型
                source_record_id: selectedAccount.id,
                allocation_config_id: result.config_id,
                allocated_amount: result.allocated_amount,
                allocation_date: editFormData.occurred_date,
                description: `账款分摊: ${editFormData.description}`,
              };
              console.log('创建编辑分摊记录参数:', params);
              return allocationAPI.createAllocationRecord(params);
            });
            
            await Promise.all(allocationPromises);
            console.log('编辑分摊记录创建成功');
          } else {
            console.log('编辑分摊结果为空，不创建分摊记录');
          }
        } catch (allocationError) {
          console.error('更新分摊记录失败:', allocationError);
          toast({
            title: '账款记录更新成功',
            description: '但分摊记录更新失败，请稍后重试',
            variant: 'destructive',
          });
        }
      } else {
        console.log('未启用分摊，删除现有分摊记录');
        // 如果不分摊，删除原有的分摊记录
        try {
          const existingAllocations = await allocationAPI.getAllocationRecords({
            source_record_type: 'expense',
            source_record_id: selectedAccount.id
          });
          for (const allocation of existingAllocations) {
            await allocationAPI.deleteAllocationRecord(allocation.id);
          }
        } catch (error) {
          console.error('删除分摊记录失败:', error);
        }
      }

      toast({
        title: '更新成功',
        description: '账款记录已成功更新',
        variant: 'default',
      });
      
      await loadData();
      setIsEditDialogOpen(false);
      resetEditForm();
    } catch (err) {
      console.error('更新账款失败:', err);
      
      let errorMessage = '更新账款失败';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as any).message;
      }
      
      toast({
        title: '更新账款失败',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const openAllocationDialog = (account: AccountsRecord) => {
    setSelectedAccount(account);
    setIsAllocationDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background theme-transition flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Clock className="h-6 w-6 animate-spin" />
          <span>加载往来账款数据中...</span>
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
            <h1 className="text-3xl font-bold text-foreground">往来管理</h1>
            <p className="text-muted-foreground mt-1">管理应收账款和应付账款</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增{activeTab === 'receivable' ? '应收' : '应付'}账款
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增{activeTab === 'receivable' ? '应收' : '应付'}账款记录</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="partner" className="text-sm font-medium flex items-center">
                      {activeTab === 'receivable' ? '客户' : '供应商'}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select 
                      value={formData.counterparty_id} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        counterparty_id: value,
                        counterparty_type: activeTab === 'receivable' ? 'customer' : 'supplier',
                        type: activeTab as 'receivable' | 'payable'
                      }))}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder={`选择${activeTab === 'receivable' ? '客户' : '供应商'}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {(activeTab === 'receivable' ? customers : suppliers).map(partner => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium flex items-center">
                      账款金额
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="amount" 
                      type="number"
                      placeholder="请输入账款金额"
                      value={formData.amount || ''}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, amount: e.target.value }));
                        // 当金额变化时，重新计算分摊
                        if (formData.is_allocation_enabled) {
                          calculateAllocation(parseFloat(e.target.value) || 0);
                        }
                      }}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project">关联项目</Label>
                    <Select 
                      value={formData.project_id || 'none'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value === 'none' ? '' : value }))}
                    >
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
                  <div>
                    <Label htmlFor="department" className="text-sm font-medium flex items-center">
                      关联部门
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select 
                      value={formData.department_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择关联部门" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {departments.map(department => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium flex items-center">
                      账款日期
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={formData.occurred_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, occurred_date: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">到期日期</Label>
                    <Input 
                      id="dueDate" 
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>

                  <div>
                  <Label htmlFor="description" className="text-sm font-medium flex items-center">
                    账款描述
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea 
                    id="description" 
                    placeholder="请输入账款描述"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-background border-border text-foreground" 
                    rows={3}
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
                              // 如果allocationResults为空，显示默认配置并初始化分摊结果
                              (() => {
                                const enabledConfigs = allocationConfigs.filter(config => config.is_enabled);
                                const amount = parseFloat(formData.amount) || 0;
                                
                                // 初始化分摊结果
                                if (enabledConfigs.length > 0 && amount > 0) {
                                  const initialResults = enabledConfigs.map(config => {
                                    const team = teams.find(t => t.id === config.team_id);
                                    return {
                                      team_id: config.team_id,
                                      team_name: team?.name || '未知团队',
                                      allocation_ratio: config.allocation_ratio,
                                      allocated_amount: (amount * config.allocation_ratio / 100),
                                      config_id: config.id || ''
                                    };
                                  });
                                  setAllocationResults(initialResults);
                                }
                                
                                return enabledConfigs.map((config) => {
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
                                });
                              })()
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
                      <Select value={formData.team_id} onValueChange={(value) => setFormData(prev => ({ ...prev, team_id: value }))}>
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
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleSaveAccount}
                    disabled={formData.is_allocation_enabled ? !isRatioBalanced() : !formData.team_id}
                  >
                    新增{activeTab === 'receivable' ? '应收' : '应付'}账款
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
              <CardTitle className="text-sm font-medium text-muted-foreground">应收账款总额</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">¥{totalReceivable.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                已收 ¥{settledReceivable.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">应付账款总额</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">¥{totalPayable.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                已付 ¥{settledPayable.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">净资产</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{(totalReceivable - totalPayable).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                应收 - 应付
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">逾期账款</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{(overdueReceivable + overduePayable).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                需要关注
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card className="bg-card border-border theme-transition">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索账款描述、客户或供应商..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
              <div className="flex space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待处理</SelectItem>
                    <SelectItem value="partial">部分结清</SelectItem>
                    <SelectItem value="settled">已结清</SelectItem>
                    <SelectItem value="overdue">逾期</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 往来账款列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">往来账款</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="receivable" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>应收账款</span>
                </TabsTrigger>
                <TabsTrigger value="payable" className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4" />
                  <span>应付账款</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="receivable" className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">日期</TableHead>
                      <TableHead className="text-muted-foreground">描述</TableHead>
                      <TableHead className="text-muted-foreground">客户</TableHead>
                      <TableHead className="text-muted-foreground">项目</TableHead>
                      <TableHead className="text-muted-foreground">金额</TableHead>
                      <TableHead className="text-muted-foreground">到期日</TableHead>
                      <TableHead className="text-muted-foreground">状态</TableHead>
                      <TableHead className="text-muted-foreground">分摊状态</TableHead>
                      <TableHead className="text-muted-foreground">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceivables.map((account) => (
                      <TableRow key={account.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{account.occurredDate}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{account.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{account.counterparty?.name || '未设置'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                            <span className="text-muted-foreground">-</span>
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          ¥{account.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{account.dueDate}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(account.status)}
                            <Badge variant="outline" className={getStatusColor(account.status)}>
                              {getStatusName(account.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {account.is_allocation_enabled ? (
                            <div className="flex items-center space-x-2">
                              <Share2 className="h-4 w-4 text-blue-500" />
                              <Badge variant="outline" className="border-blue-500 text-blue-500">
                                已分摊
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                              未分摊
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                              onClick={() => openEditDialog(account)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {account.isAllocated && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                onClick={() => openAllocationDialog(account)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="payable" className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">日期</TableHead>
                      <TableHead className="text-muted-foreground">描述</TableHead>
                      <TableHead className="text-muted-foreground">供应商</TableHead>
                      <TableHead className="text-muted-foreground">项目</TableHead>
                      <TableHead className="text-muted-foreground">金额</TableHead>
                      <TableHead className="text-muted-foreground">到期日</TableHead>
                      <TableHead className="text-muted-foreground">状态</TableHead>
                      <TableHead className="text-muted-foreground">分摊状态</TableHead>
                      <TableHead className="text-muted-foreground">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayables.map((account) => (
                      <TableRow key={account.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{account.date}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{account.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{account.counterparty?.name || '未设置'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                            <span className="text-muted-foreground">-</span>
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          ¥{account.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{account.dueDate}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(account.status)}
                            <Badge variant="outline" className={getStatusColor(account.status)}>
                              {getStatusName(account.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {account.isAllocated ? (
                            <div className="flex items-center space-x-2">
                              <Share2 className="h-4 w-4 text-blue-500" />
                              <Badge variant="outline" className="border-blue-500 text-blue-500">
                                已分摊
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                              未分摊
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                              onClick={() => openEditDialog(account)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {account.isAllocated && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                onClick={() => openAllocationDialog(account)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 编辑账款对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑{activeTab === 'receivable' ? '应收' : '应付'}账款记录</DialogTitle>
            </DialogHeader>
            {selectedAccount && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editPartner" className="text-sm font-medium flex items-center">
                      {activeTab === 'receivable' ? '客户' : '供应商'}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select 
                      value={editFormData.counterparty_id} 
                      onValueChange={(value) => {
                        setEditFormData(prev => ({ 
                          ...prev, 
                          counterparty_id: value,
                          counterparty_type: activeTab === 'receivable' ? 'customer' : 'supplier',
                          type: activeTab as 'receivable' | 'payable'
                        }));
                      }}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder={`选择${activeTab === 'receivable' ? '客户' : '供应商'}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {(activeTab === 'receivable' ? customers : suppliers).map(partner => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editAmount" className="text-sm font-medium flex items-center">
                      账款金额
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="editAmount" 
                      type="number"
                      placeholder="请输入账款金额"
                      value={editFormData.amount}
                      onChange={(e) => {
                        setEditFormData(prev => ({ ...prev, amount: e.target.value }));
                        // 当金额变化时，重新计算分摊
                        if (editFormData.is_allocation_enabled) {
                          calculateEditAllocation(parseFloat(e.target.value) || 0);
                        }
                      }}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editProject">关联项目</Label>
                    <Select 
                      value={editFormData.project_id || 'none'} 
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, project_id: value === 'none' ? '' : value }))}
                    >
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
                  <div>
                    <Label htmlFor="editDepartment" className="text-sm font-medium flex items-center">
                      关联部门
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select 
                      value={editFormData.department_id} 
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, department_id: value }))}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择关联部门" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {departments.map(department => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editDate" className="text-sm font-medium flex items-center">
                      账款日期
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="editDate" 
                      type="date"
                      value={editFormData.occurred_date}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, occurred_date: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="editDueDate">到期日期</Label>
                    <Input 
                      id="editDueDate" 
                      type="date"
                      value={editFormData.due_date}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="bg-background border-border text-foreground" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editStatus">账款状态</Label>
                    <Select 
                      value={editFormData.status}
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value as 'pending' | 'partial' | 'settled' | 'overdue' }))}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="pending">待处理</SelectItem>
                        <SelectItem value="partial">部分结清</SelectItem>
                        <SelectItem value="settled">已结清</SelectItem>
                        <SelectItem value="overdue">逾期</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editAllocation">分摊设置</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-allocation-enabled"
                        checked={editFormData.is_allocation_enabled}
                        onCheckedChange={(checked) => {
                          const newEditFormData = { ...editFormData, is_allocation_enabled: checked as boolean };
                          setEditFormData(newEditFormData);
                          if (checked) {
                            // 立即计算分摊结果
                            calculateEditAllocation(parseFloat(editFormData.amount) || 0);
                          } else {
                            setEditAllocationResults([]);
                          }
                        }}
                      />
                      <Label htmlFor="edit-allocation-enabled" className="text-sm font-medium">
                        启用分摊
                      </Label>
                  </div>
                </div>
                </div>

                <div>
                  <Label htmlFor="editDescription" className="text-sm font-medium flex items-center">
                    账款描述
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea 
                    id="editDescription" 
                    placeholder="请输入账款描述"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-background border-border text-foreground" 
                    rows={3}
                  />
                </div>

                {/* 分摊设置 */}
                {editFormData.is_allocation_enabled && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <h4 className="text-blue-800 dark:text-blue-200 font-medium mb-3 flex items-center">
                        <Share2 className="h-4 w-4 mr-2" />
                        分摊配置
                      </h4>
                      {allocationConfigs.filter(config => config.is_enabled).length > 0 ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-4 text-xs font-medium text-blue-800 dark:text-blue-200 border-b border-blue-200 dark:border-blue-800 pb-2">
                            <div>团队名称</div>
                            <div>默认比例</div>
                            <div>本次比例</div>
                            <div>分配金额</div>
                          </div>
                          
                          {(editAllocationResults.length > 0 ? editAllocationResults : allocationConfigs.filter(config => config.is_enabled).map(config => {
                            const team = teams.find(t => t.id === config.team_id);
                            const amount = parseFloat(editFormData.amount) || 0;
                            return {
                              team_id: config.team_id,
                              team_name: team?.name || '未知团队',
                              allocation_ratio: config.allocation_ratio,
                              allocated_amount: (amount * config.allocation_ratio) / 100,
                              config_id: config.id,
                            };
                          })).map((result) => (
                            <div key={result.team_id} className="grid grid-cols-4 gap-4 items-center text-sm">
                              <div className="font-medium text-blue-900 dark:text-blue-100">
                                {result.team_name}
                              </div>
                              <div className="text-blue-700 dark:text-blue-300">
                                {result.allocation_ratio}%
                              </div>
                              <div className="text-blue-700 dark:text-blue-300">
                                <Input
                                  type="number"
                                  value={result.allocation_ratio}
                                  onChange={(e) => {
                                    const newRatio = parseFloat(e.target.value) || 0;
                                    updateEditAllocationRatio(result.team_id, newRatio);
                                  }}
                                  className="w-16 h-6 text-xs bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600"
                                />
                                %
                              </div>
                              <div className="text-blue-900 dark:text-blue-100 font-medium">
                                ¥{result.allocated_amount.toLocaleString()}
                              </div>
                            </div>
                          ))}
                          
                          {/* 分摊比例状态 */}
                          <div className={`text-xs font-medium ${validateEditAllocationRatios() ? 'text-green-600' : 'text-red-600'}`}>
                            {validateEditAllocationRatios() ? '✓ 分摊比例平衡' : '✗ 分摊比例不平衡，总和必须为100%'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-blue-600 dark:text-blue-400 text-sm">
                          暂无可用的分摊配置，请先在团队管理中配置分摊比例
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditDialogOpen(false);
                    resetEditForm();
                  }}>
                    取消
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleEditAccount}
                  >
                    保存更改
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 分摊明细对话框 */}
        <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-blue-500" />
                <span>分摊明细</span>
              </DialogTitle>
            </DialogHeader>
            {selectedAccount && (
              <div className="space-y-4">
                {/* 原始账款信息 */}
                <div className="bg-accent rounded-lg p-4">
                  <h4 className="text-foreground font-medium mb-2">原始账款信息</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">账款描述：</span>
                      <span className="text-foreground">{selectedAccount.description}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">账款金额：</span>
                      <span className="text-foreground font-medium">¥{selectedAccount.amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">账款日期：</span>
                      <span className="text-foreground">{selectedAccount.date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{selectedAccount.type === 'receivable' ? '客户' : '供应商'}：</span>
                      <span className="text-foreground">
                        {selectedAccount.counterparty?.name || '未设置'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 分摊明细表格 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-foreground font-medium">分摊明细</h4>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => exportAllocationDetails(selectedAccount)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Download className="mr-2 h-3 w-3" />
                      导出明细
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">团队名称</TableHead>
                        <TableHead className="text-muted-foreground">分摊比例</TableHead>
                        <TableHead className="text-muted-foreground">分摊金额</TableHead>
                        <TableHead className="text-muted-foreground">分摊时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAllocationDetails(selectedAccount).map((allocation) => {
                        const teamName = allocation.description.split(' - ')[1]?.replace('分摊', '');
                        const team = teams.find(t => allocation.description.includes(t.name));
                        const config = allocationConfigs.find(c => c.team_id === team?.id);
                        
                        return (
                          <TableRow key={allocation.id} className="border-border">
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground font-medium">{teamName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Percent className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground">{config?.allocation_ratio || 0}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground font-medium">
                              ¥{allocation.allocated_amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{allocation.date}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsAllocationDialogOpen(false)}>
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

export default AccountsManagement;
