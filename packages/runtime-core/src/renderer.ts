import { ShapeFlags } from '@vue/shared';

export function createRenderer(renderOptions) {
  // core中不关心如何渲染

  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = renderOptions;

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      // children[i] 可能是纯文本元素
      patch(null, children[i], container);
    }
  };

  const mountElement = (vnode, container) => {
    const { type, children, props, shapeFlag } = vnode;

    let el = hostCreateElement(type);

    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    // 位运算  & 或（组合）
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }

    hostInsert(el, container);
  };

  // 渲染走这里
  const patch = (n1, n2, container) => {
    // 两次渲染同一个元素直接跳过
    if (n1 == n2) {
      return;
    }

    if (n1 == null) {
      // 初始化操作
      mountElement(n2, container);
    }
  };

  // 多次调用虚拟节点 回进行虚拟节点的比较，在进行更新
  const render = (vnode, container) => {
    // 将虚拟节点变成真实节点渲染
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode;
  };

  return {
    render,
  };
}
