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
import { Calendar, Clock, Plus, Search, Eye, Edit, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LeaveRequestAPI } from '@/services/administrativeAPI';
import { LeaveRequest, LEAVE_TYPE_OPTIONS, PERIOD_OPTIONS, REQUEST_STATUS_OPTIONS } from '@/types/administrative';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const LeaveManagement = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    startPeriod: '',
    endDate: '',
    endPeriod: '',
    reason: '',
    attachmentUrl: ''
  });

  const leaveAPI = new LeaveRequestAPI();

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      const data = await leaveAPI.getAll();
      setLeaveRequests(data);
    } catch (error) {
      console.error('加载请假申请失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const requestData = {
        applicantId: user.id,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        startPeriod: formData.startPeriod,
        endDate: formData.endDate,
        endPeriod: formData.endPeriod,
        reason: formData.reason,
        attachmentUrl: formData.attachmentUrl || null
      };

      if (editingRequest) {
        await leaveAPI.update(editingRequest.id, requestData);
      } else {
        await leaveAPI.create(requestData);
      }

      setIsDialogOpen(false);
      setEditingRequest(null);
      resetForm();
      loadLeaveRequests();
    } catch (error) {
      console.error('提交请假申请失败:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      leaveType: '',
      startDate: '',
      startPeriod: '',
      endDate: '',
      endPeriod: '',
      reason: '',
      attachmentUrl: ''
    });
  };

  const handleEdit = (request: LeaveRequest) => {
    setEditingRequest(request);
    setFormData({
      leaveType: request.leaveType,
      startDate: request.startDate,
      startPeriod: request.startPeriod,
      endDate: request.endDate,
      endPeriod: request.endPeriod,
      reason: request.reason,
      attachmentUrl: request.attachmentUrl || ''
    });
    setIsDialogOpen(true);
  };

  const handleView = (request: LeaveRequest) => {
    setViewingRequest(request);
  };

  const handleApprove = async (requestId: string, approved: boolean) => {
    try {
      await leaveAPI.approve(requestId, approved);
      loadLeaveRequests();
    } catch (error) {
      console.error('审批失败:', error);
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.applicantName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.leaveType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '已批准', color: 'bg-green-100 text-green-800' },
      rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const option = LEAVE_TYPE_OPTIONS.find((opt: any) => opt.value === type);
    return option?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">请假管理</h1>
          <p className="text-muted-foreground">管理员工请假申请和审批流程</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingRequest(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              新建请假申请
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRequest ? '编辑请假申请' : '新建请假申请'}
              </DialogTitle>
              <DialogDescription>
                请填写请假申请信息，所有字段均为必填项
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leaveType">请假类型 *</Label>
                  <Select value={formData.leaveType} onValueChange={(value) => setFormData({...formData, leaveType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择请假类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAVE_TYPE_OPTIONS.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">开始日期 *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="endDate">结束日期 *</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="attachmentUrl">附件</Label>
                  <Input
                    type="file"
                    onChange={(e) => {
                      // 这里应该处理文件上传逻辑
                      console.log('文件上传:', e.target.files?.[0]);
                    }}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="reason">请假事由 *</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="请详细说明请假原因"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  {editingRequest ? '更新' : '提交'}
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
                  placeholder="搜索申请人或请假事由..."
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
                {REQUEST_STATUS_OPTIONS.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {LEAVE_TYPE_OPTIONS.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 请假申请列表 */}
      <Card>
        <CardHeader>
          <CardTitle>请假申请列表</CardTitle>
          <CardDescription>
            共 {filteredRequests.length} 条记录
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
                  <TableHead>请假类型</TableHead>
                  <TableHead>开始时间</TableHead>
                  <TableHead>结束时间</TableHead>
                  <TableHead>时长(小时)</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.requestNumber}</TableCell>
                    <TableCell>{request.applicantName}</TableCell>
                    <TableCell>{request.applicantDepartment}</TableCell>
                    <TableCell>{getTypeLabel(request.leaveType)}</TableCell>
                    <TableCell>
                      {format(new Date(request.startDate), 'yyyy-MM-dd', { locale: zhCN })} {request.startPeriod}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.endDate), 'yyyy-MM-dd', { locale: zhCN })} {request.endPeriod}
                    </TableCell>
                    <TableCell>{request.durationHours}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(request)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(request.id, true)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(request.id, false)}
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
      {viewingRequest && (
        <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>请假申请详情</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>申请编号</Label>
                  <p className="text-sm text-muted-foreground">{viewingRequest.requestNumber}</p>
                </div>
                <div>
                  <Label>申请人</Label>
                  <p className="text-sm text-muted-foreground">{viewingRequest.applicantName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>部门</Label>
                  <p className="text-sm text-muted-foreground">{viewingRequest.applicantDepartment}</p>
                </div>
                <div>
                  <Label>请假类型</Label>
                  <p className="text-sm text-muted-foreground">{getTypeLabel(viewingRequest.leaveType)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>开始时间</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(viewingRequest.startDate), 'yyyy-MM-dd', { locale: zhCN })} {viewingRequest.startPeriod}
                  </p>
                </div>
                <div>
                  <Label>结束时间</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(viewingRequest.endDate), 'yyyy-MM-dd', { locale: zhCN })} {viewingRequest.endPeriod}
                  </p>
                </div>
              </div>
              <div>
                <Label>请假事由</Label>
                <p className="text-sm text-muted-foreground">{viewingRequest.reason}</p>
              </div>
              {viewingRequest.attachmentUrl && (
                <div>
                  <Label>附件</Label>
                  <p className="text-sm text-muted-foreground">
                    <a href={viewingRequest.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      查看附件
                    </a>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>状态</Label>
                  <div className="mt-1">{getStatusBadge(viewingRequest.status)}</div>
                </div>
                <div>
                  <Label>时长(小时)</Label>
                  <p className="text-sm text-muted-foreground">{viewingRequest.durationHours}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LeaveManagement; 