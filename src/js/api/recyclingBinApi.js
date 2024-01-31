import Api from '@/js/api/api.js'
import DataTypeEnum from '@/js/enum/dataTypeEnum'

class recyclingBinApi extends Api {
  static async getRecyclingBinList (arg) {
    const res = await this.apiRequest(
      'GET',
      '/okman/recycling-bin',
      {},
      {},
      '',
      true,
      null
    )
    return res
  }

  static async restoreRecyclingBinData (arg) {
    const res = await this.apiRequest(
      'POST',
      '/okman/recycling-bin',
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    )
    return res
  }

  // 手動刪除垃圾桶資料(單筆或多筆)
  static async deleteRecyclingBinData (arg) {
    const res = await this.apiRequest(
      'DELETE',
      `/okman/recycling-bin?${arg}`,
      {},
      {},
      '',
      true,
      null
    )
    return res
  }
}

export default recyclingBinApi
