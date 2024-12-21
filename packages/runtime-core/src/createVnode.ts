import { isObject, isString, ShapeFlags } from '@vue/shared';

export const Text = Symbol('Text');

export const Fragment = Symbol('Fragment');

/**
 * isVnode
 * @param value
 * @returns
 */
export function isVnode(value) {
  return !!(value && value.__v_isVnode);
}

/**
 * isSameVnode
 * @param n1
 * @param n2
 * @returns
 */
export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

/**
 * createVnode
 * @param type
 * @param props
 * @param children
 * @returns
 */
export function createVnode(type, props, children?) {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0;

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
    } else if (isObject(children)) {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    } else {
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }
  return vnode;
}
