import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import UserSelect from '@/components/UserSelect';

const TestUserSelect = () => {
  const [selectedUser, setSelectedUser] = useState<string>('');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">UserSelect 组件测试</h1>
      
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
        </CardContent>
      </Card>
      
      <div className="mt-6 text-sm text-muted-foreground">
        <h3 className="font-semibold mb-2">测试说明：</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>打开浏览器控制台查看调试信息</li>
          <li>检查用户数据是否正确加载</li>
          <li>检查部门数据是否正确加载</li>
          <li>检查用户部门关联是否正确</li>
          <li>检查部门下的用户是否正确显示</li>
        </ul>
      </div>
    </div>
  );
};

export default TestUserSelect;
