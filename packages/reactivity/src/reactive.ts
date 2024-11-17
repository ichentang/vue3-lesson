import { isObject } from '@vue/shared';
import { ReactiveFlags, mutableHandlers } from './baseHandler';

// 用于记录我们的代理后的结果 可以服用
const reactiveMap = new WeakMap();

// 创建响应式对象
function createReactiveObject(target) {
  //统—做判断，响应式对象必须是对象才可以
  if (!isObject(target)) {
    return target;
  }

  // 判断是否已经代理，已经代理过了则直接返回代理的对象，对象已经代理了，则可以访问proxy的get方法
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  // 缓存存在则返回
  const exitsProxy = reactiveMap.get(target);
  if (exitsProxy) {
    return exitsProxy;
  }

  let proxy = new Proxy(target, mutableHandlers);

  // 根据对象缓存 代理后的结果
  reactiveMap.set(target, proxy);

  return proxy;
}

// reactive
export function reactive(target) {
  return createReactiveObject(target);
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
