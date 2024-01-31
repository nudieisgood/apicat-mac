import Mock from 'mockjs'

const random = Mock.Random
// console.log('random__', random)


// Mock.mock('/getData', 'get', {
//   status:200, //请求成功状态码
//   dataList:[1,2,3,4,5,6,7,8,9,10] //模拟的请
//   })

// string
Mock.mock('/getData', 'get', {
  "string|1-10": "★"
})

const fakeFile = {
  filename: 'example.txt',
  content: 'This is an example text file content.'
};
// res.json(fakeFile);

Mock.mock('/getTextFile', 'get', {
  status: 200,
  statusText: 'OKK',
  headers: {
    'host': 'mock-server.com',
    'content-type': 'plain/text'
  },
  data: 'got yooo!!',
  bodySize: 123,
  code: 20000,
  time: 157,
  bodySize: 19.01,
  headerSize: 1.138
})




Mock.mock('/getString', 'get', {
  status: 200,
  statusText: 'OKK',
  headers: {
    'host': 'mock-server.com',
    'content-type': 'plain/text'
  },
  data: 'got yooo!!',
  bodySize: 123,
  code: 20000,
  time: 157,
  bodySize: 19.01,
  headerSize: 1.138
})

function generateXMLData() {
  const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
    <root>
      <element1>${Mock.mock('@string("lower", 5)')}</element1>
      <element2>${Mock.mock('@integer(100, 999)')}</element2>
      <!-- 其他 XML 元素 -->
    </root>
  `;

  return xmlData;
}

Mock.mock('/api/xml', 'get', {
  status: 200,
  statusText: 'OKK',
  headers: {
    'host': 'mock-server.com',
    'content-type': 'application/xml'
  },
  data: generateXMLData,
  bodySize: 123,
  code: 20000,
  time: 157,
  bodySize: 19.01,
  headerSize: 1.138
});

Mock.mock('/api/png', 'get', {
  requestId: 56007,
  responseData: {
    status: 200,
  statusText: 'OKK',
  headers: {
    'host': 'mock-server.com',
    'content-type': 'image/png'
  },
  data: random.image('200x100', '#894FC4', '#FFF', 'png', '!'),
  bodySize: 123,
  code: 20000,
  time: 157,
  bodySize: 19.01,
  headerSize: 1.138
  }

});

// Mock.mock('/getStyle', 'get',{
//   'data|1-10': [
//     '@color;',
//     '@font-family;',
//     'font-size: @natural(12, 24)px;',
//     // 其他 CSS 属性
//   ],
// });
