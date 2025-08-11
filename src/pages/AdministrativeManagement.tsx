import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, FileText, MapPin, CreditCard, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AdministrativeManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const modules = [
    {
      title: '考勤管理',
      description: '管理考勤组和成员关联',
      icon: Clock,
      path: '/administrative/attendance',
      color: 'bg-blue-500',
      features: ['考勤组维护', '成员关联', '考勤统计']
    },
    {
      title: '请假管理',
      description: '处理员工请假申请',
      icon: Calendar,
      path: '/administrative/leave',
      color: 'bg-green-500',
      features: ['请假申请', '审批流程', '请假统计']
    },
    {
      title: '出差管理',
      description: '管理员工出差申请',
      icon: MapPin,
      path: '/administrative/business-trip',
      color: 'bg-purple-500',
      features: ['出差申请', '同行人管理', '出差统计']
    },
    {
      title: '补卡管理',
      description: '处理员工补卡申请',
      icon: CreditCard,
      path: '/administrative/card-replacement',
      color: 'bg-orange-500',
      features: ['补卡申请', '审批流程', '补卡记录']
    },
    {
      title: '外出管理',
      description: '管理员工外出申请',
      icon: ExternalLink,
      path: '/administrative/outing',
      color: 'bg-red-500',
      features: ['外出申请', '审批流程', '外出记录']
    },
    {
      title: '调班管理',
      description: '管理员工调班安排',
      icon: Users,
      path: '/administrative/shift-exchange',
      color: 'bg-indigo-500',
      features: ['调班申请', '审批流程', '调班记录']
    }
  ];

  return (
    <div className="min-h-screen bg-background theme-transition">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">行政管理</h1>
            <p className="text-muted-foreground">管理员工考勤、请假、出差等行政事务</p>
          </div>
        </div>

        {/* 欢迎卡片 */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  欢迎使用行政管理模块
                </h3>
                <p className="text-blue-700 dark:text-blue-300">
                  当前用户：{user?.name} ({user?.employee_id})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能模块网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20"
              onClick={() => navigate(module.path)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${module.color} text-white`}>
                    <module.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {module.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(module.path);
                  }}
                >
                  进入模块
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>快速操作</span>
            </CardTitle>
            <CardDescription>
              常用功能的快速入口
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2"
                onClick={() => navigate('/administrative/leave')}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-sm">申请请假</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2"
                onClick={() => navigate('/administrative/business-trip')}
              >
                <MapPin className="h-5 w-5" />
                <span className="text-sm">申请出差</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2"
                onClick={() => navigate('/administrative/card-replacement')}
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-sm">申请补卡</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2"
                onClick={() => navigate('/administrative/outing')}
              >
                <ExternalLink className="h-5 w-5" />
                <span className="text-sm">申请外出</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
            <CardDescription>
              行政管理模块功能说明
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">请假管理</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 支持年假、事假、病假、婚假等多种类型</li>
                  <li>• 自动计算请假时长</li>
                  <li>• 支持附件上传</li>
                  <li>• 完整的审批流程</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">出差管理</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 支持多种交通工具选择</li>
                  <li>• 同行人管理功能</li>
                  <li>• 单程/往返行程类型</li>
                  <li>• 出差完成状态跟踪</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">补卡管理</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 自动关联申请人部门</li>
                  <li>• 精确到秒的补卡时间</li>
                  <li>• 支持附件说明</li>
                  <li>• 补卡原因记录</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">外出管理</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 外出地点记录</li>
                  <li>• 自动计算外出时长</li>
                  <li>• 支持附件上传</li>
                  <li>• 外出记录查询</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdministrativeManagement; 