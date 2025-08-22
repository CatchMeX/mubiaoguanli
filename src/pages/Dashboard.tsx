import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, TrendingUp, DollarSign, Car, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import api from '@/services/api';
import type { Team } from '@/types';

const Dashboard = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState({
    averageVehicleRevenue: 0,
    averageRevenueGMV: 0,
    averageTurnoverRate: 0,
  });
  const [chartData, setChartData] = useState<{
    teamTurnoverRate: Array<{ name: string; value: number }>;
    teamAverageOrderRevenue: Array<{ name: string; value: number }>;
    teamAverageVehicleRevenue: Array<{ name: string; value: number }>;
    weatherOrderDistribution: Array<{ name: string; value: number }>;
  }>({
    teamTurnoverRate: [],
    teamAverageOrderRevenue: [],
    teamAverageVehicleRevenue: [],
    weatherOrderDistribution: [],
  });
  const [barChartData, setBarChartData] = useState<{
    personnelSituation: Array<{ name: string; averageMoveCar: number; averageBatterySwap: number }>;
    refundTotals: Array<{ name: string; averageRefund: number }>;
  }>({
    personnelSituation: [],
    refundTotals: [],
  });
  const [tableData, setTableData] = useState<{
    dailySummary: Array<{
      date: string;
      totalVehicles: number;
      operatingVehicles: number;
      batterySwaps: number;
      dailyMovedVehicles: number;
      averageMovesPerPerson: number;
      averageSwapsPerPerson: number;
      batteryStaff: number;
      dispatchStaff: number;
      patrolStaff: number;
      assistantStaff: number;
      cleanedVehicles: number;
      idleVehicles24hPlus: number;
      scrappedVehicles: number;
      expanded: boolean;
      teamDetails: Array<{
        teamName: string;
        totalVehicles: number;
        operatingVehicles: number;
        batterySwaps: number;
        dailyMovedVehicles: number;
        averageMovesPerPerson: number;
        averageSwapsPerPerson: number;
        batteryStaff: number;
        dispatchStaff: number;
        patrolStaff: number;
        assistantStaff: number;
        cleanedVehicles: number;
        idleVehicles24hPlus: number;
        scrappedVehicles: number;
      }>;
    }>;
  }>({
    dailySummary: [],
  });
  const [outputTableData, setOutputTableData] = useState<{
    dailySummary: Array<{
      date: string;
      revenueGMV: number;
      dailyTurnoverRate: number;
      averageOrderRevenue: number;
      averageVehicleRevenue: number;
      expanded: boolean;
      teamDetails: Array<{
        teamName: string;
        revenueGMV: number;
        dailyTurnoverRate: number;
        averageOrderRevenue: number;
        averageVehicleRevenue: number;
      }>;
    }>;
  }>({
    dailySummary: [],
  });
  const [lineChartData, setLineChartData] = useState<Array<{
    date: string;
    averageVehicleRevenue: number;
    revenueGMV: number;
    dailyTurnoverRate: number;
    dailyOrders: number;
  }>>([]);
  const [turnoverRateByCityData, setTurnoverRateByCityData] = useState<Array<{
    date: string;
    [city: string]: number | string | null;
  }>>([]);

  // 生成年份选项（当前年份往前5年）
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() + '年' };
  });

  // 生成月份选项
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return { value: month, label: month + '月' };
  });

  // 饼图颜色配置
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

  // 加载团队数据
  useEffect(() => {
    loadTeams();
  }, []);

  // 加载统计数据
  useEffect(() => {
    if (teams.length > 0) {
      loadStatistics();
    }
  }, [teams, selectedTeam, selectedYear, selectedMonth]);

  const loadTeams = async () => {
    try {
      const data = await api.team.getAll();
      setTeams(data || []);
    } catch (err) {
      console.error('加载团队数据失败:', err);
      setTeams([]);
    }
  };

  const loadTurnoverRateByCity = async (startDate: string, endDate: string) => {
    try {
      const data = await api.rideSharing.getTurnoverRateByCity(startDate, endDate);
      console.log('API返回的健康车周转率数据:', data);
      setTurnoverRateByCityData(data);
    } catch (err) {
      console.error('加载健康车周转率数据失败:', err);
      setTurnoverRateByCityData([]);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // 构建日期范围
      const startDate = `${selectedYear}-${selectedMonth}-01`;
      const endDate = `${selectedYear}-${selectedMonth}-${new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate()}`;

      console.log('加载统计数据:', { selectedTeam, startDate, endDate });

      // 获取所有日报数据（用于图表）
      let allReports;
      if (selectedTeam === 'all') {
        allReports = await api.rideSharing.getDailyReportsByDateRange(startDate, endDate);
      } else {
        const teamReports = await api.rideSharing.getDailyReportsByTeam(selectedTeam);
        allReports = teamReports.filter(report => 
          report.report_date >= startDate && report.report_date <= endDate
        );
      }

      console.log('获取到的日报数据:', allReports);

      if (allReports.length === 0) {
        setStatistics({
          averageVehicleRevenue: 0,
          averageRevenueGMV: 0,
          averageTurnoverRate: 0,
        });
        setChartData({
          teamTurnoverRate: [],
          teamAverageOrderRevenue: [],
          teamAverageVehicleRevenue: [],
          weatherOrderDistribution: [],
        });
        setBarChartData({
          personnelSituation: [],
          refundTotals: [],
        });
        setTableData({
          dailySummary: [],
        });
        setOutputTableData({
          dailySummary: [],
        });
        setLineChartData([]);
        return;
      }

      // 计算基础统计数据
      const totalVehicleRevenue = allReports.reduce((sum, report) => sum + report.average_vehicle_revenue, 0);
      const totalRevenueGMV = allReports.reduce((sum, report) => sum + report.revenue_gmv, 0);
      const totalTurnoverRate = allReports.reduce((sum, report) => sum + report.daily_turnover_rate, 0);

      setStatistics({
        averageVehicleRevenue: totalVehicleRevenue / allReports.length,
        averageRevenueGMV: totalRevenueGMV / allReports.length,
        averageTurnoverRate: totalTurnoverRate / allReports.length,
      });

      // 计算各种图表数据
      calculateChartData(allReports);
      calculateBarChartData(allReports);
      calculateTableData(allReports);
      calculateOutputTableData(allReports);
      calculateLineChartData(allReports);

      // 加载健康车周转率数据
      await loadTurnoverRateByCity(startDate, endDate);

    } catch (err) {
      setError(err instanceof Error ? err.message : '加载统计数据失败');
      console.error('加载统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateChartData = (reports: any[]) => {
    // 1. 按团队计算平均当日周转率
    const teamTurnoverData = new Map();
    reports.forEach(report => {
      const teamName = teams.find(t => t.id === report.team_id)?.name || '未知团队';
      if (!teamTurnoverData.has(teamName)) {
        teamTurnoverData.set(teamName, { count: 0, total: 0 });
      }
      const data = teamTurnoverData.get(teamName);
      data.count++;
      data.total += report.daily_turnover_rate;
    });

    const teamTurnoverRate = Array.from(teamTurnoverData.entries()).map(([name, data]: [string, any]) => ({
      name,
      value: data.total / data.count,
    }));

    // 2. 按团队计算平均收入单均
    const teamOrderRevenueData = new Map();
    reports.forEach(report => {
      const teamName = teams.find(t => t.id === report.team_id)?.name || '未知团队';
      if (!teamOrderRevenueData.has(teamName)) {
        teamOrderRevenueData.set(teamName, { count: 0, total: 0 });
      }
      const data = teamOrderRevenueData.get(teamName);
      data.count++;
      data.total += report.average_order_revenue;
    });

    const teamAverageOrderRevenue = Array.from(teamOrderRevenueData.entries()).map(([name, data]: [string, any]) => ({
      name,
      value: data.total / data.count,
    }));

    // 3. 按团队计算平均车均收入
    const teamVehicleRevenueData = new Map();
    reports.forEach(report => {
      const teamName = teams.find(t => t.id === report.team_id)?.name || '未知团队';
      if (!teamVehicleRevenueData.has(teamName)) {
        teamVehicleRevenueData.set(teamName, { count: 0, total: 0 });
      }
      const data = teamVehicleRevenueData.get(teamName);
      data.count++;
      data.total += report.average_vehicle_revenue;
    });

    const teamAverageVehicleRevenue = Array.from(teamVehicleRevenueData.entries()).map(([name, data]: [string, any]) => ({
      name,
      value: data.total / data.count,
    }));

    // 4. 按天气计算平均当日订单量
    const weatherOrderData = new Map();
    reports.forEach(report => {
      const weather = report.weather || '未知天气';
      if (!weatherOrderData.has(weather)) {
        weatherOrderData.set(weather, { count: 0, total: 0 });
      }
      const data = weatherOrderData.get(weather);
      data.count++;
      data.total += report.daily_orders;
    });

    const weatherOrderDistribution = Array.from(weatherOrderData.entries()).map(([name, data]: [string, any]) => ({
      name,
      value: data.total / data.count,
    }));

    setChartData({
      teamTurnoverRate,
      teamAverageOrderRevenue,
      teamAverageVehicleRevenue,
      weatherOrderDistribution,
    });

    // 计算柱状图数据
    calculateBarChartData(reports);
  };

  const calculateBarChartData = (reports: any[]) => {
    // 1. 人员情况/月 - 按团队计算平均人均挪车和平均人均换电
    const personnelData = new Map();
    reports.forEach(report => {
      const teamName = teams.find(t => t.id === report.team_id)?.name || '未知团队';
      if (!personnelData.has(teamName)) {
        personnelData.set(teamName, { 
          count: 0, 
          totalMoveCar: 0, 
          totalBatterySwap: 0 
        });
      }
      const data = personnelData.get(teamName);
      data.count++;
      data.totalMoveCar += report.average_moves_per_person || 0;
      data.totalBatterySwap += report.average_swaps_per_person || 0;
    });

    const personnelSituation = Array.from(personnelData.entries()).map(([name, data]: [string, any]) => ({
      name,
      averageMoveCar: data.totalMoveCar / data.count,
      averageBatterySwap: data.totalBatterySwap / data.count,
    }));

    // 2. 退款合计/月 - 按团队计算平均退款金额
    const refundData = new Map();
    reports.forEach(report => {
      const teamName = teams.find(t => t.id === report.team_id)?.name || '未知团队';
      if (!refundData.has(teamName)) {
        refundData.set(teamName, { count: 0, total: 0 });
      }
      const data = refundData.get(teamName);
      data.count++;
      data.total += report.refund_amount || 0;
    });

    const refundTotals = Array.from(refundData.entries()).map(([name, data]: [string, any]) => ({
      name,
      averageRefund: data.total / data.count,
    }));

    setBarChartData({
      personnelSituation,
      refundTotals,
    });

    // 计算表格数据
    calculateTableData(reports);
  };

  const calculateTableData = (reports: any[]) => {
    // 按日期分组数据
    const dailyData = new Map();
    
    reports.forEach(report => {
      const date = report.report_date;
      const teamName = teams.find(t => t.id === report.team_id)?.name || '未知团队';
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          totalVehicles: 0,
          operatingVehicles: 0,
          batterySwaps: 0,
          dailyMovedVehicles: 0,
          averageMovesPerPerson: 0,
          averageSwapsPerPerson: 0,
          batteryStaff: 0,
          dispatchStaff: 0,
          patrolStaff: 0,
          assistantStaff: 0,
          cleanedVehicles: 0,
          idleVehicles24hPlus: 0,
          scrappedVehicles: 0,
          teamCount: 0,
          teamDetails: []
        });
      }
      
      const daily = dailyData.get(date);
      daily.totalVehicles += report.total_vehicles || 0;
      daily.operatingVehicles += report.operating_vehicles || 0;
      daily.batterySwaps += report.battery_swaps || 0;
      daily.dailyMovedVehicles += report.daily_moved_vehicles || 0;
      daily.averageMovesPerPerson += report.average_moves_per_person || 0;
      daily.averageSwapsPerPerson += report.average_swaps_per_person || 0;
      daily.batteryStaff += report.battery_staff || 0;
      daily.dispatchStaff += report.dispatch_staff || 0;
      daily.patrolStaff += report.patrol_staff || 0;
      daily.assistantStaff += report.assistant_staff || 0;
      daily.cleanedVehicles += report.cleaned_vehicles || 0;
      daily.idleVehicles24hPlus += report.idle_vehicles_24h_plus || 0;
      daily.scrappedVehicles += report.scrapped_vehicles || 0;
      daily.teamCount++;
      
      // 添加团队详情
      daily.teamDetails.push({
        teamName,
        totalVehicles: report.total_vehicles || 0,
        operatingVehicles: report.operating_vehicles || 0,
        batterySwaps: report.battery_swaps || 0,
        dailyMovedVehicles: report.daily_moved_vehicles || 0,
        averageMovesPerPerson: report.average_moves_per_person || 0,
        averageSwapsPerPerson: report.average_swaps_per_person || 0,
        batteryStaff: report.battery_staff || 0,
        dispatchStaff: report.dispatch_staff || 0,
        patrolStaff: report.patrol_staff || 0,
        assistantStaff: report.assistant_staff || 0,
        cleanedVehicles: report.cleaned_vehicles || 0,
        idleVehicles24hPlus: report.idle_vehicles_24h_plus || 0,
        scrappedVehicles: report.scrapped_vehicles || 0,
      });
    });
    
    // 计算平均值并转换为数组
    const dailySummary = Array.from(dailyData.values()).map(daily => ({
      date: daily.date,
      totalVehicles: daily.totalVehicles,
      operatingVehicles: daily.operatingVehicles,
      batterySwaps: daily.batterySwaps,
      dailyMovedVehicles: daily.dailyMovedVehicles,
      averageMovesPerPerson: daily.teamCount > 0 ? daily.averageMovesPerPerson / daily.teamCount : 0,
      averageSwapsPerPerson: daily.teamCount > 0 ? daily.averageSwapsPerPerson / daily.teamCount : 0,
      batteryStaff: daily.batteryStaff,
      dispatchStaff: daily.dispatchStaff,
      patrolStaff: daily.patrolStaff,
      assistantStaff: daily.assistantStaff,
      cleanedVehicles: daily.cleanedVehicles,
      idleVehicles24hPlus: daily.idleVehicles24hPlus,
      scrappedVehicles: daily.scrappedVehicles,
      expanded: false,
      teamDetails: daily.teamDetails
    }));
    
    // 按日期排序
    dailySummary.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setTableData({ dailySummary });

    // 计算产出表格数据
    calculateOutputTableData(reports);
  };

  const calculateOutputTableData = (reports: any[]) => {
    // 按日期分组
    const dailyGroups = reports.reduce((groups, report) => {
      const date = report.report_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(report);
      return groups;
    }, {});

    // 计算每日汇总数据
    const dailySummary = Object.entries(dailyGroups).map(([date, dayReports]: [string, any]) => {
      const reports = dayReports as any[];
      const totalRevenueGMV = reports.reduce((sum, report) => sum + report.revenue_gmv, 0);
      const totalTurnoverRate = reports.reduce((sum, report) => sum + report.daily_turnover_rate, 0);
      const totalOrderRevenue = reports.reduce((sum, report) => sum + report.average_order_revenue, 0);
      const totalVehicleRevenue = reports.reduce((sum, report) => sum + report.average_vehicle_revenue, 0);

      const teamDetails = reports.map(report => ({
        teamName: report.team_name || '未知团队',
        revenueGMV: report.revenue_gmv,
        dailyTurnoverRate: report.daily_turnover_rate,
        averageOrderRevenue: report.average_order_revenue,
        averageVehicleRevenue: report.average_vehicle_revenue,
      }));

      return {
        date,
        revenueGMV: totalRevenueGMV,
        dailyTurnoverRate: totalTurnoverRate / reports.length,
        averageOrderRevenue: totalOrderRevenue / reports.length,
        averageVehicleRevenue: totalVehicleRevenue / reports.length,
        expanded: false,
        teamDetails,
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setOutputTableData({ dailySummary });
  };

  const calculateLineChartData = (reports: any[]) => {
    // 按日期分组并计算每日平均值
    const dailyGroups = reports.reduce((groups, report) => {
      const date = report.report_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(report);
      return groups;
    }, {});

    // 计算每日汇总数据
    const lineData = Object.entries(dailyGroups).map(([date, dayReports]: [string, any]) => {
      const reports = dayReports as any[];
      const totalVehicleRevenue = reports.reduce((sum, report) => sum + report.average_vehicle_revenue, 0);
      const totalRevenueGMV = reports.reduce((sum, report) => sum + report.revenue_gmv, 0);
      const totalTurnoverRate = reports.reduce((sum, report) => sum + report.daily_turnover_rate, 0);
      const totalOrders = reports.reduce((sum, report) => sum + report.daily_orders, 0);

      return {
        date,
        averageVehicleRevenue: totalVehicleRevenue / reports.length,
        revenueGMV: totalRevenueGMV,
        dailyTurnoverRate: totalTurnoverRate / reports.length,
        dailyOrders: totalOrders,
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setLineChartData(lineData);
  };

  const handleRefresh = () => {
    loadStatistics();
  };

  const handleToggleExpand = (date: string) => {
    setTableData(prev => ({
      dailySummary: prev.dailySummary.map(item => 
        item.date === date ? { ...item, expanded: !item.expanded } : item
      )
    }));
  };

  const handleToggleOutputExpand = (date: string) => {
    setOutputTableData(prev => ({
      dailySummary: prev.dailySummary.map(item => 
        item.date === date ? { ...item, expanded: !item.expanded } : item
      )
    }));
  };

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-blue-600">{`数值: ${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  const LineChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      let unit = '';
      
      // 根据数据键添加单位
      switch (entry.dataKey) {
        case 'averageVehicleRevenue':
          unit = '元';
          break;
        case 'revenueGMV':
          unit = '元';
          break;
        case 'dailyTurnoverRate':
          unit = '%';
          break;
        case 'dailyOrders':
          unit = '单';
          break;
        default:
          unit = '';
      }
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`日期: ${label}`}</p>
          <p style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toFixed(2)}${unit}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">共享出行统计看板</h1>
            <p className="text-muted-foreground mt-1">实时监控共享出行业务数据</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        {/* 筛选条件 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">筛选条件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">团队：</span>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="选择团队" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部团队</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">年份：</span>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择年份" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">月份：</span>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择月份" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleRefresh} variant="outline">
                刷新数据
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 统计指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 车均收入 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">车均收入</CardTitle>
              <Car className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{loading ? '...' : statistics.averageVehicleRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                平均每辆车的收入
              </p>
            </CardContent>
          </Card>

          {/* 营收统计（GMV） */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">营收统计（GMV）</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ¥{loading ? '...' : statistics.averageRevenueGMV.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                平均每日营收GMV
              </p>
            </CardContent>
          </Card>

          {/* 当日周转率 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">当日周转率</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loading ? '...' : statistics.averageTurnoverRate.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                平均每日周转率
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 饼图模块 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. 健康车周转率 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">健康车周转率</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={chartData.teamTurnoverRate}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    >
                      {chartData.teamTurnoverRate.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 2. 车均单价 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">车均单价</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={chartData.teamAverageOrderRevenue}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ¥${value.toFixed(2)}`}
                    >
                      {chartData.teamAverageOrderRevenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 3. 车均收入 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">车均收入</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={chartData.teamAverageVehicleRevenue}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ¥${value.toFixed(2)}`}
                    >
                      {chartData.teamAverageVehicleRevenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 4. 有效订单分布 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">有效订单分布</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={chartData.weatherOrderDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(0)}单`}
                    >
                      {chartData.weatherOrderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 柱状图模块 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. 人员情况/月 - 双柱状图 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader>
              <CardTitle className="text-foreground">人员情况/月</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart 
                    data={barChartData.personnelSituation}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    barGap={8}
                    barCategoryGap={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      label={{ 
                        value: '人均挪车/人均换电', 
                        angle: -90, 
                        position: 'insideLeft', 
                        fill: '#374151',
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#F9FAFB' }}
                    />
                    <Bar 
                      dataKey="averageMoveCar" 
                      name="平均人均挪车" 
                      fill="#3B82F6" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="averageBatterySwap" 
                      name="平均人均换电" 
                      fill="#10B981" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 2. 退款合计/月 - 单柱状图 */}
          <Card className="bg-card border-border theme-transition">
            <CardHeader>
              <CardTitle className="text-foreground">退款合计/月</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart 
                    data={barChartData.refundTotals}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    barCategoryGap={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      label={{ 
                        value: '退款金额', 
                        angle: -90, 
                        position: 'insideLeft', 
                        fill: '#374151',
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar 
                      dataKey="averageRefund" 
                      name="平均退款金额" 
                      radius={[4, 4, 0, 0]}
                    >
                      {barChartData.refundTotals.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 车辆&人员情况报表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">车辆&人员情况</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-600 hover:bg-blue-600">
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">日期</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">总车辆数</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">实际运营车辆</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">换电量</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">日挪车量</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">人均挪车</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">人均换电</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">换电人数</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">调度人数</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">巡街人数</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">助理人数</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">车辆清洗</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">24小时及以上闲置</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">报废车</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.dailySummary.map((daily, index) => (
                      <>
                        <TableRow 
                          key={daily.date} 
                          className={index % 2 === 0 ? "bg-white text-blue-900" : "bg-blue-50 text-blue-900"}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleExpand(daily.date)}
                                className="text-blue-900 hover:text-blue-700 hover:bg-transparent mr-2"
                              >
                                {daily.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                              {daily.date}
                            </div>
                          </TableCell>
                          <TableCell>{daily.totalVehicles}</TableCell>
                          <TableCell>{daily.operatingVehicles}</TableCell>
                          <TableCell>{daily.batterySwaps}</TableCell>
                          <TableCell>{daily.dailyMovedVehicles}</TableCell>
                          <TableCell>{daily.averageMovesPerPerson.toFixed(2)}</TableCell>
                          <TableCell>{daily.averageSwapsPerPerson.toFixed(2)}</TableCell>
                          <TableCell>{daily.batteryStaff}</TableCell>
                          <TableCell>{daily.dispatchStaff}</TableCell>
                          <TableCell>{daily.patrolStaff}</TableCell>
                          <TableCell>{daily.assistantStaff}</TableCell>
                          <TableCell>{daily.cleanedVehicles}</TableCell>
                          <TableCell>{daily.idleVehicles24hPlus}</TableCell>
                          <TableCell>{daily.scrappedVehicles}</TableCell>
                        </TableRow>
                        {daily.expanded && daily.teamDetails.map((team, teamIndex) => (
                          <TableRow 
                            key={`${daily.date}-${team.teamName}`} 
                            className={teamIndex % 2 === 0 ? "bg-gray-50 text-gray-700" : "bg-gray-100 text-gray-700"}
                          >
                            <TableCell className="pl-8 font-medium">{team.teamName}</TableCell>
                            <TableCell>{team.totalVehicles}</TableCell>
                            <TableCell>{team.operatingVehicles}</TableCell>
                            <TableCell>{team.batterySwaps}</TableCell>
                            <TableCell>{team.dailyMovedVehicles}</TableCell>
                            <TableCell>{team.averageMovesPerPerson.toFixed(2)}</TableCell>
                            <TableCell>{team.averageSwapsPerPerson.toFixed(2)}</TableCell>
                            <TableCell>{team.batteryStaff}</TableCell>
                            <TableCell>{team.dispatchStaff}</TableCell>
                            <TableCell>{team.patrolStaff}</TableCell>
                            <TableCell>{team.assistantStaff}</TableCell>
                            <TableCell>{team.cleanedVehicles}</TableCell>
                            <TableCell>{team.idleVehicles24hPlus}</TableCell>
                            <TableCell>{team.scrappedVehicles}</TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 城市&产出情况报表 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">城市&产出情况</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-600 hover:bg-blue-600">
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">日期</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">营收统计（GMV）</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">当日周转率</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">收入单均</TableHead>
                      <TableHead className="text-white font-bold text-base text-center hover:bg-blue-600">车均收入</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outputTableData.dailySummary.map((daily, index) => (
                      <>
                        <TableRow 
                          key={daily.date} 
                          className={index % 2 === 0 ? "bg-white text-blue-900" : "bg-blue-50 text-blue-900"}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleOutputExpand(daily.date)}
                                className="text-blue-900 hover:text-blue-700 hover:bg-transparent mr-2"
                              >
                                {daily.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                              {daily.date}
                            </div>
                          </TableCell>
                          <TableCell>¥{daily.revenueGMV.toFixed(2)}</TableCell>
                          <TableCell>{daily.dailyTurnoverRate.toFixed(2)}%</TableCell>
                          <TableCell>¥{daily.averageOrderRevenue.toFixed(2)}</TableCell>
                          <TableCell>¥{daily.averageVehicleRevenue.toFixed(2)}</TableCell>
                        </TableRow>
                        {daily.expanded && daily.teamDetails.map((team, teamIndex) => (
                          <TableRow 
                            key={`${daily.date}-${team.teamName}`} 
                            className={teamIndex % 2 === 0 ? "bg-gray-50 text-gray-700" : "bg-gray-100 text-gray-700"}
                          >
                            <TableCell className="pl-8 font-medium">{team.teamName}</TableCell>
                            <TableCell>¥{team.revenueGMV.toFixed(2)}</TableCell>
                            <TableCell>{team.dailyTurnoverRate.toFixed(2)}%</TableCell>
                            <TableCell>¥{team.averageOrderRevenue.toFixed(2)}</TableCell>
                            <TableCell>¥{team.averageVehicleRevenue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 车均/营收（日）折线图模块 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">车均/营收（日）</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-0">
                {/* 1. 车均收入 */}
                <div className="border-b border-gray-300 pb-4">
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        hide={true}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        domain={[0, 'dataMax + 5']}
                        allowDataOverflow={false}
                        tickCount={4}
                        tickFormatter={(value) => Math.round(value).toString()}
                        label={{ 
                          value: '车均收入', 
                          angle: -90, 
                          position: 'insideLeft', 
                          fill: '#374151',
                          style: { textAnchor: 'middle', fontSize: 12 }
                        }}
                      />
                      <Tooltip content={<LineChartTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="averageVehicleRevenue" 
                        name="车均收入"
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 2. 营收统计（GMV） */}
                <div className="border-b border-gray-300 pb-4">
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        hide={true}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        domain={[0, 'dataMax + 10000']}
                        allowDataOverflow={false}
                        tickCount={4}
                        tickFormatter={(value) => Math.round(value).toString()}
                        label={{ 
                          value: '营收统计', 
                          angle: -90, 
                          position: 'insideLeft', 
                          fill: '#374151',
                          style: { textAnchor: 'middle', fontSize: 12 }
                        }}
                      />
                      <Tooltip content={<LineChartTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="revenueGMV" 
                        name="营收统计(GMV)"
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 3. 当日周转率 */}
                <div className="border-b border-gray-300 pb-4">
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        hide={true}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        domain={[0, 'dataMax + 1']}
                        allowDataOverflow={false}
                        tickCount={4}
                        tickFormatter={(value) => Math.round(value).toString()}
                        label={{ 
                          value: '当日周转率', 
                          angle: -90, 
                          position: 'insideLeft', 
                          fill: '#374151',
                          style: { textAnchor: 'middle', fontSize: 12 }
                        }}
                      />
                      <Tooltip content={<LineChartTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="dailyTurnoverRate" 
                        name="当日周转率"
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#F59E0B', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 4. 当日订单量 */}
                <div>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        domain={[0, 'dataMax + 5000']}
                        allowDataOverflow={false}
                        tickCount={4}
                        tickFormatter={(value) => Math.round(value).toString()}
                        label={{ 
                          value: '当日订单量', 
                          angle: -90, 
                          position: 'insideLeft', 
                          fill: '#374151',
                          style: { textAnchor: 'middle', fontSize: 12 }
                        }}
                      />
                      <Tooltip content={<LineChartTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="dailyOrders" 
                        name="当日订单量"
                        stroke="#EF4444" 
                        strokeWidth={2}
                        dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#EF4444', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 健康车周转率/日模块 */}
        <Card className="bg-card border-border theme-transition">
          <CardHeader>
            <CardTitle className="text-foreground">健康车周转率/日</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : turnoverRateByCityData.length === 0 ? (
              <div className="flex items-center justify-center h-80 text-muted-foreground">
                暂无数据
              </div>
            ) : (
              // 添加调试日志
              console.log('渲染健康车周转率图表的数据:', turnoverRateByCityData),
              console.log('数据长度:', turnoverRateByCityData.length),
              console.log('第一个数据项:', turnoverRateByCityData[0]),
              console.log('提取的城市键:', turnoverRateByCityData.length > 0 ? Object.keys(turnoverRateByCityData[0]).filter(key => key !== 'date') : []),
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={turnoverRateByCityData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    type="category"
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    domain={[0, 'dataMax + 5']}
                    allowDataOverflow={false}
                    tickCount={4}
                    tickFormatter={(value) => Math.round(value).toString()}
                    label={{ 
                      value: '周转率 (%)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      fill: '#374151',
                      style: { textAnchor: 'middle', fontSize: 12 }
                    }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-medium text-gray-900">{label}</p>
                            {payload.map((entry: any, index: number) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {entry.value.toFixed(2)}%
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  {turnoverRateByCityData.length > 0 && Object.keys(turnoverRateByCityData[0]).filter(key => key !== 'date').map((city, index) => {
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <Line
                        key={city}
                        type="monotone"
                        dataKey={city}
                        name={city}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: color, strokeWidth: 2 }}
                        connectNulls={true}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 错误提示 */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
