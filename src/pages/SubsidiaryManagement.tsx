import { useState } from 'react';
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
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react';
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { subsidiaries } from '@/data/mockData';
import type { Subsidiary } from '@/types';

const SubsidiaryManagement = () => {
  const [subsidiaryList, setSubsidiaryList] = useState(subsidiaries);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary | null>(null);

  // 新增子公司表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    legalRepresentative: '',
    registeredCapital: 0,
    businessScope: '',
    address: '',
    phone: '',
    email: '',
    establishedDate: '',
    status: 'active' as 'active' | 'inactive',
  });

  // 编辑子公司表单状态
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    legalRepresentative: '',
    registeredCapital: 0,
    businessScope: '',
    address: '',
    phone: '',
    email: '',
    establishedDate: '',
    status: 'active' as 'active' | 'inactive',
  });

  // 过滤子公司
  const filteredSubsidiaries = subsidiaryList.filter(subsidiary => {
    const matchesSearch = subsidiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subsidiary.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || subsidiary.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 状态映射
  const statusMap = {
    active: { label: '正常运营', color: 'bg-green-600' },
    inactive: { label: '暂停运营', color: 'bg-red-600' },
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      legalRepresentative: '',
      registeredCapital: 0,
      businessScope: '',
      address: '',
      phone: '',
      email: '',
      establishedDate: '',
      status: 'active',
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      code: '',
      legalRepresentative: '',
      registeredCapital: 0,
      businessScope: '',
      address: '',
      phone: '',
      email: '',
      establishedDate: '',
      status: 'active',
    });
  };

  // 添加子公司
  const addSubsidiary = () => {
    if (!formData.name.trim()) {
      alert('请输入子公司名称');
      return;
    }
    if (!formData.code.trim()) {
      alert('请输入子公司编码');
      return;
    }
    if (!formData.legalRepresentative.trim()) {
      alert('请输入法定代表人');
      return;
    }
    if (formData.registeredCapital <= 0) {
      alert('注册资本必须大于0');
      return;
    }

    // 检查编码是否重复
    if (subsidiaryList.some(sub => sub.code === formData.code.trim())) {
      alert('子公司编码已存在');
      return;
    }

    const newSubsidiary: Subsidiary = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      code: formData.code.trim(),
      legalRepresentative: formData.legalRepresentative.trim(),
      registeredCapital: formData.registeredCapital,
      businessScope: formData.businessScope.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      establishedDate: formData.establishedDate,
      status: formData.status,
      allocationRatio: 0, // 默认分摊比例为0
      establishDate: formData.establishedDate, // 兼容旧字段名
      remarks: '', // 默认备注为空
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSubsidiaryList(prev => [...prev, newSubsidiary]);
    setIsAddDialogOpen(false);
    resetForm();
    alert('子公司添加成功！');
  };

  // 编辑子公司
  const editSubsidiary = (subsidiary: Subsidiary) => {
    setSelectedSubsidiary(subsidiary);
    setEditFormData({
      name: subsidiary.name,
      code: subsidiary.code,
      legalRepresentative: subsidiary.legalRepresentative || '',
      registeredCapital: subsidiary.registeredCapital || 0,
      businessScope: subsidiary.businessScope || '',
      address: subsidiary.address || '',
      phone: subsidiary.phone || '',
      email: subsidiary.email || '',
      establishedDate: subsidiary.establishedDate || subsidiary.establishDate || '',
      status: subsidiary.status,
    });
    setIsEditDialogOpen(true);
  };

  // 更新子公司
  const updateSubsidiary = () => {
    if (!selectedSubsidiary) return;

    if (!editFormData.name.trim()) {
      alert('请输入子公司名称');
      return;
    }
    if (!editFormData.code.trim()) {
      alert('请输入子公司编码');
      return;
    }
    if (!editFormData.legalRepresentative.trim()) {
      alert('请输入法定代表人');
      return;
    }
    if (editFormData.registeredCapital <= 0) {
      alert('注册资本必须大于0');
      return;
    }

    // 检查编码是否重复（排除当前子公司）
    if (subsidiaryList.some(sub => sub.code === editFormData.code.trim() && sub.id !== selectedSubsidiary.id)) {
      alert('子公司编码已存在');
      return;
    }

    setSubsidiaryList(prev => prev.map(sub => 
      sub.id === selectedSubsidiary.id 
        ? {
            ...sub,
            name: editFormData.name.trim(),
            code: editFormData.code.trim(),
            legalRepresentative: editFormData.legalRepresentative.trim(),
            registeredCapital: editFormData.registeredCapital,
            businessScope: editFormData.businessScope.trim(),
            address: editFormData.address.trim(),
            phone: editFormData.phone.trim(),
            email: editFormData.email.trim(),
            establishedDate: editFormData.establishedDate,
            establishDate: editFormData.establishedDate, // 兼容旧字段名
            status: editFormData.status,
            updatedAt: new Date().toISOString(),
          }
        : sub
    ));

    setIsEditDialogOpen(false);
    setSelectedSubsidiary(null);
    resetEditForm();
    alert('子公司更新成功！');
  };

  // 删除子公司
  const deleteSubsidiary = (subsidiary: Subsidiary) => {
      setSubsidiaryList(prev => prev.filter(sub => sub.id !== subsidiary.id));
      alert('子公司删除成功！');
  };

  // 切换状态
  const toggleStatus = (subsidiary: Subsidiary) => {
    const newStatus = subsidiary.status === 'active' ? 'inactive' : 'active';
    const statusText = newStatus === 'active' ? '启用' : '停用';
    
    if (confirm(`确定要${statusText}子公司"${subsidiary.name}"吗？`)) {
      setSubsidiaryList(prev => prev.map(sub => 
        sub.id === subsidiary.id 
          ? { ...sub, status: newStatus, updatedAt: new Date().toISOString() }
          : sub
      ));
      alert(`子公司已${statusText}！`);
    }
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">子公司管理</h1>
            <p className="text-muted-foreground mt-1">管理集团下属子公司信息</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                添加子公司
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-popover border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>添加新子公司</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">子公司名称 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入子公司名称"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">子公司编码 *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入子公司编码"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="legalRepresentative">法定代表人 *</Label>
                    <Input
                      id="legalRepresentative"
                      value={formData.legalRepresentative}
                      onChange={(e) => setFormData({ ...formData, legalRepresentative: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入法定代表人"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registeredCapital">注册资本（万元）*</Label>
                    <Input
                      id="registeredCapital"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.registeredCapital}
                      onChange={(e) => setFormData({ ...formData, registeredCapital: parseFloat(e.target.value) || 0 })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入注册资本"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">联系电话</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入联系电话"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">邮箱地址</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入邮箱地址"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="establishedDate">成立日期</Label>
                    <Input
                      id="establishedDate"
                      type="date"
                      value={formData.establishedDate}
                      onChange={(e) => setFormData({ ...formData, establishedDate: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">运营状态</Label>
                    <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="active">正常运营</SelectItem>
                        <SelectItem value="inactive">暂停运营</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">注册地址</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入注册地址"
                  />
                </div>
                <div>
                  <Label htmlFor="businessScope">经营范围</Label>
                  <Textarea
                    id="businessScope"
                    value={formData.businessScope}
                    onChange={(e) => setFormData({ ...formData, businessScope: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入经营范围"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={addSubsidiary}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    添加
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
              <CardTitle className="text-sm font-medium text-muted-foreground">子公司总数</CardTitle>
              <Building className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{subsidiaryList.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">正常运营</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {subsidiaryList.filter(s => s.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">暂停运营</CardTitle>
              <Building className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {subsidiaryList.filter(s => s.status === 'inactive').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总注册资本</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {subsidiaryList.reduce((sum, s) => sum + (s.registeredCapital || 0), 0).toLocaleString()}万
              </div>
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
                  placeholder="搜索子公司名称或编码..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-background border-border text-foreground">
                  <SelectValue placeholder="运营状态" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">正常运营</SelectItem>
                  <SelectItem value="inactive">暂停运营</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 子公司列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">子公司列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">子公司名称</TableHead>
                  <TableHead className="text-foreground">编码</TableHead>
                  <TableHead className="text-foreground">法定代表人</TableHead>
                  <TableHead className="text-foreground">注册资本</TableHead>
                  <TableHead className="text-foreground">成立日期</TableHead>
                  <TableHead className="text-foreground">运营状态</TableHead>
                  <TableHead className="text-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubsidiaries.map((subsidiary) => (
                  <TableRow key={subsidiary.id} className="border-border">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{subsidiary.name}</div>
                        {subsidiary.address && (
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {subsidiary.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{subsidiary.code}</TableCell>
                    <TableCell className="text-foreground">{subsidiary.legalRepresentative || '-'}</TableCell>
                    <TableCell className="text-foreground">{(subsidiary.registeredCapital || 0).toLocaleString()}万</TableCell>
                    <TableCell className="text-foreground">
                      {subsidiary.establishedDate || subsidiary.establishDate || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusMap[subsidiary.status].color} text-white`}>
                        {statusMap[subsidiary.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editSubsidiary(subsidiary)}
                          className="border-border text-muted-foreground hover:bg-accent"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleStatus(subsidiary)}
                          className={
                            subsidiary.status === 'active'
                              ? "border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                              : "border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                          }
                        >
                          {subsidiary.status === 'active' ? '停用' : '启用'}
                        </Button>
                        <DeleteButton
                          onConfirm={() => deleteSubsidiary(subsidiary)}
                          itemName={subsidiary.name}
                          variant="outline"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 编辑子公司对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>编辑子公司</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">子公司名称 *</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入子公司名称"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code">子公司编码 *</Label>
                  <Input
                    id="edit-code"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入子公司编码"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-legalRepresentative">法定代表人 *</Label>
                  <Input
                    id="edit-legalRepresentative"
                    value={editFormData.legalRepresentative}
                    onChange={(e) => setEditFormData({ ...editFormData, legalRepresentative: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入法定代表人"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-registeredCapital">注册资本（万元）*</Label>
                  <Input
                    id="edit-registeredCapital"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editFormData.registeredCapital}
                    onChange={(e) => setEditFormData({ ...editFormData, registeredCapital: parseFloat(e.target.value) || 0 })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入注册资本"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">联系电话</Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入联系电话"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">邮箱地址</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入邮箱地址"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-establishedDate">成立日期</Label>
                  <Input
                    id="edit-establishedDate"
                    type="date"
                    value={editFormData.establishedDate}
                    onChange={(e) => setEditFormData({ ...editFormData, establishedDate: e.target.value })}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">运营状态</Label>
                  <Select value={editFormData.status} onValueChange={(value: 'active' | 'inactive') => setEditFormData({ ...editFormData, status: value })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="active">正常运营</SelectItem>
                      <SelectItem value="inactive">暂停运营</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-address">注册地址</Label>
                <Input
                  id="edit-address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入注册地址"
                />
              </div>
              <div>
                <Label htmlFor="edit-businessScope">经营范围</Label>
                <Textarea
                  id="edit-businessScope"
                  value={editFormData.businessScope}
                  onChange={(e) => setEditFormData({ ...editFormData, businessScope: e.target.value })}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入经营范围"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedSubsidiary(null);
                    resetEditForm();
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={updateSubsidiary}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  更新
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SubsidiaryManagement;
