import { ShapeFlags } from '@vue/shared';
import { isSmaeVnode } from './createVnode';

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

    //
    let el = (vnode.el = hostCreateElement(type));

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

  // 比较属性
  const patchProps = (oldProps, newProps, el) => {
    // 新的全生效
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }

    for (let key in oldProps) {
      if (!(key in newProps)) {
        // 以前多的现在没有了，需要删除掉
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      unmount(child);
    }
  };
  // 比较子节点
  const patchChildren = (n1, n2, el) => {
    // text array null
    const c1 = n1.children;
    const c2 = n2.children;

    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    // 1.新的是文本，老的是数组移除老的;
    // 2.新的是文本，老的也是文本，内容不相同替换
    // 3.老的是数组，新的是数组，全量diff算法
    // 4.老的是数组，新的不是数组，移除老的子节点
    // 5.老的是文本，新的是空
    // 6.老的是文本，新的是数组

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //1
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        //2
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          //3 全量diff算法，比对两个数组
        } else {
          // 4
          unmountChildren(c1);
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 5
          hostSetElementText(el, '');
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 6
          mountChildren(c2, el);
        }
      }
    }
  };

  // 比较元素
  const patchElment = (n1, n2, container) => {
    // 1.比较元素的差异，肯定需要复用的dom元素
    // 2.比较属性和元素的子节点

    // 对dom元素的复用
    let el = (n2.el = n1.el);

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    // hostPatchProp 只针对某一个属性来处理
    patchProps(oldProps, newProps, el);

    // 比较子节点
    patchChildren(n1, n2, el);
  };

  const processElement = (n1, n2, container) => {
    if (n1 == null) {
      // 初始化操作
      mountElement(n2, container);
    } else {
      patchElment(n1, n2, container);
    }
  };

  // 渲染走这里
  const patch = (n1, n2, container) => {
    // 两次渲染同一个元素直接跳过
    if (n1 == n2) {
      return;
    }

    // 直接移除老的dom元素，初始化新的dom元素
    if (n1 && !isSmaeVnode(n1, n2)) {
      unmount(n1);
      //执行n2的初始化
      n1 = null;
    }

    // 对元素处理
    processElement(n1, n2, container);
  };

  const unmount = (vnode) => hostRemove(vnode.el);

  // 多次调用虚拟节点 回进行虚拟节点的比较，在进行更新
  const render = (vnode, container) => {
    if (vnode === null) {
      // 移除当前容器中的dom元素
      if (container._vnode) {
        unmount(container._vnode);
      }
    }

    // 将虚拟节点变成真实节点渲染
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode;
  };

  return {
    render,
  };
}
