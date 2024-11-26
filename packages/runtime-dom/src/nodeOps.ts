// 节点元素的曾查删改等操作

export const nodeOps = {
  // anchor不传  === appendChild    parent.insertBefore(el,null)
  insert: (el, parent, anchor) => parent.insertBefore(el, anchor || null),

  remove(el) {
    const parent = el.parentNode;
    parent && parent.removeChild(el);
  },

  createElement: (type) => document.createElement(type),

  createText: (text) => document.createTextNode(text),
  //设置文本
  setText: (node, text) => (node.nodeValue = text),

  setElementText: (el, text) => (el.textContent = text),

  parentNode: (node) => node.parentNode,

  nextSibling: (node) => node.nextSibling,
};
