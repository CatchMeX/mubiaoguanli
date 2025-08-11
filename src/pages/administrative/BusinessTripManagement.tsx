import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, MapPin, Plus, Search, Eye, Edit, Check, X, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BusinessTripAPI } from '@/services/administrativeAPI';
import { BusinessTrip, TRANSPORTATION_OPTIONS, TRIP_TYPE_OPTIONS, PERIOD_OPTIONS, BUSINESS_TRIP_STATUS_OPTIONS } from '@/types/administrative';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const BusinessTripManagement = () => {
  const { user } = useAuth();
  const [businessTrips, setBusinessTrips] = useState<BusinessTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<BusinessTrip | null>(null);
  const [viewingTrip, setViewingTrip] = useState<BusinessTrip | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    startDate: '',
    startPeriod: '',
    endDate: '',
    endPeriod: '',
    departureLocation: '',
    destination: '',
    transportation: '',
    tripType: '',
    purpose: '',
    companionIds: [] as string[]
  });

  const tripAPI = new BusinessTripAPI();

  useEffect(() => {
    loadBusinessTrips();
  }, []);

  const loadBusinessTrips = async () => {
    try {
      setLoading(true);
      const data = await tripAPI.getAll();
      setBusinessTrips(data);
    } catch (error) {
      console.error('加载出差申请失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const tripData = {
        applicantId: user.id,
        startDate: formData.startDate,
        startPeriod: formData.startPeriod,
        endDate: formData.endDate,
        endPeriod: formData.endPeriod,
        departureLocation: formData.departureLocation,
        destination: formData.destination,
        transportation: formData.transportation,
        tripType: formData.tripType,
        purpose: formData.purpose
      };

      if (editingTrip) {
        await tripAPI.update(editingTrip.id, tripData);
      } else {
        await tripAPI.create(tripData);
      }

      // 添加同行人
      if (formData.companionIds.length > 0) {
        for (const companionId of formData.companionIds) {
          await tripAPI.addCompanion(editingTrip?.id || '', companionId);
        }
      }

      setIsDialogOpen(false);
      setEditingTrip(null);
      resetForm();
      loadBusinessTrips();
    } catch (error) {
      console.error('提交出差申请失败:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      startDate: '',
      startPeriod: '',
      endDate: '',
      endPeriod: '',
      departureLocation: '',
      destination: '',
      transportation: '',
      tripType: '',
      purpose: '',
      companionIds: []
    });
  };

  const handleEdit = (trip: BusinessTrip) => {
    setEditingTrip(trip);
    setFormData({
      startDate: trip.startDate,
      startPeriod: trip.startPeriod,
      endDate: trip.endDate,
      endPeriod: trip.endPeriod,
      departureLocation: trip.departureLocation,
      destination: trip.destination,
      transportation: trip.transportation,
      tripType: trip.tripType,
      purpose: trip.purpose,
      companionIds: []
    });
    setIsDialogOpen(true);
  };

  const handleView = (trip: BusinessTrip) => {
    setViewingTrip(trip);
  };

  const handleApprove = async (tripId: string, approved: boolean) => {
    try {
      // 这里需要实现审批功能
      console.log('审批出差申请:', tripId, approved);
      loadBusinessTrips();
    } catch (error) {
      console.error('审批失败:', error);
    }
  };

  const filteredTrips = businessTrips.filter(trip => {
    const matchesSearch = trip.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.departureLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '已批准', color: 'bg-green-100 text-green-800' },
      rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
      completed: { label: '已完成', color: 'bg-blue-100 text-blue-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTransportationLabel = (transportation: string) => {
    const option = TRANSPORTATION_OPTIONS.find((opt: any) => opt.value === transportation);
    return option?.label || transportation;
  };

  const getTripTypeLabel = (tripType: string) => {
    const option = TRIP_TYPE_OPTIONS.find((opt: any) => opt.value === tripType);
    return option?.label || tripType;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">出差管理</h1>
          <p className="text-muted-foreground">管理员工出差申请和审批流程</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTrip(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              新建出差申请
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTrip ? '编辑出差申请' : '新建出差申请'}
              </DialogTitle>
              <DialogDescription>
                请填写出差申请信息，所有字段均为必填项
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">开始日期 *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startPeriod">开始时段 *</Label>
                  <Select value={formData.startPeriod} onValueChange={(value) => setFormData({...formData, startPeriod: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择时段" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_OPTIONS.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endDate">结束日期 *</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endPeriod">结束时段 *</Label>
                  <Select value={formData.endPeriod} onValueChange={(value) => setFormData({...formData, endPeriod: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择时段" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_OPTIONS.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departureLocation">出发地 *</Label>
                  <Input
                    value={formData.departureLocation}
                    onChange={(e) => setFormData({...formData, departureLocation: e.target.value})}
                    placeholder="请输入出发地"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="destination">目的地 *</Label>
                  <Input
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    placeholder="请输入目的地"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transportation">交通工具 *</Label>
                  <Select value={formData.transportation} onValueChange={(value) => setFormData({...formData, transportation: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择交通工具" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORTATION_OPTIONS.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tripType">行程类型 *</Label>
                  <Select value={formData.tripType} onValueChange={(value) => setFormData({...formData, tripType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择行程类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIP_TYPE_OPTIONS.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="purpose">出差事由 *</Label>
                <Textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  placeholder="请详细说明出差事由"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="companions">同行人</Label>
                <div className="border rounded-md p-4">
                  <p className="text-sm text-muted-foreground">同行人选择功能待实现</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  {editingTrip ? '更新' : '提交'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索出差事由、出发地或目的地..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {BUSINESS_TRIP_STATUS_OPTIONS.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 出差申请列表 */}
      <Card>
        <CardHeader>
          <CardTitle>出差申请列表</CardTitle>
          <CardDescription>
            共 {filteredTrips.length} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>申请编号</TableHead>
                  <TableHead>申请人</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>出差时间</TableHead>
                  <TableHead>出发地</TableHead>
                  <TableHead>目的地</TableHead>
                  <TableHead>交通工具</TableHead>
                  <TableHead>行程类型</TableHead>
                  <TableHead>时长(小时)</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>{trip.requestNumber}</TableCell>
                    <TableCell>{trip.applicantName}</TableCell>
                    <TableCell>{trip.applicantDepartment}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(trip.startDate), 'yyyy-MM-dd', { locale: zhCN })} {trip.startPeriod}</div>
                        <div>至 {format(new Date(trip.endDate), 'yyyy-MM-dd', { locale: zhCN })} {trip.endPeriod}</div>
                      </div>
                    </TableCell>
                    <TableCell>{trip.departureLocation}</TableCell>
                    <TableCell>{trip.destination}</TableCell>
                    <TableCell>{getTransportationLabel(trip.transportation)}</TableCell>
                    <TableCell>{getTripTypeLabel(trip.tripType)}</TableCell>
                    <TableCell>{trip.durationHours}</TableCell>
                    <TableCell>{getStatusBadge(trip.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(trip)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {trip.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(trip)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(trip.id, true)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(trip.id, false)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 查看详情对话框 */}
      {viewingTrip && (
        <Dialog open={!!viewingTrip} onOpenChange={() => setViewingTrip(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>出差申请详情</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>申请编号</Label>
                  <p className="text-sm text-muted-foreground">{viewingTrip.requestNumber}</p>
                </div>
                <div>
                  <Label>申请人</Label>
                  <p className="text-sm text-muted-foreground">{viewingTrip.applicantName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>部门</Label>
                  <p className="text-sm text-muted-foreground">{viewingTrip.applicantDepartment}</p>
                </div>
                <div>
                  <Label>状态</Label>
                  <div className="mt-1">{getStatusBadge(viewingTrip.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>开始时间</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(viewingTrip.startDate), 'yyyy-MM-dd', { locale: zhCN })} {viewingTrip.startPeriod}
                  </p>
                </div>
                <div>
                  <Label>结束时间</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(viewingTrip.endDate), 'yyyy-MM-dd', { locale: zhCN })} {viewingTrip.endPeriod}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>出发地</Label>
                  <p className="text-sm text-muted-foreground">{viewingTrip.departureLocation}</p>
                </div>
                <div>
                  <Label>目的地</Label>
                  <p className="text-sm text-muted-foreground">{viewingTrip.destination}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>交通工具</Label>
                  <p className="text-sm text-muted-foreground">{getTransportationLabel(viewingTrip.transportation)}</p>
                </div>
                <div>
                  <Label>行程类型</Label>
                  <p className="text-sm text-muted-foreground">{getTripTypeLabel(viewingTrip.tripType)}</p>
                </div>
              </div>
              <div>
                <Label>出差事由</Label>
                <p className="text-sm text-muted-foreground">{viewingTrip.purpose}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>时长(小时)</Label>
                  <p className="text-sm text-muted-foreground">{viewingTrip.durationHours}</p>
                </div>
                <div>
                  <Label>同行人</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingTrip.companions && viewingTrip.companions.length > 0 ? 
                      viewingTrip.companions.join(', ') : '无'
                    }
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BusinessTripManagement; 