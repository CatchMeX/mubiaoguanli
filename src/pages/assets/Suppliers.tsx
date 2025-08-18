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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Building,
  Phone,
  Mail,
  MapPin,
  User,
} from 'lucide-react';
import { suppliers } from '@/data/mockData';
import type { Supplier } from '@/types';

const Suppliers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    code: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
  });

  // 过滤供应商
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'border-green-500 text-green-500';
      case 'inactive': return 'border-red-500 text-red-500';
      default: return 'border-muted-foreground text-muted-foreground';
    }
  };

  // 获取状态名称
  const getStatusName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': '启用',
      'inactive': '停用',
    };
    return statusMap[status] || status;
  };

  // 创建供应商
  const handleCreate = () => {
    console.log('创建供应商:', newSupplier);
    setIsCreateOpen(false);
    setNewSupplier({
      name: '',
      code: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      status: 'active',
    });
  };

  // 编辑供应商
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setNewSupplier({
      name: supplier.name,
      code: supplier.code,
      contact: supplier.contact,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      status: supplier.status,
    });
  };

  // 更新供应商
  const handleUpdate = () => {
    console.log('更新供应商:', editingSupplier?.id, newSupplier);
    setEditingSupplier(null);
    setNewSupplier({
      name: '',
      code: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      status: 'active',
    });
  };

  // 删除供应商
  const handleDelete = (id: string) => {
    console.log('删除供应商:', id);
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">供应商管理</h1>
            <p className="text-muted-foreground mt-1">管理资产供应商信息</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                新增供应商
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle>新增供应商</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">供应商名称</Label>
                    <Input
                      id="name"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入供应商名称"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">供应商编码</Label>
                    <Input
                      id="code"
                      value={newSupplier.code}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, code: e.target.value }))}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入供应商编码"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact">联系人</Label>
                    <Input
                      id="contact"
                      value={newSupplier.contact}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, contact: e.target.value }))}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入联系人姓名"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">联系电话</Label>
                    <Input
                      id="phone"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入联系电话"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">邮箱地址</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-background border-border text-foreground"
                      placeholder="请输入邮箱地址"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">状态</Label>
                    <Select value={newSupplier.status} onValueChange={(value: 'active' | 'inactive') => setNewSupplier(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="active">启用</SelectItem>
                        <SelectItem value="inactive">停用</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">地址</Label>
                  <Textarea
                    id="address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入详细地址"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    创建
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
                  placeholder="搜索供应商名称、编码或联系人..."
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
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 供应商列表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">供应商列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">供应商名称</TableHead>
                  <TableHead className="text-muted-foreground">编码</TableHead>
                  <TableHead className="text-muted-foreground">联系人</TableHead>
                  <TableHead className="text-muted-foreground">联系方式</TableHead>
                  <TableHead className="text-muted-foreground">地址</TableHead>
                  <TableHead className="text-muted-foreground">状态</TableHead>
                  <TableHead className="text-muted-foreground">创建时间</TableHead>
                  <TableHead className="text-muted-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{supplier.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-500 text-blue-500">
                        {supplier.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{supplier.contact}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-foreground">{supplier.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-foreground">{supplier.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 max-w-xs">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground text-sm truncate" title={supplier.address}>
                          {supplier.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusStyle(supplier.status)}>
                        {getStatusName(supplier.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(supplier.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog open={editingSupplier?.id === supplier.id} onOpenChange={(open) => !open && setEditingSupplier(null)}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                              onClick={() => handleEdit(supplier)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>编辑供应商</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-name">供应商名称</Label>
                                  <Input
                                    id="edit-name"
                                    value={newSupplier.name}
                                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                                    className="bg-background border-border text-foreground"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-code">供应商编码</Label>
                                  <Input
                                    id="edit-code"
                                    value={newSupplier.code}
                                    onChange={(e) => setNewSupplier(prev => ({ ...prev, code: e.target.value }))}
                                    className="bg-background border-border text-foreground"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-contact">联系人</Label>
                                  <Input
                                    id="edit-contact"
                                    value={newSupplier.contact}
                                    onChange={(e) => setNewSupplier(prev => ({ ...prev, contact: e.target.value }))}
                                    className="bg-background border-border text-foreground"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-phone">联系电话</Label>
                                  <Input
                                    id="edit-phone"
                                    value={newSupplier.phone}
                                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                                    className="bg-background border-border text-foreground"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-email">邮箱地址</Label>
                                  <Input
                                    id="edit-email"
                                    type="email"
                                    value={newSupplier.email}
                                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                                    className="bg-background border-border text-foreground"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-status">状态</Label>
                                  <Select value={newSupplier.status} onValueChange={(value: 'active' | 'inactive') => setNewSupplier(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger className="bg-background border-border text-foreground">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                      <SelectItem value="active">启用</SelectItem>
                                      <SelectItem value="inactive">停用</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="edit-address">地址</Label>
                                <Textarea
                                  id="edit-address"
                                  value={newSupplier.address}
                                  onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                                  className="bg-background border-border text-foreground"
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setEditingSupplier(null)}>
                                  取消
                                </Button>
                                <Button onClick={handleUpdate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
                          onClick={() => handleDelete(supplier.id)}
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
      </div>
    </div>
  );
};

export default Suppliers;
