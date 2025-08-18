import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Download, Upload, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/services/api';
import type { RideSharingDailyReport, RideSharingDailyReportFormData, Team } from '@/types';
import { WEEK_DAYS } from '@/types/rideSharing';

const defaultForm: RideSharingDailyReportFormData = {
  report_date: '',
  team_id: '',
  total_vehicles: 0,
  operating_vehicles: 0,
  week_day: '周一',
  revenue_gmv: 0,
  daily_turnover_rate: 0,
  daily_orders: 0,
  average_order_revenue: 0,
  average_vehicle_revenue: 0,
  daily_moved_vehicles: 0,
  average_moves_per_person: 0,
  battery_swaps: 0,
  average_swaps_per_person: 0,
  dispatch_staff: 0,
  battery_staff: 0,
  patrol_staff: 0,
  warehouse_staff: 0,
  assistant_staff: 0,
  total_users: 0,
  active_users: 0,
  new_users: 0,
  maintenance_vehicles: 0,
  scrapped_vehicles: 0,
  inventory_vehicles: 0,
  cleaned_vehicles: 0,
  idle_vehicles_24h_plus: 0,
  weather: '晴天', // 设置默认天气
  refund_amount: 0,
  unpaid_rides: 0,
  low_battery_rate: 0,
};

const RideSharingDailyReports = () => {
  const [reports, setReports] = useState<RideSharingDailyReport[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDate, setSearchDate] = useState('');
  const [searchTeam, setSearchTeam] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<RideSharingDailyReportFormData>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    loadTeams();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.rideSharing.getDailyReportsWithRelations();
      setReports(data || []);
    } catch (err) {
      setError('加载日报数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const data = await api.team.getAll();
      setTeams(data || []);
    } catch (err) {
      setTeams([]);
    }
  };

  const handleSearch = () => {
    let filtered = reports;
    if (searchDate) filtered = filtered.filter(r => r.report_date === searchDate);
    if (searchTeam && searchTeam !== 'all') filtered = filtered.filter(r => r.team_id === searchTeam);
    return filtered;
  };

  const openAddDialog = () => {
    setFormData(defaultForm);
    setIsEdit(false);
    setEditId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (report: RideSharingDailyReport) => {
    setFormData({ ...report });
    setIsEdit(true);
    setEditId(report.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这条日报吗？')) return;
    try {
      await api.rideSharing.deleteReport(id);
      toast({ 
        title: '删除成功',
        className: "bg-green-500 text-white border-green-600"
      });
      loadData();
    } catch {
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };

  const handleFormChange = (key: keyof RideSharingDailyReportFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [key]: value };
      
      // 如果修改的是日期，自动计算周几
      if (key === 'report_date' && value) {
        const date = new Date(value);
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekDay = weekDays[date.getDay()];
        newData.week_day = weekDay as '周一' | '周二' | '周三' | '周四' | '周五' | '周六' | '周日';
      }
      
      return newData;
    });
  };

  const handleSubmit = async () => {
    // 完整的表单验证
    const requiredFields = [
      { field: 'report_date', name: '日期' },
      { field: 'team_id', name: '城市' },
      { field: 'total_vehicles', name: '总车辆数' },
      { field: 'operating_vehicles', name: '实际运营车辆' },
      { field: 'week_day', name: '周' },
      { field: 'revenue_gmv', name: '营收（GMV）' },
      { field: 'daily_turnover_rate', name: '当日周转率' },
      { field: 'daily_orders', name: '当日订单量' },
      { field: 'average_order_revenue', name: '收入单均' },
      { field: 'average_vehicle_revenue', name: '车均收入' },
      { field: 'daily_moved_vehicles', name: '日挪车辆' },
      { field: 'average_moves_per_person', name: '人均挪车' },
      { field: 'battery_swaps', name: '换电量' },
      { field: 'average_swaps_per_person', name: '人均换电' },
      { field: 'dispatch_staff', name: '调度人数' },
      { field: 'battery_staff', name: '换电人数' },
      { field: 'patrol_staff', name: '巡街人数' },
      { field: 'warehouse_staff', name: '库管人数' },
      { field: 'assistant_staff', name: '助理人数' },
      { field: 'total_users', name: '月（日）总用户' },
      { field: 'active_users', name: '月（日）总活跃人数' },
      { field: 'new_users', name: '月（日）新增人数' },
      { field: 'maintenance_vehicles', name: '库内维修车' },
      { field: 'scrapped_vehicles', name: '报废车' },
      { field: 'inventory_vehicles', name: '库存车' },
      { field: 'cleaned_vehicles', name: '车辆清洗' },
      { field: 'idle_vehicles_24h_plus', name: '24小时及以上闲置车' },
      { field: 'weather', name: '天气' },
      { field: 'refund_amount', name: '退款金额' },
      { field: 'unpaid_rides', name: '骑行未缴纳' },
      { field: 'low_battery_rate', name: '低电率' }
    ];

    // 检查所有必填字段
    for (const { field, name } of requiredFields) {
      const value = formData[field as keyof RideSharingDailyReportFormData];
      if (value === undefined || value === null || value === '' || (typeof value === 'number' && value < 0)) {
        toast({ title: `请填写${name}`, variant: 'destructive' });
        return;
      }
    }

    try {
      if (!isEdit) {
        const exists = await api.rideSharing.checkDuplicateReport(formData.team_id, formData.report_date);
        if (exists) {
          toast({ title: '同一城市同一天只能有一条日报', variant: 'destructive' });
          return;
        }
        await api.rideSharing.createReport(formData);
        toast({ 
          title: '新增成功',
          className: "bg-green-500 text-white border-green-600"
        });
      } else if (editId) {
        await api.rideSharing.updateReport(editId, formData);
        toast({ 
          title: '更新成功',
          className: "bg-green-500 text-white border-green-600"
        });
      }
      setIsDialogOpen(false);
      loadData();
    } catch {
      toast({ title: '保存失败', variant: 'destructive' });
    }
  };

  // 导出CSV
  const handleExport = () => {
    const data = handleSearch();
    const headers = [
      '日期','城市','总车辆数','实际运营车辆','周','营收（GMV）','当日周转率','当日订单量','收入单均','车均收入','日挪车辆','人均挪车','换电量','人均换电','调度人数','换电人数','巡街人数','库管人数','助理人数','月（日）总用户','月（日）总活跃人数','月（日）新增人数','库内维修车','报废车','库存车','车辆清洗','24小时及以上闲置车','天气','退款金额','骑行未缴纳','低电率'];
    const rows = data.map(r => [
      r.report_date,
      teams.find(t => t.id === r.team_id)?.name || '',
      r.total_vehicles,
      r.operating_vehicles,
      r.week_day,
      r.revenue_gmv,
      r.daily_turnover_rate,
      r.daily_orders,
      r.average_order_revenue,
      r.average_vehicle_revenue,
      r.daily_moved_vehicles,
      r.average_moves_per_person,
      r.battery_swaps,
      r.average_swaps_per_person,
      r.dispatch_staff,
      r.battery_staff,
      r.patrol_staff,
      r.warehouse_staff,
      r.assistant_staff,
      r.total_users,
      r.active_users,
      r.new_users,
      r.maintenance_vehicles,
      r.scrapped_vehicles,
      r.inventory_vehicles,
      r.cleaned_vehicles,
      r.idle_vehicles_24h_plus,
      r.weather,
      r.refund_amount,
      r.unpaid_rides,
      r.low_battery_rate
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `共享出行城市日报_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: '导出成功',
      className: "bg-green-500 text-white border-green-600"
    });
  };

  // 下载导入模板
  const handleDownloadTemplate = () => {
    const headers = [
      '日期','城市','总车辆数','实际运营车辆','周','营收（GMV）','当日周转率','当日订单量','收入单均','车均收入','日挪车辆','人均挪车','换电量','人均换电','调度人数','换电人数','巡街人数','库管人数','助理人数','月（日）总用户','月（日）总活跃人数','月（日）新增人数','库内维修车','报废车','库存车','车辆清洗','24小时及以上闲置车','天气','退款金额','骑行未缴纳','低电率'
    ];
    
    // 添加示例数据
    const exampleRow = [
      '2025-01-20',
      '北京',
      '1000',
      '800',
      '周一',
      '50000.00',
      '85.50',
      '1200',
      '41.67',
      '62.50',
      '150',
      '3.75',
      '200',
      '5.00',
      '20',
      '15',
      '10',
      '5',
      '3',
      '50000',
      '15000',
      '500',
      '50',
      '10',
      '100',
      '80',
      '20',
      '晴天',
      '500.00',
      '200.00',
      '15.30'
    ];
    
    const csvContent = [headers, exampleRow]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `共享出行城市日报导入模板_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: '模板下载成功',
      className: "bg-green-500 text-white border-green-600"
    });
  };

  // 解析中文日期格式
  const parseChineseDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // 如果已经是YYYY-MM-DD格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // 处理中文日期格式：7月1日、2024年7月1日等
    const chineseDateMatch = dateStr.match(/(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日?/);
    if (chineseDateMatch) {
      const year = chineseDateMatch[1] || new Date().getFullYear().toString();
      const month = chineseDateMatch[2].padStart(2, '0');
      const day = chineseDateMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // 处理其他可能的日期格式
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    console.error('无法解析日期格式:', dateStr);
    return '';
  };

  // 处理空白单元格的辅助函数
  const parseCellValue = (cell: string, isNumber: boolean = true, defaultValue: any = 0) => {
    const trimmedCell = cell.replace(/"/g, '').trim();
    if (trimmedCell === '' || trimmedCell === undefined || trimmedCell === null) {
      return defaultValue;
    }
    return isNumber ? Number(trimmedCell) || defaultValue : trimmedCell;
  };

  // 智能城市匹配函数
  const findTeamByName = (cityName: string) => {
    // 1. 精确匹配
    let team = teams.find(t => t.name === cityName);
    if (team) return team;
    
    // 2. 去除空格后匹配
    const trimmedCityName = cityName.trim();
    team = teams.find(t => t.name === trimmedCityName);
    if (team) return team;
    
    // 3. 模糊匹配（包含关系）
    team = teams.find(t => cityName.includes(t.name) || t.name.includes(cityName));
    if (team) return team;
    
    // 4. 尝试解码常见编码问题
    const decodedNames = [
      // 尝试移除可能的BOM和特殊字符
      cityName.replace(/^\uFEFF/, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ''),
      // 尝试反转字节序
      cityName.split('').reverse().join(''),
      // 尝试移除所有非中文字符
      cityName.replace(/[^\u4e00-\u9fa5]/g, ''),
    ];
    
    for (const decodedName of decodedNames) {
      if (decodedName && decodedName.length > 0) {
        team = teams.find(t => t.name === decodedName);
        if (team) return team;
        
        // 模糊匹配解码后的名称
        team = teams.find(t => decodedName.includes(t.name) || t.name.includes(decodedName));
        if (team) return team;
      }
    }
    
    return null;
  };

  // 导入CSV
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;
      
      console.log('原始文件内容前100个字符:', content.substring(0, 100));
      console.log('文件大小:', file.size, '字节');
      
      const lines = content.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      const rows = lines.slice(1).filter(line => line.trim());
      
      console.log('开始导入CSV文件');
      console.log('文件内容行数:', lines.length);
      console.log('有效数据行数:', rows.length);
      console.log('CSV头部:', headers);
      
      let success = 0, fail = 0;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = i + 2; // 实际行号（从1开始，跳过头部）
        console.log(`\n处理第${rowIndex}行数据:`, row);
        
        const cells = row.split(',').map(cell => cell.replace(/"/g, ''));
        console.log('解析后的单元格:', cells);
        console.log('第1个单元格(日期)的原始值:', cells[0]);
        console.log('第2个单元格(城市)的原始值:', cells[1]);
        console.log('第2个单元格(城市)的字符编码:', Array.from(cells[1]).map(c => c.charCodeAt(0)));
        
        if (cells.length < 2) { 
          console.error(`第${rowIndex}行失败: 单元格数量不足，需要至少2个单元格，实际${cells.length}个`);
          fail++; 
          continue; 
        }
        
        // 解析日期
        const originalDate = cells[0];
        const parsedDate = parseChineseDate(originalDate);
        console.log(`日期解析: "${originalDate}" -> "${parsedDate}"`);
        
        if (!parsedDate) {
          console.error(`第${rowIndex}行失败: 无法解析日期格式 "${originalDate}"`);
          fail++;
          continue;
        }
        
        const teamName = cells[1];
        console.log('查找城市:', teamName);
        console.log('可用城市列表:', teams.map(t => t.name));
        
        const team = findTeamByName(teamName);
        if (!team) { 
          console.error(`第${rowIndex}行失败: 找不到城市"${teamName}"，可用城市:`, teams.map(t => t.name));
          console.error('城市名称不匹配，可能是编码问题');
          console.error('尝试的匹配方法: 精确匹配、去除空格、模糊匹配、编码解码');
          fail++; 
          continue; 
        }
        
        console.log(`找到城市: ${team.name} (ID: ${team.id})`);
        
        const form: RideSharingDailyReportFormData = {
          report_date: parsedDate,
          team_id: team.id,
          total_vehicles: parseCellValue(cells[2], true, 0),
          operating_vehicles: parseCellValue(cells[3], true, 0),
          week_day: (parseCellValue(cells[4], false, '周一') as '周一' | '周二' | '周三' | '周四' | '周五' | '周六' | '周日'),
          revenue_gmv: parseCellValue(cells[5], true, 0),
          daily_turnover_rate: parseCellValue(cells[6], true, 0),
          daily_orders: parseCellValue(cells[7], true, 0),
          average_order_revenue: parseCellValue(cells[8], true, 0),
          average_vehicle_revenue: parseCellValue(cells[9], true, 0),
          daily_moved_vehicles: parseCellValue(cells[10], true, 0),
          average_moves_per_person: parseCellValue(cells[11], true, 0),
          battery_swaps: parseCellValue(cells[12], true, 0),
          average_swaps_per_person: parseCellValue(cells[13], true, 0),
          dispatch_staff: parseCellValue(cells[14], true, 0),
          battery_staff: parseCellValue(cells[15], true, 0),
          patrol_staff: parseCellValue(cells[16], true, 0),
          warehouse_staff: parseCellValue(cells[17], true, 0),
          assistant_staff: parseCellValue(cells[18], true, 0),
          total_users: parseCellValue(cells[19], true, 0),
          active_users: parseCellValue(cells[20], true, 0),
          new_users: parseCellValue(cells[21], true, 0),
          maintenance_vehicles: parseCellValue(cells[22], true, 0),
          scrapped_vehicles: parseCellValue(cells[23], true, 0),
          inventory_vehicles: parseCellValue(cells[24], true, 0),
          cleaned_vehicles: parseCellValue(cells[25], true, 0),
          idle_vehicles_24h_plus: parseCellValue(cells[26], true, 0),
          weather: parseCellValue(cells[27], false, '晴天'),
          refund_amount: parseCellValue(cells[28], true, 0),
          unpaid_rides: parseCellValue(cells[29], true, 0),
          low_battery_rate: parseCellValue(cells[30], true, 0),
        };
        
        console.log('解析后的表单数据:', form);
        
        try {
          console.log(`检查重复记录: ${form.team_id} - ${form.report_date}`);
          const exists = await api.rideSharing.checkDuplicateReport(form.team_id, form.report_date);
          if (!exists) {
            console.log(`创建新记录...`);
            await api.rideSharing.createReport(form);
            console.log(`第${rowIndex}行导入成功`);
            success++;
          } else {
            console.error(`第${rowIndex}行失败: 该城市在${form.report_date}已有日报记录`);
            fail++;
          }
        } catch (error) {
          console.error(`第${rowIndex}行失败: API调用错误`, error);
          fail++;
        }
      }
      
      console.log(`\n导入完成总结:`);
      console.log(`- 成功: ${success}条`);
      console.log(`- 失败: ${fail}条`);
      console.log(`- 总计: ${success + fail}条`);
      
      toast({ 
        title: `导入完成，成功${success}条，失败${fail}条`,
        className: "bg-green-500 text-white border-green-600"
      });
      setIsImportDialogOpen(false);
      loadData();
    };
    
    // 尝试使用UTF-8编码读取文件
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">共享出行城市日报</h1>
        <div className="flex gap-2">
          <Button onClick={openAddDialog} variant="default"><Plus className="mr-2 h-4 w-4" />新增</Button>
          <Button onClick={handleExport} variant="outline"><Download className="mr-2 h-4 w-4" />导出</Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}><Upload className="mr-2 h-4 w-4" />导入</Button>
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        <Input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} placeholder="按日期筛选" className="w-48" />
        <Select value={searchTeam} onValueChange={setSearchTeam}>
          <SelectTrigger className="w-48"><SelectValue placeholder="按城市筛选" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部城市</SelectItem>
            {teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadData}><Search className="mr-2 h-4 w-4" />刷新</Button>
      </div>
      <Card className="bg-card border-border theme-transition">
        <CardHeader>
          <CardTitle>日报列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin mr-2" />加载中...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-center">日期</TableHead>
                    <TableHead className="whitespace-nowrap text-center">城市</TableHead>
                    <TableHead className="whitespace-nowrap text-center">总车辆数</TableHead>
                    <TableHead className="whitespace-nowrap text-center">实际运营车辆</TableHead>
                    <TableHead className="whitespace-nowrap text-center">周</TableHead>
                    <TableHead className="whitespace-nowrap text-center">营收（GMV）</TableHead>
                    <TableHead className="whitespace-nowrap text-center">当日周转率</TableHead>
                    <TableHead className="whitespace-nowrap text-center">当日订单量</TableHead>
                    <TableHead className="whitespace-nowrap text-center">收入单均</TableHead>
                    <TableHead className="whitespace-nowrap text-center">车均收入</TableHead>
                    <TableHead className="whitespace-nowrap text-center">日挪车辆</TableHead>
                    <TableHead className="whitespace-nowrap text-center">人均挪车</TableHead>
                    <TableHead className="whitespace-nowrap text-center">换电量</TableHead>
                    <TableHead className="whitespace-nowrap text-center">人均换电</TableHead>
                    <TableHead className="whitespace-nowrap text-center">调度人数</TableHead>
                    <TableHead className="whitespace-nowrap text-center">换电人数</TableHead>
                    <TableHead className="whitespace-nowrap text-center">巡街人数</TableHead>
                    <TableHead className="whitespace-nowrap text-center">库管人数</TableHead>
                    <TableHead className="whitespace-nowrap text-center">助理人数</TableHead>
                    <TableHead className="whitespace-nowrap text-center">月（日）总用户</TableHead>
                    <TableHead className="whitespace-nowrap text-center">月（日）总活跃人数</TableHead>
                    <TableHead className="whitespace-nowrap text-center">月（日）新增人数</TableHead>
                    <TableHead className="whitespace-nowrap text-center">库内维修车</TableHead>
                    <TableHead className="whitespace-nowrap text-center">报废车</TableHead>
                    <TableHead className="whitespace-nowrap text-center">库存车</TableHead>
                    <TableHead className="whitespace-nowrap text-center">车辆清洗</TableHead>
                    <TableHead className="whitespace-nowrap text-center">24小时及以上闲置车</TableHead>
                    <TableHead className="whitespace-nowrap text-center">天气</TableHead>
                    <TableHead className="whitespace-nowrap text-center">退款金额</TableHead>
                    <TableHead className="whitespace-nowrap text-center">骑行未缴纳</TableHead>
                    <TableHead className="whitespace-nowrap text-center">低电率</TableHead>
                    <TableHead className="whitespace-nowrap text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {handleSearch().map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.report_date}</TableCell>
                      <TableCell className="whitespace-nowrap">{teams.find(t => t.id === r.team_id)?.name || ''}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.total_vehicles}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.operating_vehicles}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.week_day}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.revenue_gmv}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.daily_turnover_rate}%</TableCell>
                      <TableCell className="whitespace-nowrap">{r.daily_orders}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.average_order_revenue}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.average_vehicle_revenue}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.daily_moved_vehicles}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.average_moves_per_person}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.battery_swaps}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.average_swaps_per_person}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.dispatch_staff}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.battery_staff}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.patrol_staff}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.warehouse_staff}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.assistant_staff}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.total_users}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.active_users}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.new_users}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.maintenance_vehicles}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.scrapped_vehicles}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.inventory_vehicles}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.cleaned_vehicles}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.idle_vehicles_24h_plus}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.weather}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.refund_amount}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.unpaid_rides}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.low_battery_rate}%</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(r)}><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? '编辑日报' : '新增日报'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <Label>日期 <span className="text-red-500">*</span></Label>
              <Input type="date" value={formData.report_date} onChange={e => handleFormChange('report_date', e.target.value)} />
            </div>
            <div>
              <Label>城市 <span className="text-red-500">*</span></Label>
              <Select value={formData.team_id} onValueChange={v => handleFormChange('team_id', v)}>
                <SelectTrigger><SelectValue placeholder="请选择城市" /></SelectTrigger>
                <SelectContent>
                  {teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>总车辆数 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.total_vehicles} onChange={e => handleFormChange('total_vehicles', Number(e.target.value))} />
            </div>
            <div>
              <Label>实际运营车辆 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.operating_vehicles} onChange={e => handleFormChange('operating_vehicles', Number(e.target.value))} />
            </div>
            <div>
              <Label>周 <span className="text-red-500">*</span></Label>
              <Select value={formData.week_day} onValueChange={v => handleFormChange('week_day', v as any)}>
                <SelectTrigger><SelectValue placeholder="请选择周" /></SelectTrigger>
                <SelectContent>
                  {WEEK_DAYS.map(day => <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>营收（GMV）  <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" min="0" value={formData.revenue_gmv} onChange={e => handleFormChange('revenue_gmv', Number(e.target.value))} />
            </div>
            <div>
              <Label>当日周转率 <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" min="0" max="100" value={formData.daily_turnover_rate} onChange={e => handleFormChange('daily_turnover_rate', Number(e.target.value))} />
            </div>
            <div>
              <Label>当日订单量 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.daily_orders} onChange={e => handleFormChange('daily_orders', Number(e.target.value))} />
            </div>
            <div>
              <Label>收入单均 <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" min="0" value={formData.average_order_revenue} onChange={e => handleFormChange('average_order_revenue', Number(e.target.value))} />
            </div>
            <div>
              <Label>车均收入 <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" min="0" value={formData.average_vehicle_revenue} onChange={e => handleFormChange('average_vehicle_revenue', Number(e.target.value))} />
            </div>
            <div>
              <Label>日挪车辆 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.daily_moved_vehicles} onChange={e => handleFormChange('daily_moved_vehicles', Number(e.target.value))} />
            </div>
            <div>
              <Label>人均挪车 <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" min="0" value={formData.average_moves_per_person} onChange={e => handleFormChange('average_moves_per_person', Number(e.target.value))} />
            </div>
            <div>
              <Label>换电量 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.battery_swaps} onChange={e => handleFormChange('battery_swaps', Number(e.target.value))} />
            </div>
            <div>
              <Label>人均换电 <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" min="0" value={formData.average_swaps_per_person} onChange={e => handleFormChange('average_swaps_per_person', Number(e.target.value))} />
            </div>
            <div>
              <Label>调度人数 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.dispatch_staff} onChange={e => handleFormChange('dispatch_staff', Number(e.target.value))} />
            </div>
            <div>
              <Label>换电人数 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.battery_staff} onChange={e => handleFormChange('battery_staff', Number(e.target.value))} />
            </div>
            <div>
              <Label>巡街人数 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.patrol_staff} onChange={e => handleFormChange('patrol_staff', Number(e.target.value))} />
            </div>
            <div>
              <Label>库管人数 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.warehouse_staff} onChange={e => handleFormChange('warehouse_staff', Number(e.target.value))} />
            </div>
            <div>
              <Label>助理人数 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.assistant_staff} onChange={e => handleFormChange('assistant_staff', Number(e.target.value))} />
            </div>
            <div>
              <Label>月（日）总用户 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.total_users} onChange={e => handleFormChange('total_users', Number(e.target.value))} />
            </div>
            <div>
              <Label>月（日）总活跃人数 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.active_users} onChange={e => handleFormChange('active_users', Number(e.target.value))} />
            </div>
            <div>
              <Label>月（日）新增人数 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.new_users} onChange={e => handleFormChange('new_users', Number(e.target.value))} />
            </div>
            <div>
              <Label>库内维修车 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.maintenance_vehicles} onChange={e => handleFormChange('maintenance_vehicles', Number(e.target.value))} />
            </div>
            <div>
              <Label>报废车 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.scrapped_vehicles} onChange={e => handleFormChange('scrapped_vehicles', Number(e.target.value))} />
            </div>
            <div>
              <Label>库存车 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.inventory_vehicles} onChange={e => handleFormChange('inventory_vehicles', Number(e.target.value))} />
            </div>
            <div>
              <Label>车辆清洗 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.cleaned_vehicles} onChange={e => handleFormChange('cleaned_vehicles', Number(e.target.value))} />
            </div>
            <div>
              <Label>24小时及以上闲置车 <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" value={formData.idle_vehicles_24h_plus} onChange={e => handleFormChange('idle_vehicles_24h_plus', Number(e.target.value))} />
            </div>
            <div>
              <Label>天气 <span className="text-red-500">*</span></Label>
              <Input value={formData.weather} onChange={e => handleFormChange('weather', e.target.value)} required />
            </div>
            <div>
              <Label>退款金额 (元) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" min="0" value={formData.refund_amount} onChange={e => handleFormChange('refund_amount', Number(e.target.value))} />
            </div>
            <div>
              <Label>骑行未缴纳 (元) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" min="0" value={formData.unpaid_rides} onChange={e => handleFormChange('unpaid_rides', Number(e.target.value))} />
            </div>
            <div>
              <Label>低电率 (%) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" min="0" max="100" value={formData.low_battery_rate} onChange={e => handleFormChange('low_battery_rate', Number(e.target.value))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button onClick={() => setIsDialogOpen(false)} variant="outline">取消</Button>
            <Button onClick={handleSubmit}>{isEdit ? '保存' : '新增'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 导入对话框 */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>导入日报数据</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>请按照模板格式准备CSV文件，确保数据格式正确。</p>
              <p className="mt-2">注意事项：</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>城市名称必须与系统中的城市名称完全一致</li>
                <li>日期格式为：YYYY-MM-DD</li>
                <li>周几格式为：周一、周二、周三、周四、周五、周六、周日</li>
                <li>所有数值字段不能为空</li>
                <li>同一城市同一天只能有一条记录</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownloadTemplate} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                下载模板
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                选择文件
              </Button>
            </div>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImport} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RideSharingDailyReports; 