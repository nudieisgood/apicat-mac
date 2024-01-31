import Api from '@/js/api/api.js'
import DataTypeEnum from '@/js/enum/dataTypeEnum'

class environmentApi extends Api {
  static async createEnvironmentApi (arg) {
    const res = await this.apiRequest(
      'POST',
      '/okman/environment',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null,
      null
    )
    return res
  }

  static async editEnvironmentApi (arg) {
    const res = await this.apiRequest(
      'PATCH',
      '/okman/environment',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null,
      null
    )
    return res
  }

  static async deleteEnvironmentApi (arg) {
    const res = await this.apiRequest(
      'DELETE',
      `/okman/environment?workspaceId=${arg.workspaceId}&environmentId=${arg.environmentId}`,
      {},
      {},
      '',
      true,
      null,
      null
    )
    return res
  }
}

export default environmentApi
