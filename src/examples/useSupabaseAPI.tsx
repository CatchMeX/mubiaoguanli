import React, { useState, useEffect } from 'react'
import { 
  userAPI, 
  departmentAPI, 
  goalAPI, 
  expenseAPI, 
  revenueAPI, 
  assetAPI 
} from '@/services/api'
import { companyYearlyGoalService } from '@/services/goalService'
import type { 
  User, 
  Department, 
  CompanyYearlyGoal, 
  Asset 
} from '@/types'
import type { ExpenseRecord } from '@/types/expense'
import type { RevenueRecord } from '@/types/revenue'

// =============================================================================
// 用户管理示例
// =============================================================================

export const UserManagementExample: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取所有用户
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await userAPI.getAll()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户失败')
    } finally {
      setLoading(false)
    }
  }

  // 创建新用户
  const createUser = async (userData: Partial<User>) => {
    try {
      const newUser = await userAPI.create(userData)
      setUsers(prev => [...prev, newUser])
      return newUser
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建用户失败')
      throw err
    }
  }

  // 更新用户
  const updateUser = async (userId: string, userData: Partial<User>) => {
    try {
      const updatedUser = await userAPI.update(userId, userData)
      setUsers(prev => 
        prev.map(user => user.id === userId ? updatedUser : user)
      )
      return updatedUser
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新用户失败')
      throw err
    }
  }

  // 删除用户
  const deleteUser = async (userId: string) => {
    try {
      await userAPI.delete(userId)
      setUsers(prev => prev.filter(user => user.id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除用户失败')
      throw err
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error}</div>

  return (
    <div>
      <h2>用户管理</h2>
      <button onClick={() => createUser({ 
        name: '新用户', 
        employee_id: 'EMP' + Date.now(),
        email: 'new@example.com',
        status: 'active'
      })}>
        创建用户
      </button>
      
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.employee_id}) - {user.email}
            <button onClick={() => updateUser(user.id, { status: 'inactive' })}>
              禁用
            </button>
            <button onClick={() => deleteUser(user.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// =============================================================================
// 部门管理示例
// =============================================================================

export const DepartmentManagementExample: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const data = await departmentAPI.getHierarchy()
      setDepartments(data)
    } catch (err) {
      console.error('获取部门层级失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const createDepartment = async (deptData: Partial<Department>) => {
    try {
      const newDept = await departmentAPI.create(deptData)
      setDepartments(prev => [...prev, newDept])
      return newDept
    } catch (err) {
      console.error('创建部门失败:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <h2>部门管理</h2>
      <button onClick={() => createDepartment({
        name: '新部门',
        code: 'DEPT' + Date.now(),
        level: 1,
        sort_order: 0,
        status: 'active'
      })}>
        创建部门
      </button>
      
      <ul>
        {departments.map(dept => (
          <li key={dept.id}>
            {dept.name} ({dept.code}) - Level {dept.level}
          </li>
        ))}
      </ul>
    </div>
  )
}

// =============================================================================
// 目标管理示例
// =============================================================================

export const GoalManagementExample: React.FC = () => {
  const [yearlyGoals, setYearlyGoals] = useState<CompanyYearlyGoal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchYearlyGoals = async () => {
    try {
      setLoading(true)
      const data = await companyYearlyGoalService.getAll()
      setYearlyGoals(data)
    } catch (err) {
      console.error('获取年度目标失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const createYearlyGoal = async () => {
    try {
      const newGoal = await companyYearlyGoalService.create({
        year: new Date().getFullYear(),
        target_value: 10000000,
        status: 'active'
      })
      setYearlyGoals(prev => [...prev, newGoal])
    } catch (err) {
      console.error('创建年度目标失败:', err)
    }
  }

  useEffect(() => {
    fetchYearlyGoals()
  }, [])

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <h2>目标管理</h2>
      <button onClick={createYearlyGoal}>
        创建年度目标
      </button>
      
      <ul>
        {yearlyGoals.map(goal => (
          <li key={goal.id}>
            {goal.year}年目标: {goal.target_value.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}

// =============================================================================
// 费用管理示例
// =============================================================================

export const ExpenseManagementExample: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const [expenseData, statsData] = await Promise.all([
        expenseAPI.getExpenseRecords(),
        expenseAPI.getExpenseStatistics()
      ])
      setExpenses(expenseData)
      setStatistics(statsData)
    } catch (err) {
      console.error('获取费用数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const createExpense = async () => {
    try {
      const newExpense = await expenseAPI.createExpenseRecord({
        expenseNumber: 'EXP' + Date.now(),
        amount: 1000,
        netAmount: 1000,
        remainingAmount: 1000,
        description: '办公用品采购',
        expenseDate: new Date().toISOString().split('T')[0],
        status: 'draft'
      })
      setExpenses(prev => [...prev, newExpense])
    } catch (err) {
      console.error('创建费用记录失败:', err)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <h2>费用管理</h2>
      
      {statistics && (
        <div>
          <h3>费用统计</h3>
          <p>总费用: {statistics.totalExpense.toLocaleString()}</p>
          <p>已付费用: {statistics.totalPaid.toLocaleString()}</p>
          <p>待付费用: {statistics.totalPending}</p>
        </div>
      )}
      
      <button onClick={createExpense}>
        创建费用记录
      </button>
      
      <ul>
        {expenses.map(expense => (
          <li key={expense.id}>
            {expense.expenseNumber} - {expense.description} 
            ({expense.amount.toLocaleString()})
          </li>
        ))}
      </ul>
    </div>
  )
}

// =============================================================================
// 资产管理示例
// =============================================================================

export const AssetManagementExample: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAssetData = async () => {
    try {
      setLoading(true)
      const [assetData, categoryData] = await Promise.all([
        assetAPI.getAssets(),
        assetAPI.getAssetCategories()
      ])
      setAssets(assetData)
      setCategories(categoryData)
    } catch (err) {
      console.error('获取资产数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const createAsset = async () => {
    try {
      const newAsset = await assetAPI.createAsset({
        name: '新资产',
        code: 'ASSET' + Date.now(),
        status: 'in_use',
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_price: 5000,
        current_value: 5000
      })
      setAssets(prev => [...prev, newAsset])
    } catch (err) {
      console.error('创建资产失败:', err)
    }
  }

  useEffect(() => {
    fetchAssetData()
  }, [])

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <h2>资产管理</h2>
      
      <button onClick={createAsset}>
        创建资产
      </button>
      
      <h3>资产分类 ({categories.length})</h3>
      <ul>
        {categories.map(category => (
          <li key={category.id}>
            {category.name} ({category.code})
          </li>
        ))}
      </ul>
      
      <h3>资产列表 ({assets.length})</h3>
      <ul>
        {assets.map(asset => (
          <li key={asset.id}>
            {asset.name} ({asset.code}) - {asset.status}
          </li>
        ))}
      </ul>
    </div>
  )
}

// =============================================================================
// 分页查询示例
// =============================================================================

export const PaginationExample: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchUsers = async (page: number = 1, pageSize: number = 10) => {
    try {
      setLoading(true)
      const result = await userAPI.getPaginated(page, pageSize)
      setUsers(result.data)
      setPagination({
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages
      })
    } catch (err) {
      console.error('获取分页数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUsers(newPage, pagination.pageSize)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <h2>分页查询示例</h2>
      
      <div>
        <p>总记录数: {pagination.total}</p>
        <p>当前页: {pagination.page} / {pagination.totalPages}</p>
      </div>
      
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.employee_id})
          </li>
        ))}
      </ul>
      
      <div>
        <button 
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          上一页
        </button>
        <span> 第 {pagination.page} 页 </span>
        <button 
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          下一页
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// 主示例组件
// =============================================================================

export const SupabaseAPIExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users')

  const tabs = [
    { id: 'users', label: '用户管理', component: UserManagementExample },
    { id: 'departments', label: '部门管理', component: DepartmentManagementExample },
    { id: 'goals', label: '目标管理', component: GoalManagementExample },
    { id: 'expenses', label: '费用管理', component: ExpenseManagementExample },
    { id: 'assets', label: '资产管理', component: AssetManagementExample },
    { id: 'pagination', label: '分页查询', component: PaginationExample }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || UserManagementExample

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Supabase API 使用示例</h1>
      
      <div className="mb-6">
        <nav className="flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded ${
                activeTab === tab.id 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <ActiveComponent />
      </div>
    </div>
  )
}

export default SupabaseAPIExample 