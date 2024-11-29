/**
 * patchStyle
 * @param el
 * @param prevValue
 * @param nextValue
 */
export default function patchStyle(el, prevValue, nextValue) {
  let style = el.style;
  for (let key in nextValue) {
    // 新样式全部生效
    style[key] = nextValue[key];
  }
  if (prevValue) {
    for (let key in prevValue) {
      // 看以前的属性，如果没有就删除

      if (nextValue) {
        if (nextValue[key] == null) {
          style[key] = null;
        }
      }
    }
  }
}
