import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, ArrowLeft, User, Briefcase, Calendar, DollarSign, Mail, Phone, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { roleAPI } from '@/services/api';

const Profile = () => {
  const { user, updateProfile, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    employeeId: user?.employee_id || '',
    email: user?.email || '',
    phone: user?.phone || '',
    joinDate: user?.join_date || '',
  });
  
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // 如果未登录，重定向到登录页
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 加载用户角色数据
  const loadUserRoles = async () => {
    if (!user?.id) return;
    
    try {
      const userRolesData = await roleAPI.getUserRoles(user.id);
      setUserRoles(userRolesData.map((ur: any) => ur.role).filter(Boolean));
    } catch (error) {
      console.error('加载用户角色失败:', error);
    }
  };

  // 当用户信息更新时，同步表单数据
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        employeeId: user.employee_id || '',
        email: user.email || '',
        phone: user.phone || '',
        joinDate: user.join_date || '',
      });
      loadUserRoles();
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const success = await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        join_date: formData.joinDate,
      });

      if (success) {
        setSuccess('个人信息更新成功！');
      } else {
        setError('更新失败，请稍后重试');
      }
    } catch (err) {
      setError('更新失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6 theme-transition">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="border-border text-muted-foreground hover:bg-accent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">个人信息</h1>
              <p className="text-muted-foreground mt-1">查看和编辑您的个人资料</p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            退出登录
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 个人信息卡片 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="text-center">
              <Avatar className="h-20 w-20 mx-auto mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-foreground">{user.name || '未设置姓名'}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {user.position?.name || '未设置职位'}
                {user.position?.level && ` (${user.position.level}级)`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">工号</p>
                  <p className="text-foreground font-medium">{user.employee_id || '未设置'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">部门</p>
                  <p className="text-foreground font-medium">
                    {user.primaryDepartment?.name || '未分配'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">入职日期</p>
                  <p className="text-foreground font-medium">{user.join_date || '未设置'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">角色</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {userRoles.length > 0 ? (
                      userRoles.map((role, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {role.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">无角色</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">状态</p>
                <Badge className={user.status === 'active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                  {user.status === 'active' ? '在职' : '离职'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 编辑表单 */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border theme-transition">
              <CardHeader>
                <CardTitle className="text-foreground">编辑个人信息</CardTitle>
                <CardDescription className="text-muted-foreground">
                  更新您的个人资料信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                      <AlertDescription className="text-red-700 dark:text-red-300">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">姓名</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-foreground">电话</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="joinDate" className="text-foreground">入职日期</Label>
                      <Input
                        id="joinDate"
                        type="date"
                        value={formData.joinDate}
                        onChange={(e) => handleInputChange('joinDate', e.target.value)}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/')}
                      className="border-border text-muted-foreground hover:bg-accent"
                    >
                      取消
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          保存更改
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
