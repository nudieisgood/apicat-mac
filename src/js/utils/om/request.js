// let _ = require("lodash");
import HeaderList  from '@/js/utils/om/headerList.js'



class Request {
  constructor() {
    this.url = '';
    this.method = '';
    // this.headers = [];
    this.headers = new HeaderList();
    this.body = '';
  }
}




export default Request
