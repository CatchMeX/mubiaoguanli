import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { userAPI, departmentAPI } from '@/services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  changePassword: (userId: string, newPassword: string) => Promise<boolean>;
  forceLogout: (userId: string, reason?: string) => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  positionId: string;
  departmentId: string;
  joinDate: string;
  salary: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 检查本地存储中的登录状态
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      
      // 检查登录是否过期（7天）
      const loginTime = new Date(userData.loginTime || userData.created_at);
      const now = new Date();
      const daysDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7) {
        console.log('🕐 登录状态已过期，自动下线');
        localStorage.removeItem('currentUser');
        return;
      }
      
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 开始登录流程，工号:', email);
      
      // 使用真正的密码验证
      const validationResult = await userAPI.validatePassword(email, password);
      console.log('🔐 密码验证结果:', validationResult);
      
      if (validationResult.valid && validationResult.user) {
        console.log('✅ 登录成功');
        
        // 获取用户的完整信息（包括职位、部门）
        const userWithRelations = await userAPI.getUserWithRelations(validationResult.user.id);
        const userToStore = userWithRelations || validationResult.user;
        console.log('📝 用户完整信息:', userToStore);
        
        // 保存登录时间和用户信息
        const loginData = {
          ...userToStore,
          loginTime: new Date().toISOString()
        };
        
        setUser(userToStore);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(loginData));
        return true;
      }
      
      console.log('❌ 登录失败 - 工号或密码错误');
      return false;
    } catch (error) {
      console.error('❌ 登录过程中发生错误:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      console.log('🔍 开始注册流程，检查工号:', userData.employeeId);
      console.log('📝 注册数据:', userData);
      
      // 检查工号是否已存在
      const existingUser = await userAPI.getByEmployeeId(userData.employeeId);
      console.log('📝 工号查询结果:', existingUser);
      
      if (existingUser) {
        console.log('❌ 工号已存在');
        return false;
      }
      console.log('✅ 工号不存在，可以注册');

      // 检查邮箱是否已存在
      if (userData.email) {
        console.log('🔍 检查邮箱:', userData.email);
        const existingEmailUser = await userAPI.getByEmail(userData.email);
        console.log('📧 邮箱查询结果:', existingEmailUser);
        
        if (existingEmailUser) {
          console.log('❌ 邮箱已存在');
          return false;
        }
        console.log('✅ 邮箱不存在，可以注册');
      }

      // 创建用户记录到数据库
      const newUserData = {
        name: userData.name,
        employee_id: userData.employeeId,
        email: userData.email,
        position_id: userData.positionId || undefined,
        salary: userData.salary,
        status: 'active' as const,
        join_date: userData.joinDate,
      };

      console.log('📝 准备创建用户，数据:', newUserData);
      const newUser = await userAPI.create(newUserData);
      console.log('✅ 用户创建成功:', newUser);

      // 创建用户与部门的关联关系
      if (userData.departmentId && newUser.id) {
        try {
          console.log('🔗 创建用户部门关联:', {
            userId: newUser.id,
            departmentId: userData.departmentId
          });
          await userAPI.updateUserDepartments(newUser.id, [userData.departmentId], userData.departmentId);
          console.log('✅ 用户部门关联创建成功');
        } catch (deptError) {
          console.error('❌ 创建用户部门关联失败:', deptError);
          // 即使部门关联失败，用户创建成功，不返回失败
        }
      }

      console.log('🎉 注册流程完成');
      return true;
    } catch (error) {
      console.error('❌ 注册过程中发生错误:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (user && user.id) {
        const updatedUser = await userAPI.update(user.id, userData);
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      // 使用API发送重置密码邮件
      const response = await userAPI.requestPasswordReset(email);
      return response.success;
    } catch (error) {
      console.error('Password reset request failed:', error);
      return false;
    }
  };

  const forceLogout = (userId: string, reason: string = '密码已重置') => {
    // 如果当前用户就是被重置密码的用户，强制下线
    if (user && user.id === userId) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('currentUser');
      alert(`您的${reason}，请重新登录`);
      window.location.href = '/login';
    }
  };

  const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      // 使用API更改密码（管理员重置）
      const response = await userAPI.adminResetPassword(userId, newPassword);
      
      if (response.success) {
        // 强制对应用户下线
        forceLogout(userId, '密码已被管理员重置');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Password change failed:', error);
      return false;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    changePassword,
    forceLogout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
