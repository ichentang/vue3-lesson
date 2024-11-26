// 节点元素属性等操作 class style event

import patchClass from './modules/patchClass';
import patchStyle from './modules/patchStyle';
import patchEvent from './modules/patchEvent';
import patchAtrr from './modules/patchAtrr';

/**
 * patchProp
 * @param el
 * @param key
 * @param prevValue
 * @param nextValue
 * @returns
 */
export default function patchProp(el, key, prevValue, nextValue) {
  if (key === 'class') {
    return patchClass(el, nextValue);
  } else if (key === 'style') {
    return patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    return patchEvent(el, key, nextValue);
  } else {
    return patchAtrr(el, key, nextValue);
  }
}
