import { useState, useEffect } from 'react';
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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Package,
  Calendar,
  DollarSign,
  User,
  FileText,
  Trash,
  ShoppingCart,
  Gift,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { assetDisposalAPI, assetAPI, userAPI } from '@/services/api';
import type { AssetDisposal, Asset, User as UserType } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AssetDisposal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDisposal, setEditingDisposal] = useState<AssetDisposal | null>(null);
  const [viewingDisposal, setViewingDisposal] = useState<AssetDisposal | null>(null);
  const [disposals, setDisposals] = useState<AssetDisposal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newDisposal, setNewDisposal] = useState({
    assetId: '',
    type: 'scrap' as 'scrap' | 'sale' | 'donation' | 'transfer',
    reason: '',
    disposalDate: '',
    disposalValue: '',
    income: '',
    recipient: '',
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [disposalsData, assetsData, usersData] = await Promise.all([
        assetDisposalAPI.getAssetDisposals(),
        assetAPI.getAll(),
        userAPI.getUsersWithRelations()
      ]);
      setDisposals(disposalsData);
      setAssets(assetsData.filter(asset => asset.status === 'in_use' || asset.status === 'idle'));
      setUsers(usersData);
    } catch (err) {
      console.error('加载数据失败:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
      toast({
        title: '加载数据失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 过滤处置记录
  const filteredDisposals = disposals.filter(disposal => {
    const matchesSearch = disposal.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disposal.asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (disposal.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || disposal.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // 获取处置类型样式
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'scrap': return 'bg-red-100 text-red-800';
      case 'sale': return 'bg-green-100 text-green-800';
      case 'donation': return 'bg-blue-100 text-blue-800';
      case 'transfer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取处置类型名称
  const getTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'scrap': '报废',
      'sale': '变卖',
      'donation': '捐赠',
      'transfer': '转移',
    };
    return typeMap[type] || type;
  };

  // 获取处置类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scrap': return Trash;
      case 'sale': return ShoppingCart;
      case 'donation': return Gift;
      case 'transfer': return ArrowRightLeft;
      default: return Package;
    }
  };

  // 创建处置记录
  const handleCreate = async () => {
    try {
      // 验证必填字段
      if (!newDisposal.assetId) {
        toast({
          title: '请选择资产',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.type) {
        toast({
          title: '请选择处置类型',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.reason) {
        toast({
          title: '请输入处置原因',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.disposalDate) {
        toast({
          title: '请选择处置日期',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.disposalValue) {
        toast({
          title: '请输入处置价值',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.income) {
        toast({
          title: '请输入处置收入',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.recipient) {
        toast({
          title: '请输入接收方',
          variant: 'destructive',
        });
        return;
      }

      setSubmitting(true);
      await assetDisposalAPI.createAssetDisposal({
        asset_id: newDisposal.assetId,
        type: newDisposal.type,
        reason: newDisposal.reason,
        disposal_date: newDisposal.disposalDate,
        disposal_value: parseFloat(newDisposal.disposalValue),
        income: parseFloat(newDisposal.income),
        recipient: newDisposal.recipient,
        status: 'pending',
      });

      await loadData();
      setIsCreateOpen(false);
      setNewDisposal({
        assetId: '',
        type: 'scrap',
        reason: '',
        disposalDate: '',
        disposalValue: '',
        income: '',
        recipient: '',
      });
      toast({
        title: '创建成功',
        description: '资产处置记录已创建',
        duration: 2000,
      });
    } catch (err) {
      console.error('创建处置记录失败:', err);
      toast({
        title: '创建失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 审批处置记录
  const handleApprove = async (id: string) => {
    try {
      setSubmitting(true);
      
      // 1. 获取处置记录详情
      const disposal = disposals.find(d => d.id === id);
      if (!disposal || !disposal.asset) {
        toast({
          title: '审批失败',
          description: '找不到相关处置记录或资产信息',
          variant: 'destructive',
        });
        return;
      }

      // 2. 更新处置记录状态
      await assetDisposalAPI.updateAssetDisposal(id, { 
        status: 'approved',
      });

      // 3. 更新资产状态为已处置
      await assetAPI.updateAsset(disposal.asset_id, { 
        status: 'disposed' 
      });

      toast({
        title: '审批成功',
        description: '资产处置已批准，资产状态已更新为已处置',
        duration: 2000,
      });

      // 4. 刷新数据
      await loadData();

    } catch (error) {
      console.error('Error approving asset disposal:', error);
      toast({
        title: '审批失败',
        description: error instanceof Error ? error.message : '服务器错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 驳回处置记录
  const handleReject = async (id: string) => {
    try {
      setSubmitting(true);
      await assetDisposalAPI.updateAssetDisposal(id, { status: 'cancelled' });
      
      toast({
        title: '驳回成功',
        description: '资产处置已驳回',
        duration: 2000,
      });
      
      await loadData();
    } catch (error) {
      console.error('Error rejecting asset disposal:', error);
      toast({
        title: '驳回失败',
        description: '服务器错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 编辑处置记录
  const handleEdit = (disposal: AssetDisposal) => {
    setEditingDisposal(disposal);
    setNewDisposal({
      assetId: disposal.asset_id,
      type: disposal.type,
      reason: disposal.reason || '',
      disposalDate: disposal.disposal_date,
      disposalValue: disposal.disposal_value?.toString() || '',
      income: disposal.income?.toString() || '',
      recipient: disposal.recipient || '',
    });
    setIsCreateOpen(true);
  };

  // 更新处置记录
  const handleUpdate = async () => {
    if (!editingDisposal) return;

    try {
      // 验证必填字段
      if (!newDisposal.assetId) {
        toast({
          title: '请选择资产',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.type) {
        toast({
          title: '请选择处置类型',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.reason) {
        toast({
          title: '请输入处置原因',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.disposalDate) {
        toast({
          title: '请选择处置日期',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.disposalValue) {
        toast({
          title: '请输入处置价值',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.income) {
        toast({
          title: '请输入处置收入',
          variant: 'destructive',
        });
        return;
      }
      if (!newDisposal.recipient) {
        toast({
          title: '请输入接收方',
          variant: 'destructive',
        });
        return;
      }

      setSubmitting(true);
      await assetDisposalAPI.updateAssetDisposal(editingDisposal.id, {
        asset_id: newDisposal.assetId,
        type: newDisposal.type,
        reason: newDisposal.reason,
        disposal_date: newDisposal.disposalDate,
        disposal_value: parseFloat(newDisposal.disposalValue),
        income: parseFloat(newDisposal.income),
        recipient: newDisposal.recipient,
      });

      await loadData();
      setIsCreateOpen(false);
      setEditingDisposal(null);
      setNewDisposal({
        assetId: '',
        type: 'scrap',
        reason: '',
        disposalDate: '',
        disposalValue: '',
        income: '',
        recipient: '',
      });
      toast({
        title: '更新成功',
        description: '资产处置记录已更新',
        duration: 2000,
      });
    } catch (err) {
      console.error('更新处置记录失败:', err);
      toast({
        title: '更新失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 删除处置记录
  const handleDelete = async (id: string) => {
    try {
      await assetDisposalAPI.deleteAssetDisposal(id);
      await loadData();
      toast({
        title: '删除成功',
        description: '资产处置记录已删除',
          duration: 2000,
      });
    } catch (err) {
      console.error('删除处置记录失败:', err);
      toast({
        title: '删除失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 重置表单
  const resetForm = () => {
    setNewDisposal({
      assetId: '',
      type: 'scrap',
      reason: '',
      disposalDate: '',
      disposalValue: '',
      income: '',
      recipient: '',
    });
    setEditingDisposal(null);
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'border-yellow-500 text-yellow-500';
      case 'approved': return 'border-green-500 text-green-500';
      case 'completed': return 'border-blue-500 text-blue-500';
      case 'cancelled': return 'border-red-500 text-red-500';
      default: return 'border-muted-foreground text-muted-foreground';
    }
  };

  // 获取状态名称
  const getStatusName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '待审批',
      'approved': '已批准',
      'completed': '已完成',
      'cancelled': '已取消',
    };
    return statusMap[status] || status;
  };

  // 渲染处置记录行
  const renderDisposalRow = (disposal: AssetDisposal) => {
    const Icon = getTypeIcon(disposal.type);
    return (
      <TableRow
        key={disposal.id}
        className="border-border transition-colors hover:bg-accent/60 group text-sm h-14"
      >
        {/* 资产信息 */}
        <TableCell className="text-foreground min-w-[180px] max-w-[220px]">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-semibold text-base leading-tight truncate">{disposal.asset.name}</div>
              <div className="text-xs text-muted-foreground truncate">{disposal.asset.code}</div>
            </div>
          </div>
        </TableCell>
        {/* 处置类型 */}
        <TableCell className="align-middle text-center min-w-[80px]">
          <Badge className={getTypeStyle(disposal.type) + ' px-2 py-0.5 rounded-full text-xs font-medium min-w-[48px] justify-center'}>
            {getTypeName(disposal.type)}
          </Badge>
        </TableCell>
        {/* 处置原因 */}
        <TableCell className="max-w-[120px] truncate text-muted-foreground text-center">
          {disposal.reason}
        </TableCell>
        {/* 处置日期 */}
        <TableCell className="whitespace-nowrap text-muted-foreground text-center min-w-[110px]">
          {disposal.disposal_date}
        </TableCell>
        {/* 处置价值 */}
        <TableCell className="text-right font-semibold text-blue-600 min-w-[90px]">
          ¥{disposal.disposal_value?.toLocaleString() || '0'}
        </TableCell>
        {/* 处置收入 */}
        <TableCell className="text-right font-semibold text-green-600 min-w-[90px]">
          ¥{disposal.income?.toLocaleString() || '0'}
        </TableCell>
        {/* 接收方 */}
        <TableCell className="text-foreground text-center min-w-[60px]">
          {disposal.recipient || '-'}
        </TableCell>
        {/* 状态 */}
        <TableCell className="align-middle text-center min-w-[80px]">
          <Badge className={getStatusStyle(disposal.status) + ' px-2 py-0.5 rounded-full text-xs font-medium min-w-[56px] justify-center'}>
            {getStatusName(disposal.status)}
          </Badge>
        </TableCell>
        {/* 操作 */}
        <TableCell className="align-middle text-center min-w-[120px]">
          <div className="flex items-center justify-center gap-1">
            <TooltipProvider>
              {disposal.status === 'pending' && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleApprove(disposal.id)}
                        disabled={submitting}
                        className="text-green-600 hover:bg-green-50"
                        aria-label="审批"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>审批</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleReject(disposal.id)}
                        disabled={submitting}
                        className="text-red-600 hover:bg-red-50"
                        aria-label="驳回"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>驳回</TooltipContent>
                  </Tooltip>
                </>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(disposal)}
                    disabled={disposal.status !== 'pending'}
                    aria-label="编辑"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>编辑</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DeleteButton
                      onConfirm={() => handleDelete(disposal.id)}
                      itemName={`资产处置记录`}
                    variant="ghost"
                    disabled={disposal.status !== 'pending'}
                      className="hover:bg-red-50"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>删除</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">资产处置</h1>
            <p className="text-muted-foreground mt-1">管理资产报废、变卖、捐赠和转移</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增处置
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingDisposal ? '编辑资产处置' : '新增资产处置'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="asset" className="text-sm font-medium flex items-center">
                      选择资产
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={newDisposal.assetId} onValueChange={(value) => setNewDisposal(prev => ({ ...prev, assetId: value }))}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="选择要处置的资产" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {assets.map(asset => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.code} - {asset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium flex items-center">
                      处置类型
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={newDisposal.type} onValueChange={(value: 'scrap' | 'sale' | 'donation' | 'transfer') => setNewDisposal(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="scrap">报废</SelectItem>
                        <SelectItem value="sale">变卖</SelectItem>
                        <SelectItem value="donation">捐赠</SelectItem>
                        <SelectItem value="transfer">转移</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="disposalDate" className="text-sm font-medium flex items-center">
                      处置日期
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="disposalDate"
                      type="date"
                      value={newDisposal.disposalDate}
                      onChange={(e) => setNewDisposal(prev => ({ ...prev, disposalDate: e.target.value }))}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="disposalValue" className="text-sm font-medium flex items-center">
                      处置价值
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="disposalValue"
                      type="number"
                      value={newDisposal.disposalValue}
                      onChange={(e) => setNewDisposal(prev => ({ ...prev, disposalValue: e.target.value }))}
                      className="bg-background border-border text-foreground"
                      placeholder="资产处置时的价值"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="income" className="text-sm font-medium flex items-center">
                      处置收入
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="income"
                      type="number"
                      value={newDisposal.income}
                      onChange={(e) => setNewDisposal(prev => ({ ...prev, income: e.target.value }))}
                      className="bg-background border-border text-foreground"
                      placeholder="处置获得的收入"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipient" className="text-sm font-medium flex items-center">
                      接收方
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="recipient"
                      value={newDisposal.recipient}
                      onChange={(e) => setNewDisposal(prev => ({ ...prev, recipient: e.target.value }))}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入接收方名称"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason" className="text-sm font-medium flex items-center">
                    处置原因
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    value={newDisposal.reason}
                    onChange={(e) => setNewDisposal(prev => ({ ...prev, reason: e.target.value }))}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入处置原因"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    取消
                  </Button>
                  <Button 
                    onClick={editingDisposal ? handleUpdate : handleCreate} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    {editingDisposal ? '更新' : '创建'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 搜索和筛选栏 */}
        <Card className="bg-card border-border theme-transition">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索资产名称、编号或处置原因..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="scrap">报废</SelectItem>
                  <SelectItem value="sale">变卖</SelectItem>
                  <SelectItem value="donation">捐赠</SelectItem>
                  <SelectItem value="transfer">转移</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 处置记录列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">处置记录</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground min-w-[180px] max-w-[220px]">资产信息</TableHead>
                  <TableHead className="text-muted-foreground text-center min-w-[80px]">处置类型</TableHead>
                  <TableHead className="text-muted-foreground text-center max-w-[120px]">处置原因</TableHead>
                  <TableHead className="text-muted-foreground text-center min-w-[110px]">处置日期</TableHead>
                  <TableHead className="text-muted-foreground text-right min-w-[90px]">处置价值</TableHead>
                  <TableHead className="text-muted-foreground text-right min-w-[90px]">处置收入</TableHead>
                  <TableHead className="text-muted-foreground text-center min-w-[60px]">接收方</TableHead>
                  <TableHead className="text-muted-foreground text-center min-w-[80px]">状态</TableHead>
                  <TableHead className="text-muted-foreground text-center min-w-[120px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisposals.map(renderDisposalRow)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetDisposal;
