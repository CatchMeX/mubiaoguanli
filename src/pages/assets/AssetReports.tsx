import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { 
  Download, 
  FileText, 
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  MapPin,
  Building,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { assetStatistics, assets, assetCategories, assetLocations, departments } from '@/data/mockData';

const AssetReports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

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

  // 位置资产分布数据
  const locationData = assetStatistics.byLocation.map(item => ({
    name: item.location,
    count: item.count,
    value: item.value,
  }));

  // 折旧趋势数据（模拟）
  const depreciationTrendData = [
    { month: '1月', originalValue: 1000000, currentValue: 950000, depreciation: 50000 },
    { month: '2月', originalValue: 1050000, currentValue: 990000, depreciation: 60000 },
    { month: '3月', originalValue: 1100000, currentValue: 1025000, depreciation: 75000 },
    { month: '4月', originalValue: 1150000, currentValue: 1060000, depreciation: 90000 },
    { month: '5月', originalValue: 1200000, currentValue: 1095000, depreciation: 105000 },
    { month: '6月', originalValue: 1250000, currentValue: 1130000, depreciation: 120000 },
    { month: '7月', originalValue: 1300000, currentValue: 1165000, depreciation: 135000 },
    { month: '8月', originalValue: 1350000, currentValue: 1200000, depreciation: 150000 },
    { month: '9月', originalValue: 1400000, currentValue: 1235000, depreciation: 165000 },
    { month: '10月', originalValue: 1450000, currentValue: 1270000, depreciation: 180000 },
    { month: '11月', originalValue: 1500000, currentValue: 1305000, depreciation: 195000 },
    { month: '12月', originalValue: 1550000, currentValue: 1340000, depreciation: 210000 },
  ];

  // 资产增长趋势数据（模拟）
  const growthTrendData = [
    { month: '1月', newAssets: 5, disposedAssets: 1, netGrowth: 4 },
    { month: '2月', newAssets: 3, disposedAssets: 0, netGrowth: 3 },
    { month: '3月', newAssets: 8, disposedAssets: 2, netGrowth: 6 },
    { month: '4月', newAssets: 4, disposedAssets: 1, netGrowth: 3 },
    { month: '5月', newAssets: 6, disposedAssets: 0, netGrowth: 6 },
    { month: '6月', newAssets: 7, disposedAssets: 3, netGrowth: 4 },
    { month: '7月', newAssets: 5, disposedAssets: 1, netGrowth: 4 },
    { month: '8月', newAssets: 9, disposedAssets: 2, netGrowth: 7 },
    { month: '9月', newAssets: 3, disposedAssets: 0, netGrowth: 3 },
    { month: '10月', newAssets: 6, disposedAssets: 1, netGrowth: 5 },
    { month: '11月', newAssets: 4, disposedAssets: 2, netGrowth: 2 },
    { month: '12月', newAssets: 8, disposedAssets: 1, netGrowth: 7 },
  ];

  // 导出报表
  const handleExport = (reportType: string) => {
    console.log('导出报表:', reportType);
  };

  // 展平分类数据
  const flattenCategories = (categories: any[], level = 0): any[] => {
    let result: any[] = [];
    categories.forEach(category => {
      result.push({ ...category, level });
      if (category.children) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(assetCategories);

  // 展平位置数据
  const flattenLocations = (locations: any[], level = 0): any[] => {
    let result: any[] = [];
    locations.forEach(location => {
      result.push({ ...location, level });
      if (location.children) {
        result = result.concat(flattenLocations(location.children, level + 1));
      }
    });
    return result;
  };

  const flatLocations = flattenLocations(assetLocations);

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">统计报表</h1>
            <p className="text-muted-foreground mt-1">资产统计分析和报表导出</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport('summary')}
              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              导出汇总报表
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('detail')}
              className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              导出明细报表
            </Button>
          </div>
        </div>

        {/* 筛选条件 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">筛选条件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="endDate">结束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="category">资产分类</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">全部分类</SelectItem>
                    {flatCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {'  '.repeat(category.level)}{category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">存放地点</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">全部地点</SelectItem>
                    {flatLocations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {'  '.repeat(location.level)}{location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">使用部门</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">全部部门</SelectItem>
                    {departments.map(department => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">资产总数</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{assetStatistics.totalAssets}</div>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                较上月增长 8.2%
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
              <p className="text-xs text-red-600 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                折旧率 {assetStatistics.depreciation.depreciationRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">在用资产</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{assetStatistics.byStatus.in_use}</div>
              <p className="text-xs text-muted-foreground">
                使用率 {((assetStatistics.byStatus.in_use / assetStatistics.totalAssets) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">闲置资产</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{assetStatistics.byStatus.idle}</div>
              <p className="text-xs text-muted-foreground">
                闲置率 {((assetStatistics.byStatus.idle / assetStatistics.totalAssets) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 报表标签页 */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">概览统计</TabsTrigger>
            <TabsTrigger value="distribution" className="data-[state=active]:bg-background">分布分析</TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-background">趋势分析</TabsTrigger>
            <TabsTrigger value="depreciation" className="data-[state=active]:bg-background">折旧分析</TabsTrigger>
          </TabsList>

          {/* 概览统计 */}
          <TabsContent value="overview" className="space-y-6">
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

              {/* 资产分类统计 */}
              <Card className="bg-card border-border theme-transition">
                <CardHeader>
                  <CardTitle className="text-foreground">资产分类统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
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
          </TabsContent>

          {/* 分布分析 */}
          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <Bar dataKey="count" fill="#38bdf8" name="数量" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 位置资产分布 */}
              <Card className="bg-card border-border theme-transition">
                <CardHeader>
                  <CardTitle className="text-foreground">位置资产分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={locationData}>
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
                      <Bar dataKey="count" fill="#f472b6" name="数量" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 趋势分析 */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-card border-border theme-transition">
              <CardHeader>
                <CardTitle className="text-foreground">资产增长趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={growthTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Line type="monotone" dataKey="newAssets" stroke="#10b981" name="新增资产" strokeWidth={2} />
                    <Line type="monotone" dataKey="disposedAssets" stroke="#ef4444" name="处置资产" strokeWidth={2} />
                    <Line type="monotone" dataKey="netGrowth" stroke="#9E7FFF" name="净增长" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 折旧分析 */}
          <TabsContent value="depreciation" className="space-y-6">
            <Card className="bg-card border-border theme-transition">
              <CardHeader>
                <CardTitle className="text-foreground">资产折旧趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={depreciationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => [`¥${(value / 10000).toFixed(1)}万`, '']}
                    />
                    <Area type="monotone" dataKey="originalValue" stackId="1" stroke="#9E7FFF" fill="#9E7FFF" name="原值" />
                    <Area type="monotone" dataKey="depreciation" stackId="2" stroke="#ef4444" fill="#ef4444" name="累计折旧" />
                    <Line type="monotone" dataKey="currentValue" stroke="#10b981" strokeWidth={2} name="净值" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 折旧统计表 */}
            <Card className="bg-card border-border theme-transition">
              <CardHeader>
                <CardTitle className="text-foreground">折旧统计汇总</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      ¥{(assetStatistics.depreciation.totalOriginalValue / 10000).toFixed(1)}万
                    </div>
                    <p className="text-sm text-muted-foreground">资产原值</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      ¥{(assetStatistics.depreciation.totalDepreciation / 10000).toFixed(1)}万
                    </div>
                    <p className="text-sm text-muted-foreground">累计折旧</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ¥{(assetStatistics.depreciation.currentValue / 10000).toFixed(1)}万
                    </div>
                    <p className="text-sm text-muted-foreground">资产净值</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {assetStatistics.depreciation.depreciationRate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">折旧率</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AssetReports;
