import Api from '@/js/api/api.js'
import { apiRequest } from '@/js/utils/httpRequest.js'
import { getUserInfo } from '@/js/lokijs/user.js'
import { createJsonTree, findJsonTree } from '@/js/lokijs/workspace.js'
import DataTypeEnum from '@/js/enum/dataTypeEnum'

class workspaceApi extends Api {
  static async createWorkspace (arg) {
    const res = await this.apiRequest(
      'POST',
      '/okman/workspace',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async editWorkspace (arg) {
    const res = await this.apiRequest(
      'PATCH',
      '/okman/workspace',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async getWorkspaceTree (arg) {
    // findJsonTree 會先進localDB找有沒有已經存在的workspace，如果有的話會使用localDB的json (尚未與雲上的資料一致)
    if (findJsonTree(arg)) {
      return findJsonTree(arg)
    } else {
      await this.apiRequest(
        'GET',
        `/okman/workspace/tree?workspaceId=${arg.workspaceId}`,
        {},
        {},
        '',
        true,
        (res) => {
          createJsonTree(res)
        }
      )
      return findJsonTree(arg)
    }
  }

  static async getWorkspaceList (arg) {
    const res = await this.apiRequest(
      'GET',
      '/okman/workspaces',
      {},
      {},
      '',
      true,
      null
    )
    return res
  }

  static async getWorkspace (arg) {
    const res = await this.apiRequest(
      'GET',
      '/okman/workspace/' + arg.workspaceId,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }

  static async deleteWorkspace (arg) {
    const res = await this.apiRequest(
      'DELETE',
      `/okman/workspace?workspaceId=${arg.workspaceId}`,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }

  // 取得ts起到now的異動記錄列表(含history內容)
  static async getActivityList (arg) {
    const header = {}
    if (getUserInfo().data.length) header.Authorization = 'Bearer ' + getUserInfo().data[0].token
    let params = ''
    params += arg.workspaceId ? `workspaceId=${arg.workspaceId}` : ''
    params += arg.timestamp ? `&ts=${arg.timestamp}` : ''
    params += arg.targetId ? `&targetId=${arg.targetId}` : ''
    const data = {
      method: 'GET',
      url: process.env.VUE_APP_API_BASE + `/okman/activity?${params}`,
      header,
      body: {},
      dataType: ''
    }
    const response = await apiRequest(data, function (params, header, info) {})
    return response
  }

  // 取得該workspace完整活動紀錄(不含history內容)
  static async getWorkspaceActivity (arg) {
    const header = {}
    if (getUserInfo().data.length) header.Authorization = 'Bearer ' + getUserInfo().data[0].token
    let params = ''
    params += arg.itemTypeList ? `itemTypeList=${arg.itemTypeList}` : ''
    params += arg.userIdList ? `&userIdList=${arg.userIdList}` : ''
    params += arg.page ? `&page=${arg.page}` : ''
    params += arg.size ? `&size=${arg.size}` : ''
    const data = {
      method: 'GET',
      url: process.env.VUE_APP_API_BASE + `/okman/activity/${arg.workspaceId}?${params}`,
      header,
      body: {},
      dataType: ''
    }
    const response = await apiRequest(data, function (params, header, info) {})
    return response
  }

  // 轉移工作區擁有者身分給其他參與者
  static async editWorkspaceOwner (arg) {
    const res = await this.apiRequest(
      'PATCH',
      '/okman/workspace/owner',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }
}

export default workspaceApi
