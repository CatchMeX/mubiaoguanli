import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import UserSelect from '@/components/UserSelect';

const TestUserSelectExpand = () => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [testCount, setTestCount] = useState(0);

  const handleTestExpand = () => {
    setTestCount(prev => prev + 1);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">UserSelect 组件展开功能测试</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>执行人选择器测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="assignee">选择执行人</Label>
            <UserSelect
              value={selectedUser}
              onValueChange={setSelectedUser}
              placeholder="选择执行人"
            />
          </div>
          
          <div className="pt-4">
            <Label>当前选择：</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedUser ? `已选择用户ID: ${selectedUser}` : '未选择任何用户'}
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={handleTestExpand} variant="outline">
              测试展开功能 (点击次数: {testCount})
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 text-sm text-muted-foreground">
        <h3 className="font-semibold mb-2">测试说明：</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>点击部门前的箭头图标测试展开/收缩功能</li>
          <li>在搜索框中输入姓名、工号或部门名称测试搜索</li>
          <li>搜索时自动展开匹配的部门</li>
          <li>检查部门展开状态是否正确更新</li>
          <li>检查用户列表是否正确显示</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold text-green-800 mb-2">新增功能：</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>✅ 部门展开/收缩功能</li>
          <li>✅ 点击箭头图标切换展开状态</li>
          <li>✅ 搜索时自动展开匹配部门</li>
          <li>✅ 展开状态持久化</li>
          <li>✅ 用户列表只在展开时显示</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">使用方法：</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>🔽 点击蓝色箭头展开部门</li>
          <li>▶️ 点击蓝色箭头收缩部门</li>
          <li>🔍 搜索时自动展开相关部门</li>
          <li>👥 展开后显示部门下的用户</li>
          <li>📁 支持多级部门层级</li>
        </ul>
      </div>
    </div>
  );
};

export default TestUserSelectExpand;
