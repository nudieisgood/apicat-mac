import Api from '@/js/api/api.js'
import DataTypeEnum from '@/js/enum/dataTypeEnum'

class itemApi extends Api {
  static async createItem (arg) {
    const res = await this.apiRequest(
      'POST',
      '/okman/item',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async editItem (arg) {
    const res = await this.apiRequest(
      'PATCH',
      '/okman/item',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async moveItem (arg) {
    const res = await this.apiRequest(
      'PATCH',
      '/okman/item/move',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async deleteItem (arg) {
    const res = await this.apiRequest(
      'DELETE',
      `/okman/item?workspaceId=${arg.workspaceId}&itemsId=${arg.itemsId}`,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }
}

export default itemApi
