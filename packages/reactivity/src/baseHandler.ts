import { track, trigger } from './reactiveEffect';

// 枚举
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}

// ProxyHandler
// proxy 搭配reflect使用
export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // 当取值的时候 应该让响应式属性 和 effect映射起来
    // 依赖收集 TODO...

    track(target, key); //收集这个对象上的属性，和effect关联
    // console.log(activeEffect, key);

    return Reflect.get(target, key, recevier);
  },
  set(target, key, value, recevier) {
    // 找到属性 让对应的effect重新执行
    let oldValue = target[key];

    let result = Reflect.set(target, key, value, recevier);
    if (oldValue !== value) {
      // 需要触发页面更新
      trigger(target, key, value, oldValue);
    }
    // 出发更新 TODO...
    return result;
  },
};
