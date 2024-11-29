import { isString, ShapeFlags } from '@vue/shared';

/**
 * isVnode
 * @param value
 * @returns
 */
export function isVnode(value) {
  return value?.__v_isVnode;
}

/**
 * createVnode
 * @param type
 * @param props
 * @param children
 * @returns
 */
export function createVnode(type, props, children?) {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    key: props?.key, //diff算法对应的key
    el: null, //虚拟节点需要对应的真实节点
    shapeFlag,
  };

  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }
  return vnode;
}
