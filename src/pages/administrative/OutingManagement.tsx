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
import { ArrowRightLeft, Plus, Search, Eye, Edit, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { OutingAPI } from '@/services/administrativeAPI';
import { Outing, PERIOD_OPTIONS, REQUEST_STATUS_OPTIONS } from '@/types/administrative';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const OutingManagement = () => {
  const { user } = useAuth();
  const [outings, setOutings] = useState<Outing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOuting, setEditingOuting] = useState<Outing | null>(null);
  const [viewingOuting, setViewingOuting] = useState<Outing | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    location: '',
    startDate: '',
    startPeriod: '',
    endDate: '',
    endPeriod: '',
    attachmentUrl: ''
  });

  const outingAPI = new OutingAPI();

  useEffect(() => {
    loadOutings();
  }, []);

  const loadOutings = async () => {
    try {
      setLoading(true);
      const data = await outingAPI.getAll();
      setOutings(data);
    } catch (error) {
      console.error('加载外出申请失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const outingData = {
        applicantId: user.id,
        location: formData.location,
        startDate: formData.startDate,
        startPeriod: formData.startPeriod,
        endDate: formData.endDate,
        endPeriod: formData.endPeriod,
        attachmentUrl: formData.attachmentUrl || null
      };

      if (editingOuting) {
        await outingAPI.update(editingOuting.id, outingData);
      } else {
        await outingAPI.create(outingData);
      }

      setIsDialogOpen(false);
      setEditingOuting(null);
      resetForm();
      loadOutings();
    } catch (error) {
      console.error('提交外出申请失败:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      location: '',
      startDate: '',
      startPeriod: '',
      endDate: '',
      endPeriod: '',
      attachmentUrl: ''
    });
  };

  const handleEdit = (outing: Outing) => {
    setEditingOuting(outing);
    setFormData({
      location: outing.location,
      startDate: outing.startDate,
      startPeriod: outing.startPeriod,
      endDate: outing.endDate,
      endPeriod: outing.endPeriod,
      attachmentUrl: outing.attachmentUrl || ''
    });
    setIsDialogOpen(true);
  };

  const handleView = (outing: Outing) => {
    setViewingOuting(outing);
  };

  const handleApprove = async (outingId: string, approved: boolean) => {
    try {
      // 这里需要实现审批功能
      console.log('审批外出申请:', outingId, approved);
      loadOutings();
    } catch (error) {
      console.error('审批失败:', error);
    }
  };

  const filteredOutings = outings.filter(outing => {
    const matchesSearch = outing.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         outing.applicantName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || outing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">外出管理</h1>
          <p className="text-muted-foreground">管理员工外出申请和审批流程</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingOuting(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              新建外出申请
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingOuting ? '编辑外出申请' : '新建外出申请'}
              </DialogTitle>
              <DialogDescription>
                请填写外出申请信息，所有字段均为必填项
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="location">外出地点 *</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="请输入外出地点"
                  required
                />
              </div>
              
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
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  {editingOuting ? '更新' : '提交'}
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
                  placeholder="搜索外出地点或申请人..."
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
          </div>
        </CardContent>
      </Card>

      {/* 外出申请列表 */}
      <Card>
        <CardHeader>
          <CardTitle>外出申请列表</CardTitle>
          <CardDescription>
            共 {filteredOutings.length} 条记录
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
                  <TableHead>外出地点</TableHead>
                  <TableHead>开始时间</TableHead>
                  <TableHead>结束时间</TableHead>
                  <TableHead>时长(小时)</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOutings.map((outing) => (
                  <TableRow key={outing.id}>
                    <TableCell>{outing.requestNumber}</TableCell>
                    <TableCell>{outing.applicantName}</TableCell>
                    <TableCell>{outing.applicantDepartment}</TableCell>
                    <TableCell>{outing.location}</TableCell>
                    <TableCell>
                      {format(new Date(outing.startDate), 'yyyy-MM-dd', { locale: zhCN })} {outing.startPeriod}
                    </TableCell>
                    <TableCell>
                      {format(new Date(outing.endDate), 'yyyy-MM-dd', { locale: zhCN })} {outing.endPeriod}
                    </TableCell>
                    <TableCell>{outing.durationHours}</TableCell>
                    <TableCell>{getStatusBadge(outing.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(outing)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {outing.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(outing)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(outing.id, true)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(outing.id, false)}
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
      {viewingOuting && (
        <Dialog open={!!viewingOuting} onOpenChange={() => setViewingOuting(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>外出申请详情</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>申请编号</Label>
                  <p className="text-sm text-muted-foreground">{viewingOuting.requestNumber}</p>
                </div>
                <div>
                  <Label>申请人</Label>
                  <p className="text-sm text-muted-foreground">{viewingOuting.applicantName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>部门</Label>
                  <p className="text-sm text-muted-foreground">{viewingOuting.applicantDepartment}</p>
                </div>
                <div>
                  <Label>状态</Label>
                  <div className="mt-1">{getStatusBadge(viewingOuting.status)}</div>
                </div>
              </div>
              <div>
                <Label>外出地点</Label>
                <p className="text-sm text-muted-foreground">{viewingOuting.location}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>开始时间</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(viewingOuting.startDate), 'yyyy-MM-dd', { locale: zhCN })} {viewingOuting.startPeriod}
                  </p>
                </div>
                <div>
                  <Label>结束时间</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(viewingOuting.endDate), 'yyyy-MM-dd', { locale: zhCN })} {viewingOuting.endPeriod}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>时长(小时)</Label>
                  <p className="text-sm text-muted-foreground">{viewingOuting.durationHours}</p>
                </div>
                <div>
                  <Label>附件</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingOuting.attachmentUrl ? (
                      <a href={viewingOuting.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        查看附件
                      </a>
                    ) : (
                      '无附件'
                    )}
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

export default OutingManagement; 