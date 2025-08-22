import { supabase } from "@/lib/supabase";
import type {
  BusinessTripReimbursement,
  BusinessTripExpenseDetail,
  BusinessTripBankAccount,
  BusinessTripAllocation,
  BusinessTripAttachment,
  CreateBusinessTripReimbursementData,
  UpdateBusinessTripReimbursementData,
  BusinessTripReimbursementStatistics
} from "@/types/businessTrip";

export class BusinessTripAPI {
  // Get all business trip reimbursements with related data
  async getBusinessTripReimbursements() {
    const { data, error } = await supabase
      .from("business_trip_reimbursements")
      .select(
        `
        *,
        applicant:users!business_trip_reimbursements_applicant_id_fkey(id, name),
        department:departments!business_trip_reimbursements_department_id_fkey(id, name),
        team:teams!business_trip_reimbursements_team_id_fkey(id, name),
        approval_workflow:workflows!business_trip_reimbursements_approval_workflow_id_fkey(id, name, description, form_type, status)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as BusinessTripReimbursement[];
  }

  // Get business trip reimbursement by ID with all related data
  async getBusinessTripReimbursementById(id: string) {
    const { data, error } = await supabase
      .from("business_trip_reimbursements")
      .select(
        `
        *,
        applicant:users!business_trip_reimbursements_applicant_id_fkey(id, name),
        department:departments!business_trip_reimbursements_department_id_fkey(id, name),
        team:teams!business_trip_reimbursements_team_id_fkey(id, name),
        approval_workflow:workflows!business_trip_reimbursements_approval_workflow_id_fkey(id, name, description, form_type, status)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as BusinessTripReimbursement;
  }

  // Create new business trip reimbursement
  async createBusinessTripReimbursement(
    data: CreateBusinessTripReimbursementData
  ) {
    const { data: reimbursement, error: reimbursementError } = await supabase
      .from("business_trip_reimbursements")
      .insert({
        applicant_id: data.applicant_id,
        expense_reason: data.expense_reason,
        total_amount: data.total_amount,
        department_id: data.department_id || null,
        team_id: data.team_id || null,
        approval_workflow_id: data.approval_workflow_id || null,
        is_corporate_dimension: data.is_corporate_dimension,
        status: "pending"
      })
      .select()
      .single();

    if (reimbursementError) throw reimbursementError;

    const reimbursementId = reimbursement.id;

    // 如果选择了审批流程，创建工作流实例
    if (data.approval_workflow_id) {
      try {
        // 使用与财务事项相同的方式创建工作流实例
        const workflowInstanceAPI = await import('./workflowInstanceApi');
        await workflowInstanceAPI.default.createWorkflowInstance({
          entity_type: "business_trip_reimbursements",
          entity_id: reimbursementId,
          applicantId: data.applicant_id,
          approval_workflow_id: data.approval_workflow_id,
          data: {
            applicant_id: data.applicant_id,
            expense_reason: data.expense_reason,
            total_amount: data.total_amount.toString(),
            department_id: data.department_id,
            team_id: data.team_id,
            is_corporate_dimension: data.is_corporate_dimension
          }
        });
      } catch (workflowError) {
        console.error("创建工作流实例失败:", workflowError);
        // 不抛出错误，避免影响申请创建
      }
    }

    // Create expense details
    if (data.expense_details.length > 0) {
      const { error: expenseError } = await supabase
        .from("business_trip_expense_details")
        .insert(
          data.expense_details.map((detail) => ({
            business_trip_reimbursement_id: reimbursementId,
            accommodation_fee: parseFloat(detail.accommodation_fee) || 0,
            intercity_transport_fee:
              parseFloat(detail.intercity_transport_fee) || 0,
            local_transport_fee: parseFloat(detail.local_transport_fee) || 0,
            other_fees: parseFloat(detail.other_fees) || 0,
            description: detail.description
          }))
        );

      if (expenseError) throw expenseError;
    }

    // Create bank accounts
    if (data.bank_accounts.length > 0) {
      const { error: bankError } = await supabase
        .from("business_trip_bank_accounts")
        .insert(
          data.bank_accounts.map((account) => ({
            business_trip_reimbursement_id: reimbursementId,
            payee_account_name: account.payee_account_name,
            bank_account: account.bank_account,
            bank_name: account.bank_name,
            payment_amount: parseFloat(account.payment_amount) || 0
          }))
        );

      if (bankError) throw bankError;
    }

    // Create allocations
    if (data.allocations.length > 0) {
      const { error: allocationError } = await supabase
        .from("business_trip_allocations")
        .insert(
          data.allocations.map((allocation) => ({
            business_trip_reimbursement_id: reimbursementId,
            team_id: allocation.team_id,
            allocation_ratio: parseFloat(allocation.allocation_ratio) || 0
          }))
        );

      if (allocationError) throw allocationError;
    }

    return reimbursement;
  }

  // Update business trip reimbursement
  async updateBusinessTripReimbursement(
    id: string,
    data: UpdateBusinessTripReimbursementData
  ) {
    const { error: reimbursementError } = await supabase
      .from("business_trip_reimbursements")
      .update({
        expense_reason: data.expense_reason,
        total_amount: data.total_amount,
        department_id: data.department_id || null,
        team_id: data.team_id || null,
        approval_workflow_id: data.approval_workflow_id || null,
        is_corporate_dimension: data.is_corporate_dimension
      })
      .eq("id", id);

    if (reimbursementError) throw reimbursementError;

    // Delete existing related data
    await supabase
      .from("business_trip_expense_details")
      .delete()
      .eq("business_trip_reimbursement_id", id);
    await supabase
      .from("business_trip_bank_accounts")
      .delete()
      .eq("business_trip_reimbursement_id", id);
    await supabase
      .from("business_trip_allocations")
      .delete()
      .eq("business_trip_reimbursement_id", id);

    // Create new expense details
    if (data.expense_details.length > 0) {
      const { error: expenseError } = await supabase
        .from("business_trip_expense_details")
        .insert(
          data.expense_details.map((detail) => ({
            business_trip_reimbursement_id: id,
            accommodation_fee: parseFloat(detail.accommodation_fee) || 0,
            intercity_transport_fee:
              parseFloat(detail.intercity_transport_fee) || 0,
            local_transport_fee: parseFloat(detail.local_transport_fee) || 0,
            other_fees: parseFloat(detail.other_fees) || 0,
            description: detail.description
          }))
        );

      if (expenseError) throw expenseError;
    }

    // Create new bank accounts
    if (data.bank_accounts.length > 0) {
      const { error: bankError } = await supabase
        .from("business_trip_bank_accounts")
        .insert(
          data.bank_accounts.map((account) => ({
            business_trip_reimbursement_id: id,
            payee_account_name: account.payee_account_name,
            bank_account: account.bank_account,
            bank_name: account.bank_name,
            payment_amount: parseFloat(account.payment_amount) || 0
          }))
        );

      if (bankError) throw bankError;
    }

    // Create new allocations
    if (data.allocations.length > 0) {
      const { error: allocationError } = await supabase
        .from("business_trip_allocations")
        .insert(
          data.allocations.map((allocation) => ({
            business_trip_reimbursement_id: id,
            team_id: allocation.team_id,
            allocation_ratio: parseFloat(allocation.allocation_ratio) || 0
          }))
        );

      if (allocationError) throw allocationError;
    }

    return { id };
  }

  // Delete business trip reimbursement
  async deleteBusinessTripReimbursement(id: string) {
    const { error } = await supabase
      .from("business_trip_reimbursements")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { id };
  }

  // Get expense details for a reimbursement
  async getExpenseDetails(reimbursementId: string) {
    const { data, error } = await supabase
      .from("business_trip_expense_details")
      .select("*")
      .eq("business_trip_reimbursement_id", reimbursementId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as BusinessTripExpenseDetail[];
  }

  // Get bank accounts for a reimbursement
  async getBankAccounts(reimbursementId: string) {
    const { data, error } = await supabase
      .from("business_trip_bank_accounts")
      .select("*")
      .eq("business_trip_reimbursement_id", reimbursementId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as BusinessTripBankAccount[];
  }

  // Get allocations for a reimbursement
  async getAllocations(reimbursementId: string) {
    const { data, error } = await supabase
      .from("business_trip_allocations")
      .select(
        `
        *,
        team:teams!business_trip_allocations_team_id_fkey(id, name)
      `
      )
      .eq("business_trip_reimbursement_id", reimbursementId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as BusinessTripAllocation[];
  }

  // Get attachments for a reimbursement
  async getAttachments(reimbursementId: string) {
    const { data, error } = await supabase
      .from("business_trip_attachments")
      .select(
        `
        *,
        uploaded_by_user:users!business_trip_attachments_uploaded_by_fkey(id, name)
      `
      )
      .eq("business_trip_reimbursement_id", reimbursementId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as BusinessTripAttachment[];
  }

  // Upload attachment
  async uploadAttachment(reimbursementId: string, file: File) {
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `business_trip_reimbursements/${reimbursementId}/${Date.now()}_${fileName}`;

    // Get current user
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("用户未登录");
    }

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: attachment, error: insertError } = await supabase
      .from("business_trip_attachments")
      .insert({
        business_trip_reimbursement_id: reimbursementId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return attachment as BusinessTripAttachment;
  }

  // Delete attachment
  async deleteAttachment(id: string) {
    const { data: attachment, error: fetchError } = await supabase
      .from("business_trip_attachments")
      .select("file_path")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    if (attachment.file_path) {
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([attachment.file_path]);

      if (storageError) throw storageError;
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("business_trip_attachments")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;
    return { id };
  }

  // Get attachment download URL
  async getAttachmentDownloadUrl(filePath: string) {
    const { data } = supabase.storage
      .from("attachments")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // Get statistics
  async getBusinessTripReimbursementStatistics(): Promise<BusinessTripReimbursementStatistics> {
    const { data, error } = await supabase.rpc(
      "get_business_trip_reimbursement_statistics"
    );

    if (error) throw error;
    return data as BusinessTripReimbursementStatistics;
  }
}

const businessTripAPI = new BusinessTripAPI();
