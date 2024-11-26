/**
 * createInvoker
 * @param value
 * @returns
 */
function createInvoker(value) {
  const invoker = (e) => invoker.value(e);

  // 更改invoker中的value属性 可以修改对应的调用函数
  invoker.value = value;

  return invoker;
}

/**
 * patchEvent
 * @param el
 * @param name
 * @param nextValue
 * @returns
 */
export default function patchEvent(el, name, nextValue) {
  const invokers = el._vei || (el._vei = {});
  const eventName = name.slice(2).toLowerCase();

  // 是否存在同名的事件绑定
  const exisitingInvokers = invokers[name];
  if (nextValue && exisitingInvokers) {
    // 事件换绑定
    return (exisitingInvokers.value = nextValue);
  }

  if (nextValue) {
    // 创建一个调用函数，并且执行nextValue
    const invoker = (invokers[name] = createInvoker(nextValue));
    return el.addEventListener(eventName, invoker);
  }

  if (exisitingInvokers) {
    //现在没有，以前有
    el.removeEventListener(eventName, exisitingInvokers);
    invokers[name] = undefined;
  }
}
