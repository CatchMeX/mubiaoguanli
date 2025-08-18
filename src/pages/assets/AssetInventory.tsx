import { useState } from 'react';
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
  Package,
  MapPin,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  Eye,
} from 'lucide-react';
import { inventoryPlans, inventoryRecords, inventoryAdjustments, assetLocations, assetCategories, users, assets } from '@/data/mockData';
import type { InventoryPlan, InventoryRecord } from '@/types';

const AssetInventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isCreateRecordOpen, setIsCreateRecordOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InventoryPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<InventoryPlan | null>(null);
  const [newPlan, setNewPlan] = useState({
    planName: '',
    type: 'full' as 'full' | 'partial' | 'spot',
    startDate: '',
    endDate: '',
    locationIds: [] as string[],
    categoryIds: [] as string[],
    responsibleIds: [] as string[],
    description: '',
  });
  const [newRecord, setNewRecord] = useState({
    planId: '',
    assetId: '',
    expectedLocationId: '',
    actualLocationId: '',
    expectedStatus: '',
    actualStatus: '',
    expectedCustodianId: '',
    actualCustodianId: '',
    difference: 'normal' as 'normal' | 'missing' | 'surplus' | 'damaged' | 'location_error',
    notes: '',
  });

  // 过滤盘点计划
  const filteredPlans = inventoryPlans.filter(plan => {
    const matchesSearch = plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    const matchesType = typeFilter === 'all' || plan.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // 过滤盘点记录
  const filteredRecords = inventoryRecords.filter(record => {
    const matchesSearch = record.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'draft': return 'border-gray-500 text-gray-500';
      case 'in_progress': return 'border-blue-500 text-blue-500';
      case 'completed': return 'border-green-500 text-green-500';
      case 'cancelled': return 'border-red-500 text-red-500';
      default: return 'border-muted-foreground text-muted-foreground';
    }
  };

  // 获取状态名称
  const getStatusName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'draft': '草稿',
      'in_progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消',
    };
    return statusMap[status] || status;
  };

  // 获取盘点类型名称
  const getTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'full': '全面盘点',
      'partial': '部分盘点',
      'spot': '抽查盘点',
    };
    return typeMap[type] || type;
  };

  // 获取差异类型样式
  const getDifferenceStyle = (difference: string) => {
    switch (difference) {
      case 'normal': return 'border-green-500 text-green-500';
      case 'missing': return 'border-red-500 text-red-500';
      case 'surplus': return 'border-blue-500 text-blue-500';
      case 'damaged': return 'border-orange-500 text-orange-500';
      case 'location_error': return 'border-yellow-500 text-yellow-500';
      default: return 'border-muted-foreground text-muted-foreground';
    }
  };

  // 获取差异类型名称
  const getDifferenceName = (difference: string) => {
    const differenceMap: { [key: string]: string } = {
      'normal': '正常',
      'missing': '盘亏',
      'surplus': '盘盈',
      'damaged': '损坏',
      'location_error': '位置错误',
    };
    return differenceMap[difference] || difference;
  };

  // 展平位置数据
  const flattenLocations = (locations: any[], level = 0): any[] => {
    let result: any[] = [];
    locations.forEach(location => {
      result.push({ ...location, level });
      if (location.children) {
        result = result.concat(flattenLocations(location.children, level + 1));
      }
    });
    return result;
  };

  const flatLocations = flattenLocations(assetLocations);

  // 展平分类数据
  const flattenCategories = (categories: any[], level = 0): any[] => {
    let result: any[] = [];
    categories.forEach(category => {
      result.push({ ...category, level });
      if (category.children) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(assetCategories);

  // 创建盘点计划
  const handleCreatePlan = () => {
    console.log('创建盘点计划:', newPlan);
    setIsCreatePlanOpen(false);
    setNewPlan({
      planName: '',
      type: 'full',
      startDate: '',
      endDate: '',
      locationIds: [],
      categoryIds: [],
      responsibleIds: [],
      description: '',
    });
  };

  // 创建盘点记录
  const handleCreateRecord = () => {
    console.log('创建盘点记录:', newRecord);
    setIsCreateRecordOpen(false);
    setNewRecord({
      planId: '',
      assetId: '',
      expectedLocationId: '',
      actualLocationId: '',
      expectedStatus: '',
      actualStatus: '',
      expectedCustodianId: '',
      actualCustodianId: '',
      difference: 'normal',
      notes: '',
    });
  };

  // 编辑盘点计划
  const handleEditPlan = (plan: InventoryPlan) => {
    setEditingPlan(plan);
    setNewPlan({
      planName: plan.planName,
      type: plan.type,
      startDate: plan.startDate,
      endDate: plan.endDate,
      locationIds: plan.locations.map(loc => loc.id),
      categoryIds: plan.categories.map(cat => cat.id),
      responsibleIds: plan.responsible.map(user => user.id),
      description: plan.description,
    });
  };

  // 更新盘点计划
  const handleUpdatePlan = () => {
    console.log('更新盘点计划:', editingPlan?.id, newPlan);
    setEditingPlan(null);
    setNewPlan({
      planName: '',
      type: 'full',
      startDate: '',
      endDate: '',
      locationIds: [],
      categoryIds: [],
      responsibleIds: [],
      description: '',
    });
  };

  // 删除盘点计划
  const handleDeletePlan = (id: string) => {
    console.log('删除盘点计划:', id);
  };

  // 删除盘点记录
  const handleDeleteRecord = (id: string) => {
    console.log('删除盘点记录:', id);
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">资产盘点</h1>
            <p className="text-muted-foreground mt-1">管理资产盘点计划和记录</p>
          </div>
        </div>

        {/* 搜索和筛选栏 */}
        <Card className="bg-card border-border theme-transition">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索计划名称、资产名称或描述..."
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
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="full">全面盘点</SelectItem>
                  <SelectItem value="partial">部分盘点</SelectItem>
                  <SelectItem value="spot">抽查盘点</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 盘点管理标签页 */}
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="plans" className="data-[state=active]:bg-background">盘点计划</TabsTrigger>
            <TabsTrigger value="records" className="data-[state=active]:bg-background">盘点记录</TabsTrigger>
            <TabsTrigger value="adjustments" className="data-[state=active]:bg-background">差异处理</TabsTrigger>
          </TabsList>

          {/* 盘点计划 */}
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
                    <DialogTitle>新增盘点计划</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planName">计划名称</Label>
                        <Input
                          id="planName"
                          value={newPlan.planName}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, planName: e.target.value }))}
                          className="bg-background border-border text-foreground"
                          placeholder="请输入计划名称"
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">盘点类型</Label>
                        <Select value={newPlan.type} onValueChange={(value: 'full' | 'partial' | 'spot') => setNewPlan(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="full">全面盘点</SelectItem>
                            <SelectItem value="partial">部分盘点</SelectItem>
                            <SelectItem value="spot">抽查盘点</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">开始日期</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={newPlan.startDate}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, startDate: e.target.value }))}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">结束日期</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newPlan.endDate}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, endDate: e.target.value }))}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">计划描述</Label>
                      <Textarea
                        id="description"
                        value={newPlan.description}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-background border-border text-foreground"
                        placeholder="请输入计划描述"
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
                <CardTitle className="text-foreground">盘点计划列表</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">计划名称</TableHead>
                      <TableHead className="text-muted-foreground">盘点类型</TableHead>
                      <TableHead className="text-muted-foreground">时间范围</TableHead>
                      <TableHead className="text-muted-foreground">负责人</TableHead>
                      <TableHead className="text-muted-foreground">状态</TableHead>
                      <TableHead className="text-muted-foreground">创建人</TableHead>
                      <TableHead className="text-muted-foreground">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.map((plan) => (
                      <TableRow key={plan.id} className="border-border">
                        <TableCell>
                          <span className="text-foreground font-medium">{plan.planName}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-500 text-blue-500">
                            {getTypeName(plan.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground text-sm">
                                {new Date(plan.startDate).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                            <span className="text-muted-foreground text-xs">
                              至 {new Date(plan.endDate).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">
                              {plan.responsible.map(user => user.name).join(', ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusStyle(plan.status)}>
                            {getStatusName(plan.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{plan.createdBy.name}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog open={viewingPlan?.id === plan.id} onOpenChange={(open) => !open && setViewingPlan(null)}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                  onClick={() => setViewingPlan(plan)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>盘点计划详情</DialogTitle>
                                </DialogHeader>
                                {viewingPlan && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-muted-foreground">计划名称</Label>
                                        <p className="text-foreground">{viewingPlan.planName}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">盘点类型</Label>
                                        <Badge variant="outline" className="border-blue-500 text-blue-500">
                                          {getTypeName(viewingPlan.type)}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-muted-foreground">开始日期</Label>
                                        <p className="text-foreground">
                                          {new Date(viewingPlan.startDate).toLocaleDateString('zh-CN')}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">结束日期</Label>
                                        <p className="text-foreground">
                                          {new Date(viewingPlan.endDate).toLocaleDateString('zh-CN')}
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">盘点范围</Label>
                                      <div className="space-y-2">
                                        <div>
                                          <span className="text-sm text-muted-foreground">地点：</span>
                                          <span className="text-foreground">
                                            {viewingPlan.locations.map(loc => loc.name).join(', ')}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-sm text-muted-foreground">分类：</span>
                                          <span className="text-foreground">
                                            {viewingPlan.categories.map(cat => cat.name).join(', ')}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">负责人</Label>
                                      <p className="text-foreground">
                                        {viewingPlan.responsible.map(user => user.name).join(', ')}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">计划描述</Label>
                                      <p className="text-foreground">{viewingPlan.description}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-muted-foreground">状态</Label>
                                        <Badge variant="outline" className={getStatusStyle(viewingPlan.status)}>
                                          {getStatusName(viewingPlan.status)}
                                        </Badge>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">创建人</Label>
                                        <p className="text-foreground">{viewingPlan.createdBy.name}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Dialog open={editingPlan?.id === plan.id} onOpenChange={(open) => !open && setEditingPlan(null)}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                                  onClick={() => handleEditPlan(plan)}
                                  disabled={plan.status === 'completed'}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>编辑盘点计划</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {/* 编辑表单内容与创建表单相同 */}
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
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => handleDeletePlan(plan.id)}
                              disabled={plan.status === 'in_progress' || plan.status === 'completed'}
                            >
                              <Trash2 className="h-3 w-3" />
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

          {/* 盘点记录 */}
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
                    <DialogTitle>新增盘点记录</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="record-plan">盘点计划</Label>
                        <Select value={newRecord.planId} onValueChange={(value) => setNewRecord(prev => ({ ...prev, planId: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="选择盘点计划" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {inventoryPlans.filter(plan => plan.status === 'in_progress').map(plan => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.planName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="record-asset">盘点资产</Label>
                        <Select value={newRecord.assetId} onValueChange={(value) => setNewRecord(prev => ({ ...prev, assetId: value }))}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="选择资产" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {assets.map(asset => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {asset.assetCode} - {asset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
                <CardTitle className="text-foreground">盘点记录列表</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">资产信息</TableHead>
                      <TableHead className="text-muted-foreground">盘点计划</TableHead>
                      <TableHead className="text-muted-foreground">预期位置</TableHead>
                      <TableHead className="text-muted-foreground">实际位置</TableHead>
                      <TableHead className="text-muted-foreground">差异类型</TableHead>
                      <TableHead className="text-muted-foreground">操作人</TableHead>
                      <TableHead className="text-muted-foreground">盘点时间</TableHead>
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
                              {record.asset.assetCode}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{record.plan.planName}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground text-sm">{record.expectedLocation.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground text-sm">
                              {record.actualLocation?.name || '未找到'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getDifferenceStyle(record.difference)}>
                            {getDifferenceName(record.difference)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{record.operator.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground text-sm">
                              {new Date(record.operatedAt).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => handleDeleteRecord(record.id)}
                            >
                              <Trash2 className="h-3 w-3" />
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

          {/* 差异处理 */}
          <TabsContent value="adjustments" className="space-y-6">
            <Card className="bg-card border-border theme-transition">
              <CardHeader>
                <CardTitle className="text-foreground">差异处理记录</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">盘点记录</TableHead>
                      <TableHead className="text-muted-foreground">处理类型</TableHead>
                      <TableHead className="text-muted-foreground">处理原因</TableHead>
                      <TableHead className="text-muted-foreground">审批人</TableHead>
                      <TableHead className="text-muted-foreground">操作人</TableHead>
                      <TableHead className="text-muted-foreground">处理时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryAdjustments.map((adjustment) => (
                      <TableRow key={adjustment.id} className="border-border">
                        <TableCell>
                          <div className="space-y-1">
                            <span className="text-foreground font-medium">{adjustment.record.asset.name}</span>
                            <Badge variant="outline" className="border-blue-500 text-blue-500">
                              {adjustment.record.asset.assetCode}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-purple-500 text-purple-500">
                            {adjustment.adjustmentType === 'write_off' ? '核销' :
                             adjustment.adjustmentType === 'add_asset' ? '新增资产' :
                             adjustment.adjustmentType === 'location_update' ? '位置更新' :
                             adjustment.adjustmentType === 'status_update' ? '状态更新' : adjustment.adjustmentType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground text-sm">{adjustment.reason}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{adjustment.approver.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{adjustment.operator.name}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground text-sm">
                              {new Date(adjustment.createdAt).toLocaleDateString('zh-CN')}
                            </span>
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

export default AssetInventory;
