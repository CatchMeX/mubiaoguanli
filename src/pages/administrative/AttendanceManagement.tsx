import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, StrictDialog, StrictDialogContent } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Plus, Search, Eye, Edit, Users, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceGroupAPI } from '@/services/administrativeAPI';
import { AttendanceGroup, AttendanceGroupMember } from '@/types/administrative';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  employee_id: string;
  email?: string;
}

const AttendanceManagement = () => {
  const { user } = useAuth();
  const [attendanceGroups, setAttendanceGroups] = useState<AttendanceGroup[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [groupMembers, setGroupMembers] = useState<{ [groupId: string]: User[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AttendanceGroup | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<AttendanceGroup | null>(null);
  const [viewingGroup, setViewingGroup] = useState<AttendanceGroup | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    workStartTime: '09:00',
    workEndTime: '18:00',
    breakStartTime: '12:00',
    breakEndTime: '13:00',
    isActive: true
  });

  const attendanceAPI = new AttendanceGroupAPI();

  useEffect(() => {
    loadAttendanceGroups();
    loadAllUsers();
  }, []);

  const loadAttendanceGroups = async () => {
    try {
      setLoading(true);
      const data = await attendanceAPI.getAll();
      setAttendanceGroups(data);
      
      // 加载每个组的成员
      for (const group of data) {
        await loadGroupMembers(group.id);
      }
    } catch (error) {
      console.error('加载考勤组失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, employee_id, email')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_group_members')
        .select(`
          member_id,
          users!attendance_group_members_member_id_fkey (
            id, name, employee_id, email
          )
        `)
        .eq('group_id', groupId);
      
      if (error) throw error;
      
      const members = data?.map(item => item.users).filter(Boolean) || [];
      setGroupMembers(prev => ({
        ...prev,
        [groupId]: members
      }));
    } catch (error) {
      console.error('加载组成员失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const groupData = {
        name: formData.name,
        description: formData.description,
        work_start_time: formData.workStartTime,
        work_end_time: formData.workEndTime,
        break_start_time: formData.breakStartTime,
        break_end_time: formData.breakEndTime,
        is_active: formData.isActive,
        created_by_id: user.id
      };

      if (editingGroup) {
        await attendanceAPI.update(editingGroup.id, groupData);
      } else {
        await attendanceAPI.create(groupData);
      }

      setIsDialogOpen(false);
      setEditingGroup(null);
      resetForm();
      loadAttendanceGroups();
    } catch (error) {
      console.error('提交考勤组失败:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      workStartTime: '09:00',
      workEndTime: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      isActive: true
    });
  };

  const handleEdit = (group: AttendanceGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      workStartTime: group.workStartTime,
      workEndTime: group.workEndTime,
      breakStartTime: group.breakStartTime || '12:00',
      breakEndTime: group.breakEndTime || '13:00',
      isActive: group.isActive
    });
    setIsDialogOpen(true);
  };

  const handleView = (group: AttendanceGroup) => {
    setViewingGroup(group);
  };

  const handleDelete = async (groupId: string) => {
    if (window.confirm('确定要删除这个考勤组吗？')) {
      try {
        await attendanceAPI.delete(groupId);
        loadAttendanceGroups();
      } catch (error) {
        console.error('删除考勤组失败:', error);
      }
    }
  };

  const handleManageMembers = (group: AttendanceGroup) => {
    setSelectedGroup(group);
    const currentMembers = groupMembers[group.id] || [];
    setSelectedMembers(currentMembers.map(member => member.id));
    setIsMemberDialogOpen(true);
  };

  const handleSaveMembers = async () => {
    if (!selectedGroup) return;

    try {
      // 先删除现有成员
      await supabase
        .from('attendance_group_members')
        .delete()
        .eq('group_id', selectedGroup.id);

      // 添加新选中的成员
      for (const memberId of selectedMembers) {
        await attendanceAPI.addMember(selectedGroup.id, memberId);
      }

      // 重新加载组成员
      await loadGroupMembers(selectedGroup.id);
      setIsMemberDialogOpen(false);
      setSelectedGroup(null);
      setSelectedMembers([]);
    } catch (error) {
      console.error('保存成员失败:', error);
    }
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const filteredGroups = attendanceGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge className="bg-green-100 text-green-800">启用</Badge> : 
      <Badge className="bg-red-100 text-red-800">禁用</Badge>;
  };

  const getMemberCount = (groupId: string) => {
    return groupMembers[groupId]?.length || 0;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">考勤管理</h1>
          <p className="text-muted-foreground">管理考勤组和成员关联</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingGroup(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              新建考勤组
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? '编辑考勤组' : '新建考勤组'}
              </DialogTitle>
              <DialogDescription>
                请填写考勤组信息
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">考勤组名称 *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="请输入考勤组名称"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="workStartTime">上班时间 *</Label>
                  <Input
                    type="time"
                    value={formData.workStartTime}
                    onChange={(e) => setFormData({...formData, workStartTime: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workEndTime">下班时间 *</Label>
                  <Input
                    type="time"
                    value={formData.workEndTime}
                    onChange={(e) => setFormData({...formData, workEndTime: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="breakStartTime">休息开始时间</Label>
                  <Input
                    type="time"
                    value={formData.breakStartTime}
                    onChange={(e) => setFormData({...formData, breakStartTime: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="breakEndTime">休息结束时间</Label>
                  <Input
                    type="time"
                    value={formData.breakEndTime}
                    onChange={(e) => setFormData({...formData, breakEndTime: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label>启用状态</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">描述</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="请输入考勤组描述"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  {editingGroup ? '更新' : '创建'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索考勤组名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 考勤组列表 */}
      <Card>
        <CardHeader>
          <CardTitle>考勤组列表</CardTitle>
          <CardDescription>
            共 {filteredGroups.length} 个考勤组
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>考勤组名称</TableHead>
                  <TableHead>上班时间</TableHead>
                  <TableHead>下班时间</TableHead>
                  <TableHead>休息时间</TableHead>
                  <TableHead>成员数量</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{group.name}</div>
                        {group.description && (
                          <div className="text-sm text-muted-foreground">{group.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{group.workStartTime}</TableCell>
                    <TableCell>{group.workEndTime}</TableCell>
                    <TableCell>
                      {group.breakStartTime && group.breakEndTime ? 
                        `${group.breakStartTime} - ${group.breakEndTime}` : 
                        '无休息时间'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getMemberCount(group.id)} 人</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(group.isActive)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(group)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageMembers(group)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(group.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      {viewingGroup && (
        <Dialog open={!!viewingGroup} onOpenChange={() => setViewingGroup(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>考勤组详情</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>考勤组名称</Label>
                  <p className="text-sm text-muted-foreground">{viewingGroup.name}</p>
                </div>
                <div>
                  <Label>状态</Label>
                  <div className="mt-1">{getStatusBadge(viewingGroup.isActive)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>上班时间</Label>
                  <p className="text-sm text-muted-foreground">{viewingGroup.workStartTime}</p>
                </div>
                <div>
                  <Label>下班时间</Label>
                  <p className="text-sm text-muted-foreground">{viewingGroup.workEndTime}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>休息开始时间</Label>
                  <p className="text-sm text-muted-foreground">{viewingGroup.breakStartTime || '无'}</p>
                </div>
                <div>
                  <Label>休息结束时间</Label>
                  <p className="text-sm text-muted-foreground">{viewingGroup.breakEndTime || '无'}</p>
                </div>
              </div>
              {viewingGroup.description && (
                <div>
                  <Label>描述</Label>
                  <p className="text-sm text-muted-foreground">{viewingGroup.description}</p>
                </div>
              )}
              <div>
                <Label>成员列表</Label>
                <div className="mt-2 space-y-2">
                  {groupMembers[viewingGroup.id]?.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{member.name}</span>
                      <span className="text-sm text-muted-foreground">({member.employee_id})</span>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">暂无成员</p>}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 成员管理对话框 */}
      {selectedGroup && (
        <StrictDialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
          <StrictDialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>管理考勤组成员 - {selectedGroup.name}</DialogTitle>
              <DialogDescription>
                选择考勤组成员，一个人员只能属于一个考勤组
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded-md p-4 h-96 overflow-y-auto">
                <div className="space-y-2">
                  {allUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        checked={selectedMembers.includes(user.id)}
                        onCheckedChange={() => handleMemberToggle(user.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.employee_id}</div>
                      </div>
                      {user.email && (
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  已选择 {selectedMembers.length} 个成员
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSaveMembers}>
                    保存成员
                  </Button>
                </div>
              </div>
            </div>
          </StrictDialogContent>
        </StrictDialog>
      )}
    </div>
  );
};

export default AttendanceManagement; 