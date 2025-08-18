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
import { DeleteButton } from '@/components/ui/delete-confirm-dialog';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Building,
  MapPin,
  Users,
  Hash,
  Building2,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { assetAPI, userAPI } from '@/services/api';
import type { AssetLocation, User } from '@/types';

const AssetLocations = () => {
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AssetLocation | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    code: '',
    type: 'building' as 'building' | 'floor' | 'room',
    parent_id: '',
    capacity: '',
    responsible_id: '',
    address: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const [locationsData, usersData] = await Promise.all([
        assetAPI.getAssetLocationsHierarchy(),
        userAPI.getAll(),
      ]);
      setLocations(locationsData);
      setUsers(usersData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载存放位置数据',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 展平位置树形结构为列表
  const flattenLocations = (locations: AssetLocation[], level = 0): (AssetLocation & { level: number })[] => {
    let result: (AssetLocation & { level: number })[] = [];
    
    locations.forEach(location => {
      result.push({ ...location, level });
      if (location.children && location.children.length > 0) {
        result = result.concat(flattenLocations(location.children, level + 1));
      }
    });
    
    return result;
  };

  // 获取父级位置选项
  const getParentOptions = () => {
    const flatList = flattenLocations(locations);
    // 根据当前选择的类型来限制父级选项
    if (newLocation.type === 'building') {
      return []; // 建筑物不能有父级
    } else if (newLocation.type === 'floor') {
      return flatList.filter(loc => loc.type === 'building'); // 楼层的父级只能是建筑物
    } else if (newLocation.type === 'room') {
      return flatList.filter(loc => loc.type === 'floor'); // 房间的父级只能是楼层
    }
    return [];
  };

  // 获取位置类型名称
  const getLocationTypeName = (type: string) => {
    const typeMap = {
      building: '建筑物',
      floor: '楼层',
      room: '房间',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // 获取位置类型图标
  const getLocationTypeIcon = (type: string) => {
    const iconMap = {
      building: Building2,
      floor: Building,
      room: MapPin,
    };
    return iconMap[type as keyof typeof iconMap] || MapPin;
  };

  // 过滤位置
  const filteredLocations = flattenLocations(locations).filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newLocation.name.trim() || !newLocation.code.trim()) {
      toast({
        title: '验证失败',
        description: '请填写位置名称和编码',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // 根据类型和父级确定层级
      let level = 0;
      if (newLocation.type === 'floor') level = 1;
      if (newLocation.type === 'room') level = 2;
      
      const locationData = {
        ...newLocation,
        parent_id: newLocation.parent_id === 'null' || !newLocation.parent_id ? undefined : newLocation.parent_id,
        capacity: parseInt(newLocation.capacity) || 0,
        responsible_id: newLocation.responsible_id === 'null' || !newLocation.responsible_id ? undefined : newLocation.responsible_id,
        level,
        status: 'active' as const,
      };

      await assetAPI.createAssetLocation(locationData);
      
      toast({
        title: '创建成功',
        description: '存放位置已创建',
        duration: 2000,
      });
      
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('创建位置失败:', error);
      toast({
        title: '创建失败',
        description: '无法创建存放位置',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (location: AssetLocation) => {
    setEditingLocation(location);
    setNewLocation({
      name: location.name,
      code: location.code,
      type: location.type,
      parent_id: location.parent_id || '',
      capacity: location.capacity.toString(),
      responsible_id: location.responsible_id || '',
      address: location.address || '',
      description: location.description || '',
    });
    setIsCreateOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingLocation || !newLocation.name.trim() || !newLocation.code.trim()) {
      toast({
        title: '验证失败',
        description: '请填写位置名称和编码',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // 根据类型和父级确定层级
      let level = 0;
      if (newLocation.type === 'floor') level = 1;
      if (newLocation.type === 'room') level = 2;
      
      const locationData = {
        ...newLocation,
        parent_id: newLocation.parent_id === 'null' || !newLocation.parent_id ? undefined : newLocation.parent_id,
        capacity: parseInt(newLocation.capacity) || 0,
        responsible_id: newLocation.responsible_id === 'null' || !newLocation.responsible_id ? undefined : newLocation.responsible_id,
        level,
        status: editingLocation.status,
      };

      await assetAPI.updateAssetLocation(editingLocation.id, locationData);
      
      toast({
        title: '更新成功',
        description: '存放位置已更新',
        duration: 2000,
      });
      
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('更新位置失败:', error);
      toast({
        title: '更新失败',
        description: '无法更新存放位置',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (location: AssetLocation) => {
    if (location.children && location.children.length > 0) {
      toast({
        title: '删除失败',
        description: '该位置下还有子位置，请先删除子位置',
        variant: 'destructive',
      });
      return;
    }

    try {
      await assetAPI.deleteAssetLocation(location.id);
              toast({
          title: '删除成功',
          description: '存放位置已删除',
          duration: 2000,
        });
      loadData();
    } catch (error) {
      console.error('删除位置失败:', error);
      toast({
        title: '删除失败',
        description: '无法删除存放位置',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setNewLocation({
      name: '',
      code: '',
      type: 'building',
      parent_id: '',
      capacity: '',
      responsible_id: '',
      address: '',
      description: '',
    });
    setEditingLocation(null);
  };

  const handleDialogClose = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和新建按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">存放位置管理</h1>
          <p className="text-muted-foreground">管理资产存放位置，支持建筑物→楼层→房间的三级结构</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              新增位置
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingLocation ? '编辑位置' : '新建位置'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">位置名称 <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入位置名称"
                  />
                </div>
                <div>
                  <Label htmlFor="code">位置编码 <span className="text-red-500">*</span></Label>
                  <Input
                    id="code"
                    value={newLocation.code}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, code: e.target.value }))}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入位置编码"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">位置类型 <span className="text-red-500">*</span></Label>
                  <Select 
                    value={newLocation.type} 
                    onValueChange={(value: 'building' | 'floor' | 'room') => 
                      setNewLocation(prev => ({ ...prev, type: value, parent_id: '' }))
                    }
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择位置类型" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="building">建筑物</SelectItem>
                      <SelectItem value="floor">楼层</SelectItem>
                      <SelectItem value="room">房间</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="parent_id">父级位置</Label>
                  <Select 
                    value={newLocation.parent_id} 
                    onValueChange={(value) => setNewLocation(prev => ({ ...prev, parent_id: value }))}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择父级位置（可选）" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="null">无父级位置</SelectItem>
                      {getParentOptions().map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} ({location.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">容量</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newLocation.capacity}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, capacity: e.target.value }))}
                    className="bg-background border-border text-foreground"
                    placeholder="请输入容量"
                  />
                </div>
                <div>
                  <Label htmlFor="responsible_id">负责人</Label>
                  <Select 
                    value={newLocation.responsible_id} 
                    onValueChange={(value) => setNewLocation(prev => ({ ...prev, responsible_id: value }))}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="选择负责人（可选）" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="null">无负责人</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} - {user.position?.name || '无职位'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="address">地址</Label>
                <Input
                  id="address"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入地址（可选）"
                />
              </div>
              <div>
                <Label htmlFor="description">描述</Label>
                <Input
                  id="description"
                  value={newLocation.description}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-background border-border text-foreground"
                  placeholder="请输入描述（可选）"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleDialogClose}>
                  取消
                </Button>
                <Button 
                  onClick={editingLocation ? handleUpdate : handleCreate} 
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingLocation ? '更新' : '创建'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索栏 */}
      <Card className="bg-card border-border theme-transition">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索位置名称或编码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 位置列表 */}
      <Card className="bg-card border-border theme-transition">
        <CardHeader>
          <CardTitle className="text-foreground">位置列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">位置名称</TableHead>
                <TableHead className="text-muted-foreground">位置编码</TableHead>
                <TableHead className="text-muted-foreground">类型</TableHead>
                <TableHead className="text-muted-foreground">容量</TableHead>
                <TableHead className="text-muted-foreground">负责人</TableHead>
                <TableHead className="text-muted-foreground">地址</TableHead>
                <TableHead className="text-muted-foreground">创建时间</TableHead>
                <TableHead className="text-muted-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => {
                const Icon = getLocationTypeIcon(location.type);
                return (
                  <TableRow key={location.id} className="border-border">
                    <TableCell className="text-foreground">
                      <div className="flex items-center space-x-2">
                        <div style={{ marginLeft: `${location.level * 20}px` }}>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span>{location.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-mono">{location.code}</TableCell>
                    <TableCell className="text-foreground">
                      <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                        {getLocationTypeName(location.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">{location.capacity}</TableCell>
                    <TableCell className="text-foreground">
                      {location.responsible?.name || '无'}
                    </TableCell>
                    <TableCell className="text-foreground">
                      <span className="text-muted-foreground">{location.address || '无'}</span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {new Date(location.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(location)}
                          className="hover:bg-muted"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          onConfirm={() => handleDelete(location)}
                          itemName={location.name}
                          variant="ghost"
                          className="hover:bg-muted"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetLocations;
