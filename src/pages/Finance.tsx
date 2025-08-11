import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Receipt,
  CreditCard,
  Building,
  FileText,
  BarChart3,
  PieChart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
} from 'lucide-react';
import CostManagement from './finance/CostManagement';
import RevenueManagement from './finance/RevenueManagement';
import ExpenseManagement from './finance/ExpenseManagement';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // 模拟财务数据
  const financialData = {
    overview: {
      totalRevenue: 2550000,
      totalExpense: 103600,
      totalCost: 1850000,
      netProfit: 596400,
      profitMargin: 23.4,
      cashFlow: 450000,
    },
    monthlyTrends: [
      { month: '10月', revenue: 200000, expense: 0, cost: 150000, profit: 50000 },
      { month: '11月', revenue: 900000, expense: 13600, cost: 650000, profit: 236400 },
      { month: '12月', revenue: 1450000, expense: 90000, cost: 1050000, profit: 310000 },
    ],
    alerts: [
      { type: 'warning', message: '小米培训项目收款已逾期', category: 'revenue' },
      { type: 'error', message: '通讯费用付款已逾期', category: 'expense' },
      { type: 'info', message: '12月份营销成本超出预算10%', category: 'cost' },
      { type: 'success', message: '本季度利润率达到预期目标', category: 'profit' },
    ],
    quickStats: {
      pendingRevenue: 1150000,
      pendingExpense: 82400,
      monthlyBudget: 2000000,
      budgetUsed: 75.5,
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">财务管理</h1>
            <p className="text-muted-foreground mt-1">管理收入、费用、成本和财务分析</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              财务报表
            </Button>
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              数据分析
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">财务概览</TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-background">收入管理</TabsTrigger>
            <TabsTrigger value="expense" className="data-[state=active]:bg-background">费用管理</TabsTrigger>
            <TabsTrigger value="cost" className="data-[state=active]:bg-background">成本管理</TabsTrigger>
          </TabsList>

          {/* 财务概览 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 核心指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card border-border theme-transition">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">总收入</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">¥{financialData.overview.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">+12.5%</span> 较上月
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border theme-transition">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">总费用</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">¥{financialData.overview.totalExpense.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-red-500">+561.8%</span> 较上月
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border theme-transition">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">经营成本</CardTitle>
                  <Calculator className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">¥{financialData.overview.totalCost.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-orange-500">+8.3%</span> 较上月
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border theme-transition">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">净利润</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">¥{financialData.overview.netProfit.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    利润率 <span className="text-blue-500">{financialData.overview.profitMargin}%</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 快速统计和预警 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 快速统计 */}
              <Card className="bg-card border-border theme-transition">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    快速统计
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">待收款金额</span>
                    <span className="font-semibold text-foreground">¥{financialData.quickStats.pendingRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">待付款金额</span>
                    <span className="font-semibold text-foreground">¥{financialData.quickStats.pendingExpense.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">月度预算</span>
                    <span className="font-semibold text-foreground">¥{financialData.quickStats.monthlyBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">预算使用率</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-foreground">{financialData.quickStats.budgetUsed}%</span>
                      <Badge className={financialData.quickStats.budgetUsed > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {financialData.quickStats.budgetUsed > 80 ? '超预警' : '正常'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 财务预警 */}
              <Card className="bg-card border-border theme-transition">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    财务预警
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {financialData.alerts.map((alert, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getAlertStyle(alert.type)}`}>
                      <div className="flex items-start space-x-2">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{alert.message}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {alert.category === 'revenue' ? '收入' : 
                             alert.category === 'expense' ? '费用' : 
                             alert.category === 'cost' ? '成本' : '利润'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* 月度趋势 */}
            <Card className="bg-card border-border theme-transition">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  月度财务趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData.monthlyTrends.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-4 p-4 bg-accent rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">月份</p>
                        <p className="font-medium text-foreground">{item.month}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">收入</p>
                        <p className="font-medium text-green-600">¥{item.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">费用</p>
                        <p className="font-medium text-red-600">¥{item.expense.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">成本</p>
                        <p className="font-medium text-orange-600">¥{item.cost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">利润</p>
                        <p className="font-medium text-blue-600">¥{item.profit.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card className="bg-card border-border theme-transition">
              <CardHeader>
                <CardTitle className="text-foreground">快速操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setActiveTab('revenue')}
                  >
                    <Receipt className="h-6 w-6" />
                    <span>新增收入</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setActiveTab('expense')}
                  >
                    <CreditCard className="h-6 w-6" />
                    <span>新增费用</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setActiveTab('cost')}
                  >
                    <Building className="h-6 w-6" />
                    <span>记录成本</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <PieChart className="h-6 w-6" />
                    <span>财务报表</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 收入管理 */}
          <TabsContent value="revenue">
            <RevenueManagement />
          </TabsContent>

          {/* 费用管理 */}
          <TabsContent value="expense">
            <ExpenseManagement />
          </TabsContent>

          {/* 成本管理 */}
          <TabsContent value="cost">
            <CostManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Finance;
