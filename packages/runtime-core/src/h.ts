import { isObject } from '@vue/shared';
import { createVnode, isVnode } from './createVnode';

/**
 * h
 * @param type
 * @param propsOrChildren
 * @param children
 * @returns
 */
export function h(type, propsOrChildren?, children?) {
  let l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      // 属性或者虚拟节点
      if (isVnode(propsOrChildren)) {
        // h('div',h('a))
        return createVnode(type, null, [propsOrChildren]);
      } else {
        return createVnode(type, propsOrChildren);
      }
    }

    //儿子 是数组或者文本
    return createVnode(type, null, propsOrChildren);
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    }

    if (l === 3 && isVnode(children)) {
      children = [children];
    }

    // ===3 ===1
    return createVnode(type, propsOrChildren, children);
  }
}
