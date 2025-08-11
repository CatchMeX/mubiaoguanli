import { goalAPI } from './api'
import type { 
  CompanyYearlyGoal, 
  TeamMonthlyGoal, 
  PersonalMonthlyGoal, 
  DailyReport 
} from '@/types'

// =============================================================================
// 目标管理服务 - 演示如何使用统一的API
// =============================================================================

/**
 * 公司年度目标管理
 */
export const companyYearlyGoalService = {
  // 获取所有公司年度目标
  async getAll(): Promise<CompanyYearlyGoal[]> {
    try {
      return await goalAPI.getCompanyYearlyGoals()
    } catch (error) {
      console.error('获取公司年度目标失败:', error)
      throw error
    }
  },

  // 根据年份获取目标
  async getByYear(year: number): Promise<CompanyYearlyGoal[]> {
    try {
      const goals = await goalAPI.getCompanyYearlyGoals()
      return goals.filter(goal => goal.year === year)
    } catch (error) {
      console.error('获取指定年份目标失败:', error)
      throw error
    }
  },

  // 创建新的年度目标
  async create(data: Partial<CompanyYearlyGoal>): Promise<CompanyYearlyGoal> {
    try {
      return await goalAPI.createCompanyYearlyGoal(data)
    } catch (error) {
      console.error('创建公司年度目标失败:', error)
      throw error
    }
  },

  // 更新年度目标
  async update(id: string, data: Partial<CompanyYearlyGoal>): Promise<CompanyYearlyGoal> {
    try {
      return await goalAPI.updateCompanyYearlyGoal(id, data)
    } catch (error) {
      console.error('更新公司年度目标失败:', error)
      throw error
    }
  },

  // 删除年度目标
  async delete(id: string): Promise<void> {
    try {
      return await goalAPI.deleteCompanyYearlyGoal(id)
    } catch (error) {
      console.error('删除公司年度目标失败:', error)
      throw error
    }
  }
}

/**
 * 团队月度目标管理
 */
export const teamMonthlyGoalService = {
  // 获取所有团队月度目标
  async getAll(): Promise<TeamMonthlyGoal[]> {
    try {
      return await goalAPI.getTeamMonthlyGoals()
    } catch (error) {
      console.error('获取团队月度目标失败:', error)
      throw error
    }
  },

  // 根据年月获取目标
  async getByYearMonth(year: number, month: number): Promise<TeamMonthlyGoal[]> {
    try {
      return await goalAPI.getTeamMonthlyGoals(year, month)
    } catch (error) {
      console.error('获取指定年月团队目标失败:', error)
      throw error
    }
  },

  // 根据部门获取目标
  async getByDepartment(departmentId: string): Promise<TeamMonthlyGoal[]> {
    try {
      const goals = await goalAPI.getTeamMonthlyGoals()
      return goals.filter(goal => goal.department_id === departmentId)
    } catch (error) {
      console.error('获取部门目标失败:', error)
      throw error
    }
  },

  // 创建新的月度目标
  async create(data: Partial<TeamMonthlyGoal>): Promise<TeamMonthlyGoal> {
    try {
      return await goalAPI.createTeamMonthlyGoal(data)
    } catch (error) {
      console.error('创建团队月度目标失败:', error)
      throw error
    }
  },

  // 更新月度目标
  async update(id: string, data: Partial<TeamMonthlyGoal>): Promise<TeamMonthlyGoal> {
    try {
      return await goalAPI.updateTeamMonthlyGoal(id, data)
    } catch (error) {
      console.error('更新团队月度目标失败:', error)
      throw error
    }
  },

  // 更新目标进度
  async updateProgress(id: string, progress: number): Promise<TeamMonthlyGoal> {
    try {
      return await goalAPI.updateTeamMonthlyGoal(id, { progress })
    } catch (error) {
      console.error('更新目标进度失败:', error)
      throw error
    }
  }
}

/**
 * 个人月度目标管理
 */
export const personalMonthlyGoalService = {
  // 获取所有个人月度目标
  async getAll(): Promise<PersonalMonthlyGoal[]> {
    try {
      return await goalAPI.getPersonalMonthlyGoals()
    } catch (error) {
      console.error('获取个人月度目标失败:', error)
      throw error
    }
  },

  // 根据用户获取目标
  async getByUser(userId: string): Promise<PersonalMonthlyGoal[]> {
    try {
      return await goalAPI.getPersonalMonthlyGoals(userId)
    } catch (error) {
      console.error('获取用户目标失败:', error)
      throw error
    }
  },

  // 根据用户和年月获取目标
  async getByUserYearMonth(userId: string, year: number, month: number): Promise<PersonalMonthlyGoal[]> {
    try {
      return await goalAPI.getPersonalMonthlyGoals(userId, year, month)
    } catch (error) {
      console.error('获取用户指定年月目标失败:', error)
      throw error
    }
  },

  // 创建新的个人目标
  async create(data: Partial<PersonalMonthlyGoal>): Promise<PersonalMonthlyGoal> {
    try {
      return await goalAPI.createPersonalMonthlyGoal(data)
    } catch (error) {
      console.error('创建个人月度目标失败:', error)
      throw error
    }
  },

  // 更新个人目标
  async update(id: string, data: Partial<PersonalMonthlyGoal>): Promise<PersonalMonthlyGoal> {
    try {
      return await goalAPI.updatePersonalMonthlyGoal(id, data)
    } catch (error) {
      console.error('更新个人月度目标失败:', error)
      throw error
    }
  },

  // 更新目标进度
  async updateProgress(id: string, progress: number): Promise<PersonalMonthlyGoal> {
    try {
      return await goalAPI.updatePersonalMonthlyGoal(id, { progress })
    } catch (error) {
      console.error('更新个人目标进度失败:', error)
      throw error
    }
  }
}

/**
 * 日报管理
 */
export const dailyReportService = {
  // 获取所有日报
  async getAll(): Promise<DailyReport[]> {
    try {
      return await goalAPI.getDailyReports()
    } catch (error) {
      console.error('获取日报失败:', error)
      throw error
    }
  },

  // 根据用户获取日报
  async getByUser(userId: string): Promise<DailyReport[]> {
    try {
      return await goalAPI.getDailyReports(userId)
    } catch (error) {
      console.error('获取用户日报失败:', error)
      throw error
    }
  },

  // 根据日期范围获取日报
  async getByDateRange(userId: string, startDate: string, endDate: string): Promise<DailyReport[]> {
    try {
      return await goalAPI.getDailyReports(userId, startDate, endDate)
    } catch (error) {
      console.error('获取指定日期范围日报失败:', error)
      throw error
    }
  },

  // 获取今日日报
  async getTodayReport(userId: string): Promise<DailyReport | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const reports = await goalAPI.getDailyReports(userId, today, today)
      return reports.length > 0 ? reports[0] : null
    } catch (error) {
      console.error('获取今日日报失败:', error)
      throw error
    }
  },

  // 创建新的日报
  async create(data: Partial<DailyReport>): Promise<DailyReport> {
    try {
      return await goalAPI.createDailyReport(data)
    } catch (error) {
      console.error('创建日报失败:', error)
      throw error
    }
  },

  // 更新日报
  async update(id: string, data: Partial<DailyReport>): Promise<DailyReport> {
    try {
      return await goalAPI.updateDailyReport(id, data)
    } catch (error) {
      console.error('更新日报失败:', error)
      throw error
    }
  },

  // 提交日报
  async submit(id: string): Promise<DailyReport> {
    try {
      return await goalAPI.updateDailyReport(id, { status: 'submitted' })
    } catch (error) {
      console.error('提交日报失败:', error)
      throw error
    }
  },

  // 审批日报
  async approve(id: string): Promise<DailyReport> {
    try {
      return await goalAPI.updateDailyReport(id, { status: 'approved' })
    } catch (error) {
      console.error('审批日报失败:', error)
      throw error
    }
  }
}

/**
 * 目标管理统计服务
 */
export const goalStatisticsService = {
  // 获取目标达成统计
  async getGoalCompletionStats(year: number, month?: number) {
    try {
      const personalGoals = await goalAPI.getPersonalMonthlyGoals(undefined, year, month)
      const teamGoals = await goalAPI.getTeamMonthlyGoals(year, month)
      
      // 计算完成率
      const personalCompletionRate = personalGoals.length > 0 
        ? personalGoals.filter(g => g.status === 'completed').length / personalGoals.length * 100
        : 0
      
      const teamCompletionRate = teamGoals.length > 0
        ? teamGoals.filter(g => g.status === 'completed').length / teamGoals.length * 100
        : 0
      
      // 计算平均进度
      const avgPersonalProgress = personalGoals.length > 0
        ? personalGoals.reduce((sum, g) => sum + g.progress, 0) / personalGoals.length
        : 0
      
      const avgTeamProgress = teamGoals.length > 0
        ? teamGoals.reduce((sum, g) => sum + g.progress, 0) / teamGoals.length
        : 0
      
      return {
        personalGoals: {
          total: personalGoals.length,
          completed: personalGoals.filter(g => g.status === 'completed').length,
          completionRate: personalCompletionRate,
          avgProgress: avgPersonalProgress
        },
        teamGoals: {
          total: teamGoals.length,
          completed: teamGoals.filter(g => g.status === 'completed').length,
          completionRate: teamCompletionRate,
          avgProgress: avgTeamProgress
        }
      }
    } catch (error) {
      console.error('获取目标统计失败:', error)
      throw error
    }
  },

  // 获取目标趋势数据
  async getGoalTrends(year: number, userId?: string) {
    try {
      const months = Array.from({ length: 12 }, (_, i) => i + 1)
      const trends = await Promise.all(
        months.map(async (month) => {
          const goals = userId 
            ? await goalAPI.getPersonalMonthlyGoals(userId, year, month)
            : await goalAPI.getTeamMonthlyGoals(year, month)
          
          const avgProgress = goals.length > 0
            ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length
            : 0
          
          return {
            month,
            goalCount: goals.length,
            avgProgress,
            completedCount: goals.filter(g => g.status === 'completed').length
          }
        })
      )
      
      return trends
    } catch (error) {
      console.error('获取目标趋势失败:', error)
      throw error
    }
  }
}

// 导出所有服务
export default {
  companyYearlyGoal: companyYearlyGoalService,
  teamMonthlyGoal: teamMonthlyGoalService,
  personalMonthlyGoal: personalMonthlyGoalService,
  dailyReport: dailyReportService,
  statistics: goalStatisticsService
} 