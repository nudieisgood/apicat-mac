/**
 * @description 格式化树形数据结构为扁平数据结构
 * @param data 传入初始数据
 * @param treeData return 的返回结果
 * @param _params 替换初始数据中 key,title,item 字段为树组件中对应的字段
 * @param _level 层级级别
 * @param parentIds 父节点id集合用来设置pid
 * @param _params.other 自定义添加需要返回的字段
 */

class TreeHelper {
  // static formatFlatTree(data, _level = 0, parentIds = [], treeData = []) {
  static formatFlatTree(data, _params, _level = 0, parentIds = [], treeData = []) {
    if (!data.length) return treeData;

    const list = [];
    const param = {
      id: 'id',
      name: 'name',
      item: 'item',
      // other: _params.other || [],
    };

    const pIds = [];
    const obj = {};
    for (let i = 0; i < data.length; i++) {
      const node = data[i];

      const id = node[param.id];
      const item = node[param.item] || [];

      treeData.push({
        // id: id,
        // name: node[param.name],
        // pid: parentIds[i] || '0',
        // level: _level,
        // ...obj,
        ...node
      });
      list.push(...item);
      pIds.push(...new Array(item.length).fill(id));
     }

    return this.formatFlatTree(list, param, _level + 1, pIds, treeData);
  }

  static formatTree (list) {
    const data = JSON.parse(JSON.stringify(list));
    const obj = {}
    const trees = []
    data.forEach((item) => {
      obj[item.id] = item
    })
    data.forEach((el) => {
      const parent = obj[el.pid]
      if (parent) {
        parent.item = parent.item || []
        parent.item.push(el)
      } else {
        trees.push(el)
      }
    })
    return trees
  }

  /**
 * @description 將符合關鍵字的數據重新組合成樹狀資料
 * @param source 符合關鍵字的數據
 * @param list 全部扁平化的數據
 */

  static getFilterTree (source, list) {
    const initData = JSON.parse(JSON.stringify(list));
    const data = JSON.parse(JSON.stringify(source));
    const obj = {};
    data.forEach((item) => {
      obj[item.id] = item;
    });

    data.forEach((item) => {
      // let pid = item.pid;
      let pid = item.parentId;
      while (pid) {


        // pid為-1，表示該筆資料類型為collection，沒有父層，改取自己的資料
        // if (pid === -1) {
        //   const self = initData.find((el) => el.id === item.id);
        //   if (self) {
        //     if (!data.some(x=>x.id === self.id)) data.push(self)
        //   } else {
        //     pid = null;
        //   }
        //   return
        // }


        const parent = obj[pid];
        if (!parent) {

          const organParent = initData.find((item) => item.id == pid);

          if (organParent) {
            obj[pid] = organParent;
            pid = organParent.parentId;
            data.push(organParent);
          } else {
            pid = null;
          }
        } else {
          pid = null;
        }
      }
    });
    const trees = this.flatToTree(data, obj);
    return { data, trees };
  }

  static flatToTree (data, obj) {
    const trees = [];
    data.forEach((el) => {
      const parent = obj[el.parentId];
      if (parent) {
        if (!el.item) {
          el.item = [];
        }
        parent.item = []
        parent.item.push(el)

        // if (!parent.item.some(x=>x.id === el.id)) parent.item.push(el);
      } else {
        trees.push(el);
      }
    });
    return trees;
  }

  static getTreeIds (list) {
    const ids = []
    list.map((el) => {
      if (Array.isArray(el.item) && el.item.length)
      ids.push(el.id);
    });
    return ids;

  }

  static filterNode(node, predicate, parents = []) {

    let res = null;
    // if (this.isBranch(node)) {
    //   node["item"].map((childNode) => {
    //     console.log('childNode__', childNode)
    //     this.filterNode(childNode, predicate, [...parents, node])
    //   })
    // } else {
    //   console.log('node["item"]__', node["item"])
    // }

    const isNodeItselfMatched = predicate(node);

    if (isNodeItselfMatched) {
      // this.hasChildren(node)
      if (this.hasChildren(node)) {
        let a = node["item"].map((childNode) =>
        this.filterNode(childNode, predicate, [...parents, node]))
      }
    } else {

    }

    // const filteredChildren = this.isBranch(node) ? node["item"].map((childNode) =>
    // this.filterNode(childNode, predicate, [...parents, node])) : null;
    // console.log('filteredChildren__', filteredChildren)

    // const result = this.isBranch(node)
    // console.log('result__', result)
    // let a = []

    // if (result) {
    //   console.log('--- result is true ---')

    //   a = node["item"].map((childNode) =>
    // this.filterNode(childNode, predicate, [...parents, node]))
    // } else {
    //   a= []
    // }
    // console.log('a__', a)



    // const filteredChildren =node["item"].map((childNode) =>
    // this.filterNode(childNode, predicate, [...parents, node])).filter(i => i !== null || i !== undefined);


    // const filteredChildren = this.isBranch(node) ? node["item"].map((childNode) =>
    // this.filterNode(childNode, predicate, [...parents, node])).filter(i => i !== null || i !== undefined) : null;

    // // console.log('---------- ---------- ----------')
    // console.log('filteredChildren__', filteredChildren)

    // const hasChildrenMatched = filteredChildren && filteredChildren.length > 0;
    // console.log('---------- hasChildrenMatched ------')
    // console.log('hasChildrenMatched__', hasChildrenMatched)
    // const isNodeItselfMatched = predicate(node, parents);
    // console.log('---------- isNodeItselfMatched ------')
    // console.log('isNodeItselfMatched__', isNodeItselfMatched)

    // if (isNodeItselfMatched || hasChildrenMatched) {
    //   const childrenData = filteredChildren ? { ["item"]: filteredChildren } : { ["item"]: parents.item };
    //   console.log('childrenData__', childrenData)
    //   res = Object.assign({}, node, childrenData);
    //   console.log('res__', res)
    // } else {
    //   console.log('---------- else ------')
    //   res = Object.assign({}, node);
    //   console.log('res__', res)

    // }

    // if (isNodeItselfMatched || hasChildrenMatched) {
    //   if (filteredChildren) {
    //     console.log({ ["item"]: filteredChildren })
    //   }
    // }

    // return res;
  }
  // static filterNode(node, predicate, parents = []) {
  //   console.log('yo')
  //   let res = null;
  //   const self = this;

  //   const filteredChildren = self.isBranch(node) ? node[self.childrenField].map((childNode) =>
  //       self.filterNode(childNode, predicate, [...parents, node])).filter(i => i !== null) : null;

  //   const hasChildrenMatched = filteredChildren && filteredChildren.length > 0;
  //   const isNodeItselfMatched = predicate(node, parents);

  //   if (isNodeItselfMatched || hasChildrenMatched) {
  //     const childrenData = filteredChildren ? { [self.childrenField]: filteredChildren } : {};
  //     res = Object.assign({}, node, childrenData);
  //   }

  //   return res;
  // }

  static filterNodes(nodes, predicate, parents = []) {

    return nodes.map(node => this.filterNode(node, predicate, parents)).filter(i => i !== null);
  }

  static isBranch(nodeData) {

    const children = nodeData && nodeData["item"];
    // console.log("[nodeData]__", [nodeData]);
    // return children;
    return children && children.length > 0;
    // return children && children.length >= 0;
  }

  static hasChildren(nodeData) {
    const children = nodeData && nodeData["item"];
    return children && children.length > 0;
  }
}

export default TreeHelper
