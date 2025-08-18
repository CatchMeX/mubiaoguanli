import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  Download,
  Calendar,
  Building,
  DollarSign,
  Percent,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings,
  Bell,
  Shield,
  Target,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingDown,
  Plus,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';
import api from '@/services/api';
import type { 
  AllocationSummary, AllocationConfig, AllocationRecord, 
  Department, Supplier, Project, AlertRule, AlertRecord 
} from '@/types';

const AllocationQuery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTargetType, setSelectedTargetType] = useState<string>('all');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('all');
  const [isRuleConfigOpen, setIsRuleConfigOpen] = useState(false);
  const [isAddConfigOpen, setIsAddConfigOpen] = useState(false);
  const [isEditConfigOpen, setIsEditConfigOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 数据状态
  const [allocationSummary, setAllocationSummary] = useState<AllocationSummary[]>([]);
  const [allocationConfigs, setAllocationConfigs] = useState<AllocationConfig[]>([]);
  const [allocationRecords, setAllocationRecords] = useState<AllocationRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [selectedConfig, setSelectedConfig] = useState<AllocationConfig | null>(null);
  
  // 预警数据状态
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [alertRecords, setAlertRecords] = useState<AlertRecord[]>([]);
  const [alertStatistics, setAlertStatistics] = useState<any>({});

  // 表单状态
  const [configFormData, setConfigFormData] = useState({
    name: '',
    target_type: 'department' as 'department' | 'subsidiary' | 'project',
    target_id: '',
    allocation_ratio: '',
    is_enabled: true,
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        summaryData, 
        configsData, 
        recordsData, 
        departmentsData, 
        subsidiariesData, 
        projectsData,
        statisticsData,
        alertRulesData,
        alertRecordsData,
        alertStatsData
      ] = await Promise.all([
        api.allocation.getAllocationSummary({
          startDate: dateRange.start,
          endDate: dateRange.end,
        }),
        api.allocation.getAllocationConfigs(),
        api.allocation.getAllocationRecords({
          startDate: dateRange.start,
          endDate: dateRange.end,
        }),
        api.department.getAll(),
        api.supplier.getAll(), // 使用供应商作为子公司
        api.project.getAll(),
        api.allocation.getAllocationStatistics({
          startDate: dateRange.start,
          endDate: dateRange.end,
        }),
        api.allocation.getAlertRules(),
        api.allocation.getAlertRecords({
          startDate: dateRange.start,
          endDate: dateRange.end,
        }),
        api.allocation.getAlertStatistics()
      ]);
      
      setAllocationSummary(summaryData);
      setAllocationConfigs(configsData);
      setAllocationRecords(recordsData);
      setDepartments(departmentsData);
      setSubsidiaries(subsidiariesData);
      setProjects(projectsData);
      setStatistics(statisticsData);
      setAlertRules(alertRulesData);
      setAlertRecords(alertRecordsData);
      setAlertStatistics(alertStatsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      console.error('加载往来管理数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const resetConfigForm = () => {
    setConfigFormData({
      name: '',
      target_type: 'department',
      target_id: '',
      allocation_ratio: '',
      is_enabled: true,
    });
  };

  // 获取分摊费用记录
  const getAllocationRecords = () => {
    return allocationRecords.filter(record => {
      const matchesSearch = searchTerm === '' || 
        record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.allocation_config?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTargetType = selectedTargetType === 'all' || 
        record.allocation_config?.target_type === selectedTargetType;
        
      const matchesTargetId = selectedTargetId === 'all' || 
        record.allocation_config?.target_id === selectedTargetId;
      
      return matchesSearch && matchesTargetType && matchesTargetId;
    });
  };

  // 获取分摊汇总数据
  const getAllocationSummaries = () => {
    return allocationSummary.filter(summary => {
      const matchesTargetType = selectedTargetType === 'all' || 
        summary.target_type === selectedTargetType;
      return matchesTargetType;
    });
  };

  // 获取目标选项
  const getTargetOptions = (targetType: string) => {
    switch (targetType) {
      case 'department':
        return departments;
      case 'subsidiary':
        return subsidiaries;
      case 'project':
        return projects;
      default:
        return [];
    }
  };

  // 获取目标名称
  const getTargetName = (targetType: string, targetId: string) => {
    const options = getTargetOptions(targetType);
    const target = options.find(item => item.id === targetId);
    return target?.name || '未知';
  };

  // 添加分摊配置
  const handleAddConfig = async () => {
    try {
      if (!configFormData.name || !configFormData.target_id || !configFormData.allocation_ratio) {
        alert('请填写所有必填字段');
        return;
      }

      const ratio = parseFloat(configFormData.allocation_ratio);
      if (ratio < 0 || ratio > 100) {
        alert('分摊比例必须在0-100之间');
        return;
      }

      await api.allocation.createAllocationConfig({
        name: configFormData.name,
        target_type: configFormData.target_type,
        target_id: configFormData.target_id,
        allocation_ratio: ratio,
        is_enabled: configFormData.is_enabled,
      });

      await loadData();
      setIsAddConfigOpen(false);
      resetConfigForm();
      alert('分摊配置添加成功！');
    } catch (err) {
      console.error('添加分摊配置失败:', err);
      alert('添加分摊配置失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 打开编辑配置对话框
  const openEditConfigDialog = (config: AllocationConfig) => {
    setSelectedConfig(config);
    setConfigFormData({
      name: config.name,
      target_type: config.target_type,
      target_id: config.target_id,
      allocation_ratio: config.allocation_ratio.toString(),
      is_enabled: config.is_enabled,
    });
    setIsEditConfigOpen(true);
  };

  // 更新分摊配置
  const handleUpdateConfig = async () => {
    if (!selectedConfig) return;

    try {
      const ratio = parseFloat(configFormData.allocation_ratio);
      if (ratio < 0 || ratio > 100) {
        alert('分摊比例必须在0-100之间');
        return;
      }

      await api.allocation.updateAllocationConfig(selectedConfig.id, {
        name: configFormData.name,
        target_type: configFormData.target_type,
        target_id: configFormData.target_id,
        allocation_ratio: ratio,
        is_enabled: configFormData.is_enabled,
      });

      await loadData();
      setIsEditConfigOpen(false);
      setSelectedConfig(null);
      resetConfigForm();
      alert('分摊配置更新成功！');
    } catch (err) {
      console.error('更新分摊配置失败:', err);
      alert('更新分摊配置失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 删除分摊配置
  const handleDeleteConfig = async (config: AllocationConfig) => {
    if (confirm(`确定要删除分摊配置"${config.name}"吗？`)) {
      try {
        await api.allocation.deleteAllocationConfig(config.id);
        await loadData();
        alert('分摊配置删除成功！');
      } catch (err) {
        console.error('删除分摊配置失败:', err);
        alert('删除分摊配置失败: ' + (err instanceof Error ? err.message : '未知错误'));
      }
    }
  };

  // 获取分类标签颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'department': return 'border-blue-500 text-blue-500';
      case 'subsidiary': return 'border-green-500 text-green-500';
      case 'project': return 'border-orange-500 text-orange-500';
      default: return 'border-muted-foreground text-muted-foreground';
    }
  };

  // 获取分类名称
  const getCategoryName = (category: string) => {
    const categoryMap = {
      'department': '部门',
      'subsidiary': '子公司',
      'project': '项目',
    };
    return categoryMap[category as keyof typeof categoryMap] || category;
  };

  // 获取预警级别样式
  const getAlertLevelStyle = (level: string) => {
    switch (level) {
      case 'high': return 'border-red-500 text-red-500';
      case 'medium': return 'border-yellow-500 text-yellow-500';
      case 'low': return 'border-blue-500 text-blue-500';
      default: return 'border-muted-foreground text-muted-foreground';
    }
  };

  // 获取预警级别名称
  const getAlertLevelName = (level: string) => {
    const levelMap = { 'high': '高', 'medium': '中', 'low': '低' };
    return levelMap[level as keyof typeof levelMap] || level;
  };

  // 获取预警类型名称
  const getAlertTypeName = (type: string) => {
    const typeMap = {
      'ratio_change': '比例变动',
      'absolute_amount': '绝对金额',
      'relative_amount': '相对金额',
      'asset_ratio': '资产比例',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'border-red-500 text-red-500';
      case 'resolved': return 'border-green-500 text-green-500';
      case 'ignored': return 'border-gray-500 text-gray-500';
      default: return 'border-muted-foreground text-muted-foreground';
    }
  };

  // 获取状态名称
  const getStatusName = (status: string) => {
    const statusMap = { 'active': '活跃', 'resolved': '已解决', 'ignored': '已忽略' };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // 更新预警规则
  const updateAlertRule = async (ruleId: string, updates: Partial<AlertRule>) => {
    try {
      await api.allocation.updateAlertRule(ruleId, updates);
      setAlertRules(rules => 
        rules.map(rule => rule.id === ruleId ? { ...rule, ...updates } : rule)
      );
    } catch (err) {
      console.error('更新预警规则失败:', err);
      alert('更新预警规则失败');
    }
  };

  // 导出报告
  const exportReport = () => {
    console.log('导出往来分摊报告');
  };

  // 导出预警报告
  const exportAlertReport = () => {
    console.log('导出异常预警报告');
  };

  // 处理预警操作
  const handleAlertAction = async (alertId: string, action: 'resolve' | 'ignore') => {
    try {
      if (action === 'resolve') {
        await api.allocation.resolveAlertRecord(alertId);
      } else {
        await api.allocation.ignoreAlertRecord(alertId);
      }
      
      // 更新本地状态
      setAlertRecords(records => 
        records.map(record => 
          record.id === alertId 
            ? { ...record, status: action === 'resolve' ? 'resolved' : 'ignored' }
            : record
        )
      );
    } catch (err) {
      console.error('处理预警记录失败:', err);
      alert('处理预警记录失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background theme-transition flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载往来管理数据中...</span>
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
            <p className="text-muted-foreground mt-1">管理费用分摊配置和异常预警</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isAddConfigOpen} onOpenChange={setIsAddConfigOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  新增分摊配置
          </Button>
              </DialogTrigger>
              <DialogContent className="bg-popover border-border text-popover-foreground">
                <DialogHeader>
                  <DialogTitle>新增分摊配置</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
              <div>
                    <Label htmlFor="config-name">配置名称 *</Label>
                  <Input
                      id="config-name"
                      value={configFormData.name}
                      onChange={(e) => setConfigFormData({ ...configFormData, name: e.target.value })}
                  className="bg-background border-border text-foreground"
                      placeholder="请输入配置名称"
                />
              </div>
                  <div className="grid grid-cols-2 gap-4">
              <div>
                      <Label htmlFor="target-type">目标类型 *</Label>
                      <Select value={configFormData.target_type} onValueChange={(value: any) => setConfigFormData({ ...configFormData, target_type: value, target_id: '' })}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                          <SelectItem value="department">部门</SelectItem>
                          <SelectItem value="subsidiary">子公司</SelectItem>
                          <SelectItem value="project">项目</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                      <Label htmlFor="target-id">目标对象 *</Label>
                      <Select value={configFormData.target_id} onValueChange={(value) => setConfigFormData({ ...configFormData, target_id: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="选择目标对象" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                          {getTargetOptions(configFormData.target_type).map(option => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
                  <div>
                    <Label htmlFor="ratio">分摊比例 (%) *</Label>
                    <Input
                      id="ratio"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={configFormData.allocation_ratio}
                      onChange={(e) => setConfigFormData({ ...configFormData, allocation_ratio: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入分摊比例"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={configFormData.is_enabled}
                      onChange={(e) => setConfigFormData({ ...configFormData, is_enabled: e.target.checked })}
                      className="rounded border-border"
                    />
                    <Label htmlFor="enabled">启用状态</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {
                      setIsAddConfigOpen(false);
                      resetConfigForm();
                    }}>
                      取消
                    </Button>
                    <Button onClick={handleAddConfig} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      添加配置
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={exportReport}>
              <Download className="mr-2 h-4 w-4" />
              导出报告
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">分摊记录</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{statistics.totalRecords || 0}</div>
          </CardContent>
        </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">分摊配置</CardTitle>
              <Settings className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{allocationConfigs.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">分摊总额</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{(statistics.totalAllocated || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">平均分摊</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{(statistics.avgAllocation || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-muted rounded-lg p-1">
            <TabsTrigger value="summary" className="data-[state=active]:bg-background">分摊汇总</TabsTrigger>
            <TabsTrigger value="records" className="data-[state=active]:bg-background">分摊记录</TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-background">分摊配置</TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-background">异常预警</TabsTrigger>
          </TabsList>

          {/* 分摊汇总 */}
          <TabsContent value="summary">
            <Card className="bg-card border-border theme-transition">
              <CardHeader>
                <CardTitle className="text-foreground">分摊汇总</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="搜索分摊对象..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedTargetType} onValueChange={setSelectedTargetType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="department">部门</SelectItem>
                      <SelectItem value="subsidiary">子公司</SelectItem>
                      <SelectItem value="project">项目</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>分摊对象</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>分摊总额</TableHead>
                      <TableHead>分摊次数</TableHead>
                      <TableHead>平均分摊</TableHead>
                      <TableHead>分摊比例</TableHead>
                      <TableHead>最后分摊日期</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getAllocationSummaries().map((summary) => (
                      <TableRow key={summary.id}>
                        <TableCell className="font-medium">{summary.target_name}</TableCell>
                          <TableCell>
                          <Badge variant="outline" className={getCategoryColor(summary.target_type)}>
                            {getCategoryName(summary.target_type)}
                            </Badge>
                          </TableCell>
                        <TableCell>¥{summary.total_allocated.toLocaleString()}</TableCell>
                        <TableCell>{summary.allocation_count}</TableCell>
                        <TableCell>¥{summary.avg_allocation.toLocaleString()}</TableCell>
                        <TableCell>{summary.allocation_ratio?.toFixed(2)}%</TableCell>
                        <TableCell>{summary.last_allocation_date || '-'}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 分摊记录 */}
          <TabsContent value="records">
              <Card className="bg-card border-border theme-transition">
                <CardHeader>
                <CardTitle className="text-foreground">分摊记录</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                    <TableRow>
                      <TableHead>配置名称</TableHead>
                      <TableHead>分摊对象</TableHead>
                      <TableHead>分摊金额</TableHead>
                      <TableHead>分摊日期</TableHead>
                      <TableHead>描述</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {getAllocationRecords().map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.allocation_config?.name || '-'}
                          </TableCell>
                          <TableCell>
                          {getTargetName(
                            record.allocation_config?.target_type || '', 
                            record.allocation_config?.target_id || ''
                          )}
                          </TableCell>
                        <TableCell>¥{record.allocated_amount.toLocaleString()}</TableCell>
                        <TableCell>{record.allocation_date}</TableCell>
                        <TableCell>{record.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
          </TabsContent>

          {/* 分摊配置 */}
          <TabsContent value="config">
              <Card className="bg-card border-border theme-transition">
                <CardHeader>
                <CardTitle className="text-foreground">分摊配置</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                    <TableRow>
                      <TableHead>配置名称</TableHead>
                      <TableHead>目标类型</TableHead>
                      <TableHead>目标对象</TableHead>
                      <TableHead>分摊比例</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {allocationConfigs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.name}</TableCell>
                          <TableCell>
                          <Badge variant="outline" className={getCategoryColor(config.target_type)}>
                            {getCategoryName(config.target_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                          {getTargetName(config.target_type, config.target_id)}
                          </TableCell>
                        <TableCell>{config.allocation_ratio}%</TableCell>
                          <TableCell>
                          <Badge variant="outline" className={config.is_enabled ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}>
                            {config.is_enabled ? '启用' : '禁用'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditConfigDialog(config)}>
                              <Edit className="h-4 w-4" />
                                </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteConfig(config)}>
                              <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
          </TabsContent>

          {/* 异常预警 */}
          <TabsContent value="alerts">
              <Card className="bg-card border-border theme-transition">
                <CardHeader>
                <CardTitle className="text-foreground">异常预警</CardTitle>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Select value={alertFilter} onValueChange={setAlertFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="active">活跃</SelectItem>
                        <SelectItem value="resolved">已解决</SelectItem>
                        <SelectItem value="ignored">已忽略</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportAlertReport}>
                    <Download className="mr-2 h-4 w-4" />
                    导出预警报告
                  </Button>
                </div>
                </CardHeader>
                <CardContent>
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">预警功能开发中</h3>
                  <p className="text-muted-foreground">
                    异常预警功能正在开发中，将支持智能预警规则配置和实时监控
                  </p>
                          </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 编辑分摊配置对话框 */}
        <Dialog open={isEditConfigOpen} onOpenChange={setIsEditConfigOpen}>
          <DialogContent className="bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>编辑分摊配置</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                          <div>
                <Label htmlFor="edit-config-name">配置名称 *</Label>
                <Input
                  id="edit-config-name"
                  value={configFormData.name}
                  onChange={(e) => setConfigFormData({ ...configFormData, name: e.target.value })}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入配置名称"
                />
                          </div>
              <div className="grid grid-cols-2 gap-4">
                          <div>
                  <Label htmlFor="edit-target-type">目标类型 *</Label>
                  <Select value={configFormData.target_type} onValueChange={(value: any) => setConfigFormData({ ...configFormData, target_type: value, target_id: '' })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="department">部门</SelectItem>
                      <SelectItem value="subsidiary">子公司</SelectItem>
                      <SelectItem value="project">项目</SelectItem>
                    </SelectContent>
                  </Select>
                          </div>
                          <div>
                  <Label htmlFor="edit-target-id">目标对象 *</Label>
                  <Select value={configFormData.target_id} onValueChange={(value) => setConfigFormData({ ...configFormData, target_id: value })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择目标对象" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {getTargetOptions(configFormData.target_type).map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                      </div>
                    </div>
                    <div>
                <Label htmlFor="edit-ratio">分摊比例 (%) *</Label>
                <Input
                  id="edit-ratio"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={configFormData.allocation_ratio}
                  onChange={(e) => setConfigFormData({ ...configFormData, allocation_ratio: e.target.value })}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入分摊比例"
                />
                        </div>
                        <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-enabled"
                  checked={configFormData.is_enabled}
                  onChange={(e) => setConfigFormData({ ...configFormData, is_enabled: e.target.checked })}
                  className="rounded border-border"
                />
                <Label htmlFor="edit-enabled">启用状态</Label>
                        </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsEditConfigOpen(false);
                  setSelectedConfig(null);
                  resetConfigForm();
                }}>
                  取消
                </Button>
                <Button onClick={handleUpdateConfig} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  更新配置
                </Button>
                        </div>
                      </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AllocationQuery;
