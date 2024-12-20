import { isObject } from '@vue/shared';
import { track, trigger } from './reactiveEffect';
import { reactive } from './reactive';
import { ReactiveFlags } from './constants';

// proxy 搭配reflect使用
export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // 当取值的时候 应该让响应式属性 和 effect映射起来
    // 依赖收集 TODO...

    track(target, key); //收集这个对象上的属性，和effect关联
    // console.log(activeEffect, key);

    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      //当取得值也是对象的时候，我需要对这个对象在进行代理，递归代理
      return reactive(res);
    }

    return res;
  },
  set(target, key, value, receiver) {
    // 找到属性 让对应的effect重新执行
    let oldValue = target[key];

    let result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      // 需要触发页面更新
      trigger(target, key, value, oldValue);
    }
    // 出发更新 TODO...
    return result;
  },
};
