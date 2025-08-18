import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShiftExchangeManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">调班管理</h1>
          <p className="text-muted-foreground">管理员工调班申请和安排</p>
        </div>
      </div>

      {/* 功能说明卡片 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ArrowUpDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                调班管理功能
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                调班管理功能正在开发中，敬请期待
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能预览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">调班申请</CardTitle>
                <CardDescription className="text-sm">
                  员工提交调班申请
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              员工可以申请调班，包括调班日期、时间段等信息
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">审批流程</CardTitle>
                <CardDescription className="text-sm">
                  主管审批调班申请
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              主管可以审批调班申请，确保人员安排合理
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <ArrowUpDown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-lg">调班记录</CardTitle>
                <CardDescription className="text-sm">
                  查看调班历史记录
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              记录所有调班申请和审批历史，便于管理
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowUpDown className="h-5 w-5" />
            <span>快速操作</span>
          </CardTitle>
          <CardDescription>
            调班管理相关功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              disabled
            >
              <Clock className="h-5 w-5" />
              <span className="text-sm">申请调班</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              disabled
            >
              <Users className="h-5 w-5" />
              <span className="text-sm">审批调班</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              disabled
            >
              <ArrowUpDown className="h-5 w-5" />
              <span className="text-sm">调班记录</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/administrative')}
            >
              <ArrowUpDown className="h-5 w-5" />
              <span className="text-sm">返回主页</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 开发状态 */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg inline-block">
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">功能开发中</h3>
              <p className="text-sm text-muted-foreground">
                调班管理功能正在开发中，预计将在后续版本中发布
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/administrative')}
            >
              返回行政管理主页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftExchangeManagement; 