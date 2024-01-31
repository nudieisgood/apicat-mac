import Api from '@/js/api/api.js'
import DataTypeEnum from '@/js/enum/dataTypeEnum'

class participantApi extends Api {
  static async getParticipant (arg) {
    const res = await this.apiRequest(
      'GET',
      `/okman/workspace/participant?workspaceId=${arg.workspaceId}`,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }

  static async participantConfirm (arg) {
    const res = await this.apiRequest(
      'GET',
      arg.declined
        ? `/okman/workspace/participant/confirm?declined=${arg.declined}&invite-code=${arg.inviteCode}`
        : `/okman/workspace/participant/confirm?invite-code=${arg.inviteCode}`,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }

  static async inviteParticipant (arg) {
    const res = await this.apiRequest(
      'POST',
      '/okman/workspace/participant',
      {},
      arg,
      DataTypeEnum.APPLICATION_JSON.dataType,
      true,
      null
    )
    return res
  }

  static async editParticipant (arg) {
    const res = await this.apiRequest(
      'PATCH',
      '/okman/workspace/participant',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  // 踢除參與者
  static async removeParticipant (arg) {
    const res = await this.apiRequest(
      'DELETE',
      `/okman/workspace/participant?workspaceId=${arg.workspaceId}&userId=${arg.userId}`,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }

  // 參與者自行退出工作區
  static async leaveWorkspace (arg) {
    const res = await this.apiRequest(
      'DELETE',
      `/okman/workspace/participant/leave?workspaceId=${arg.workspaceId}`,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }
}

export default participantApi
