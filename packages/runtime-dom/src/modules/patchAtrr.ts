/**
 * patchAtrr
 * @param el
 * @param key
 * @param value
 */
export default function patchAtrr(el, key, value) {
  if (value == null) {
    el.removerAtrribute(key);
  } else {
    el.setAttribute(key, value);
  }
}
