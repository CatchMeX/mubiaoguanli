import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Package,
  Building2,
  Truck,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Settings,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { assetStatistics, assets, maintenancePlans, inventoryPlans } from '@/data/mockData';

const AssetManagement = () => {
  const navigate = useNavigate();

  // 资产状态分布数据
  const statusData = [
    { name: '在用', value: assetStatistics.byStatus.in_use, color: '#10b981' },
    { name: '闲置', value: assetStatistics.byStatus.idle, color: '#f59e0b' },
    { name: '维修', value: assetStatistics.byStatus.maintenance, color: '#ef4444' },
    { name: '报废', value: assetStatistics.byStatus.scrapped, color: '#6b7280' },
    { name: '处置', value: assetStatistics.byStatus.disposed, color: '#8b5cf6' },
  ];

  // 资产分类分布数据
  const categoryData = assetStatistics.byCategory.map(item => ({
    name: item.category,
    count: item.count,
    value: item.value,
  }));

  // 部门资产分布数据
  const departmentData = assetStatistics.byDepartment.map(item => ({
    name: item.department,
    count: item.count,
    value: item.value,
  }));

  // 即将到期的维保计划
  const upcomingMaintenance = maintenancePlans.filter(plan => {
    const nextDate = new Date(plan.nextDate);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  });

  // 进行中的盘点计划
  const activeInventory = inventoryPlans.filter(plan => plan.status === 'in_progress');

  // 快速操作
  const quickActions = [
    { icon: Plus, label: '新增资产', path: '/assets/list', color: 'bg-blue-600' },
    { icon: Package, label: '资产变动', path: '/assets/movements', color: 'bg-green-600' },
    { icon: Settings, label: '维保管理', path: '/assets/maintenance', color: 'bg-orange-600' },
    { icon: FileText, label: '资产盘点', path: '/assets/inventory', color: 'bg-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">资产管理</h1>
            <p className="text-muted-foreground mt-1">全生命周期资产管理系统</p>
          </div>
          <Button 
            onClick={() => navigate('/assets/reports')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <FileText className="mr-2 h-4 w-4" />
            查看报表
          </Button>
        </div>

        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">资产总数</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{assetStatistics.totalAssets}</div>
              <p className="text-xs text-muted-foreground">
                在用 {assetStatistics.byStatus.in_use} 台
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">资产总值</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{(assetStatistics.totalValue / 10000).toFixed(1)}万
              </div>
              <p className="text-xs text-muted-foreground">
                折旧率 {assetStatistics.depreciation.depreciationRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">待维保资产</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{upcomingMaintenance.length}</div>
              <p className="text-xs text-orange-500">30天内需要维保</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">进行中盘点</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{activeInventory.length}</div>
              <p className="text-xs text-blue-500">盘点计划执行中</p>
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 资产状态分布 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader>
              <CardTitle className="text-foreground">资产状态分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 部门资产分布 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader>
              <CardTitle className="text-foreground">部门资产分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="count" fill="#9E7FFF" name="数量" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作和提醒 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 快速操作 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader>
              <CardTitle className="text-foreground">快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <Button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className={`${action.color} hover:opacity-90 text-white h-20 flex flex-col items-center justify-center space-y-2`}
                  >
                    <action.icon className="h-6 w-6" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 维保提醒 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader>
              <CardTitle className="text-foreground">维保提醒</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingMaintenance.length > 0 ? (
                  upcomingMaintenance.map((plan) => {
                    const nextDate = new Date(plan.nextDate);
                    const today = new Date();
                    const diffTime = nextDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={plan.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{plan.asset.name}</p>
                            <p className="text-xs text-muted-foreground">{plan.planName}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-orange-500 text-orange-500">
                          {diffDays}天后
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">暂无即将到期的维保计划</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 资产分类统计 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">资产分类统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="text-foreground font-medium">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.count} 台资产
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      ¥{(category.value / 10000).toFixed(1)}万
                    </p>
                    <p className="text-xs text-muted-foreground">
                      占比 {((category.value / assetStatistics.totalValue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetManagement;
