import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Calculator,
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { mileageAPI, teamAPI, userAPI } from '@/services/api';
import type { EmployeeMileage, User, Team, TeamPerformanceConfig } from '@/types';

const EmployeeMileageManagement = () => {
  const [mileageRecords, setMileageRecords] = useState<EmployeeMileage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamPerformanceConfigs, setTeamPerformanceConfigs] = useState<Map<string, TeamPerformanceConfig>>(new Map());
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EmployeeMileage | null>(null);

  // 新增记录表单状态
  const [formData, setFormData] = useState({
    employeeId: 'none',
    teamId: 'none',
    mileage: '',
    recordDate: new Date().toISOString().split('T')[0],
    description: '',
    status: 'pending' as 'pending' | 'confirmed' | 'rejected',
  });

  // 编辑记录表单状态
  const [editFormData, setEditFormData] = useState({
    employeeId: 'none',
    teamId: 'none',
    mileage: '',
    recordDate: '',
    description: '',
    status: 'pending' as 'pending' | 'confirmed' | 'rejected',
  });

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 开始加载员工里程数据...');
      
      // 并行加载基础数据
      const [recordsData, usersData, teamsData, statsData] = await Promise.all([
        mileageAPI.getMileageRecords(),
        userAPI.getAll(),
        teamAPI.getAll(),
        mileageAPI.getMileageStatistics()
      ]);

      console.log('📊 里程记录数据:', recordsData);
      console.log('👥 用户数据:', usersData);
      console.log('🏢 团队数据:', teamsData);
      console.log('📈 统计数据:', statsData);

      setMileageRecords(recordsData);
      setUsers(usersData);
      setTeams(teamsData);
      setStatistics(statsData);

      // 加载所有团队的绩效配置
      console.log('🎯 开始加载团队绩效配置...');
      const performanceConfigMap = new Map<string, TeamPerformanceConfig>();
      
      for (const team of teamsData) {
        try {
          const config = await teamAPI.getTeamPerformanceConfig(team.id);
          if (config) {
            console.log(`✅ 团队 ${team.name} 的绩效配置:`, config);
            performanceConfigMap.set(team.id, config);
          } else {
            console.log(`⚠️ 团队 ${team.name} 没有绩效配置`);
          }
        } catch (err) {
          console.log(`❌ 获取团队 ${team.name} 的绩效配置失败:`, err);
        }
      }
      
      setTeamPerformanceConfigs(performanceConfigMap);
      console.log('🎯 绩效配置加载完成:', performanceConfigMap.size, '个团队配置');
    } catch (error) {
      console.error('❌ 加载数据失败:', error);
      alert('加载数据失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 计算绩效的函数 - 使用真实的数据库数据
  const calculatePerformance = (mileage: number, teamId: string): number => {
    const config = teamPerformanceConfigs.get(teamId);
    
    console.log(`🎯 计算绩效: 里程=${mileage}公里, 团队ID=${teamId}`);
    console.log(`🎯 团队绩效配置:`, config);
    
    if (!config || !config.is_active) {
      console.log('❌ 团队没有激活的绩效配置，返回0');
      return 0;
    }

    if (config.calculation_type === 'fixed') {
      const result = mileage * (config.fixed_rate || 0);
      console.log(`✅ 固定值计算: ${mileage} × ${config.fixed_rate} = ${result}`);
      return result;
    } else if (config.calculation_type === 'tiered' && config.tiers) {
      console.log(`🎯 阶梯计算, 共${config.tiers.length}个阶梯:`, config.tiers);
      
      // 阶梯计算
      for (const tier of config.tiers) {
        if (mileage >= tier.min_value && mileage < tier.max_value) {
          const result = mileage * tier.rate;
          console.log(`✅ 匹配阶梯: ${tier.min_value}-${tier.max_value}公里, 费率=${tier.rate}, 计算结果=${mileage} × ${tier.rate} = ${result}`);
          return result;
        }
      }
      
      // 如果超出所有阶梯范围，使用最后一个阶梯的绩效
      const lastTier = config.tiers[config.tiers.length - 1];
      if (mileage >= lastTier.min_value) {
        const result = mileage * lastTier.rate;
        console.log(`✅ 超出所有阶梯，使用最后阶梯: 费率=${lastTier.rate}, 计算结果=${mileage} × ${lastTier.rate} = ${result}`);
        return result;
      }
    }
    
    console.log('❌ 无法计算绩效，返回0');
    return 0;
  };

  // 过滤记录
  const filteredRecords = mileageRecords.filter(record => {
    const matchesSearch = (record.employee?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.employee?.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesTeam = teamFilter === 'all' || record.team_id === teamFilter;
    return matchesSearch && matchesStatus && matchesTeam;
  });

  // 状态映射
  const statusMap = {
    pending: { label: '待确认', color: 'bg-yellow-600', icon: Clock },
    confirmed: { label: '已确认', color: 'bg-green-600', icon: CheckCircle },
    rejected: { label: '已拒绝', color: 'bg-red-600', icon: XCircle },
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      employeeId: 'none',
      teamId: 'none',
      mileage: '',
      recordDate: new Date().toISOString().split('T')[0],
      description: '',
      status: 'pending',
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      employeeId: 'none',
      teamId: 'none',
      mileage: '',
      recordDate: '',
      description: '',
      status: 'pending',
    });
  };

  // 添加记录
  const addRecord = async () => {
    if (formData.employeeId === 'none') {
      alert('请选择员工');
      return;
    }
    if (formData.teamId === 'none') {
      alert('请选择团队');
      return;
    }
    if (!formData.mileage || parseFloat(formData.mileage) <= 0) {
      alert('请输入有效的里程数');
      return;
    }

    try {
      const mileage = parseFloat(formData.mileage);
      const calculatedPerformance = calculatePerformance(mileage, formData.teamId);

      const newRecord = {
        employee_id: formData.employeeId,
        team_id: formData.teamId,
        mileage,
        calculated_performance: Math.round(calculatedPerformance * 100) / 100,
        record_date: formData.recordDate,
        description: formData.description.trim(),
        status: formData.status,
      };

      console.log('📝 创建新里程记录:', newRecord);
      await mileageAPI.create(newRecord);
      
      setIsAddDialogOpen(false);
      resetForm();
      await loadData(); // 重新加载数据
      alert('里程记录添加成功！');
    } catch (error) {
      console.error('❌ 添加里程记录失败:', error);
      alert('添加里程记录失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 编辑记录
  const editRecord = (record: EmployeeMileage) => {
    setSelectedRecord(record);
    setEditFormData({
      employeeId: record.employee_id || record.employee?.id || 'none',
      teamId: record.team_id || 'none',
      mileage: record.mileage.toString(),
      recordDate: record.record_date,
      description: record.description || '',
      status: record.status,
    });
    setIsEditDialogOpen(true);
  };

  // 更新记录
  const updateRecord = async () => {
    if (!selectedRecord) return;

    if (editFormData.employeeId === 'none') {
      alert('请选择员工');
      return;
    }
    if (editFormData.teamId === 'none') {
      alert('请选择团队');
      return;
    }
    if (!editFormData.mileage || parseFloat(editFormData.mileage) <= 0) {
      alert('请输入有效的里程数');
      return;
    }

    try {
      const mileage = parseFloat(editFormData.mileage);
      const calculatedPerformance = calculatePerformance(mileage, editFormData.teamId);

      const updatedRecord = {
        employee_id: editFormData.employeeId,
        team_id: editFormData.teamId,
        mileage,
        calculated_performance: Math.round(calculatedPerformance * 100) / 100,
        record_date: editFormData.recordDate,
        description: editFormData.description.trim(),
        status: editFormData.status,
      };

      console.log('📝 更新里程记录:', updatedRecord);
      await mileageAPI.update(selectedRecord.id, updatedRecord);
      
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
      resetEditForm();
      await loadData(); // 重新加载数据
      alert('里程记录更新成功！');
    } catch (error) {
      console.error('❌ 更新里程记录失败:', error);
      alert('更新里程记录失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 删除记录
  const deleteRecord = async (recordId: string) => {
    try {
      console.log('🗑️ 删除里程记录:', recordId);
      await mileageAPI.delete(recordId);
      await loadData(); // 重新加载数据
      alert('里程记录删除成功！');
    } catch (error) {
      console.error('❌ 删除里程记录失败:', error);
      alert('删除里程记录失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 获取团队名称
  const getTeamName = (teamId: string): string => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : '未知团队';
  };

  // 获取用户名称
  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : '未知用户';
  };

  // 获取绩效配置文本
  const getPerformanceConfigText = (teamId: string): string => {
    const config = teamPerformanceConfigs.get(teamId);
    if (!config || !config.is_active) return '无绩效配置';

    if (config.calculation_type === 'fixed') {
      return `固定值：${config.fixed_rate}元/公里`;
    } else if (config.calculation_type === 'tiered' && config.tiers) {
      return `阶梯计算：${config.tiers.length}个阶梯`;
    }
    return '未知配置';
  };

  // 获取绩效预览
  const getPerformancePreview = (mileage: string, teamId: string): string => {
    const mileageNum = parseFloat(mileage);
    if (isNaN(mileageNum) || mileageNum <= 0) return '¥0.00';
    
    const performance = calculatePerformance(mileageNum, teamId);
    return `¥${performance.toFixed(2)}`;
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-background theme-transition">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在加载员工里程数据...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">员工里程管理</h1>
          <p className="text-muted-foreground mt-2">管理员工出行里程记录和绩效计算</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              新增记录
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>新增里程记录</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">员工 *</Label>
                  <Select value={formData.employeeId} onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择员工" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">请选择员工</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team">所在团队 *</Label>
                  <Select value={formData.teamId} onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择团队" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">请选择团队</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mileage">里程数（公里）*</Label>
                  <Input
                    id="mileage"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.mileage}
                    onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                    placeholder="请输入里程数"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recordDate">记录日期</Label>
                  <Input
                    id="recordDate"
                    type="date"
                    value={formData.recordDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, recordDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">记录状态</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待确认</SelectItem>
                    <SelectItem value="confirmed">已确认</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">出行描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入出行描述"
                  rows={3}
                />
              </div>

              {/* 绩效预览 */}
              {formData.teamId !== 'none' && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="font-medium">绩效计算预览</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    团队配置：{getPerformanceConfigText(formData.teamId)}
                  </div>
                  <div className="text-lg font-bold text-primary">
                    预计绩效：{getPerformancePreview(formData.mileage, formData.teamId)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={addRecord}>
                确定
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总记录数</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalRecords}</div>
            <p className="text-xs text-muted-foreground">
              已确认 {statistics.confirmedRecords} 条
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总里程数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalMileage}</div>
            <p className="text-xs text-muted-foreground">
              平均 {statistics.averageMileage} 公里/次
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总绩效金额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{statistics.totalPerformance}</div>
            <p className="text-xs text-muted-foreground">
              平均 ¥{statistics.averagePerformance}/次
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理记录</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pendingRecords}</div>
            <p className="text-xs text-muted-foreground">
              需要确认的记录
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>里程记录列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索员工姓名或出行描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待确认</SelectItem>
                <SelectItem value="confirmed">已确认</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="团队筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部团队</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id || ''}>
                    {team.name || '未命名团队'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 记录表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>员工信息</TableHead>
                  <TableHead>所在团队</TableHead>
                  <TableHead>里程数</TableHead>
                  <TableHead>本次绩效</TableHead>
                  <TableHead>记录日期</TableHead>
                  <TableHead>出行描述</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const StatusIcon = statusMap[record.status].icon;
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.employee?.name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{record.employee?.position?.name || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                          {getTeamName(record.team_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          {record.mileage} 公里
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center font-medium text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ¥{record.calculated_performance.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {record.record_date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {record.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusMap[record.status].color} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusMap[record.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editRecord(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            onConfirm={() => deleteRecord(record.id)}
                            itemName={`${record.record_date}的里程记录`}
                            variant="outline"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              暂无里程记录数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑记录对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑里程记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-employee">员工 *</Label>
                <Select value={editFormData.employeeId} onValueChange={(value) => setEditFormData(prev => ({ ...prev, employeeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择员工" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">请选择员工</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-team">所在团队 *</Label>
                <Select value={editFormData.teamId} onValueChange={(value) => setEditFormData(prev => ({ ...prev, teamId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择团队" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">请选择团队</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-mileage">里程数（公里）*</Label>
                <Input
                  id="edit-mileage"
                  type="number"
                  step="0.1"
                  min="0"
                  value={editFormData.mileage}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, mileage: e.target.value }))}
                  placeholder="请输入里程数"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-recordDate">记录日期</Label>
                <Input
                  id="edit-recordDate"
                  type="date"
                  value={editFormData.recordDate}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, recordDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">记录状态</Label>
              <Select value={editFormData.status} onValueChange={(value: any) => setEditFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待确认</SelectItem>
                  <SelectItem value="confirmed">已确认</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">出行描述</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入出行描述"
                rows={3}
              />
            </div>

            {/* 绩效预览 */}
            {editFormData.teamId !== 'none' && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="font-medium">绩效计算预览</span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  团队配置：{getPerformanceConfigText(editFormData.teamId)}
                </div>
                <div className="text-lg font-bold text-primary">
                  预计绩效：{getPerformancePreview(editFormData.mileage, editFormData.teamId)}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={updateRecord}>
              更新
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeMileageManagement;
