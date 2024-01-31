import Api from '@/js/api/api.js'
import DataTypeEnum from '@/js/enum/dataTypeEnum'

class folderApi extends Api {
  static async createFolder (arg) {
    const res = await this.apiRequest(
      'POST',
      '/okman/folder',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async editFolder (arg) {
    const res = await this.apiRequest(
      'PATCH',
      '/okman/folder',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async moveFolder (arg) {
    const res = await this.apiRequest(
      'PATCH',
      '/okman/folder/move',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async deleteFolder (arg) {
    const res = await this.apiRequest(
      'DELETE',
      `/okman/folder?workspaceId=${arg.workspaceId}&folderId=${arg.folderId}`,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }
}

export default folderApi
