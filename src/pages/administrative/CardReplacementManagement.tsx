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
import { CreditCard, Plus, Search, Eye, Edit, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CardReplacementAPI } from '@/services/administrativeAPI';
import { CardReplacement, REQUEST_STATUS_OPTIONS } from '@/types/administrative';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const CardReplacementManagement = () => {
  const { user } = useAuth();
  const [cardReplacements, setCardReplacements] = useState<CardReplacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReplacement, setEditingReplacement] = useState<CardReplacement | null>(null);
  const [viewingReplacement, setViewingReplacement] = useState<CardReplacement | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    departmentId: '',
    replacementDate: '',
    replacementTime: '',
    reason: '',
    attachmentUrl: ''
  });

  const replacementAPI = new CardReplacementAPI();

  useEffect(() => {
    loadCardReplacements();
  }, []);

  const loadCardReplacements = async () => {
    try {
      setLoading(true);
      const data = await replacementAPI.getAll();
      setCardReplacements(data);
    } catch (error) {
      console.error('加载补卡申请失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const replacementData = {
        applicantId: user.id,
        departmentId: formData.departmentId,
        replacementDate: formData.replacementDate,
        replacementTime: formData.replacementTime,
        reason: formData.reason,
        attachmentUrl: formData.attachmentUrl || null
      };

      if (editingReplacement) {
        await replacementAPI.update(editingReplacement.id, replacementData);
      } else {
        await replacementAPI.create(replacementData);
      }

      setIsDialogOpen(false);
      setEditingReplacement(null);
      resetForm();
      loadCardReplacements();
    } catch (error) {
      console.error('提交补卡申请失败:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      departmentId: '',
      replacementDate: '',
      replacementTime: '',
      reason: '',
      attachmentUrl: ''
    });
  };

  const handleEdit = (replacement: CardReplacement) => {
    setEditingReplacement(replacement);
    setFormData({
      departmentId: replacement.departmentId,
      replacementDate: replacement.replacementDate,
      replacementTime: replacement.replacementTime,
      reason: replacement.reason,
      attachmentUrl: replacement.attachmentUrl || ''
    });
    setIsDialogOpen(true);
  };

  const handleView = (replacement: CardReplacement) => {
    setViewingReplacement(replacement);
  };

  const handleApprove = async (replacementId: string, approved: boolean) => {
    try {
      // 这里需要实现审批功能
      console.log('审批补卡申请:', replacementId, approved);
      loadCardReplacements();
    } catch (error) {
      console.error('审批失败:', error);
    }
  };

  const filteredReplacements = cardReplacements.filter(replacement => {
    const matchesSearch = replacement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         replacement.applicantName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || replacement.status === statusFilter;
    
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
          <h1 className="text-3xl font-bold text-foreground">补卡管理</h1>
          <p className="text-muted-foreground">管理员工补卡申请和审批流程</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingReplacement(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              新建补卡申请
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingReplacement ? '编辑补卡申请' : '新建补卡申请'}
              </DialogTitle>
              <DialogDescription>
                请填写补卡申请信息，所有字段均为必填项
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departmentId">部门 *</Label>
                  <Select value={formData.departmentId} onValueChange={(value) => setFormData({...formData, departmentId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择部门" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dept1">技术部</SelectItem>
                      <SelectItem value="dept2">人事部</SelectItem>
                      <SelectItem value="dept3">财务部</SelectItem>
                      <SelectItem value="dept4">市场部</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="replacementDate">补卡日期 *</Label>
                  <Input
                    type="date"
                    value={formData.replacementDate}
                    onChange={(e) => setFormData({...formData, replacementDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="replacementTime">补卡时间 *</Label>
                  <Input
                    type="time"
                    step="1"
                    value={formData.replacementTime}
                    onChange={(e) => setFormData({...formData, replacementTime: e.target.value})}
                    required
                  />
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
                <Label htmlFor="reason">补卡事由 *</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="请详细说明补卡原因"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  {editingReplacement ? '更新' : '提交'}
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
                  placeholder="搜索申请人或补卡事由..."
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

      {/* 补卡申请列表 */}
      <Card>
        <CardHeader>
          <CardTitle>补卡申请列表</CardTitle>
          <CardDescription>
            共 {filteredReplacements.length} 条记录
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
                  <TableHead>补卡日期</TableHead>
                  <TableHead>补卡时间</TableHead>
                  <TableHead>补卡事由</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReplacements.map((replacement) => (
                  <TableRow key={replacement.id}>
                    <TableCell>{replacement.requestNumber}</TableCell>
                    <TableCell>{replacement.applicantName}</TableCell>
                    <TableCell>{replacement.applicantDepartment}</TableCell>
                    <TableCell>
                      {format(new Date(replacement.replacementDate), 'yyyy-MM-dd', { locale: zhCN })}
                    </TableCell>
                    <TableCell>{replacement.replacementTime}</TableCell>
                    <TableCell className="max-w-xs truncate">{replacement.reason}</TableCell>
                    <TableCell>{getStatusBadge(replacement.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(replacement)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {replacement.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(replacement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(replacement.id, true)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(replacement.id, false)}
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
      {viewingReplacement && (
        <Dialog open={!!viewingReplacement} onOpenChange={() => setViewingReplacement(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>补卡申请详情</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>申请编号</Label>
                  <p className="text-sm text-muted-foreground">{viewingReplacement.requestNumber}</p>
                </div>
                <div>
                  <Label>申请人</Label>
                  <p className="text-sm text-muted-foreground">{viewingReplacement.applicantName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>部门</Label>
                  <p className="text-sm text-muted-foreground">{viewingReplacement.applicantDepartment}</p>
                </div>
                <div>
                  <Label>状态</Label>
                  <div className="mt-1">{getStatusBadge(viewingReplacement.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>补卡日期</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(viewingReplacement.replacementDate), 'yyyy-MM-dd', { locale: zhCN })}
                  </p>
                </div>
                <div>
                  <Label>补卡时间</Label>
                  <p className="text-sm text-muted-foreground">{viewingReplacement.replacementTime}</p>
                </div>
              </div>
              <div>
                <Label>补卡事由</Label>
                <p className="text-sm text-muted-foreground">{viewingReplacement.reason}</p>
              </div>
              {viewingReplacement.attachmentUrl && (
                <div>
                  <Label>附件</Label>
                  <p className="text-sm text-muted-foreground">
                    <a href={viewingReplacement.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      查看附件
                    </a>
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CardReplacementManagement; 