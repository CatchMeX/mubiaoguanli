// @ts-nocheck
import { supabase, executeQuery, executePaginatedQuery } from "@/lib/supabase";
import type {
  User,
  Department,
  Project,
  Customer,
  Supplier,
  Asset,
  AssetCategory,
  AssetLocation,
  AssetBrand,
  Team,
  EmployeeMileage,
  CompanyYearlyGoal,
  QuarterlyGoal,
  TeamMonthlyGoal,
  PersonalMonthlyGoal,
  DailyReport,
  Task,
  TaskProgress,
  Permission,
  Role,
  UserRole,
  Workflow,
  WorkflowNode,
  WorkflowTransition,
  WorkflowInstance,
  CostCenter,
  CostRecord,
  Todo,
  FinanceCategory,
  AllocationConfig,
  AllocationRecord,
  AllocationSummary,
  AlertRule,
  AlertRecord,
  TeamPerformanceConfig,
  PerformanceTier,
  TeamAllocationConfig,
  Position,
  AssetMovement,
  InventoryPlan,
  InventoryPlanRecord,
  InventoryAdjustment,
  ProcurementOrder,
  ProcurementOrderItem,
  ProcurementReceipt,
  ProcurementReceiptItem,
  MaintenancePlan,
  MaintenanceRecord,
  AssetDisposal,
  RideSharingDailyReport,
  RideSharingDailyReportFormData,
  RideSharingStatistics
} from "@/types";
import type {
  SalesOrder,
  SalesOrderItem,
  SalesOrderDetail,
  SalesOrderItemDetail,
  CreateSalesOrderData,
  CreateSalesOrderItemData,
  UpdateSalesOrderData,
  SalesOrderStatistics,
  SalesOrderFilters
} from "@/types/sales";
import type { ExpenseCategory, ExpenseRecord } from "@/types/expense";
import type { RevenueCategory, RevenueRecord } from "@/types/revenue";
import type { AccountsRecord, SettlementRecord } from "@/types/accounts";
import type { InventoryRecord } from "@/types/inventory";

// =============================================================================
// 通用 CRUD 操作
// =============================================================================

class BaseAPI<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async getAll(): Promise<T[]> {
    return executeQuery(supabase.from(this.tableName).select("*"));
  }

  async getById(id: string): Promise<T | null> {
    const data = await executeQuery(
      supabase.from(this.tableName).select("*").eq("id", id).single()
    );
    return data;
  }

  async create(data: Partial<T>): Promise<T> {
    return executeQuery(
      supabase.from(this.tableName).insert(data).select().single()
    );
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return executeQuery(
      supabase.from(this.tableName).update(data).eq("id", id).select().single()
    );
  }

  async delete(id: string): Promise<void> {
    await executeQuery(supabase.from(this.tableName).delete().eq("id", id));
  }

  async getPaginated(page: number = 1, pageSize: number = 10, filters?: any) {
    let query = supabase.from(this.tableName).select("*", { count: "exact" });

    // 应用过滤器
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value);
        }
      });
    }

    return executePaginatedQuery(query, page, pageSize);
  }
}

// =============================================================================
// 用户管理 API
// =============================================================================

class UserAPI extends BaseAPI<User> {
  constructor() {
    super("users");
  }

  async getByEmployeeId(employeeId: string): Promise<User | null> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .eq("employee_id", employeeId)
        .maybeSingle()
    );
  }

  async getByEmail(email: string): Promise<User | null> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("email", email).maybeSingle()
    );
  }

  async getUsersWithDepartments(): Promise<User[]> {
    return executeQuery(
      supabase.from(this.tableName).select(`
          *,
          user_departments (
            is_primary,
            departments (*)
          )
        `)
    );
  }

  async updateUserDepartments(
    userId: string,
    departmentIds: string[],
    primaryDepartmentId: string
  ) {
    // 删除现有关联
    await executeQuery(
      supabase.from("user_departments").delete().eq("user_id", userId)
    );

    // 添加新关联
    const userDepartments = departmentIds.map((deptId) => ({
      user_id: userId,
      department_id: deptId,
      is_primary: deptId === primaryDepartmentId
    }));

    return executeQuery(
      supabase.from("user_departments").insert(userDepartments)
    );
  }

  async getUserPositions(userId: string): Promise<Position[]> {
    return executeQuery(
      supabase
        .from("users")
        .select(
          `
          position_id,
          position:positions!users_position_id_fkey (*)
        `
        )
        .eq("id", userId)
        .single()
    ).then((user) => (user?.position ? [user.position] : []));
  }

  async assignUserPosition(
    userId: string,
    positionId: string,
    assignedBy?: string
  ) {
    return executeQuery(
      supabase
        .from("users")
        .update({ position_id: positionId })
        .eq("id", userId)
    );
  }

  async removeUserPosition(userId: string, positionId: string) {
    return executeQuery(
      supabase
        .from("users")
        .update({ position_id: null })
        .eq("id", userId)
        .eq("position_id", positionId)
    );
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return executeQuery(
      supabase
        .from("user_roles")
        .select(
          `
          *,
          role:roles (*),
          assigned_by_user:users!user_roles_assigned_by_fkey (*)
        `
        )
        .eq("user_id", userId)
    );
  }

  async assignUserRole(userId: string, roleId: string, assignedBy?: string) {
    return executeQuery(
      supabase.from("user_roles").insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy
      })
    );
  }

  async removeUserRole(userId: string, roleId: string) {
    return executeQuery(
      supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role_id", roleId)
    );
  }

  // 获取用户完整信息，包括职位、部门、角色
  async getUsersWithRelations(): Promise<User[]> {
    return executeQuery(supabase.from("users_with_relations").select("*"));
  }

  async getUserWithRelations(userId: string): Promise<User | null> {
    console.log('🔍 getUserWithRelations: 开始获取用户ID:', userId);
    
    try {
      // 先尝试获取基本用户信息
      const basicUser = await executeQuery(
        supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single()
      );
      console.log('🔍 getUserWithRelations: 基本用户信息:', basicUser);
      
      // 然后获取完整的用户关系信息
      const userWithRelations = await executeQuery(
        supabase
          .from("users_with_relations")
          .select("*")
          .eq("id", userId)
          .single()
      );
      console.log('🔍 getUserWithRelations: 完整用户关系信息:', userWithRelations);
      console.log('🔍 getUserWithRelations: roles字段类型:', typeof userWithRelations?.roles);
      console.log('🔍 getUserWithRelations: roles字段值:', userWithRelations?.roles);
      console.log('🔍 getUserWithRelations: roles是否为数组:', Array.isArray(userWithRelations?.roles));
      
      if (userWithRelations?.roles) {
        console.log('🔍 getUserWithRelations: 角色数量:', userWithRelations.roles.length);
        userWithRelations.roles.forEach((role: any, index: number) => {
          console.log(`🔍 getUserWithRelations: 角色 ${index + 1}:`, {
            id: role.id,
            name: role.name,
            code: role.code,
            permissionsCount: role.permissions?.length || 0
          });
        });
      }
      
      return userWithRelations;
    } catch (error) {
      console.error('❌ getUserWithRelations: 获取用户关系信息失败:', error);
      
      // 如果视图查询失败，尝试手动构建用户关系
      try {
        console.log('🔍 getUserWithRelations: 尝试手动构建用户关系...');
        
        // 获取用户角色
        const userRoles = await executeQuery(
          supabase
            .from("user_roles")
            .select(`
              role_id,
              roles!inner(
                id,
                name,
                code,
                description,
                status,
                is_system,
                role_permissions!inner(
                  permission_id,
                  permissions!inner(
                    id,
                    name,
                    code,
                    type,
                    description
                  )
                )
              )
            `)
            .eq("user_id", userId)
        );
        
        console.log('🔍 getUserWithRelations: 手动查询的用户角色:', userRoles);
        
        // 构建用户对象
        const user = basicUser;
        if (userRoles && userRoles.length > 0) {
          user.roles = userRoles.map((ur: any) => {
            const role = ur.roles;
            return {
              id: role.id,
              name: role.name,
              code: role.code,
              description: role.description,
              status: role.status,
              is_system: role.is_system,
              permissions: role.role_permissions?.map((rp: any) => rp.permissions) || []
            };
          });
        }
        
        console.log('🔍 getUserWithRelations: 手动构建的用户对象:', user);
        return user;
        
      } catch (manualError) {
        console.error('❌ getUserWithRelations: 手动构建用户关系也失败:', manualError);
        return basicUser;
      }
    }
  }

  // 密码重置相关方法
  async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 检查用户是否存在
      const user = await this.getByEmail(email);
      if (!user) {
        return { success: false, message: "用户不存在" };
      }

      // 在实际应用中，这里应该：
      // 1. 生成重置令牌
      // 2. 将令牌存储到数据库
      // 3. 发送包含令牌的邮件
      console.log("Sending password reset email to:", email);

      // 模拟成功响应
      return { success: true, message: "重置密码邮件已发送" };
    } catch (error) {
      console.error("Password reset request failed:", error);
      return { success: false, message: "重置密码请求失败" };
    }
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 在实际应用中，这里应该：
      // 1. 验证令牌是否有效
      // 2. 检查令牌是否过期
      // 3. 更新用户密码
      // 4. 删除或标记令牌为已使用
      console.log("Resetting password with token:", token);

      // 模拟成功响应
      return { success: true, message: "密码重置成功" };
    } catch (error) {
      console.error("Password reset failed:", error);
      return { success: false, message: "密码重置失败" };
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 在实际应用中，这里应该：
      // 1. 验证当前密码是否正确
      // 2. 加密新密码
      // 3. 更新数据库中的密码
      console.log("Changing password for user:", userId);

      // 模拟成功响应
      return { success: true, message: "密码修改成功" };
    } catch (error) {
      console.error("Password change failed:", error);
      return { success: false, message: "密码修改失败" };
    }
  }

  async adminResetPassword(
    userId: string,
    newPassword?: string
  ): Promise<{
    success: boolean;
    message: string;
    temporaryPassword?: string;
  }> {
    try {
      const passwordToSet = newPassword || Math.random().toString(36).slice(-8);

      // 更新用户密码
      await executeQuery(
        supabase
          .from("users")
          .update({
            password: passwordToSet,
            password_changed_at: new Date().toISOString()
          })
          .eq("id", userId)
      );

      console.log("Admin reset password success for user:", userId);

      return {
        success: true,
        message: "管理员重置密码成功",
        temporaryPassword: passwordToSet
      };
    } catch (error) {
      console.error("Admin password reset failed:", error);
      return { success: false, message: "管理员重置密码失败" };
    }
  }

  async validatePassword(
    employeeId: string,
    password: string
  ): Promise<{ valid: boolean; user?: User }> {
    try {
      const user = await this.getByEmployeeId(employeeId);
      if (!user) {
        return { valid: false };
      }

      // 简单密码验证（在实际应用中应该使用加密的密码）
      if (user.password === password) {
        // 更新最后登录时间
        await executeQuery(
          supabase
            .from("users")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", user.id)
        );

        return { valid: true, user };
      }

      return { valid: false };
    } catch (error) {
      console.error("Password validation failed:", error);
      return { valid: false };
    }
  }
}

// =============================================================================
// 职位管理 API
// =============================================================================

class PositionAPI extends BaseAPI<Position> {
  constructor() {
    super("positions");
  }

  async getByCode(code: string): Promise<Position | null> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("code", code).single()
    );
  }

  async getByDepartment(departmentId: string): Promise<Position[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .eq("department_id", departmentId)
    );
  }

  async getActivePositions(): Promise<Position[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .eq("status", "active")
        .order("level", { ascending: true })
    );
  }

  // 获取活跃的职位名称（从新的position_names表）
  async getActivePositionNames(): Promise<any[]> {
    return executeQuery(supabase.rpc("get_active_position_names_for_members"));
  }

  async getPositionsByLevel(level: number): Promise<Position[]> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("level", level)
    );
  }

  async getPositionsWithDepartments(): Promise<Position[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select(
          `
          *,
          department:departments (*)
        `
        )
        .order("level", { ascending: true })
    );
  }

  async searchPositions(searchTerm: string): Promise<Position[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .or(
          `name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        )
    );
  }
}

// =============================================================================
// 职级管理 API
// =============================================================================

class JobLevelAPI {
  // 获取活跃的职级名称
  async getActiveJobLevelNames(): Promise<any[]> {
    return executeQuery(supabase.rpc("get_active_job_level_names_for_members"));
  }
}

// =============================================================================
// 部门管理 API
// =============================================================================

class DepartmentAPI extends BaseAPI<Department> {
  constructor() {
    super("departments");
  }

  async getHierarchy(): Promise<Department[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .order("level", { ascending: true })
        .order("sort_order", { ascending: true })
    );
  }

  async getHierarchyWithManager(): Promise<Department[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select(`
          *,
          manager:users!departments_manager_id_fkey (*)
        `)
        .order("level", { ascending: true })
        .order("sort_order", { ascending: true })
    );
  }

  async getByCode(code: string): Promise<Department | null> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("code", code).maybeSingle()
    );
  }

  async getChildDepartments(parentId: string): Promise<Department[]> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("parent_id", parentId)
    );
  }

  async getDepartmentWithManager(id: string): Promise<Department | null> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select(
          `
          *,
          manager:users!departments_manager_id_fkey (*)
        `
        )
        .eq("id", id)
        .single()
    );
  }

  async getDepartmentMembers(departmentId: string): Promise<User[]> {
    const result = await executeQuery(
      supabase
        .from("user_departments")
        .select(
          `
          user:users!user_departments_user_id_fkey (*)
        `
        )
        .eq("department_id", departmentId)
    );

    // 使用 Set 来去重用户
    const uniqueUsers = new Set();
    const users = result
      .map((item) => item.user)
      .filter((user) => {
        if (uniqueUsers.has(user.id)) {
          return false;
        }
        uniqueUsers.add(user.id);
        return true;
      });

    return users;
  }
}

// =============================================================================
// 项目管理 API
// =============================================================================

class ProjectAPI extends BaseAPI<Project> {
  constructor() {
    super("projects");
  }

  async getByCode(code: string): Promise<Project | null> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("code", code).single()
    );
  }

  async getProjectsWithDetails(): Promise<Project[]> {
    return executeQuery(
      supabase.from(this.tableName).select(`
          *,
          manager:users!projects_manager_id_fkey (*),
          department:departments!projects_department_id_fkey (*)
        `)
    );
  }

  async getActiveProjects(): Promise<Project[]> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("status", "active")
    );
  }
}

// =============================================================================
// 目标管理 API
// =============================================================================

class GoalAPI {
  // 公司年度目标
  async getCompanyYearlyGoals(): Promise<CompanyYearlyGoal[]> {
    return executeQuery(
      supabase
        .from("company_yearly_goals")
        .select(
          `
          *,
          manager:users!company_yearly_goals_manager_id_fkey (*),
          creator:users!company_yearly_goals_created_by_fkey (*),
          unit:units!company_yearly_goals_unit_id_fkey (*),
          quarters:quarterly_goals (*),
          team_monthly_goals:team_monthly_goals!team_monthly_goals_company_yearly_goal_id_fkey (
            *,
            department:departments!team_monthly_goals_department_id_fkey (*),
            unit:units!team_monthly_goals_unit_id_fkey (*),
            creator:users!team_monthly_goals_created_by_fkey (*),
            personalGoals:personal_monthly_goals!personal_monthly_goals_team_monthly_goal_id_fkey (
              *,
              user:users!personal_monthly_goals_user_id_fkey (
                id,
                name,
                employee_id
              ),
              unit:units!personal_monthly_goals_unit_id_fkey (*),
              creator:users!personal_monthly_goals_created_by_fkey (*),
              dailyReports:daily_reports!daily_reports_personal_monthly_goal_id_fkey (*)
            )
          )
        `
        )
        .is("deleted_at", null) // 只获取未删除的目标
        .order("year", { ascending: false })
    );
  }

  async createCompanyYearlyGoal(
    data: Partial<CompanyYearlyGoal>
  ): Promise<CompanyYearlyGoal> {
    return executeQuery(
      supabase.from("company_yearly_goals").insert(data).select().single()
    );
  }

  // 获取所有年度目标（包括已删除的），用于显示关联状态
  async getAllCompanyYearlyGoals(): Promise<CompanyYearlyGoal[]> {
    return executeQuery(
      supabase
        .from("company_yearly_goals")
        .select(
          `
          *,
          manager:users!company_yearly_goals_manager_id_fkey (*),
          creator:users!company_yearly_goals_created_by_fkey (*),
          unit:units!company_yearly_goals_unit_id_fkey (*)
        `
        )
        .order("year", { ascending: false })
    );
  }

  async updateCompanyYearlyGoal(
    id: string,
    data: Partial<CompanyYearlyGoal>
  ): Promise<CompanyYearlyGoal> {
    return executeQuery(
      supabase
        .from("company_yearly_goals")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async deleteCompanyYearlyGoal(id: string): Promise<void> {
    // 软删除年度目标，只设置deleted_at字段，不删除相关数据
    await executeQuery(
      supabase
        .from("company_yearly_goals")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
    );
  }

  // 季度目标
  async createQuarterlyGoal(
    data: Partial<QuarterlyGoal>
  ): Promise<QuarterlyGoal> {
    return executeQuery(
      supabase.from("quarterly_goals").insert(data).select().single()
    );
  }

  async updateQuarterlyGoal(
    id: string,
    data: Partial<QuarterlyGoal>
  ): Promise<QuarterlyGoal> {
    return executeQuery(
      supabase
        .from("quarterly_goals")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  // 团队月度目标
  async getTeamMonthlyGoals(
    year?: number,
    month?: number
  ): Promise<TeamMonthlyGoal[]> {
    // 先获取团队月度目标
    let query = supabase.from("team_monthly_goals").select(`
        *,
        department:departments!team_monthly_goals_department_id_fkey (*),
        creator:users!team_monthly_goals_created_by_fkey (*),
        unit:units!team_monthly_goals_unit_id_fkey (*),
        personalGoals:personal_monthly_goals!personal_monthly_goals_team_monthly_goal_id_fkey (
          *,
          user:users!personal_monthly_goals_user_id_fkey (
            id,
            name,
            employee_id,
            position_id
          ),
          unit:units!personal_monthly_goals_unit_id_fkey (*),
          daily_reports:daily_reports!daily_reports_personal_monthly_goal_id_fkey (*)
        )
      `);

    if (year) query = query.eq("year", year);
    if (month) query = query.eq("month", month);

    const teamGoals = await executeQuery(
      query
        .is("deleted_at", null) // 只获取未删除的目标
        .order("year", { ascending: false })
        .order("month", { ascending: false })
    );

    // 获取所有年度目标（包括已删除的）
    const allYearlyGoals = await this.getAllCompanyYearlyGoals();

    // 为每个团队目标添加关联的年度目标信息
    const teamGoalsWithYearlyGoals = teamGoals.map(teamGoal => {
      const yearlyGoal = allYearlyGoals.find(yg => yg.id === teamGoal.company_yearly_goal_id);
      return {
        ...teamGoal,
        company_yearly_goal: yearlyGoal || null
      };
    });

    return teamGoalsWithYearlyGoals;
  }

  async createTeamMonthlyGoal(
    data: Partial<TeamMonthlyGoal>
  ): Promise<TeamMonthlyGoal> {
    return executeQuery(
      supabase.from("team_monthly_goals").insert(data).select().single()
    );
  }

  // 获取所有部门月度目标（包括已删除的），用于显示关联状态
  async getAllTeamMonthlyGoals(): Promise<TeamMonthlyGoal[]> {
    return executeQuery(
      supabase
        .from("team_monthly_goals")
        .select(`
          *,
          department:departments!team_monthly_goals_department_id_fkey (*),
          creator:users!team_monthly_goals_created_by_fkey (*),
          unit:units!team_monthly_goals_unit_id_fkey (*)
        `)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
    );
  }

  async updateTeamMonthlyGoal(
    id: string,
    data: Partial<TeamMonthlyGoal>
  ): Promise<TeamMonthlyGoal> {
    return executeQuery(
      supabase
        .from("team_monthly_goals")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async deleteTeamMonthlyGoal(id: string): Promise<void> {
    // 软删除部门月度目标，只设置deleted_at字段，不删除相关数据
    await executeQuery(
      supabase
        .from("team_monthly_goals")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
    );
  }

  // 个人月度目标
  async getPersonalMonthlyGoals(
    userId?: string,
    year?: number,
    month?: number
  ): Promise<PersonalMonthlyGoal[]> {
    console.log("=== 获取个人月度目标 ===");
    console.log("参数:", { userId, year, month });

    // 先获取个人月度目标
    let query = supabase
      .from("personal_monthly_goals")
      .select(
        `
        *,
        user:users!personal_monthly_goals_user_id_fkey (*),
        creator:users!personal_monthly_goals_created_by_fkey (*),
        team_monthly_goal:team_monthly_goals!personal_monthly_goals_team_monthly_goal_id_fkey (
          *,
          department:departments!team_monthly_goals_department_id_fkey (*),
          unit:units!team_monthly_goals_unit_id_fkey (*),
          creator:users!team_monthly_goals_created_by_fkey (*)
        ),
        unit:units!personal_monthly_goals_unit_id_fkey (*),
        dailyReports:daily_reports!daily_reports_personal_monthly_goal_id_fkey (
          id,
          report_date,
          performance_value,
          work_content,
          status,
          created_at
        )
      `
      )
      .order("created_at", { ascending: false });

    // 如果提供了用户ID，则按用户ID筛选
    if (userId) {
      query = query.eq("user_id", userId);
    }

    // 如果提供了年份，则按年份筛选
    if (year) {
      query = query.eq("year", year);
    }

    // 如果提供了月份，则按月份筛选
    if (month) {
      query = query.eq("month", month);
    }

    const result = await executeQuery(query);
    console.log("查询结果:", result);

    if (!result) {
      console.log("未找到个人月度目标");
      return [];
    }

    // 获取所有年度目标（包括已删除的）
    const allYearlyGoals = await this.getAllCompanyYearlyGoals();
    
    // 获取所有部门月度目标（包括已删除的）
    const allTeamGoals = await this.getAllTeamMonthlyGoals();

    // 为每个个人目标添加关联的年度目标和部门目标信息
    const personalGoalsWithYearlyGoals = result.map((goal) => {
      let teamGoalWithYearlyGoal = goal.team_monthly_goal;
      
      if (goal.team_monthly_goal_id) {
        // 查找关联的部门目标（包括已删除的）
        const teamGoal = allTeamGoals.find(tg => tg.id === goal.team_monthly_goal_id);
        if (teamGoal) {
          // 如果部门目标存在，添加年度目标信息
          if (teamGoal.company_yearly_goal_id) {
            const yearlyGoal = allYearlyGoals.find(yg => yg.id === teamGoal.company_yearly_goal_id);
            teamGoalWithYearlyGoal = {
              ...teamGoal,
              company_yearly_goal: yearlyGoal || null
            };
          } else {
            teamGoalWithYearlyGoal = teamGoal;
          }
        }
      }

      return {
        ...goal,
        team_monthly_goal: teamGoalWithYearlyGoal,
        dailyReports: goal.dailyReports?.sort(
          (a, b) =>
            new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
        )
      };
    });

    return personalGoalsWithYearlyGoals;
  }

  async createPersonalMonthlyGoal(
    data: Partial<PersonalMonthlyGoal>
  ): Promise<PersonalMonthlyGoal> {
    return executeQuery(
      supabase.from("personal_monthly_goals").insert(data).select().single()
    );
  }

  async updatePersonalMonthlyGoal(
    id: string,
    data: Partial<PersonalMonthlyGoal>
  ): Promise<PersonalMonthlyGoal> {
    return executeQuery(
      supabase
        .from("personal_monthly_goals")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  // 日报
  async getDailyReports(
    userId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<DailyReport[]> {
    let query = supabase.from("daily_reports").select(`
        *,
        user:users!daily_reports_user_id_fkey (*),
        personal_monthly_goal:personal_monthly_goals!daily_reports_personal_monthly_goal_id_fkey (*)
      `);

    if (userId) query = query.eq("user_id", userId);
    if (startDate) query = query.gte("report_date", startDate);
    if (endDate) query = query.lte("report_date", endDate);

    return executeQuery(query.order("report_date", { ascending: false }));
  }

  async createDailyReport(data: Partial<DailyReport>): Promise<DailyReport> {
    try {
      // 创建日报
      const result = await executeQuery(
        supabase
          .from("daily_reports")
          .insert(data)
          .select(
            `
            *,
            personal_monthly_goal:personal_monthly_goals!daily_reports_personal_monthly_goal_id_fkey (
              *,
              user:users!personal_monthly_goals_user_id_fkey (*),
              team_monthly_goal:team_monthly_goals!personal_monthly_goals_team_monthly_goal_id_fkey (
                *,
                department:departments!team_monthly_goals_department_id_fkey (*)
              ),
              daily_reports:daily_reports!daily_reports_personal_monthly_goal_id_fkey (*)
            )
          `
          )
          .single()
      );

      if (!result) {
        throw new Error("Failed to create daily report");
      }

      // 更新个人目标进度
      if (result.personal_monthly_goal_id) {
        await this.updatePersonalGoalProgress(result.personal_monthly_goal_id);
      }

      // 获取更新后的个人目标
      const updatedGoal = await executeQuery(
        supabase
          .from("personal_monthly_goals")
          .select(
            `
            *,
            user:users!personal_monthly_goals_user_id_fkey (*),
            team_monthly_goal:team_monthly_goals!personal_monthly_goals_team_monthly_goal_id_fkey (
              *,
              department:departments!team_monthly_goals_department_id_fkey (*)
            ),
            daily_reports:daily_reports!daily_reports_personal_monthly_goal_id_fkey (*)
          `
          )
          .eq("id", result.personal_monthly_goal_id)
          .single()
      );

      // 返回创建的日报，并包含更新后的关联数据
      return {
        ...result,
        personal_monthly_goal: updatedGoal
      };
    } catch (error) {
      console.error("创建日报失败:", error);
      throw error;
    }
  }

  async updateDailyReport(
    id: string,
    data: Partial<DailyReport>
  ): Promise<DailyReport> {
    const result = await executeQuery(
      supabase.from("daily_reports").update(data).eq("id", id).select().single()
    );

    // 自动更新个人目标进度
    if (result.personal_monthly_goal_id) {
      await this.updatePersonalGoalProgress(result.personal_monthly_goal_id);
    }

    return result;
  }

  async deleteDailyReport(id: string): Promise<void> {
    // 先获取日报信息，以便更新个人目标进度
    const report = await executeQuery(
      supabase.from("daily_reports").select("personal_monthly_goal_id").eq("id", id).single()
    );

    // 删除日报
    await executeQuery(
      supabase.from("daily_reports").delete().eq("id", id)
    );

    // 自动更新个人目标进度
    if (report?.personal_monthly_goal_id) {
      await this.updatePersonalGoalProgress(report.personal_monthly_goal_id);
    }
  }

  // 更新个人目标进度的辅助方法
  async updatePersonalGoalProgress(personalGoalId: string): Promise<void> {
    try {
      console.log("=== 更新个人目标进度 ===");
      console.log("个人目标ID:", personalGoalId);

      // 获取个人目标信息
      const personalGoal = await executeQuery(
        supabase
          .from("personal_monthly_goals")
          .select(
            `
            *,
            daily_reports:daily_reports!daily_reports_personal_monthly_goal_id_fkey (
              performance_value
            )
          `
          )
          .eq("id", personalGoalId)
          .single()
      );

      if (!personalGoal) {
        console.log("未找到个人目标");
        return;
      }

      console.log("个人目标信息:", personalGoal);

      // 计算实际收入
      const actualRevenue =
        personalGoal.daily_reports?.reduce(
          (sum: number, report: any) => sum + (report.performance_value || 0),
          0
        ) || 0;

      // 计算进度
      const progress = Math.min(
        Math.round((actualRevenue / personalGoal.target_value) * 100),
        100
      );

      console.log("计算结果:", { actualRevenue, progress });

      // 更新个人目标进度
      await executeQuery(
        supabase
          .from("personal_monthly_goals")
          .update({
            progress,
            updated_at: new Date().toISOString()
          })
          .eq("id", personalGoalId)
      );

      console.log("进度更新完成");
    } catch (error) {
      console.error("更新个人目标进度失败:", error);
      throw error; // 抛出错误以便调用方知道更新失败
    }
  }

  async deletePersonalMonthlyGoal(id: string): Promise<void> {
    // 先删除关联的每日报告
    await executeQuery(
      supabase.from("daily_reports").delete().eq("personal_monthly_goal_id", id)
    );

    // 然后删除个人月度目标
    await executeQuery(
      supabase.from("personal_monthly_goals").delete().eq("id", id)
    );
  }

  // 目标看板数据
  async getGoalDashboardData(year?: number) {
    // 获取公司年度目标（包含关联的团队月度目标和个人目标）
    let yearlyQuery = supabase
      .from("company_yearly_goals")
      .select(
        `
        *,
        manager:users!company_yearly_goals_manager_id_fkey (*),
        creator:users!company_yearly_goals_created_by_fkey (*),
        unit:units!company_yearly_goals_unit_id_fkey (*),
        quarters:quarterly_goals (*),
        team_monthly_goals:team_monthly_goals!team_monthly_goals_company_yearly_goal_id_fkey (
          *,
          department:departments!team_monthly_goals_department_id_fkey (*),
          creator:users!team_monthly_goals_created_by_fkey (*),
          unit:units!team_monthly_goals_unit_id_fkey (*),
          personalGoals:personal_monthly_goals!personal_monthly_goals_team_monthly_goal_id_fkey (
            *,
            user:users!personal_monthly_goals_user_id_fkey (
              id,
              name,
              employee_id,
              position_id
            ),
            creator:users!personal_monthly_goals_created_by_fkey (*),
            unit:units!personal_monthly_goals_unit_id_fkey (*),
            daily_reports:daily_reports!daily_reports_personal_monthly_goal_id_fkey (*)
          )
        )
      `
      )
      .is("deleted_at", null) // 只获取未删除的年度目标
      .order("year", { ascending: false });

    if (year) {
      yearlyQuery = yearlyQuery.eq("year", year);
    }

    const yearlyGoals = await executeQuery(yearlyQuery);

    // 展平团队月度目标数据
    const teamMonthlyGoals: any[] = [];
    const personalMonthlyGoals: any[] = [];

    yearlyGoals.forEach((yearlyGoal) => {
      if (yearlyGoal.team_monthly_goals) {
        // 过滤掉已删除的团队月度目标
        const activeTeamGoals = yearlyGoal.team_monthly_goals.filter((teamGoal: any) => !teamGoal.deleted_at);
        
        activeTeamGoals.forEach((teamGoal: any) => {
          // 添加company_yearly_goal引用
          teamGoal.company_yearly_goal = {
            id: yearlyGoal.id,
            title: yearlyGoal.title,
            year: yearlyGoal.year,
            target_value: yearlyGoal.target_value,
            unit: yearlyGoal.unit
          };
          teamMonthlyGoals.push(teamGoal);

          // 处理个人目标
          if (teamGoal.personalGoals) {
            // 过滤掉已删除的个人目标
            const activePersonalGoals = teamGoal.personalGoals.filter((personalGoal: any) => !personalGoal.deleted_at);
            
            activePersonalGoals.forEach((personalGoal: any) => {
              // 确保个人目标有正确的关联信息
              personalGoal.team_monthly_goal_id = teamGoal.id;
              personalGoal.team_monthly_goal = {
                id: teamGoal.id,
                department: teamGoal.department,
                year: teamGoal.year,
                month: teamGoal.month,
                target_value: teamGoal.target_value,
                unit: teamGoal.unit
              };
              personalMonthlyGoals.push(personalGoal);
            });
          }
        });
      }
    });

    return {
      yearlyGoals,
      teamMonthlyGoals,
      personalMonthlyGoals
    };
  }
}

// =============================================================================
// 客户管理 API
// =============================================================================

class CustomerAPI extends BaseAPI<Customer> {
  constructor() {
    super("customers");
  }

  async getByCode(code: string): Promise<Customer | null> {
    return executeQuery(
      supabase.from("customers").select("*").eq("code", code).single()
    );
  }

  async getActiveCustomers(): Promise<Customer[]> {
    return executeQuery(
      supabase.from("customers").select("*").eq("status", "active")
    );
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    return executeQuery(
      supabase
        .from("customers")
        .select("*")
        .or(
          `name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`
        )
    );
  }
}

// =============================================================================
// 供应商管理 API
// =============================================================================

class SupplierAPI extends BaseAPI<Supplier> {
  constructor() {
    super("suppliers");
  }

  async getByCode(code: string): Promise<Supplier | null> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("code", code).single()
    );
  }

  async getActiveSuppliers(): Promise<Supplier[]> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("status", "active")
    );
  }

  async searchSuppliers(searchTerm: string): Promise<Supplier[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .or(
          `name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`
        )
    );
  }
}

// =============================================================================
// 费用管理 API
// =============================================================================

class ExpenseAPI {
  // 费用分类
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return executeQuery(
      supabase
        .from("expense_categories")
        .select("*")
        .order("level", { ascending: true })
        .order("code", { ascending: true })
    );
  }

  async createExpenseCategory(
    data: Partial<ExpenseCategory>
  ): Promise<ExpenseCategory> {
    return executeQuery(
      supabase.from("expense_categories").insert(data).select().single()
    );
  }

  // 费用记录
  async getExpenseRecords(filters?: any): Promise<ExpenseRecord[]> {
    let query = supabase.from("expense_records").select(`
        *,
        category:finance_categories!expense_records_category_id_fkey (*),
        supplier:suppliers!expense_records_supplier_id_fkey (*),
        department:departments!expense_records_department_id_fkey (*),
        applicant:users!expense_records_applicant_id_fkey (*),
        project:projects!expense_records_project_id_fkey (*),
        created_by_user:users!expense_records_created_by_fkey (*)
      `);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value);
        }
      });
    }

    const expenseRecords = await executeQuery(
      query.order("created_at", { ascending: false })
    );

    // 加载每个费用记录的分摊记录，并映射字段
    const expenseRecordsWithAllocations = await Promise.all(
      expenseRecords.map(async (expenseRecord: any) => {
        const allocationRecords = await this.getAllocationRecordsByExpenseId(
          expenseRecord.id
        );

        // 映射字段以匹配前端期望的结构
        return {
          ...expenseRecord,
          // 将 category_id 映射为 financial_category_id (保持向后兼容)
          financial_category_id: expenseRecord.category_id,
          // category 字段已由数据库查询直接提供
          allocation_records: allocationRecords,
          is_allocation_enabled: allocationRecords.length > 0
        };
      })
    );

    return expenseRecordsWithAllocations;
  }

  async getAllocationRecordsByExpenseId(
    expenseId: string
  ): Promise<AllocationRecord[]> {
    const records = await executeQuery(
      supabase
        .from("allocation_records")
        .select("*")
        .eq("source_record_type", "expense")
        .eq("source_record_id", expenseId)
        .order("created_at", { ascending: false })
    );

    // 为每个分摊记录添加团队分摊配置信息
    const recordsWithConfig = await Promise.all(
      records.map(async (record) => {
        // 从团队分摊配置中获取信息
        const teamConfig = await executeQuery(
          supabase
            .from("team_allocation_configs")
            .select(
              `
              *,
              team:teams (*)
            `
            )
            .eq("id", record.allocation_config_id)
            .single()
        );

        return {
          ...record,
          allocation_config: teamConfig
            ? {
                id: teamConfig.id,
                name: teamConfig.team?.name || "未知团队",
                target_type: "department" as const,
                target_id: teamConfig.team_id,
                allocation_ratio: teamConfig.allocation_ratio,
                is_enabled: teamConfig.is_enabled,
                created_by_id: teamConfig.created_by_id,
                created_at: teamConfig.created_at,
                updated_at: teamConfig.updated_at,
                target: teamConfig.team
              }
            : null
        };
      })
    );

    return recordsWithConfig;
  }

  async createExpenseRecord(
    data: Partial<ExpenseRecord>
  ): Promise<ExpenseRecord> {
    // 自动生成费用编号和计算必填字段
    const amount = data.amount || 0;
    const taxAmount = data.tax_amount || 0;
    const netAmount = amount + taxAmount;

    // 确保状态值符合数据库约束
    const validStatuses = [
      "draft",
      "submitted",
      "approved",
      "rejected",
      "paid",
      "cancelled"
    ];
    const status = validStatuses.includes(data.status as string)
      ? data.status
      : "draft";

    const expenseData = {
      ...data,
      expense_number: `EXP${Date.now()}${Math.random()
        .toString(36)
        .substr(2, 5)
        .toUpperCase()}`,
      net_amount: netAmount,
      remaining_amount: netAmount, // 初始状态剩余金额等于净额
      tax_amount: taxAmount,
      expense_date: data.date || new Date().toISOString().split("T")[0], // 将date映射到expense_date
      status: status, // 使用验证后的状态值
      // 将 financial_category_id 映射为 category_id
      category_id: (data as any).financial_category_id
    };

    // 移除不需要的字段
    delete expenseData.date;
    delete (expenseData as any).financial_category_id;

    return executeQuery(
      supabase.from("expense_records").insert(expenseData).select().single()
    );
  }

  async updateExpenseRecord(
    id: string,
    data: Partial<ExpenseRecord>
  ): Promise<ExpenseRecord> {
    return executeQuery(
      supabase
        .from("expense_records")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async getExpenseStatistics(startDate?: string, endDate?: string) {
    let query = supabase
      .from("expense_records")
      .select(
        "amount, paid_amount, status, category_id, supplier_id, department_id"
      );

    if (startDate) query = query.gte("expense_date", startDate);
    if (endDate) query = query.lte("expense_date", endDate);

    const data = await executeQuery(query);

    // 计算统计数据
    const totalExpense = data.reduce(
      (sum: number, record: any) => sum + record.amount,
      0
    );
    const totalPaid = data.reduce(
      (sum: number, record: any) => sum + record.paid_amount,
      0
    );
    const totalPending = data.filter(
      (record: any) => record.status === "pending"
    ).length;
    const totalOverdue = data.filter(
      (record: any) => record.status === "overdue"
    ).length;

    return {
      totalExpense,
      totalPaid,
      totalPending,
      totalOverdue,
      recordCount: data.length
    };
  }
}

// =============================================================================
// 收入管理 API
// =============================================================================

class RevenueAPI extends BaseAPI<RevenueRecord> {
  constructor() {
    super("revenue_records");
  }

  // 收入分类
  async getRevenueCategories(): Promise<RevenueCategory[]> {
    return executeQuery(
      supabase
        .from("revenue_categories")
        .select("*")
        .order("level", { ascending: true })
        .order("code", { ascending: true })
    );
  }

  async createRevenueCategory(
    data: Partial<RevenueCategory>
  ): Promise<RevenueCategory> {
    return executeQuery(
      supabase.from("revenue_categories").insert(data).select().single()
    );
  }

  // 收入记录
  async getRevenueRecords(filters?: any): Promise<RevenueRecord[]> {
    let query = supabase.from("revenue_records").select(`
        *,
        customer:customers!revenue_records_customer_id_fkey (*),
        category:finance_categories!revenue_records_category_id_fkey (*),
        project:projects!revenue_records_project_id_fkey (*),
        department:departments!revenue_records_department_id_fkey (*),
        salesperson:users!revenue_records_salesperson_id_fkey (*),
        created_by_user:users!revenue_records_created_by_fkey (*)
      `);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value);
        }
      });
    }

    const revenueRecords = await executeQuery(
      query.order("created_at", { ascending: false })
    );

    // 加载每个收入记录的分摊记录
    const revenueRecordsWithAllocations = await Promise.all(
      revenueRecords.map(async (revenueRecord) => {
        const allocationRecords = await this.getAllocationRecordsByRevenueId(
          revenueRecord.id
        );
        return {
          ...revenueRecord,
          allocation_records: allocationRecords,
          is_allocation_enabled: allocationRecords.length > 0
        };
      })
    );

    return revenueRecordsWithAllocations;
  }

  async getAllocationRecordsByRevenueId(
    revenueId: string
  ): Promise<AllocationRecord[]> {
    const records = await executeQuery(
      supabase
        .from("allocation_records")
        .select("*")
        .eq("source_record_type", "revenue")
        .eq("source_record_id", revenueId)
        .order("created_at", { ascending: false })
    );

    // 为每个分摊记录添加团队分摊配置信息
    const recordsWithConfig = await Promise.all(
      records.map(async (record) => {
        // 从团队分摊配置中获取信息
        const teamConfig = await executeQuery(
          supabase
            .from("team_allocation_configs")
            .select(
              `
              *,
              team:teams (*)
            `
            )
            .eq("id", record.allocation_config_id)
            .single()
        );

        return {
          ...record,
          allocation_config: teamConfig
            ? {
                id: teamConfig.id,
                name: teamConfig.team?.name || "未知团队",
                target_type: "department" as const,
                target_id: teamConfig.team_id,
                allocation_ratio: teamConfig.allocation_ratio,
                is_enabled: teamConfig.is_enabled,
                created_by_id: teamConfig.created_by_id,
                created_at: teamConfig.created_at,
                updated_at: teamConfig.updated_at,
                target: teamConfig.team
              }
            : null
        };
      })
    );

    return recordsWithConfig;
  }

  async createRevenueRecord(
    data: Partial<RevenueRecord>
  ): Promise<RevenueRecord> {
    return executeQuery(
      supabase.from("revenue_records").insert(data).select().single()
    );
  }

  async updateRevenueRecord(
    id: string,
    data: Partial<RevenueRecord>
  ): Promise<RevenueRecord> {
    return executeQuery(
      supabase
        .from("revenue_records")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async delete(id: string): Promise<void> {
    await executeQuery(supabase.from("revenue_records").delete().eq("id", id));
  }

  async getRevenueStatistics(startDate?: string, endDate?: string) {
    let query = supabase
      .from("revenue_records")
      .select(
        "amount, received_amount, status, category_id, customer_id, department_id"
      );

    if (startDate) query = query.gte("revenue_date", startDate);
    if (endDate) query = query.lte("revenue_date", endDate);

    const data = await executeQuery(query);

    // 计算统计数据
    const totalRevenue = data.reduce(
      (sum: number, record: any) => sum + record.amount,
      0
    );
    const totalReceived = data.reduce(
      (sum: number, record: any) => sum + record.received_amount,
      0
    );
    const totalPending = data.filter(
      (record: any) => record.status === "pending"
    ).length;
    const totalOverdue = data.filter(
      (record: any) => record.status === "overdue"
    ).length;

    return {
      totalRevenue,
      totalReceived,
      totalPending,
      totalOverdue,
      recordCount: data.length
    };
  }
}

// =============================================================================
// 往来管理 API
// =============================================================================

class AccountsAPI {
  async getAccountsRecords(filters?: any): Promise<AccountsRecord[]> {
    let query = supabase.from("accounts_records").select(`
        *,
        department:departments!accounts_records_department_id_fkey (*),
        created_by_user:users!accounts_records_created_by_fkey (*)
      `);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value);
        }
      });
    }

    const accountsRecords = await executeQuery(
      query.order("created_at", { ascending: false })
    );

    // 加载每个往来记录的分摊记录
    const accountsRecordsWithAllocations = await Promise.all(
      accountsRecords.map(async (accountsRecord) => {
        const allocationRecords = await this.getAllocationRecordsByAccountsId(
          accountsRecord.id
        );
        return {
          ...accountsRecord,
          allocation_records: allocationRecords,
          is_allocation_enabled: allocationRecords.length > 0
        };
      })
    );

    return accountsRecordsWithAllocations;
  }

  async getAllocationRecordsByAccountsId(
    accountsId: string
  ): Promise<AllocationRecord[]> {
    const records = await executeQuery(
      supabase
        .from("allocation_records")
        .select("*")
        .eq("source_record_type", "accounts")
        .eq("source_record_id", accountsId)
        .order("created_at", { ascending: false })
    );

    // 为每个分摊记录添加团队分摊配置信息
    const recordsWithConfig = await Promise.all(
      records.map(async (record) => {
        // 从团队分摊配置中获取信息
        const teamConfig = await executeQuery(
          supabase
            .from("team_allocation_configs")
            .select(
              `
              *,
              team:teams (*)
            `
            )
            .eq("id", record.allocation_config_id)
            .single()
        );

        return {
          ...record,
          allocation_config: teamConfig
            ? {
                id: teamConfig.id,
                name: teamConfig.team?.name || "未知团队",
                target_type: "department" as const,
                target_id: teamConfig.team_id,
                allocation_ratio: teamConfig.allocation_ratio,
                is_enabled: teamConfig.is_enabled,
                created_by_id: teamConfig.created_by_id,
                created_at: teamConfig.created_at,
                updated_at: teamConfig.updated_at,
                target: teamConfig.team
              }
            : null
        };
      })
    );

    return recordsWithConfig;
  }

  async createAccountsRecord(
    data: Partial<AccountsRecord>
  ): Promise<AccountsRecord> {
    return executeQuery(
      supabase.from("accounts_records").insert(data).select().single()
    );
  }

  async updateAccountsRecord(
    id: string,
    data: Partial<AccountsRecord>
  ): Promise<AccountsRecord> {
    return executeQuery(
      supabase
        .from("accounts_records")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async getSettlementRecords(
    accountsRecordId?: string
  ): Promise<SettlementRecord[]> {
    let query = supabase.from("settlement_records").select(`
        *,
        created_by_user:users!settlement_records_created_by_fkey (*)
      `);

    if (accountsRecordId) {
      query = query.eq("accounts_record_id", accountsRecordId);
    }

    return executeQuery(query.order("created_at", { ascending: false }));
  }

  async createSettlementRecord(
    data: Partial<SettlementRecord>
  ): Promise<SettlementRecord> {
    return executeQuery(
      supabase.from("settlement_records").insert(data).select().single()
    );
  }

  async getAccountsStatistics() {
    const data = await executeQuery(
      supabase
        .from("accounts_records")
        .select("amount, settled_amount, balance, type, status")
    );

    const receivables = data.filter(
      (record: any) => record.type === "receivable"
    );
    const payables = data.filter((record: any) => record.type === "payable");

    return {
      totalReceivable: receivables.reduce(
        (sum: number, record: any) => sum + record.amount,
        0
      ),
      totalPayable: payables.reduce(
        (sum: number, record: any) => sum + record.amount,
        0
      ),
      totalSettledReceivable: receivables.reduce(
        (sum: number, record: any) => sum + record.settled_amount,
        0
      ),
      totalSettledPayable: payables.reduce(
        (sum: number, record: any) => sum + record.settled_amount,
        0
      ),
      totalPendingReceivable: receivables.filter(
        (r: any) => r.status === "pending"
      ).length,
      totalPendingPayable: payables.filter((r: any) => r.status === "pending")
        .length,
      totalOverdueReceivable: receivables.filter(
        (r: any) => r.status === "overdue"
      ).length,
      totalOverduePayable: payables.filter((r: any) => r.status === "overdue")
        .length
    };
  }
}

// =============================================================================
// 资产管理 API
// =============================================================================

class AssetAPI extends BaseAPI<Asset> {
  constructor() {
    super("assets"); // 添加表名
  }

  // 资产分类
  async getAssetCategories(): Promise<AssetCategory[]> {
    return executeQuery(
      supabase
        .from("asset_categories")
        .select("*")
        .order("level", { ascending: true })
        .order("sort_order", { ascending: true })
    );
  }

  async getAssetCategoriesHierarchy(): Promise<AssetCategory[]> {
    const categories = await executeQuery(
      supabase
        .from("asset_categories")
        .select(
          `
          *,
          project:projects(*)
        `
        )
        .order("level", { ascending: true })
        .order("sort_order", { ascending: true })
    );

    // 构建层级结构
    return this.buildCategoryTree(categories);
  }

  private buildCategoryTree(
    categories: AssetCategory[],
    parentId: string | null = null
  ): AssetCategory[] {
    return categories
      .filter((category) => category.parent_id === parentId)
      .map((category) => ({
        ...category,
        children: this.buildCategoryTree(categories, category.id)
      }));
  }

  async createAssetCategory(
    data: Partial<AssetCategory>
  ): Promise<AssetCategory> {
    const categoryData = {
      name: data.name,
      code: data.code,
      parent_id:
        data.parent_id &&
        data.parent_id.trim() !== "" &&
        data.parent_id !== "null"
          ? data.parent_id
          : null,
      level: data.level || 0,
      sort_order: data.sort_order || 0,
      project_id:
        data.project_id && data.project_id.trim() !== ""
          ? data.project_id
          : null,
      description: data.description || null,
      status: data.status || "active"
    };

    return executeQuery(
      supabase
        .from("asset_categories")
        .insert(categoryData)
        .select("*")
        .single()
    );
  }

  async updateAssetCategory(
    id: string,
    data: Partial<AssetCategory>
  ): Promise<AssetCategory> {
    const categoryData = {
      name: data.name,
      code: data.code,
      parent_id:
        data.parent_id &&
        data.parent_id.trim() !== "" &&
        data.parent_id !== "null"
          ? data.parent_id
          : null,
      level: data.level,
      sort_order: data.sort_order,
      project_id:
        data.project_id && data.project_id.trim() !== ""
          ? data.project_id
          : null,
      description: data.description || null,
      status: data.status
    };

    return executeQuery(
      supabase
        .from("asset_categories")
        .update(categoryData)
        .eq("id", id)
        .select("*")
        .single()
    );
  }

  async deleteAssetCategory(id: string): Promise<void> {
    await executeQuery(supabase.from("asset_categories").delete().eq("id", id));
  }

  // 资产位置
  async getAssetLocations(): Promise<AssetLocation[]> {
    return executeQuery(
      supabase
        .from("asset_locations")
        .select(
          `
          *,
          responsible:users(*)
        `
        )
        .order("level", { ascending: true })
        .order("name", { ascending: true })
    );
  }

  async getAssetLocationsHierarchy(): Promise<AssetLocation[]> {
    const locations = await executeQuery(
      supabase
        .from("asset_locations")
        .select(
          `
          *,
          responsible:users(*)
        `
        )
        .order("level", { ascending: true })
        .order("name", { ascending: true })
    );

    // 构建层级结构
    return this.buildLocationTree(locations);
  }

  private buildLocationTree(
    locations: AssetLocation[],
    parentId: string | null = null
  ): AssetLocation[] {
    return locations
      .filter((location) => location.parent_id === parentId)
      .map((location) => ({
        ...location,
        children: this.buildLocationTree(locations, location.id)
      }));
  }

  async createAssetLocation(
    data: Partial<AssetLocation>
  ): Promise<AssetLocation> {
    const locationData = {
      name: data.name,
      code: data.code,
      type: data.type || "building",
      parent_id:
        data.parent_id &&
        data.parent_id.trim() !== "" &&
        data.parent_id !== "null"
          ? data.parent_id
          : null,
      level: data.level || 0,
      capacity: data.capacity || 0,
      responsible_id:
        data.responsible_id && data.responsible_id.trim() !== ""
          ? data.responsible_id
          : null,
      address: data.address || null,
      description: data.description || null,
      status: data.status || "active"
    };

    return executeQuery(
      supabase.from("asset_locations").insert(locationData).select("*").single()
    );
  }

  async updateAssetLocation(
    id: string,
    data: Partial<AssetLocation>
  ): Promise<AssetLocation> {
    const locationData = {
      name: data.name,
      code: data.code,
      type: data.type,
      parent_id:
        data.parent_id &&
        data.parent_id.trim() !== "" &&
        data.parent_id !== "null"
          ? data.parent_id
          : null,
      level: data.level,
      capacity: data.capacity,
      responsible_id:
        data.responsible_id && data.responsible_id.trim() !== ""
          ? data.responsible_id
          : null,
      address: data.address || null,
      description: data.description || null,
      status: data.status
    };

    return executeQuery(
      supabase
        .from("asset_locations")
        .update(locationData)
        .eq("id", id)
        .select("*")
        .single()
    );
  }

  async deleteAssetLocation(id: string): Promise<void> {
    await executeQuery(supabase.from("asset_locations").delete().eq("id", id));
  }

  // 资产品牌管理
  async getAssetBrands(): Promise<AssetBrand[]> {
    return executeQuery(
      supabase
        .from("asset_brands")
        .select("*")
        .order("name", { ascending: true })
    );
  }

  async createAssetBrand(data: Partial<AssetBrand>): Promise<AssetBrand> {
    const brandData = {
      name: data.name,
      code: data.code,
      country: data.country || null,
      description: data.description || null,
      status: data.status || "active"
    };

    return executeQuery(
      supabase.from("asset_brands").insert(brandData).select("*").single()
    );
  }

  async updateAssetBrand(
    id: string,
    data: Partial<AssetBrand>
  ): Promise<AssetBrand> {
    const brandData = {
      name: data.name,
      code: data.code,
      country: data.country || null,
      description: data.description || null,
      status: data.status
    };

    return executeQuery(
      supabase
        .from("asset_brands")
        .update(brandData)
        .eq("id", id)
        .select("*")
        .single()
    );
  }

  async deleteAssetBrand(id: string): Promise<void> {
    await executeQuery(supabase.from("asset_brands").delete().eq("id", id));
  }

  // 搜索方法
  async searchAssetCategories(searchTerm: string): Promise<AssetCategory[]> {
    return executeQuery(
      supabase
        .from("asset_categories")
        .select("*")
        .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
        .order("name", { ascending: true })
    );
  }

  async searchAssetLocations(searchTerm: string): Promise<AssetLocation[]> {
    return executeQuery(
      supabase
        .from("asset_locations")
        .select("*")
        .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
        .order("name", { ascending: true })
    );
  }

  async searchAssetBrands(searchTerm: string): Promise<AssetBrand[]> {
    return executeQuery(
      supabase
        .from("asset_brands")
        .select("*")
        .or(
          `name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`
        )
        .order("name", { ascending: true })
    );
  }

  // 资产管理
  async getAssets(filters?: any): Promise<Asset[]> {
    let query = supabase
      .from("assets")
      .select(
        `
      *,
      category:asset_categories!assets_category_id_fkey (*),
      brand:asset_brands!assets_brand_id_fkey (*),
      location:asset_locations!assets_location_id_fkey (*),
      custodian:users!assets_custodian_id_fkey (*),
      user:users!assets_user_id_fkey (*)
    `
      )
      .order("created_at", { ascending: false });

    if (filters?.category_id) {
      query = query.eq("category_id", filters.category_id);
    }
    if (filters?.brand_id) {
      query = query.eq("brand_id", filters.brand_id);
    }
    if (filters?.location_id) {
      query = query.eq("location_id", filters.location_id);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`
      );
    }

    return executeQuery(query);
  }

  async createAsset(data: Partial<Asset>): Promise<Asset> {
    return executeQuery(supabase.from("assets").insert(data).select().single());
  }

  async updateAsset(id: string, data: Partial<Asset>): Promise<Asset> {
    return executeQuery(
      supabase.from("assets").update(data).eq("id", id).select().single()
    );
  }

  async getAssetByCode(code: string): Promise<Asset | null> {
    return executeQuery(
      supabase.from("assets").select("*").eq("code", code).single()
    );
  }

  // 出入库记录
  async getInventoryRecords(filters?: any): Promise<InventoryRecord[]> {
    let query = supabase.from("inventory_records").select(`
        *,
        asset:assets!inventory_records_asset_id_fkey (*),
        from_location:asset_locations!inventory_records_from_location_id_fkey (*),
        to_location:asset_locations!inventory_records_to_location_id_fkey (*),
        from_department:departments!inventory_records_from_department_id_fkey (*),
        to_department:departments!inventory_records_to_department_id_fkey (*),
        from_custodian:users!inventory_records_from_custodian_id_fkey (*),
        to_custodian:users!inventory_records_to_custodian_id_fkey (*),
        project:projects!inventory_records_project_id_fkey (*),
        operator:users!inventory_records_operator_id_fkey (*),
        approver:users!inventory_records_approver_id_fkey (*)
      `);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value);
        }
      });
    }

    return executeQuery(query.order("created_at", { ascending: false }));
  }

  async createInventoryRecord(
    data: Partial<InventoryRecord>
  ): Promise<InventoryRecord> {
    return executeQuery(
      supabase.from("inventory_records").insert(data).select().single()
    );
  }

  async updateInventoryRecord(
    id: string,
    data: Partial<InventoryRecord>
  ): Promise<InventoryRecord> {
    return executeQuery(
      supabase
        .from("inventory_records")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async getInventoryStatistics() {
    const records = await executeQuery(
      supabase.from("inventory_records").select("type, status, operation_date")
    );

    const today = new Date().toISOString().split("T")[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    return {
      totalRecords: records.length,
      inRecords: records.filter((r: any) => r.type === "in").length,
      outRecords: records.filter((r: any) => r.type === "out").length,
      pendingRecords: records.filter((r: any) => r.status === "pending").length,
      completedRecords: records.filter((r: any) => r.status === "completed")
        .length,
      todayRecords: records.filter((r: any) => r.operation_date === today)
        .length,
      thisMonthRecords: records.filter((r: any) =>
        r.operation_date.startsWith(thisMonth)
      ).length
    };
  }

  // ===== 资产变动管理 =====
  async getAssetMovements(filters?: any): Promise<AssetMovement[]> {
    let query = supabase
      .from("asset_movements")
      .select(
        `
        *,
        asset:assets(id, name, code),
        from_location:from_location_id(id, name, code),
        to_location:to_location_id(id, name, code),
        from_department:from_department_id(id, name, code),
        to_department:to_department_id(id, name, code),
        from_custodian:from_custodian_id(id, name, employee_id),
        to_custodian:to_custodian_id(id, name, employee_id),
        applicant:applicant_id(id, name, employee_id),
        approver:approver_id(id, name, employee_id)
      `
      )
      .order("created_at", { ascending: false });

    if (filters) {
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.movement_type)
        query = query.eq("movement_type", filters.movement_type);
      if (filters.asset_id) query = query.eq("asset_id", filters.asset_id);
      if (filters.start_date)
        query = query.gte("application_date", filters.start_date);
      if (filters.end_date)
        query = query.lte("application_date", filters.end_date);
    }

    return executeQuery(query);
  }

  async createAssetMovement(
    data: Partial<AssetMovement>
  ): Promise<AssetMovement> {
    try {
      console.log("Creating asset movement with data:", data);
      const result = await executeQuery(
        supabase.from("asset_movements").insert(data).select().single()
      );
      console.log("Asset movement creation result:", result);
      return result;
    } catch (error) {
      console.error("Error in createAssetMovement:", error);
      throw error;
    }
  }

  async updateAssetMovement(
    id: string,
    data: Partial<AssetMovement>
  ): Promise<AssetMovement> {
    return executeQuery(
      supabase
        .from("asset_movements")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async deleteAssetMovement(id: string): Promise<void> {
    await executeQuery(supabase.from("asset_movements").delete().eq("id", id));
  }

  async approveAssetMovement(
    id: string,
    approverId: string
  ): Promise<AssetMovement> {
    return executeQuery(
      supabase
        .from("asset_movements")
        .update({
          status: "approved",
          approver_id: approverId,
          approval_date: new Date().toISOString().split("T")[0]
        })
        .eq("id", id)
        .select()
        .single()
    );
  }

  async completeAssetMovement(id: string): Promise<AssetMovement> {
    return executeQuery(
      supabase
        .from("asset_movements")
        .update({
          status: "completed",
          completion_date: new Date().toISOString().split("T")[0]
        })
        .eq("id", id)
        .select()
        .single()
    );
  }

  // ===== 盘点计划管理 =====
  async getInventoryPlans(filters?: any): Promise<InventoryPlan[]> {
    let query = supabase
      .from("inventory_plans")
      .select(
        `
        *,
        created_by:created_by_id(id, name, employee_id)
      `
      )
      .order("created_at", { ascending: false });

    if (filters) {
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.type) query = query.eq("type", filters.type);
    }

    return executeQuery(query);
  }

  async createInventoryPlan(
    data: Partial<InventoryPlan>
  ): Promise<InventoryPlan> {
    return executeQuery(
      supabase.from("inventory_plans").insert(data).select().single()
    );
  }

  async updateInventoryPlan(
    id: string,
    data: Partial<InventoryPlan>
  ): Promise<InventoryPlan> {
    return executeQuery(
      supabase
        .from("inventory_plans")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async deleteInventoryPlan(id: string): Promise<void> {
    await executeQuery(supabase.from("inventory_plans").delete().eq("id", id));
  }

  // ===== 盘点记录管理 =====
  async getInventoryPlanRecords(
    planId?: string
  ): Promise<InventoryPlanRecord[]> {
    let query = supabase
      .from("inventory_plan_records")
      .select(
        `
        *,
        plan:plan_id(id, plan_name, plan_number),
        asset:asset_id(id, name, code),
        expected_location:expected_location_id(id, name, code),
        actual_location:actual_location_id(id, name, code),
        expected_custodian:expected_custodian_id(id, name, employee_id),
        actual_custodian:actual_custodian_id(id, name, employee_id),
        checker:checker_id(id, name, employee_id)
      `
      )
      .order("created_at", { ascending: false });

    if (planId) {
      query = query.eq("plan_id", planId);
    }

    return executeQuery(query);
  }

  async createInventoryPlanRecord(
    data: Partial<InventoryPlanRecord>
  ): Promise<InventoryPlanRecord> {
    return executeQuery(
      supabase.from("inventory_plan_records").insert(data).select().single()
    );
  }

  async updateInventoryPlanRecord(
    id: string,
    data: Partial<InventoryPlanRecord>
  ): Promise<InventoryPlanRecord> {
    return executeQuery(
      supabase
        .from("inventory_plan_records")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  // ===== 盘点调整管理 =====
  async getInventoryAdjustments(filters?: any): Promise<InventoryAdjustment[]> {
    let query = supabase
      .from("inventory_adjustments")
      .select(
        `
        *,
        plan_record:plan_record_id(id, plan_id),
        asset:asset_id(id, name, code),
        operator:operator_id(id, name, employee_id),
        approver:approver_id(id, name, employee_id)
      `
      )
      .order("created_at", { ascending: false });

    if (filters) {
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.adjustment_type)
        query = query.eq("adjustment_type", filters.adjustment_type);
      if (filters.asset_id) query = query.eq("asset_id", filters.asset_id);
    }

    return executeQuery(query);
  }

  async createInventoryAdjustment(
    data: Partial<InventoryAdjustment>
  ): Promise<InventoryAdjustment> {
    return executeQuery(
      supabase.from("inventory_adjustments").insert(data).select().single()
    );
  }

  async updateInventoryAdjustment(
    id: string,
    data: Partial<InventoryAdjustment>
  ): Promise<InventoryAdjustment> {
    return executeQuery(
      supabase
        .from("inventory_adjustments")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  // ===== 统计查询 =====
  async getAssetMovementStatistics() {
    const [
      totalMovements,
      pendingMovements,
      completedMovements,
      todayMovements
    ] = await Promise.all([
      executeQuery(
        supabase.from("asset_movements").select("id", { count: "exact" })
      ),
      executeQuery(
        supabase
          .from("asset_movements")
          .select("id", { count: "exact" })
          .eq("status", "pending")
      ),
      executeQuery(
        supabase
          .from("asset_movements")
          .select("id", { count: "exact" })
          .eq("status", "completed")
      ),
      executeQuery(
        supabase
          .from("asset_movements")
          .select("id", { count: "exact" })
          .gte("application_date", new Date().toISOString().split("T")[0])
      )
    ]);

    return {
      totalMovements: totalMovements.length,
      pendingMovements: pendingMovements.length,
      completedMovements: completedMovements.length,
      todayMovements: todayMovements.length
    };
  }
}

// =============================================================================
// 团队管理 API
// =============================================================================

class TeamAPI extends BaseAPI<Team> {
  constructor() {
    super("teams");
  }

  async getTeamsWithMembers(): Promise<Team[]> {
    return executeQuery(
      supabase.from(this.tableName).select(`
          *,
          leader:users!teams_leader_id_fkey (*),
          department:departments!teams_department_id_fkey (*),
          team_members (
            *,
            user:users!team_members_user_id_fkey (*)
          )
        `)
    );
  }

  async addTeamMember(teamId: string, userId: string, role?: string) {
    return executeQuery(
      supabase.from("team_members").insert({
        team_id: teamId,
        user_id: userId,
        role: role
      })
    );
  }

  async removeTeamMember(teamId: string, userId: string) {
    return executeQuery(
      supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", userId)
    );
  }

  async getTeamMembers(teamId: string) {
    return executeQuery(
      supabase
        .from("team_members")
        .select(
          `
          *,
          user:users!team_members_user_id_fkey (*)
        `
        )
        .eq("team_id", teamId)
    );
  }

  async getByCode(code: string): Promise<Team | null> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("code", code).single()
    );
  }

  async getTeamsByType(teamType: string): Promise<Team[]> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("team_type", teamType)
    );
  }

  async searchTeams(searchTerm: string): Promise<Team[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .or(
          `name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        )
    );
  }

  // 绩效配置相关方法
  async getTeamPerformanceConfig(
    teamId: string
  ): Promise<TeamPerformanceConfig | null> {
    return executeQuery(
      supabase
        .from("team_performance_configs")
        .select(
          `
          *,
          team:teams!team_performance_configs_team_id_fkey (*),
          tiers:performance_tiers (*)
        `
        )
        .eq("team_id", teamId)
        .single()
    );
  }

  async createTeamPerformanceConfig(
    data: Partial<TeamPerformanceConfig>
  ): Promise<TeamPerformanceConfig> {
    return executeQuery(
      supabase.from("team_performance_configs").insert(data).select().single()
    );
  }

  async updateTeamPerformanceConfig(
    id: string,
    data: Partial<TeamPerformanceConfig>
  ): Promise<TeamPerformanceConfig> {
    return executeQuery(
      supabase
        .from("team_performance_configs")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async deleteTeamPerformanceConfig(id: string): Promise<void> {
    return executeQuery(
      supabase.from("team_performance_configs").delete().eq("id", id)
    );
  }

  // 绩效层级相关方法
  async getPerformanceTiers(configId: string): Promise<PerformanceTier[]> {
    return executeQuery(
      supabase
        .from("performance_tiers")
        .select("*")
        .eq("team_performance_config_id", configId)
        .order("min_value", { ascending: true })
    );
  }

  async createPerformanceTier(
    data: Partial<PerformanceTier>
  ): Promise<PerformanceTier> {
    return executeQuery(
      supabase.from("performance_tiers").insert(data).select().single()
    );
  }

  async updatePerformanceTier(
    id: string,
    data: Partial<PerformanceTier>
  ): Promise<PerformanceTier> {
    return executeQuery(
      supabase
        .from("performance_tiers")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async deletePerformanceTier(id: string): Promise<void> {
    return executeQuery(
      supabase.from("performance_tiers").delete().eq("id", id)
    );
  }

  async deletePerformanceTiersByConfig(configId: string): Promise<void> {
    return executeQuery(
      supabase
        .from("performance_tiers")
        .delete()
        .eq("team_performance_config_id", configId)
    );
  }

  // 分摊配置相关方法
  async getTeamAllocationConfig(
    teamId: string
  ): Promise<TeamAllocationConfig | null> {
    return executeQuery(
      supabase
        .from("team_allocation_configs")
        .select(
          `
          *,
          team:teams!team_allocation_configs_team_id_fkey (*)
        `
        )
        .eq("team_id", teamId)
        .single()
    );
  }

  async getAllTeamAllocationConfigs(): Promise<TeamAllocationConfig[]> {
    return executeQuery(
      supabase.from("team_allocation_configs").select(`
          *,
          team:teams!team_allocation_configs_team_id_fkey (*)
        `)
    );
  }

  async createTeamAllocationConfig(
    data: Partial<TeamAllocationConfig>
  ): Promise<TeamAllocationConfig> {
    return executeQuery(
      supabase.from("team_allocation_configs").insert(data).select().single()
    );
  }

  async updateTeamAllocationConfig(
    id: string,
    data: Partial<TeamAllocationConfig>
  ): Promise<TeamAllocationConfig> {
    return executeQuery(
      supabase
        .from("team_allocation_configs")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async deleteTeamAllocationConfig(id: string): Promise<void> {
    return executeQuery(
      supabase.from("team_allocation_configs").delete().eq("id", id)
    );
  }

  async getEnabledAllocationConfigs(): Promise<TeamAllocationConfig[]> {
    return executeQuery(
      supabase
        .from("team_allocation_configs")
        .select(
          `
          *,
          team:teams!team_allocation_configs_team_id_fkey (*)
        `
        )
        .eq("is_enabled", true)
    );
  }

  async validateAllocationRatios(): Promise<{
    isValid: boolean;
    totalRatio: number;
  }> {
    const configs = await this.getEnabledAllocationConfigs();
    const totalRatio = configs.reduce(
      (sum, config) => sum + config.allocation_ratio,
      0
    );
    return {
      isValid: totalRatio === 100,
      totalRatio
    };
  }
}

// =============================================================================
// 里程管理 API
// =============================================================================

class MileageAPI extends BaseAPI<EmployeeMileage> {
  constructor() {
    super("mileage_records");
  }

  async getMileageRecords(filters?: any): Promise<EmployeeMileage[]> {
    let query = supabase.from(this.tableName).select(`
        *,
        employee:users!mileage_records_employee_id_fkey (*),
        team:teams!mileage_records_team_id_fkey (*)
      `);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value);
        }
      });
    }

    return executeQuery(query.order("record_date", { ascending: false }));
  }

  async getMileageStatistics() {
    const records = await executeQuery(
      supabase
        .from(this.tableName)
        .select("mileage, calculated_performance, status")
    );

    const confirmedRecords = records.filter(
      (r: any) => r.status === "confirmed"
    );

    return {
      totalRecords: records.length,
      totalMileage: records.reduce(
        (sum: number, record: any) => sum + record.mileage,
        0
      ),
      totalPerformance: records.reduce(
        (sum: number, record: any) => sum + record.calculated_performance,
        0
      ),
      confirmedRecords: confirmedRecords.length,
      pendingRecords: records.filter((r: any) => r.status === "pending").length,
      averageMileage:
        records.length > 0
          ? records.reduce(
              (sum: number, record: any) => sum + record.mileage,
              0
            ) / records.length
          : 0,
      averagePerformance:
        records.length > 0
          ? records.reduce(
              (sum: number, record: any) => sum + record.calculated_performance,
              0
            ) / records.length
          : 0
    };
  }
}

// =============================================================================
// 任务管理 API
// =============================================================================

class TaskAPI extends BaseAPI<Task> {
  constructor() {
    super("tasks");
  }

  async getTasksWithDetails(): Promise<Task[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select(
          `
          *,
          assignee:users!tasks_assignee_id_fkey (*),
          created_by:users!tasks_created_by_id_fkey (*)
        `
        )
        .order("created_at", { ascending: false })
    );
  }

  async getTaskStatistics() {
    const tasks = await executeQuery(
      supabase
        .from(this.tableName)
        .select("status, urgency, importance, deadline")
    );

    const today = new Date().toISOString().split("T")[0];

    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter((t: any) => t.status === "pending").length,
      inProgressTasks: tasks.filter((t: any) => t.status === "in_progress")
        .length,
      completedTasks: tasks.filter((t: any) => t.status === "completed").length,
      overdueTasks: tasks.filter(
        (t: any) => t.status === "overdue" || (t.deadline && t.deadline < today)
      ).length,
      highPriorityTasks: tasks.filter(
        (t: any) => t.urgency >= 4 || t.importance >= 4
      ).length
    };
  }

  // 任务进度相关方法
  async getTaskProgress(taskId: string): Promise<TaskProgress[]> {
    return executeQuery(
      supabase
        .from("task_progress")
        .select(
          `
          *,
          created_by:users!task_progress_created_by_id_fkey (*)
        `
        )
        .eq("task_id", taskId)
        .order("progress_date", { ascending: false })
    );
  }

  async createTaskProgress(data: Partial<TaskProgress>): Promise<TaskProgress> {
    return executeQuery(
      supabase.from("task_progress").insert(data).select().single()
    );
  }

  async updateTaskProgress(
    id: string,
    data: Partial<TaskProgress>
  ): Promise<TaskProgress> {
    return executeQuery(
      supabase.from("task_progress").update(data).eq("id", id).select().single()
    );
  }

  async deleteTaskProgress(id: string): Promise<void> {
    await executeQuery(supabase.from("task_progress").delete().eq("id", id));
  }

  async updateTaskProgressFromRecords(taskId: string): Promise<void> {
    // 获取任务的所有进度记录
    const progressRecords = await this.getTaskProgress(taskId);

    // 计算总进度
    const totalProgress = progressRecords.reduce(
      (sum, record) => sum + record.progress_percentage,
      0
    );

    // 更新任务的进度字段
    await this.update(taskId, { progress: totalProgress });
  }
}

// =============================================================================
// 权限管理 API
// =============================================================================

class PermissionAPI extends BaseAPI<Permission> {
  constructor() {
    super("permissions");
  }

  async getByCode(code: string): Promise<Permission | null> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("code", code).single()
    );
  }

  async getByModule(module: string): Promise<Permission[]> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("module", module)
    );
  }
}

class RoleAPI extends BaseAPI<Role> {
  constructor() {
    super("roles");
  }

  async getRolesWithPermissions(): Promise<Role[]> {
    return executeQuery(
      supabase.from(this.tableName).select(`
          *,
          role_permissions (
            permission:permissions (*)
          )
        `)
    );
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    // 删除现有权限
    await executeQuery(
      supabase.from("role_permissions").delete().eq("role_id", roleId)
    );

    // 添加新权限
    const rolePermissions = permissionIds.map((permissionId) => ({
      role_id: roleId,
      permission_id: permissionId
    }));

    return executeQuery(
      supabase.from("role_permissions").insert(rolePermissions)
    );
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return executeQuery(
      supabase
        .from("user_roles")
        .select(
          `
          *,
          role:roles (*),
          assigned_by_user:users!user_roles_assigned_by_fkey (*)
        `
        )
        .eq("user_id", userId)
    );
  }

  async assignUserRole(userId: string, roleId: string, assignedBy?: string) {
    return executeQuery(
      supabase.from("user_roles").insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy
      })
    );
  }

  async removeUserRole(userId: string, roleId: string) {
    return executeQuery(
      supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role_id", roleId)
    );
  }
}

// =============================================================================
// 工作流管理 API
// =============================================================================

class WorkflowAPI extends BaseAPI<Workflow> {
  constructor() {
    super("workflows");
  }

  // 获取表单类型
  async getFormTypes(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      resolve([
        { value: "financial_matters", label: "财务事项" },
        { value: "payment_requests", label: "付款申请单" },
        { value: "expense_reimbursements", label: "费用报销" },
        { value: "business_trip_reimbursements", label: "差旅报销" }
      ]);
    });
  }

  // 获取工作流列表（包含表单类型信息）
  async getWorkflowsWithDetails(): Promise<any[]> {
    return executeQuery(
      supabase
        .from("workflows")
        .select(
          `
          *,
          created_by_user:created_by (
            id,
            name,
            employee_id
          )
        `
        )
        .order("created_at", { ascending: false })
    );
  }

  // 获取工作流详细信息（包含节点和连接线）
  async getWorkflowDetails(workflowId: string): Promise<any> {
    const [workflow, nodes, edges] = await Promise.all([
      executeQuery(
        supabase
          .from("workflows")
          .select(
            `
            *
          `
          )
          .eq("id", workflowId)
          .single()
      ),
      executeQuery(
        supabase
          .from("workflow_nodes")
          .select("*")
          .eq("workflow_id", workflowId)
          .order("created_at", { ascending: true })
      ),
      executeQuery(
        supabase
          .from("workflow_edges")
          .select("*")
          .eq("workflow_id", workflowId)
          .order("created_at", { ascending: true })
      )
    ]);

    // 转换节点数据格式以匹配前端期望的结构
    const transformedNodes = nodes.map((node) => ({
      id: node.node_id,
      type: "custom",
      position: {
        x: parseFloat(node.position_x),
        y: parseFloat(node.position_y)
      },
      data: {
        title: node.title,
        type: node.type,
        config: node.config || {}
      }
    }));

    // 转换连接线数据格式
    const transformedEdges = edges.map((edge) => ({
      id: edge.edge_id,
      source: edge.source_node_id,
      target: edge.target_node_id,
      label: edge.label || "",
      type: edge.type || "smoothstep"
    }));

    return {
      ...workflow,
      nodes: transformedNodes,
      edges: transformedEdges
    };
  }

  // 创建工作流
  async createWorkflow(data: {
    name: string;
    description: string;
    formType: string;
    status?: string;
    createdBy?: string;
  }): Promise<any> {
    const workflowData = {
      name: data.name,
      description: data.description,
      form_type: data.formType,
      status: data.status || "draft",
      created_by: data.createdBy,
      updated_by: data.createdBy
    };

    const workflow = await executeQuery(
      supabase.from("workflows").insert(workflowData).select().single()
    );

    // 创建默认的开始和结束节点
    const defaultNodes = [
      {
        workflow_id: workflow.id,
        node_id: "start",
        title: "开始",
        type: "start",
        position_x: 100,
        position_y: 200,
        config: {}
      },
      {
        workflow_id: workflow.id,
        node_id: "end",
        title: "结束",
        type: "end",
        position_x: 500,
        position_y: 200,
        config: {}
      }
    ];

    await executeQuery(supabase.from("workflow_nodes").insert(defaultNodes));

    return workflow;
  }

  // 更新工作流基本信息
  async updateWorkflow(
    id: string,
    data: {
      name?: string;
      description?: string;
      formType?: string;
      status?: string;
      updatedBy?: string;
    }
  ): Promise<any> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.formType !== undefined) updateData.form_type = data.formType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.updatedBy !== undefined) updateData.updated_by = data.updatedBy;

    return executeQuery(
      supabase
        .from("workflows")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()
    );
  }

  // 保存工作流设计（节点和连接线）
  async saveWorkflowDesign(
    workflowId: string,
    data: {
      nodes: any[];
      edges: any[];
    }
  ): Promise<void> {
    // 开始事务
    const { nodes, edges } = data;

    // 删除现有的节点和连接线（保留开始和结束节点）
    await executeQuery(
      supabase.from("workflow_edges").delete().eq("workflow_id", workflowId)
    );

    await executeQuery(
      supabase
        .from("workflow_nodes")
        .delete()
        .eq("workflow_id", workflowId)
        .not("node_id", "in", '("start","end")')
    );

    // 更新或插入节点
    const nodeInserts = nodes.map((node) => ({
      workflow_id: workflowId,
      node_id: node.id,
      title: node.data.title,
      type: node.data.type,
      position_x: node.position.x,
      position_y: node.position.y,
      config: node.data.config || {}
    }));

    await executeQuery(
      supabase.from("workflow_nodes").upsert(nodeInserts, {
        onConflict: "workflow_id,node_id",
        ignoreDuplicates: false
      })
    );

    // 插入连接线
    if (edges.length > 0) {
      const edgeInserts = edges.map((edge) => ({
        workflow_id: workflowId,
        edge_id: edge.id,
        source_node_id: edge.source,
        target_node_id: edge.target,
        label: edge.label || "",
        type: edge.type || "smoothstep"
      }));

      await executeQuery(supabase.from("workflow_edges").insert(edgeInserts));
    }
  }

  // 删除工作流
  async deleteWorkflow(id: string): Promise<void> {
    // 由于设置了级联删除，只需要删除主表记录
    await executeQuery(supabase.from("workflows").delete().eq("id", id));
  }

  // 激活/停用工作流
  async toggleWorkflowStatus(
    id: string,
    status: "active" | "inactive"
  ): Promise<any> {
    return executeQuery(
      supabase
        .from("workflows")
        .update({ status })
        .eq("id", id)
        .select()
        .single()
    );
  }

  // 复制工作流
  async duplicateWorkflow(
    id: string,
    newName: string,
    createdBy?: string
  ): Promise<any> {
    // 获取原工作流详情
    const originalWorkflow = await this.getWorkflowDetails(id);

    // 创建新工作流
    const newWorkflow = await this.createWorkflow({
      name: newName,
      description: originalWorkflow.description,
      formType: originalWorkflow.form_type,
      status: "draft",
      createdBy
    });

    // 复制节点和连接线设计
    if (originalWorkflow.nodes && originalWorkflow.edges) {
      await this.saveWorkflowDesign(newWorkflow.id, {
        nodes: originalWorkflow.nodes,
        edges: originalWorkflow.edges
      });
    }

    return newWorkflow;
  }

  // 获取工作流统计信息
  async getWorkflowStatistics(): Promise<{
    total: number;
    active: number;
    draft: number;
    inactive: number;
  }> {
    const workflows = await executeQuery(
      supabase.from("workflows").select("status")
    );

    return {
      total: workflows.length,
      active: workflows.filter((w) => w.status === "active").length,
      draft: workflows.filter((w) => w.status === "draft").length,
      inactive: workflows.filter((w) => w.status === "inactive").length
    };
  }

  // 搜索工作流
  async searchWorkflows(searchTerm: string): Promise<any[]> {
    return executeQuery(
      supabase
        .from("workflows")
        .select(
          `
          *
        `
        )
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order("created_at", { ascending: false })
    );
  }

  // 获取指定表单类型的工作流
  async getWorkflowsByFormType(formType: string): Promise<any[]> {
    return executeQuery(
      supabase
        .from("workflows")
        .select(
          `
          *
        `
        )
        .eq("form_type", formType)
        .eq("status", "active")
        .order("created_at", { ascending: false })
    );
  }

  // 验证工作流设计
  async validateWorkflowDesign(
    nodes: any[],
    edges: any[]
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // 检查是否有开始节点
    const startNodes = nodes.filter((node) => node.data.type === "start");
    if (startNodes.length === 0) {
      errors.push("工作流必须包含一个开始节点");
    } else if (startNodes.length > 1) {
      errors.push("工作流只能包含一个开始节点");
    }

    // 检查是否有结束节点
    const endNodes = nodes.filter((node) => node.data.type === "end");
    if (endNodes.length === 0) {
      errors.push("工作流必须包含一个结束节点");
    }

    // 检查节点连接
    const nodeIds = nodes.map((node) => node.id);
    for (const edge of edges) {
      if (!nodeIds.includes(edge.source)) {
        errors.push(`连接线源节点 ${edge.source} 不存在`);
      }
      if (!nodeIds.includes(edge.target)) {
        errors.push(`连接线目标节点 ${edge.target} 不存在`);
      }
    }

    // 检查审批节点配置
    const approvalNodes = nodes.filter((node) => node.data.type === "approval");
    for (const node of approvalNodes) {
      if (!node.data.config?.approverType) {
        errors.push(`审批节点 "${node.data.title}" 未配置审批人类型`);
      }
      if (
        node.data.config?.approverType === "specific_members" &&
        (!node.data.config?.specificApprovers ||
          node.data.config.specificApprovers.length === 0)
      ) {
        errors.push(`审批节点 "${node.data.title}" 未选择具体审批人`);
      }
    }

    // 检查条件节点配置
    const conditionNodes = nodes.filter(
      (node) => node.data.type === "condition"
    );
    for (const node of conditionNodes) {
      if (!node.data.config?.field || !node.data.config?.operator) {
        errors.push(`条件节点 "${node.data.title}" 未完整配置判断条件`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 获取工作流实例列表
  async getWorkflowInstances(): Promise<any[]> {
    return executeQuery(
      supabase
        .from("workflow_instances")
        .select(
          `
          *,
          workflow:workflow_id (
            id,
            name,
            description,
            form_type
          ),
          initiated_by:initiated_by_id (
            id,
            name,
            employee_id
          )
        `
        )
        .order("created_at", { ascending: false })
    );
  }

  // 根据业务实体查询工作流实例
  async getWorkflowInstanceByEntity(entityType: string, entityId: string): Promise<any | null> {
    try {
      const result = await executeQuery(
        supabase
          .from("workflow_instances")
          .select(
            `
            *,
            workflow:workflow_id (
              id,
              name,
              description,
              form_type
            ),
            initiated_by:initiated_by_id (
              id,
              name,
              employee_id
            )
          `
          )
          .eq("entity_type", entityType)
          .eq("entity_id", entityId)
          .order("created_at", { ascending: false })
          .limit(1)
      );
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('查询工作流实例失败:', error);
      return null;
    }
  }

  // 获取用户的待办任务
  async getUserPendingTasks(userId: string): Promise<any[]> {
    return executeQuery(
      supabase
        .from("workflow_instance_tasks")
        .select(
          `
          *,
          instance:instance_id (
            id,
            entity_type,
            entity_id,
            current_node_id,
            status,
            initiated_at,
            data,
            workflow:workflow_id (
              id,
              name,
              description,
              form_type
            ),
            initiated_by:initiated_by_id (
              id,
              name,
              employee_id
            )
          )
        `
        )
        .eq("assigned_to_id", userId)
        .eq("status", "pending")
        .order("assigned_at", { ascending: true })
    );
  }

  // 获取用户已处理的任务
  async getUserProcessedTasks(userId: string): Promise<any[]> {
    return executeQuery(
      supabase
        .from("workflow_instance_tasks")
        .select(
          `
          *,
          instance:instance_id (
            id,
            entity_type,
            entity_id,
            current_node_id,
            status,
            initiated_at,
            data,
            workflow:workflow_id (
              id,
              name,
              description,
              form_type
            ),
            initiated_by:initiated_by_id (
              id,
              name,
              employee_id
            )
          ),
          completed_by:completed_by_id (
            id,
            name,
            employee_id
          )
        `
        )
        .eq("assigned_to_id", userId)
        .in("status", ["approved", "rejected", "completed", "skipped"])
        .order("completed_at", { ascending: false })
    );
  }

  // 审批任务
  async approveTask(
    taskId: string,
    data: {
      decision: "approved" | "rejected";
      comments?: string;
      completedById: string;
    }
  ): Promise<any> {
    const { decision, comments, completedById } = data;

    // 更新任务状态
    const updatedTask = await executeQuery(
      supabase
        .from("workflow_instance_tasks")
        .update({
          status: decision,
          completed_by_id: completedById,
          completed_at: new Date().toISOString(),
          comments: comments || "",
          decision: decision
        })
        .eq("id", taskId)
        .select()
        .single()
    );

    // 创建审批记录
    await executeQuery(
      supabase.from("workflow_approvals").insert({
        instance_id: updatedTask.instance_id,
        task_id: taskId,
        node_id: updatedTask.node_id,
        approver_id: completedById,
        action: decision,
        comments: comments || "",
        approved_at: new Date().toISOString()
      })
    );

    // 如果审批通过，需要推进到下一个节点
    if (decision === "approved") {
      await this.advanceWorkflowInstance(
        updatedTask.instance_id,
        updatedTask.node_id
      );
    }

    return updatedTask;
  }

  // 推进工作流实例到下一个节点
  private async advanceWorkflowInstance(
    instanceId: string,
    currentNodeId: string
  ): Promise<void> {
    // 获取工作流实例信息
    const instance = await executeQuery(
      supabase
        .from("workflow_instances")
        .select(
          `
          *,
          workflow:workflow_id (
            id,
            nodes:workflow_nodes (*),
            edges:workflow_edges (*)
          )
        `
        )
        .eq("id", instanceId)
        .single()
    );

    if (!instance) return;

    // 获取当前节点的出边
    const outgoingEdges = instance.workflow.edges.filter(
      (edge: any) => edge.source_node_id === currentNodeId
    );

    if (outgoingEdges.length === 0) {
      // 没有出边，可能是结束节点
      await executeQuery(
        supabase
          .from("workflow_instances")
          .update({
            status: "completed",
            completed_at: new Date().toISOString()
          })
          .eq("id", instanceId)
      );
      return;
    }

    // 找到下一个节点（这里简化处理，取第一个出边）
    const nextNodeId = outgoingEdges[0].target_node_id;
    const nextNode = instance.workflow.nodes.find(
      (node: any) => node.node_id === nextNodeId
    );

    if (!nextNode) return;

    // 更新当前节点
    await executeQuery(
      supabase
        .from("workflow_instances")
        .update({
          current_node_id: nextNodeId
        })
        .eq("id", instanceId)
    );

    // 如果下一个节点是审批节点，创建新的任务
    if (nextNode.type === "approval") {
      const config = nextNode.config || {};
      let assignedToId = null;

      // 根据配置确定审批人
      if (
        config.approverType === "specific_members" &&
        config.specificApprovers
      ) {
        assignedToId = config.specificApprovers[0]; // 取第一个审批人
      }
      // 这里可以添加更多审批人类型的逻辑

      if (assignedToId) {
        await executeQuery(
          supabase.from("workflow_instance_tasks").insert({
            instance_id: instanceId,
            node_id: nextNodeId,
            task_type: "approval",
            status: "pending",
            assigned_to_id: assignedToId,
            assigned_at: new Date().toISOString()
          })
        );
      }
    }

    // 记录转换
    await executeQuery(
      supabase.from("workflow_transitions").insert({
        instance_id: instanceId,
        from_node_id: currentNodeId,
        to_node_id: nextNodeId,
        triggered_by_id: instance.initiated_by_id,
        triggered_at: new Date().toISOString()
      })
    );
  }

  // 获取工作流实例详情
  async getWorkflowInstanceDetails(instanceId: string): Promise<any> {
    // 获取工作流实例基本信息
    const instance = await executeQuery(
      supabase
        .from("workflow_instances")
        .select(`
          *,
          workflow:workflows(*),
          initiated_by:users!workflow_instances_initiated_by_id_fkey(id, name, email)
        `)
        .eq("id", instanceId)
        .single()
    );

    // 获取工作流节点信息
    let workflowNodes = [];
    if (instance.workflow_id) {
      workflowNodes = await executeQuery(
        supabase
          .from("workflow_nodes")
          .select("*")
          .eq("workflow_id", instance.workflow_id)
          .order("created_at", { ascending: true })
      );
    }

    // 获取工作流任务信息 - 每个任务分配给一个审批人
    const tasks = await executeQuery(
      supabase
        .from("workflow_instance_tasks")
        .select(`
          *,
          assigned_to:users!workflow_instance_tasks_assigned_to_id_fkey(id, name, email),
          completed_by:users!workflow_instance_tasks_completed_by_id_fkey(id, name, email)
        `)
        .eq("instance_id", instanceId)
        .order("created_at", { ascending: true })
    );

    // 获取审批记录 - 包含每个审批人的具体审批情况
    const approvals = await executeQuery(
      supabase
        .from("workflow_approvals")
        .select(`
          *,
          approver:users(id, name, email),
          task:workflow_instance_tasks(id, node_id, assigned_to_id)
        `)
        .eq("instance_id", instanceId)
        .order("approved_at", { ascending: true })
    );

    // 获取业务实体数据
    let entityData = null;
    if (instance.entity_type && instance.entity_id) {
      try {
        // 根据不同的业务类型，构建包含关联数据的查询
        let selectFields = "*";
        
        switch (instance.entity_type) {
          case 'business_trip_reimbursements':
            selectFields = `
              *,
              applicant:users!business_trip_reimbursements_applicant_id_fkey(id, name, employee_id),
              department:departments!business_trip_reimbursements_department_id_fkey(id, name, code)
            `;
            break;
          case 'expense_reimbursements':
            selectFields = `
              *,
              applicant:users!expense_reimbursements_applicant_id_fkey(id, name, employee_id),
              department:departments!expense_reimbursements_department_id_fkey(id, name, code)
            `;
            break;
          case 'payment_requests':
            selectFields = `
              *,
              applicant:users!payment_requests_applicant_id_fkey(id, name, employee_id),
              department:departments!payment_requests_department_id_fkey(id, name, code),
              company:companies!payment_requests_company_id_fkey(id, name),
              team:teams!payment_requests_team_id_fkey(id, name, code)
            `;
            break;
          case 'financial_matters':
            selectFields = `
              *,
              applicant:users!financial_matters_applicant_id_fkey(id, name, employee_id),
              department:departments!financial_matters_department_id_fkey(id, name, code)
            `;
            break;
          default:
            selectFields = "*";
        }

        entityData = await executeQuery(
          supabase
            .from(instance.entity_type)
            .select(selectFields)
            .eq("id", instance.entity_id)
            .single()
        );
      } catch (error) {
        console.warn(`无法获取业务实体数据: ${instance.entity_type}`, error);
      }
    }

    // 按节点分组任务，展示同一节点的多个审批人
    const tasksByNode = tasks.reduce((acc: any, task: any) => {
      if (!acc[task.node_id]) {
        acc[task.node_id] = [];
      }
      acc[task.node_id].push(task);
      return acc;
    }, {});

    // 创建节点ID到节点名称的映射
    const nodeMap = workflowNodes.reduce((acc: any, node: any) => {
      acc[node.node_id] = node.title;
      return acc;
    }, {});

    return {
      ...instance,
      tasks: tasks || [],
      tasksByNode,
      approvals: approvals || [],
      workflowNodes: workflowNodes || [],
      nodeMap,
      entityData
    };
  }
}

// =============================================================================
// 成本管理 API
// =============================================================================

class CostAPI {
  async getCostCenters(): Promise<CostCenter[]> {
    return executeQuery(
      supabase.from("cost_centers").select(`
          *,
          responsible:users!cost_centers_responsible_id_fkey (*)
        `)
    );
  }

  async createCostCenter(data: Partial<CostCenter>): Promise<CostCenter> {
    return executeQuery(
      supabase.from("cost_centers").insert(data).select().single()
    );
  }

  async updateCostCenter(
    id: string,
    data: Partial<CostCenter>
  ): Promise<CostCenter> {
    return executeQuery(
      supabase.from("cost_centers").update(data).eq("id", id).select().single()
    );
  }

  async deleteCostCenter(id: string): Promise<void> {
    await executeQuery(supabase.from("cost_centers").delete().eq("id", id));
  }

  async getCostRecords(filters?: any): Promise<CostRecord[]> {
    let query = supabase.from("cost_records").select(`
        *,
        cost_center:cost_centers (*),
        category:finance_categories (*),
        created_by:users!cost_records_created_by_id_fkey (*)
      `);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value);
        }
      });
    }

    const costRecords = await executeQuery(
      query.order("created_at", { ascending: false })
    );

    // 加载每个成本记录的分摊记录
    const costRecordsWithAllocations = await Promise.all(
      costRecords.map(async (costRecord) => {
        const allocationRecords = await this.getAllocationRecordsByCostId(
          costRecord.id
        );
        return {
          ...costRecord,
          allocation_records: allocationRecords,
          is_allocation_enabled: allocationRecords.length > 0
        };
      })
    );

    return costRecordsWithAllocations;
  }

  async getAllocationRecordsByCostId(
    costId: string
  ): Promise<AllocationRecord[]> {
    const records = await executeQuery(
      supabase
        .from("allocation_records")
        .select("*")
        .eq("source_record_type", "cost")
        .eq("source_record_id", costId)
        .order("created_at", { ascending: false })
    );

    // 为每个分摊记录添加团队分摊配置信息
    const recordsWithConfig = await Promise.all(
      records.map(async (record) => {
        // 从团队分摊配置中获取信息
        const teamConfig = await executeQuery(
          supabase
            .from("team_allocation_configs")
            .select(
              `
              *,
              team:teams (*)
            `
            )
            .eq("id", record.allocation_config_id)
            .single()
        );

        return {
          ...record,
          allocation_config: teamConfig
            ? {
                id: teamConfig.id,
                name: teamConfig.team?.name || "未知团队",
                target_type: "department" as const,
                target_id: teamConfig.team_id,
                allocation_ratio: teamConfig.allocation_ratio,
                is_enabled: teamConfig.is_enabled,
                created_by_id: teamConfig.created_by_id,
                created_at: teamConfig.created_at,
                updated_at: teamConfig.updated_at,
                target: teamConfig.team
              }
            : null
        };
      })
    );

    return recordsWithConfig;
  }

  async createCostRecord(data: Partial<CostRecord>): Promise<CostRecord> {
    return executeQuery(
      supabase.from("cost_records").insert(data).select().single()
    );
  }

  async updateCostRecord(
    id: string,
    data: Partial<CostRecord>
  ): Promise<CostRecord> {
    return executeQuery(
      supabase.from("cost_records").update(data).eq("id", id).select().single()
    );
  }

  async getCostStatistics() {
    const records = await executeQuery(
      supabase
        .from("cost_records")
        .select(
          "amount, actual_cost, budget_cost, status, period_year, period_month"
        )
    );

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    return {
      totalRecords: records.length,
      totalBudget: records.reduce(
        (sum: number, record: any) => sum + (record.budget_cost || 0),
        0
      ),
      totalActual: records.reduce(
        (sum: number, record: any) => sum + (record.actual_cost || 0),
        0
      ),
      currentMonthRecords: records.filter(
        (r: any) =>
          r.period_year === currentYear && r.period_month === currentMonth
      ).length,
      approvedRecords: records.filter((r: any) => r.status === "approved")
        .length,
      pendingRecords: records.filter((r: any) => r.status === "draft").length
    };
  }
}

// =============================================================================
// 待办事项管理 API
// =============================================================================

class TodoAPI extends BaseAPI<Todo> {
  constructor() {
    super("todos");
  }

  async getTodosWithDetails(): Promise<Todo[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select(
          `
          *,
          assigned_to:users!todos_assigned_to_id_fkey (*),
          created_by:users!todos_created_by_id_fkey (*)
        `
        )
        .order("created_at", { ascending: false })
    );
  }

  async getUserTodos(userId: string, status?: string): Promise<Todo[]> {
    let query = supabase
      .from(this.tableName)
      .select(
        `
        *,
        assigned_to:users!todos_assigned_to_id_fkey (*),
        created_by:users!todos_created_by_id_fkey (*)
      `
      )
      .eq("assigned_to_id", userId);

    if (status) {
      query = query.eq("status", status);
    }

    return executeQuery(query.order("due_date", { ascending: true }));
  }

  async markCompleted(id: string): Promise<Todo> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .update({
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()
    );
  }

  async getTodoStatistics(userId?: string) {
    let query = supabase
      .from(this.tableName)
      .select("status, priority, due_date, type");

    if (userId) {
      query = query.eq("assigned_to_id", userId);
    }

    const todos = await executeQuery(query);
    const today = new Date().toISOString().split("T")[0];

    return {
      totalTodos: todos.length,
      pendingTodos: todos.filter((t: any) => t.status === "pending").length,
      inProgressTodos: todos.filter((t: any) => t.status === "in_progress")
        .length,
      completedTodos: todos.filter((t: any) => t.status === "completed").length,
      overdueTodos: todos.filter(
        (t: any) => t.status !== "completed" && t.due_date && t.due_date < today
      ).length,
      highPriorityTodos: todos.filter(
        (t: any) => t.priority === "high" || t.priority === "urgent"
      ).length,
      dueTodayTodos: todos.filter((t: any) => t.due_date === today).length
    };
  }
}

// =============================================================================
// 财务分类管理 API
// =============================================================================

class FinanceCategoryAPI extends BaseAPI<FinanceCategory> {
  constructor() {
    super("finance_categories");
  }

  async getHierarchy(): Promise<FinanceCategory[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .order("sort_order", { ascending: true })
        .order("code", { ascending: true })
    );
  }

  async getByType(type: string): Promise<FinanceCategory[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .eq("type", type)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
    );
  }

  async getByCode(code: string): Promise<FinanceCategory | null> {
    return executeQuery(
      supabase.from(this.tableName).select("*").eq("code", code).single()
    );
  }

  async getChildren(parentId: string): Promise<FinanceCategory[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .eq("parent_id", parentId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
    );
  }

  async getTopLevel(): Promise<FinanceCategory[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .eq("level", 1)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
    );
  }

  // 构建树形结构
  async getCategoryTree(): Promise<FinanceCategory[]> {
    const allCategories = await this.getHierarchy();
    return this.buildTree(allCategories);
  }

  private buildTree(
    categories: FinanceCategory[],
    parentId: string | null = null
  ): FinanceCategory[] {
    return categories
      .filter((cat) => cat.parent_id === parentId)
      .map((cat) => ({
        ...cat,
        children: this.buildTree(categories, cat.id)
      }));
  }
}

// =============================================================================
// 往来分摊管理 API
// =============================================================================

class AllocationAPI {
  // 分摊配置
  async getAllocationConfigs(): Promise<AllocationConfig[]> {
    return executeQuery(
      supabase
        .from("allocation_configs")
        .select(
          `
          *,
          created_by:users!allocation_configs_created_by_id_fkey (*)
        `
        )
        .order("created_at", { ascending: false })
    );
  }

  async createAllocationConfig(
    data: Partial<AllocationConfig>
  ): Promise<AllocationConfig> {
    return executeQuery(
      supabase.from("allocation_configs").insert(data).select().single()
    );
  }

  async updateAllocationConfig(
    id: string,
    data: Partial<AllocationConfig>
  ): Promise<AllocationConfig> {
    return executeQuery(
      supabase
        .from("allocation_configs")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async deleteAllocationConfig(id: string): Promise<void> {
    await executeQuery(
      supabase.from("allocation_configs").delete().eq("id", id)
    );
  }

  // 分摊记录
  async getAllocationRecords(filters?: any): Promise<AllocationRecord[]> {
    let query = supabase.from("allocation_records").select(`
        *,
        allocation_config:allocation_configs (*),
        created_by:users!allocation_records_created_by_id_fkey (*)
      `);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value);
        }
      });
    }

    return executeQuery(query.order("allocation_date", { ascending: false }));
  }

  async createAllocationRecord(
    data: Partial<AllocationRecord>
  ): Promise<AllocationRecord> {
    return executeQuery(
      supabase.from("allocation_records").insert(data).select().single()
    );
  }

  async deleteAllocationRecord(id: string): Promise<void> {
    await executeQuery(
      supabase.from("allocation_records").delete().eq("id", id)
    );
  }

  async getAllocationSummary(filters?: any): Promise<AllocationSummary[]> {
    let query = supabase.from("allocation_records").select(`
        allocation_config:allocation_configs!inner (
          name,
          target_type,
          target_id,
          allocation_ratio
        ),
        allocated_amount,
        allocation_date
      `);

    if (filters?.startDate) {
      query = query.gte("allocation_date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("allocation_date", filters.endDate);
    }

    const records = await executeQuery(query);

    // 按目标分组汇总
    const summaryMap = new Map<string, AllocationSummary>();

    records.forEach((record: any) => {
      const config = record.allocation_config;
      const key = `${config.target_type}_${config.target_id}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          id: key,
          target_name: config.name,
          target_type: config.target_type,
          total_allocated: 0,
          allocation_count: 0,
          avg_allocation: 0,
          allocation_ratio: config.allocation_ratio
        });
      }

      const summary = summaryMap.get(key)!;
      summary.total_allocated += record.allocated_amount;
      summary.allocation_count += 1;
      summary.last_allocation_date = record.allocation_date;
    });

    // 计算平均值
    Array.from(summaryMap.values()).forEach((summary) => {
      summary.avg_allocation =
        summary.total_allocated / summary.allocation_count;
    });

    return Array.from(summaryMap.values());
  }

  async getAllocationStatistics(filters?: any) {
    const records = await this.getAllocationRecords(filters);
    const configs = await this.getAllocationConfigs();

    return {
      totalRecords: records.length,
      totalAllocated: records.reduce(
        (sum, record) => sum + record.allocated_amount,
        0
      ),
      activeConfigs: configs.filter((c) => c.is_enabled).length,
      totalConfigs: configs.length,
      avgAllocation:
        records.length > 0
          ? records.reduce((sum, record) => sum + record.allocated_amount, 0) /
            records.length
          : 0
    };
  }

  // 预警规则管理
  async getAlertRules(): Promise<AlertRule[]> {
    return executeQuery(
      supabase
        .from("alert_rules")
        .select(
          `
          *,
          created_by:users!alert_rules_created_by_id_fkey (*),
          category:finance_categories!alert_rules_category_id_fkey (*)
        `
        )
        .order("created_at", { ascending: false })
    );
  }

  async createAlertRule(data: Partial<AlertRule>): Promise<AlertRule> {
    return executeQuery(
      supabase.from("alert_rules").insert(data).select().single()
    );
  }

  async updateAlertRule(
    id: string,
    data: Partial<AlertRule>
  ): Promise<AlertRule> {
    return executeQuery(
      supabase.from("alert_rules").update(data).eq("id", id).select().single()
    );
  }

  async deleteAlertRule(id: string): Promise<void> {
    await executeQuery(supabase.from("alert_rules").delete().eq("id", id));
  }

  // 预警记录管理
  async getAlertRecords(filters?: any): Promise<AlertRecord[]> {
    let query = supabase.from("alert_records").select(`
        *,
        alert_rule:alert_rules (*),
        resolved_by:users!alert_records_resolved_by_id_fkey (*)
      `);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (key === "startDate") {
            query = query.gte("alert_date", value);
          } else if (key === "endDate") {
            query = query.lte("alert_date", value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    return executeQuery(query.order("alert_date", { ascending: false }));
  }

  async createAlertRecord(data: Partial<AlertRecord>): Promise<AlertRecord> {
    return executeQuery(
      supabase.from("alert_records").insert(data).select().single()
    );
  }

  async resolveAlertRecord(
    id: string,
    resolvedById?: string
  ): Promise<AlertRecord> {
    return executeQuery(
      supabase
        .from("alert_records")
        .update({
          status: "resolved",
          resolved_by_id: resolvedById,
          resolved_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()
    );
  }

  async ignoreAlertRecord(
    id: string,
    resolvedById?: string
  ): Promise<AlertRecord> {
    return executeQuery(
      supabase
        .from("alert_records")
        .update({
          status: "ignored",
          resolved_by_id: resolvedById,
          resolved_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()
    );
  }

  async getAlertStatistics() {
    const records = await this.getAlertRecords();

    return {
      totalAlerts: records.length,
      activeAlerts: records.filter((r) => r.status === "active").length,
      resolvedAlerts: records.filter((r) => r.status === "resolved").length,
      ignoredAlerts: records.filter((r) => r.status === "ignored").length,
      highLevelAlerts: records.filter((r) => r.level === "high").length,
      mediumLevelAlerts: records.filter((r) => r.level === "medium").length,
      lowLevelAlerts: records.filter((r) => r.level === "low").length
    };
  }
}

// =============================================================================
// 维护计划相关API
// =============================================================================

class MaintenancePlanAPI extends BaseAPI<MaintenancePlan> {
  constructor() {
    super("maintenance_plans");
  }

  async getMaintenancePlans(filters?: any): Promise<MaintenancePlan[]> {
    let query = supabase
      .from(this.tableName)
      .select(
        `
        *,
        asset:assets!maintenance_plans_asset_id_fkey (*),
        responsible:users!maintenance_plans_responsible_id_fkey (*)
      `
      )
      .order("created_at", { ascending: false });

    if (filters) {
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.type) query = query.eq("type", filters.type);
      if (filters.asset_id) query = query.eq("asset_id", filters.asset_id);
    }

    return executeQuery(query);
  }

  async createMaintenancePlan(
    data: Partial<MaintenancePlan>
  ): Promise<MaintenancePlan> {
    return executeQuery(
      supabase.from(this.tableName).insert(data).select().single()
    );
  }

  async updateMaintenancePlan(
    id: string,
    data: Partial<MaintenancePlan>
  ): Promise<MaintenancePlan> {
    return executeQuery(
      supabase.from(this.tableName).update(data).eq("id", id).select().single()
    );
  }
}

class MaintenanceRecordAPI extends BaseAPI<MaintenanceRecord> {
  constructor() {
    super("maintenance_records");
  }

  async getMaintenanceRecords(filters?: any): Promise<MaintenanceRecord[]> {
    let query = supabase
      .from(this.tableName)
      .select(
        `
        *,
        asset:assets!maintenance_records_asset_id_fkey (*),
        plan:maintenance_plans!maintenance_records_plan_id_fkey (*),
        supplier:suppliers!maintenance_records_supplier_id_fkey (*)
      `
      )
      .order("created_at", { ascending: false });

    if (filters) {
      if (filters.type) query = query.eq("type", filters.type);
      if (filters.asset_id) query = query.eq("asset_id", filters.asset_id);
      if (filters.plan_id) query = query.eq("plan_id", filters.plan_id);
    }

    return executeQuery(query);
  }

  async createMaintenanceRecord(
    data: Partial<MaintenanceRecord>
  ): Promise<MaintenanceRecord> {
    return executeQuery(
      supabase.from(this.tableName).insert(data).select().single()
    );
  }

  async updateMaintenanceRecord(
    id: string,
    data: Partial<MaintenanceRecord>
  ): Promise<MaintenanceRecord> {
    return executeQuery(
      supabase.from(this.tableName).update(data).eq("id", id).select().single()
    );
  }
}

// =============================================================================
// 资产处置相关API
// =============================================================================

class AssetDisposalAPI {
  async getAssetDisposals(): Promise<AssetDisposal[]> {
    const result = await executeQuery(
      supabase
        .from("asset_disposals")
        .select(
          `
          *,
          asset:assets!asset_disposals_asset_id_fkey (*),
          approver:users!asset_disposals_approver_id_fkey (*)
        `
        )
        .order("created_at", { ascending: false })
    );
    return result || [];
  }

  async createAssetDisposal(
    data: Partial<AssetDisposal>
  ): Promise<AssetDisposal> {
    const result = await executeQuery(
      supabase
        .from("asset_disposals")
        .insert(data)
        .select(
          `
          *,
          asset:assets!asset_disposals_asset_id_fkey (*),
          approver:users!asset_disposals_approver_id_fkey (*)
        `
        )
        .single()
    );
    return result;
  }

  async updateAssetDisposal(
    id: string,
    data: Partial<AssetDisposal>
  ): Promise<AssetDisposal> {
    const result = await executeQuery(
      supabase
        .from("asset_disposals")
        .update(data)
        .eq("id", id)
        .select(
          `
          *,
          asset:assets!asset_disposals_asset_id_fkey (*),
          approver:users!asset_disposals_approver_id_fkey (*)
        `
        )
        .single()
    );
    return result;
  }

  async deleteAssetDisposal(id: string): Promise<void> {
    await executeQuery(supabase.from("asset_disposals").delete().eq("id", id));
  }
}

// =============================================================================
// 采购管理 API
// =============================================================================

class ProcurementAPI {
  // ===== 采购订单管理 =====
  async getProcurementOrders(filters?: any): Promise<ProcurementOrder[]> {
    let query = supabase
      .from("procurement_orders")
      .select(
        `
        *,
        applicant:applicant_id(id, name, employee_id),
        department:department_id(id, name, code),
        supplier:supplier_id(id, name, code),
        created_by:created_by_id(id, name, employee_id),
        items:procurement_order_items(
          id,
          asset_code,
          asset_name,
          category_id,
          brand_id,
          specification_model,
          project_id,
          quantity,
          unit_price,
          total_amount,
          budget_amount,
          created_at,
          category:category_id(id, name),
          brand:brand_id(id, name),
          project:project_id(id, name)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (filters) {
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.department_id)
        query = query.eq("department_id", filters.department_id);
      if (filters.supplier_id)
        query = query.eq("supplier_id", filters.supplier_id);
    }

    const data = await executeQuery(query);

    // 转换字段名为camelCase
    return data.map((order: any) => ({
      id: order.id,
      orderNumber: order.order_number,
      title: order.title,
      applicantId: order.applicant_id,
      departmentId: order.department_id,
      supplierId: order.supplier_id,
      expectedDeliveryDate: order.expected_delivery_date,
      totalAmount: order.total_amount,
      purchaseTotalAmount: order.purchase_total_amount,
      status: order.status,
      urgency: order.urgency,
      businessPurpose: order.business_purpose,
      attachments: order.attachments,
      approvalHistory: order.approval_history,
      createdById: order.created_by_id,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      applicant: order.applicant
        ? {
            id: order.applicant.id,
            name: order.applicant.name,
            employeeId: order.applicant.employee_id
          }
        : null,
      department: order.department
        ? {
            id: order.department.id,
            name: order.department.name,
            code: order.department.code
          }
        : null,
      supplier: order.supplier
        ? {
            id: order.supplier.id,
            name: order.supplier.name,
            code: order.supplier.code
          }
        : null,
      createdBy: order.created_by
        ? {
            id: order.created_by.id,
            name: order.created_by.name,
            employeeId: order.created_by.employee_id
          }
        : null,
      items: order.items
        ? order.items.map((item: any) => ({
            id: item.id,
            orderId: item.order_id,
            assetCode: item.asset_code,
            assetName: item.asset_name,
            categoryId: item.category_id,
            brandId: item.brand_id,
            specificationModel: item.specification_model,
            projectId: item.project_id,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalAmount: item.total_amount,
            budgetAmount: item.budget_amount,
            createdAt: item.created_at,
            category: item.category
              ? {
                  id: item.category.id,
                  name: item.category.name
                }
              : null,
            brand: item.brand
              ? {
                  id: item.brand.id,
                  name: item.brand.name
                }
              : null,
            project: item.project
              ? {
                  id: item.project.id,
                  name: item.project.name
                }
              : null
          }))
        : []
    }));
  }

  async createProcurementOrder(
    data: Partial<ProcurementOrder>
  ): Promise<ProcurementOrder> {
    // 分离订单数据和明细数据
    const { items, ...orderData } = data;

    // 转换订单数据字段名为snake_case
    const orderInsertData = {
      order_number: orderData.orderNumber,
      title: orderData.title,
      description: orderData.description,
      applicant_id: orderData.applicantId,
      department_id: orderData.departmentId,
      supplier_id: orderData.supplierId,
      expected_delivery_date: orderData.expectedDeliveryDate,
      total_amount: orderData.totalAmount,
      status: orderData.status,
      priority: orderData.priority,
      notes: orderData.notes,
      created_by_id: orderData.createdById
    };

    // 创建采购订单
    const order = await executeQuery(
      supabase
        .from("procurement_orders")
        .insert(orderInsertData)
        .select()
        .single()
    );

    // 如果有明细数据，创建采购明细
    if (items && Array.isArray(items) && items.length > 0) {
      const orderItems = items.map((item) => ({
        order_id: order.id,
        asset_code: item.assetCode || "",
        asset_name: item.assetName || "", // 确保有默认值
        category_id: item.categoryId || "",
        brand_id: item.brandId || "",
        specification_model: item.specificationModel || "",
        project_id: item.projectId || "",
        quantity: item.quantity || 0,
        unit_price: item.unitPrice || 0,
        total_amount: (item.quantity || 0) * (item.unitPrice || 0),
        budget_amount: item.budgetAmount || 0
      }));

      await executeQuery(
        supabase.from("procurement_order_items").insert(orderItems)
      );
    }

    return order;
  }

  async updateProcurementOrder(
    id: string,
    data: Partial<ProcurementOrder>
  ): Promise<ProcurementOrder> {
    // 分离订单数据和明细数据
    const { items, ...orderData } = data;

    // 转换订单数据字段名为snake_case
    const orderUpdateData = {
      order_number: orderData.orderNumber,
      title: orderData.title,
      description: orderData.description,
      applicant_id: orderData.applicantId,
      department_id: orderData.departmentId,
      supplier_id: orderData.supplierId,
      expected_delivery_date: orderData.expectedDeliveryDate,
      total_amount: orderData.totalAmount,
      status: orderData.status,
      priority: orderData.priority,
      notes: orderData.notes
    };

    // 更新采购订单
    const order = await executeQuery(
      supabase
        .from("procurement_orders")
        .update(orderUpdateData)
        .eq("id", id)
        .select()
        .single()
    );

    // 如果有明细数据，智能更新明细
    if (items && Array.isArray(items)) {
      // 获取现有的明细
      const existingItems = await executeQuery(
        supabase.from("procurement_order_items").select("id").eq("order_id", id)
      );

      // 获取已有关联入库明细的采购明细ID
      const receipts = await executeQuery(
        supabase.from("procurement_receipts").select("id").eq("order_id", id)
      );
      const receiptIds = receipts.map((receipt) => receipt.id);

      let referencedIds: string[] = [];
      if (receiptIds.length > 0) {
        const referencedItems = await executeQuery(
          supabase
            .from("procurement_receipt_items")
            .select("order_item_id")
            .in("receipt_id", receiptIds)
        );
        referencedIds = referencedItems.map((item) => item.order_item_id);
      }

      // 处理每个明细项
      for (const item of items) {
        if (item.id && item.id.trim() !== "") {
          // 如果明细有ID且不为空，说明是现有明细，进行更新
          const updateData = {
            asset_code: item.assetCode || "",
            asset_name: item.assetName || "", // 确保有默认值
            category_id: item.categoryId || "",
            brand_id: item.brandId || "",
            specification_model: item.specificationModel || "",
            project_id: item.projectId || "",
            quantity: item.quantity || 0,
            unit_price: item.unitPrice || 0,
            total_amount: (item.quantity || 0) * (item.unitPrice || 0),
            budget_amount: item.budgetAmount || 0
          };

          await executeQuery(
            supabase
              .from("procurement_order_items")
              .update(updateData)
              .eq("id", item.id)
          );
        } else {
          // 如果明细没有ID或ID为空，说明是新明细，进行插入
          const insertData = {
            order_id: id,
            asset_code: item.assetCode || "",
            asset_name: item.assetName || "", // 确保有默认值
            category_id: item.categoryId || "",
            brand_id: item.brandId || "",
            specification_model: item.specificationModel || "",
            project_id: item.projectId || "",
            quantity: item.quantity || 0,
            unit_price: item.unitPrice || 0,
            total_amount: (item.quantity || 0) * (item.unitPrice || 0),
            budget_amount: item.budgetAmount || 0
          };

          await executeQuery(
            supabase.from("procurement_order_items").insert(insertData)
          );
        }
      }

      // 删除不在新明细列表中的现有明细（但保留已有关联入库明细的）
      const newItemIds = items
        .filter((item) => item.id && item.id.trim() !== "")
        .map((item) => item.id);
      const itemsToDelete = existingItems.filter(
        (item) =>
          !newItemIds.includes(item.id) && !referencedIds.includes(item.id)
      );

      if (itemsToDelete.length > 0) {
        await executeQuery(
          supabase
            .from("procurement_order_items")
            .delete()
            .in(
              "id",
              itemsToDelete.map((item) => item.id)
            )
        );
      }
    }

    return order;
  }

  async deleteProcurementOrder(id: string): Promise<void> {
    await executeQuery(
      supabase.from("procurement_orders").delete().eq("id", id)
    );
  }

  // ===== 采购订单明细管理 =====
  async getProcurementOrderItems(
    orderId: string
  ): Promise<ProcurementOrderItem[]> {
    return executeQuery(
      supabase
        .from("procurement_order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true })
    );
  }

  async createProcurementOrderItem(
    data: Partial<ProcurementOrderItem>
  ): Promise<ProcurementOrderItem> {
    return executeQuery(
      supabase.from("procurement_order_items").insert(data).select().single()
    );
  }

  async updateProcurementOrderItem(
    id: string,
    data: Partial<ProcurementOrderItem>
  ): Promise<ProcurementOrderItem> {
    return executeQuery(
      supabase
        .from("procurement_order_items")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async deleteProcurementOrderItem(id: string): Promise<void> {
    await executeQuery(
      supabase.from("procurement_order_items").delete().eq("id", id)
    );
  }

  // ===== 采购入库管理 =====
  async getProcurementReceipts(filters?: any): Promise<ProcurementReceipt[]> {
    let query = supabase
      .from("procurement_receipts")
      .select(
        `
        *,
        order:order_id(id, order_number, title),
        supplier:supplier_id(id, name, code),
        inspector:inspector_id(id, name, employee_id),
        created_by:created_by_id(id, name, employee_id)
      `
      )
      .order("created_at", { ascending: false });

    if (filters) {
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.order_id) query = query.eq("order_id", filters.order_id);
      if (filters.supplier_id)
        query = query.eq("supplier_id", filters.supplier_id);
    }

    return executeQuery(query);
  }

  async createProcurementReceipt(
    data: Partial<ProcurementReceipt>
  ): Promise<ProcurementReceipt> {
    return executeQuery(
      supabase.from("procurement_receipts").insert(data).select().single()
    );
  }

  async updateProcurementReceipt(
    id: string,
    data: Partial<ProcurementReceipt>
  ): Promise<ProcurementReceipt> {
    return executeQuery(
      supabase
        .from("procurement_receipts")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  async deleteProcurementReceipt(id: string): Promise<void> {
    await executeQuery(
      supabase.from("procurement_receipts").delete().eq("id", id)
    );
  }

  // ===== 采购入库明细管理 =====
  async getProcurementReceiptItems(
    receiptId: string
  ): Promise<ProcurementReceiptItem[]> {
    return executeQuery(
      supabase
        .from("procurement_receipt_items")
        .select(
          `
          *,
          order_item:order_item_id(
            id, 
            asset_name, 
            asset_code,
            category_id, 
            brand_id, 
            specification_model,
            project_id,
            unit_price
          ),
          location:location_id(id, name, code)
        `
        )
        .eq("receipt_id", receiptId)
        .order("created_at", { ascending: true })
    );
  }

  async createProcurementReceiptItem(
    data: Partial<ProcurementReceiptItem>
  ): Promise<ProcurementReceiptItem> {
    return executeQuery(
      supabase.from("procurement_receipt_items").insert(data).select().single()
    );
  }

  async updateProcurementReceiptItem(
    id: string,
    data: Partial<ProcurementReceiptItem>
  ): Promise<ProcurementReceiptItem> {
    return executeQuery(
      supabase
        .from("procurement_receipt_items")
        .update(data)
        .eq("id", id)
        .select()
        .single()
    );
  }

  // ===== 采购统计查询 =====
  async getProcurementStatistics() {
    const [totalOrders, pendingOrders, approvedOrders, totalReceipts] =
      await Promise.all([
        executeQuery(
          supabase.from("procurement_orders").select("id", { count: "exact" })
        ),
        executeQuery(
          supabase
            .from("procurement_orders")
            .select("id", { count: "exact" })
            .eq("status", "pending")
        ),
        executeQuery(
          supabase
            .from("procurement_orders")
            .select("id", { count: "exact" })
            .eq("status", "approved")
        ),
        executeQuery(
          supabase.from("procurement_receipts").select("id", { count: "exact" })
        )
      ]);

    return {
      totalOrders: totalOrders.length,
      pendingOrders: pendingOrders.length,
      approvedOrders: approvedOrders.length,
      totalReceipts: totalReceipts.length
    };
  }
}

// =============================================================================
// 导出 API 实例
// =============================================================================

export const userAPI = new UserAPI();
export const departmentAPI = new DepartmentAPI();
export const projectAPI = new ProjectAPI();
export const goalAPI = new GoalAPI();
export const customerAPI = new CustomerAPI();
export const supplierAPI = new SupplierAPI();
export const expenseAPI = new ExpenseAPI();
export const revenueAPI = new RevenueAPI();
export const accountsAPI = new AccountsAPI();
export const assetAPI = new AssetAPI();
export const teamAPI = new TeamAPI();
export const mileageAPI = new MileageAPI();
export const taskAPI = new TaskAPI();
// 菜单管理API
class MenuAPI extends BaseAPI<any> {
  constructor() {
    super("menus");
  }

  async getMenuTree(): Promise<any[]> {
    // 获取所有活跃菜单并构建树形结构
    const allMenus = await executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .eq("status", "active")
        .order("sort_order")
    );

    return this.buildTree(allMenus);
  }

  private buildTree(items: any[]): any[] {
    const itemMap = new Map();
    const tree: any[] = [];

    // 创建映射表
    items.forEach((item) => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // 构建树形结构
    items.forEach((item) => {
      const itemNode = itemMap.get(item.id);
      if (item.parent_id && itemMap.has(item.parent_id)) {
        // 有父级，添加到父级的children中
        itemMap.get(item.parent_id).children.push(itemNode);
      } else {
        // 没有父级，是根节点
        tree.push(itemNode);
      }
    });

    return tree;
  }

  async getMenuPermissions(): Promise<any[]> {
    return executeQuery(
      supabase
        .from("menus")
        .select(
          `
          *,
          menu_permissions (
            permission:permissions (*)
          )
        `
        )
        .eq("status", "active")
        .order("sort_order")
    );
  }
}

export const permissionAPI = new PermissionAPI();
export const roleAPI = new RoleAPI();
export const menuAPI = new MenuAPI();
export const workflowAPI = new WorkflowAPI();
export const costAPI = new CostAPI();
export const todoAPI = new TodoAPI();
export const financeCategoryAPI = new FinanceCategoryAPI();
export const allocationAPI = new AllocationAPI();
export const positionAPI = new PositionAPI();
export const jobLevelAPI = new JobLevelAPI();
export const maintenancePlanAPI = new MaintenancePlanAPI();
export const maintenanceRecordAPI = new MaintenanceRecordAPI();
export const assetDisposalAPI = new AssetDisposalAPI();
export const procurementAPI = new ProcurementAPI();

// =============================================================================
// 共享出行城市日报 API
// =============================================================================

class RideSharingAPI extends BaseAPI<RideSharingDailyReport> {
  constructor() {
    super("ride_sharing_daily_reports");
  }

  async getDailyReportsWithRelations(): Promise<RideSharingDailyReport[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .order("report_date", { ascending: false })
    );
  }

  async getDailyReportsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<RideSharingDailyReport[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .gte("report_date", startDate)
        .lte("report_date", endDate)
        .order("report_date", { ascending: false })
    );
  }

  async getDailyReportsByTeam(
    teamId: string
  ): Promise<RideSharingDailyReport[]> {
    return executeQuery(
      supabase
        .from(this.tableName)
        .select("*")
        .eq("team_id", teamId)
        .order("report_date", { ascending: false })
    );
  }

  async getStatistics(): Promise<RideSharingStatistics> {
    const { data, error } = await supabase.from(this.tableName).select("*");

    if (error) throw error;

    const reports = data || [];
    const totalReports = reports.length;
    const totalRevenue = reports.reduce(
      (sum, report) => sum + report.revenue_gmv,
      0
    );
    const totalOrders = reports.reduce(
      (sum, report) => sum + report.daily_orders,
      0
    );
    const totalVehicles = reports.reduce(
      (sum, report) => sum + report.total_vehicles,
      0
    );

    const averageTurnoverRate =
      totalReports > 0
        ? reports.reduce((sum, report) => sum + report.daily_turnover_rate, 0) /
          totalReports
        : 0;

    const averageOperatingRate =
      totalReports > 0
        ? reports.reduce(
            (sum, report) =>
              sum + (report.operating_vehicles / report.total_vehicles) * 100,
            0
          ) / totalReports
        : 0;

    return {
      total_reports: totalReports,
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      average_turnover_rate: averageTurnoverRate,
      total_vehicles: totalVehicles,
      average_operating_rate: averageOperatingRate
    };
  }

  async createReport(
    data: RideSharingDailyReportFormData
  ): Promise<RideSharingDailyReport> {
    return executeQuery(supabase.from(this.tableName).insert(data));
  }

  async updateReport(
    id: string,
    data: Partial<RideSharingDailyReportFormData>
  ): Promise<RideSharingDailyReport> {
    return executeQuery(
      supabase.from(this.tableName).update(data).eq("id", id)
    );
  }

  async deleteReport(id: string): Promise<void> {
    return executeQuery(supabase.from(this.tableName).delete().eq("id", id));
  }

  async checkDuplicateReport(
    teamId: string,
    reportDate: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("id")
      .eq("team_id", teamId)
      .eq("report_date", reportDate)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  }

  async getTurnoverRateByCity(
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    let query = supabase
      .from(this.tableName)
      .select(
        `
        report_date,
        daily_turnover_rate,
        teams!inner (
          name
        )
      `
      )
      .order("report_date", { ascending: true });

    if (startDate) {
      query = query.gte("report_date", startDate);
    }
    if (endDate) {
      query = query.lte("report_date", endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 获取所有唯一的日期
    const allDates = new Set<string>();
    data?.forEach((item) => {
      allDates.add(item.report_date);
    });

    // 按日期排序
    const sortedDates = Array.from(allDates).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // 按城市分组数据
    const cityDataMap = new Map<string, Map<string, number>>();

    data?.forEach((item) => {
      const city = item.teams?.name || "未知城市";
      if (!cityDataMap.has(city)) {
        cityDataMap.set(city, new Map());
      }
      cityDataMap.get(city)!.set(item.report_date, item.daily_turnover_rate);
    });

    // 构建统一的数据结构
    const result = sortedDates.map((date) => {
      const dataPoint: any = { date };
      cityDataMap.forEach((dateMap, city) => {
        dataPoint[city] = dateMap.get(date) || null;
      });
      return dataPoint;
    });

    return result;
  }
}

// =============================================================================
// 销售订单管理 API
// =============================================================================

class SalesOrderAPI extends BaseAPI<SalesOrder> {
  constructor() {
    super("sales_orders");
  }

  // 获取销售订单详情（包含客户信息）
  async getSalesOrderDetails(
    filters?: SalesOrderFilters
  ): Promise<SalesOrderDetail[]> {
    console.log("🔍 API getSalesOrderDetails 被调用，filters:", filters);

    let query = supabase
      .from("sales_order_details")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters) {
      if (filters.search) {
        query = query.or(
          `order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`
        );
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.paymentStatus) {
        query = query.eq("payment_status", filters.paymentStatus);
      }
      if (filters.customerId) {
        query = query.eq("customer_id", filters.customerId);
      }
      if (filters.startDate) {
        query = query.gte("order_date", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("order_date", filters.endDate);
      }
    }

    const result = await executeQuery(query);
    console.log("📊 API getSalesOrderDetails 返回原始数据:", result);

    // 转换字段名从下划线格式到驼峰格式
    const transformedResult = result.map((item: any) => ({
      id: item.id,
      orderNumber: item.order_number,
      orderDate: item.order_date,
      deliveryDate: item.delivery_date,
      totalAmount: item.total_amount,
      discountAmount: item.discount_amount,
      taxAmount: item.tax_amount,
      finalAmount: item.final_amount,
      paymentStatus: item.payment_status,
      notes: item.notes,
      customerId: item.customer_id,
      customerName: item.customer_name,
      customerCode: item.customer_code,
      customerContact: item.customer_contact,
      customerPhone: item.customer_phone,
      createdByName: item.created_by_name,
      approvedByName: item.approved_by_name,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    console.log("📊 API getSalesOrderDetails 转换后数据:", transformedResult);
    return transformedResult;
  }

  // 获取销售订单明细（包含资产信息）
  async getSalesOrderItemDetails(
    orderId: string
  ): Promise<SalesOrderItemDetail[]> {
    const result = await executeQuery(
      supabase
        .from("sales_order_item_details")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true })
    );

    // 转换字段名从下划线格式到驼峰格式
    return result.map((item: any) => ({
      id: item.id,
      orderId: item.order_id,
      assetId: item.asset_id,
      unitPrice: item.unit_price,
      discountRate: item.discount_rate,
      discountAmount: item.discount_amount,
      taxRate: item.tax_rate,
      taxAmount: item.tax_amount,
      subtotal: item.subtotal,
      totalAmount: item.total_amount,
      notes: item.notes,
      assetCode: item.asset_code,
      assetName: item.asset_name,
      assetModel: item.asset_model,
      assetSpecification: item.asset_specification,
      assetCategoryName: item.asset_category_name,
      assetBrandName: item.asset_brand_name,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  }

  // 创建销售订单（包含明细）
  async createSalesOrder(data: CreateSalesOrderData): Promise<SalesOrder> {
    console.log("API createSalesOrder 接收到的数据:", data);
    const { items, ...orderData } = data;

    // 计算订单金额
    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice, 0);
    const discountAmount = items.reduce((sum, item) => {
      const discount = (item.unitPrice * (item.discountRate || 0)) / 100;
      return sum + discount;
    }, 0);
    const taxAmount = items.reduce((sum, item) => {
      const subtotal =
        item.unitPrice - (item.unitPrice * (item.discountRate || 0)) / 100;
      const tax = (subtotal * (item.taxRate || 0)) / 100;
      return sum + tax;
    }, 0);
    const finalAmount = totalAmount - discountAmount + taxAmount;

    // 创建订单
    const orderInsertData = {
      customer_id: orderData.customerId,
      order_date: orderData.orderDate,
      delivery_date: orderData.deliveryDate || null,
      shipping_address: orderData.shippingAddress || null,
      notes: orderData.notes || null,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      final_amount: finalAmount,
      created_by_id: (await supabase.auth.getUser()).data.user?.id
    };
    console.log("插入销售订单数据:", orderInsertData);

    const order = await executeQuery(
      supabase.from("sales_orders").insert(orderInsertData).select().single()
    );

    // 创建订单明细
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const subtotal =
          item.unitPrice - (item.unitPrice * (item.discountRate || 0)) / 100;
        const tax = (subtotal * (item.taxRate || 0)) / 100;
        const total = subtotal + tax;

        return executeQuery(
          supabase
            .from("sales_order_items")
            .insert({
              order_id: order.id,
              asset_id: item.assetId,
              unit_price: item.unitPrice,
              discount_rate: item.discountRate || 0,
              discount_amount:
                (item.unitPrice * (item.discountRate || 0)) / 100,
              tax_rate: item.taxRate || 0,
              tax_amount: tax,
              subtotal: subtotal,
              total_amount: total,
              notes: item.notes
            })
            .select()
            .single()
        );
      })
    );

    // 暂时注释掉资产状态更新，避免400错误
    // 更新资产状态为已销售
    // try {
    //   await Promise.all(
    //     items.map(item =>
    //       supabase
    //         .from('assets')
    //         .update({ status: 'sold' })
    //         .eq('id', item.assetId)
    //     )
    //   )
    // } catch (error) {
    //   console.warn('更新资产状态失败，但订单创建成功:', error);
    //   // 不抛出错误，因为订单已经创建成功
    // }

    return { ...order, items: orderItems };
  }

  // 重写 BaseAPI 的 update 方法，确保调用正确的更新逻辑
  async update(id: string, data: Partial<SalesOrder>): Promise<SalesOrder> {
    // 如果数据包含驼峰格式的字段，转换为下划线格式
    const updateData: any = {};

    if (data.customerId !== undefined) updateData.customer_id = data.customerId;
    if (data.orderDate !== undefined) updateData.order_date = data.orderDate;
    if (data.deliveryDate !== undefined)
      updateData.delivery_date = data.deliveryDate;
    if (data.shippingAddress !== undefined)
      updateData.shipping_address = data.shippingAddress;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.paymentStatus !== undefined)
      updateData.payment_status = data.paymentStatus;
    if (data.totalAmount !== undefined)
      updateData.total_amount = data.totalAmount;
    if (data.discountAmount !== undefined)
      updateData.discount_amount = data.discountAmount;
    if (data.taxAmount !== undefined) updateData.tax_amount = data.taxAmount;
    if (data.finalAmount !== undefined)
      updateData.final_amount = data.finalAmount;

    // 如果没有转换的字段，直接使用原始数据
    if (Object.keys(updateData).length === 0) {
      Object.assign(updateData, data);
    }

    return executeQuery(
      supabase
        .from("sales_orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()
    );
  }

  // 更新销售订单
  async updateSalesOrder(
    id: string,
    data: UpdateSalesOrderData
  ): Promise<SalesOrder> {
    // 转换字段名从驼峰格式到下划线格式
    const updateData = {
      customer_id: data.customerId,
      order_date: data.orderDate,
      delivery_date: data.deliveryDate || null,
      shipping_address: data.shippingAddress || null,
      notes: data.notes || null,
      payment_status: data.paymentStatus
    };

    return executeQuery(
      supabase
        .from("sales_orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()
    );
  }

  // 更新付款状态
  async updatePaymentStatus(
    id: string,
    paymentStatus: SalesOrder["paymentStatus"]
  ): Promise<SalesOrder> {
    return executeQuery(
      supabase
        .from("sales_orders")
        .update({ payment_status: paymentStatus })
        .eq("id", id)
        .select()
        .single()
    );
  }

  // 获取销售订单统计
  async getSalesOrderStatistics(): Promise<SalesOrderStatistics> {
    const orders = await this.getAll();

    return {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + order.finalAmount, 0),
      pendingOrders: 0, // 已删除状态字段
      confirmedOrders: 0, // 已删除状态字段
      processingOrders: 0, // 已删除状态字段
      shippedOrders: 0, // 已删除状态字段
      deliveredOrders: 0, // 已删除状态字段
      cancelledOrders: 0, // 已删除状态字段
      unpaidOrders: orders.filter((order) => order.paymentStatus === "unpaid")
        .length,
      partialPaidOrders: orders.filter(
        (order) => order.paymentStatus === "partial"
      ).length,
      paidOrders: orders.filter((order) => order.paymentStatus === "paid")
        .length
    };
  }

  // 获取可销售的资产（状态不为已销售）
  async getAvailableAssets(): Promise<Asset[]> {
    return executeQuery(
      supabase
        .from("assets")
        .select(
          `
          *,
          category:asset_categories!assets_category_id_fkey (*),
          brand:asset_brands!assets_brand_id_fkey (*),
          location:asset_locations!assets_location_id_fkey (*)
        `
        )
        .neq("status", "sold")
        .order("created_at", { ascending: false })
    );
  }

  // 创建销售订单明细
  async createSalesOrderItem(
    data: CreateSalesOrderItemData
  ): Promise<SalesOrderItem> {
    const subtotal =
      (data.unitPrice || 0) -
      ((data.unitPrice || 0) * (data.discountRate || 0)) / 100;
    const tax = (subtotal * (data.taxRate || 0)) / 100;
    const total = subtotal + tax;

    return executeQuery(
      supabase
        .from("sales_order_items")
        .insert({
          order_id: data.orderId,
          asset_id: data.assetId,
          unit_price: data.unitPrice,
          discount_rate: data.discountRate || 0,
          discount_amount:
            ((data.unitPrice || 0) * (data.discountRate || 0)) / 100,
          tax_rate: data.taxRate || 0,
          tax_amount: tax,
          subtotal: subtotal,
          total_amount: total,
          notes: data.notes
        })
        .select()
        .single()
    );
  }

  // 删除销售订单明细
  async deleteSalesOrderItem(itemId: string): Promise<void> {
    await executeQuery(
      supabase.from("sales_order_items").delete().eq("id", itemId)
    );
  }

  // 更新销售订单明细
  async updateSalesOrderItem(
    itemId: string,
    data: Partial<SalesOrderItem>
  ): Promise<SalesOrderItem> {
    const subtotal =
      (data.unitPrice || 0) -
      ((data.unitPrice || 0) * (data.discountRate || 0)) / 100;
    const tax = (subtotal * (data.taxRate || 0)) / 100;
    const total = subtotal + tax;

    return executeQuery(
      supabase
        .from("sales_order_items")
        .update({
          asset_id: data.assetId,
          unit_price: data.unitPrice,
          discount_rate: data.discountRate || 0,
          discount_amount:
            ((data.unitPrice || 0) * (data.discountRate || 0)) / 100,
          tax_rate: data.taxRate || 0,
          tax_amount: tax,
          subtotal: subtotal,
          total_amount: total,
          notes: data.notes
        })
        .eq("id", itemId)
        .select()
        .single()
    );
  }
}

const rideSharingAPI = new RideSharingAPI();
const salesOrderAPI = new SalesOrderAPI();
const expenseReimbursementAPI = new ExpenseReimbursementAPI();
const businessTripAPI = new BusinessTripAPI();

// 导入财务事项API
import { financialMatterAPI } from "./financialMatterAPI";
import { ExpenseReimbursementAPI } from "./expenseReimbursementAPI";
import { BusinessTripAPI } from "./businessTripAPI";

export default {
  user: userAPI,
  department: departmentAPI,
  project: projectAPI,
  goal: goalAPI,
  customer: customerAPI,
  supplier: supplierAPI,
  expense: expenseAPI,
  revenue: revenueAPI,
  accounts: accountsAPI,
  asset: assetAPI,
  team: teamAPI,
  mileage: mileageAPI,
  task: taskAPI,
  permission: permissionAPI,
  role: roleAPI,
  workflow: workflowAPI,
  cost: costAPI,
  todo: todoAPI,
  financeCategory: financeCategoryAPI,
  allocation: allocationAPI,
  position: positionAPI,
  maintenancePlan: maintenancePlanAPI,
  maintenanceRecord: maintenanceRecordAPI,
  assetDisposal: assetDisposalAPI,
  procurement: procurementAPI,
  rideSharing: rideSharingAPI,
  salesOrder: salesOrderAPI,
  financialMatter: financialMatterAPI,
  expenseReimbursement: expenseReimbursementAPI,
  businessTrip: businessTripAPI
};
