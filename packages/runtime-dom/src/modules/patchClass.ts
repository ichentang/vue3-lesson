/**
 * patchClass
 * @param el
 * @param value
 */
export default function patchClass(el, value) {
  if (value == null) {
    // 移除class
    el.removeAtrribute('class');
  } else {
    el.className = value;
  }
}
