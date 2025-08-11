import axios from "axios";

class WorkflowInstanceAPI {
  async createWorkflowInstance(data: any) {
    if (!data.approval_workflow_id) return;

    const response = await axios.post(
      "https://database.fedin.cn/functions/v1/goal-management/createTasks",
      data
    );

    return response.data;
  }
}

export default new WorkflowInstanceAPI();
