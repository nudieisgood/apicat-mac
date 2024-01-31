class NodeEnum {}

NodeEnum.ELEMENT_NODE = 1
NodeEnum.ATTRIBUTE_NODE = 2
NodeEnum.TEXT_NODE = 3
NodeEnum.COMMENT_NODE = 8

const nodeList = [NodeEnum.ELEMENT_NODE, NodeEnum.ATTRIBUTE_NODE, NodeEnum.TEXT_NODE, NodeEnum.COMMENT_NODE]

export { nodeList }
export default NodeEnum
