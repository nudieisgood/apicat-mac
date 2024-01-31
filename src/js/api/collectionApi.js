import Api from '@/js/api/api.js'
import DataTypeEnum from '@/js/enum/dataTypeEnum'

class collectionApi extends Api {
  static async createCollection (arg) {
    const res = await this.apiRequest(
      'POST',
      '/okman/collection',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async editCollection (arg) {
    const res = await this.apiRequest(
      'PATCH',
      '/okman/collection',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async deleteCollection (arg) {
    const res = await this.apiRequest(
      'DELETE',
      `/okman/collection?workspaceId=${arg.workspaceId}&collectionsId=${arg.collectionsId}`,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }

  static async getCollectionTree (arg) {
    const res = await this.apiRequest(
      'GET',
      `/okman/collection/tree?workspaceId=${arg.workspaceId}&collectionsId=${arg.collectionsId}`,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }

  static async importCollectionById (arg) {
    const res = await this.apiRequest(
      'POST',
      '/okman/import-collections',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async importCollection (arg) {
    const res = await this.apiRequest(
      'POST',
      '/okman/import',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  static async exportCollection (arg) {
    const res = await this.apiRequest(
      'GET',
      `/okman/export?workspaceId=${arg.workspaceId}&collectionsId=${arg.collectionsId}`,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }
}

export default collectionApi
