import { supabase } from '../lib/supabase';
import { executeQuery } from '../lib/supabase';
import {
  ExpenseReimbursement,
  ExpenseReimbursementAllocation,
  ExpenseReimbursementAttachment,
  ExpenseReimbursementAllocationFormData,
  CreateExpenseReimbursementData,
  UpdateExpenseReimbursementData,
  ExpenseReimbursementStatistics
} from '../types/expense';

export class ExpenseReimbursementAPI {
  // 获取费用报销/冲销申请单列表
  async getExpenseReimbursements(filters?: {
    status?: string;
    department_id?: string;
    applicant_id?: string;
    expense_category?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ExpenseReimbursement[]> {
    let query = supabase
      .from('expense_reimbursements')
      .select(`
        *,
        applicant:users!expense_reimbursements_applicant_id_fkey(id, name, employee_id),
        department:departments(id, name),
        team:teams(id, name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.department_id && filters.department_id !== 'all') {
      query = query.eq('department_id', filters.department_id);
    }
    if (filters?.applicant_id && filters.applicant_id !== 'all') {
      query = query.eq('applicant_id', filters.applicant_id);
    }
    if (filters?.expense_category && filters.expense_category !== 'all') {
      query = query.eq('expense_category', filters.expense_category);
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    return executeQuery(query);
  }

  // 根据ID获取费用报销/冲销申请单
  async getExpenseReimbursementById(id: string): Promise<ExpenseReimbursement | null> {
    const { data, error } = await supabase
      .from('expense_reimbursements')
      .select(`
        *,
        applicant:users!expense_reimbursements_applicant_id_fkey(id, name, employee_id),
        department:departments(id, name),
        team:teams(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`获取费用报销申请单失败: ${error.message}`);
    }

    return data;
  }

  // 创建费用报销/冲销申请单
  async createExpenseReimbursement(data: CreateExpenseReimbursementData): Promise<ExpenseReimbursement> {
    return executeQuery(
      supabase.from('expense_reimbursements').insert({
        ...data,
        status: 'pending' // 默认状态为待审核
      }).select().single()
    );
  }

  // 更新费用报销/冲销申请单
  async updateExpenseReimbursement(id: string, data: UpdateExpenseReimbursementData): Promise<ExpenseReimbursement> {
    return executeQuery(
      supabase.from('expense_reimbursements').update(data).eq('id', id).select().single()
    );
  }

  // 删除费用报销/冲销申请单
  async deleteExpenseReimbursement(id: string): Promise<void> {
    // 删除相关的分摊记录
    await executeQuery(
      supabase.from('expense_reimbursement_allocations').delete().eq('expense_reimbursement_id', id)
    );

    // 删除相关的附件记录
    await executeQuery(
      supabase.from('expense_reimbursement_attachments').delete().eq('expense_reimbursement_id', id)
    );

    // 删除申请单本身
    await executeQuery(
      supabase.from('expense_reimbursements').delete().eq('id', id)
    );
  }

  // 创建分摊记录
  async createAllocation(expenseReimbursementId: string, allocationData: ExpenseReimbursementAllocationFormData): Promise<ExpenseReimbursementAllocation> {
    return executeQuery(
      supabase.from('expense_reimbursement_allocations').insert({
        expense_reimbursement_id: expenseReimbursementId,
        ...allocationData
      }).select().single()
    );
  }

  // 批量创建分摊记录
  async createAllocations(expenseReimbursementId: string, allocations: ExpenseReimbursementAllocationFormData[]): Promise<ExpenseReimbursementAllocation[]> {
    const allocationData = allocations.map(allocation => ({
      expense_reimbursement_id: expenseReimbursementId,
      ...allocation
    }));

    return executeQuery(
      supabase.from('expense_reimbursement_allocations').insert(allocationData).select()
    );
  }

  // 删除分摊记录
  async deleteAllocation(id: string): Promise<void> {
    await executeQuery(
      supabase.from('expense_reimbursement_allocations').delete().eq('id', id)
    );
  }

  // 获取分摊记录
  async getAllocations(expenseReimbursementId: string): Promise<ExpenseReimbursementAllocation[]> {
    const { data, error } = await supabase
      .from('expense_reimbursement_allocations')
      .select(`
        *,
        team:teams(id, name)
      `)
      .eq('expense_reimbursement_id', expenseReimbursementId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`获取分摊记录失败: ${error.message}`);
    }

    return data || [];
  }

  // 获取附件列表
  async getAttachments(expenseReimbursementId: string): Promise<ExpenseReimbursementAttachment[]> {
    const { data, error } = await supabase
      .from('expense_reimbursement_attachments')
      .select('*')
      .eq('expense_reimbursement_id', expenseReimbursementId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`获取附件失败: ${error.message}`);
    }

    return data || [];
  }

  // 上传附件
  async uploadAttachment(
    expenseReimbursementId: string, 
    file: File, 
    uploadedBy: string
  ): Promise<ExpenseReimbursementAttachment> {
    try {
      // 生成文件路径
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `expense-reimbursements/${expenseReimbursementId}/${timestamp}_${sanitizedFileName}`;

      console.log('📤 开始上传附件:', {
        fileName: file.name,
        fileSize: file.size,
        filePath: filePath,
        expenseReimbursementId: expenseReimbursementId
      });

      // 上传文件到Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ 文件上传失败:', uploadError);
        throw new Error(`文件上传失败: ${uploadError.message}`);
      }

      console.log('✅ 文件上传成功:', uploadData);

      // 创建附件记录
      const attachmentData = {
        expense_reimbursement_id: expenseReimbursementId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: uploadedBy
      };

      const { data: attachment, error: attachmentError } = await supabase
        .from('expense_reimbursement_attachments')
        .insert(attachmentData)
        .select()
        .single();

      if (attachmentError) {
        console.error('❌ 附件记录创建失败:', attachmentError);
        throw new Error(`附件记录创建失败: ${attachmentError.message}`);
      }

      console.log('✅ 附件记录创建成功:', attachment);
      return attachment;

    } catch (error) {
      console.error('❌ 附件上传失败:', error);
      throw new Error(`附件上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 删除附件
  async deleteAttachment(id: string): Promise<void> {
    try {
      // 获取附件信息
      const { data: attachment, error: fetchError } = await supabase
        .from('expense_reimbursement_attachments')
        .select('file_path')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(`获取附件信息失败: ${fetchError.message}`);
      }

      // 删除存储中的文件
      if (attachment?.file_path) {
        const { error: deleteError } = await supabase.storage
          .from('attachments')
          .remove([attachment.file_path]);

        if (deleteError) {
          console.error('删除存储文件失败:', deleteError);
        }
      }

      // 删除数据库记录
      await executeQuery(
        supabase.from('expense_reimbursement_attachments').delete().eq('id', id)
      );

    } catch (error) {
      throw new Error(`删除附件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 获取附件下载URL
  async getAttachmentDownloadUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // 获取统计数据
  async getExpenseReimbursementStatistics(): Promise<ExpenseReimbursementStatistics> {
    const { data: requests, error } = await supabase
      .from('expense_reimbursements')
      .select('*');

    if (error) {
      throw new Error(`获取统计数据失败: ${error.message}`);
    }

    const total_count = requests?.length || 0;
    const total_amount = requests?.reduce((sum, request) => sum + request.total_amount, 0) || 0;

    // 按状态统计
    const statusMap = new Map<string, { count: number; amount: number }>();
    requests?.forEach(request => {
      const status = request.status;
      const current = statusMap.get(status) || { count: 0, amount: 0 };
      statusMap.set(status, {
        count: current.count + 1,
        amount: current.amount + request.total_amount
      });
    });

    const by_status = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount
    }));

    // 按部门统计
    const departmentMap = new Map<string, { count: number; amount: number }>();
    requests?.forEach(request => {
      const departmentId = request.department_id || 'unknown';
      const current = departmentMap.get(departmentId) || { count: 0, amount: 0 };
      departmentMap.set(departmentId, {
        count: current.count + 1,
        amount: current.amount + request.total_amount
      });
    });

    const by_department = Array.from(departmentMap.entries()).map(([department_id, data]) => ({
      department_name: department_id === 'unknown' ? '未知部门' : department_id,
      count: data.count,
      amount: data.amount
    }));

    // 按类别统计
    const categoryMap = new Map<string, { count: number; amount: number }>();
    requests?.forEach(request => {
      const category = request.expense_category;
      const current = categoryMap.get(category) || { count: 0, amount: 0 };
      categoryMap.set(category, {
        count: current.count + 1,
        amount: current.amount + request.total_amount
      });
    });

    const by_category = Array.from(categoryMap.entries()).map(([expense_category, data]) => ({
      expense_category,
      count: data.count,
      amount: data.amount
    }));

    return {
      total_count,
      total_amount,
      by_status,
      by_department,
      by_category
    };
  }
} 