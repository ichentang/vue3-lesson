import { isObject, isFunction } from '@vue/shared';
import { ReactiveEffect } from './effect';
import { isReactive } from './reactive';
import { isRef } from './ref';

export function watch(source, cb, options = {} as any) {
  // watchEffect 也是基于doWatch实现
  return doWatch(source, cb, options);
}

export function watchEffect(source, options) {
  return doWatch(source, null, options);
}

function traverse(source, depth, currentDepth = 0, seen = new Set()) {
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    if (currentDepth < depth) {
      return source;
    }
    currentDepth++; //根据deep，属性来看是否是深度
  }
  if (seen.has(source)) {
    return source;
  }
  for (let key in source) {
    traverse(source[key], depth, currentDepth, seen);
  }

  return source; //遍历后触发每个属性的get
}

function doWatch(source, cb, { deep, immediate }) {
  const reactiveGetter = (source) => traverse(source, deep === false ? 1 : undefined);

  // 产生一个可以给ReactiveEffect 来使用的getter，需要对这个对象进行取值操作，会关联当前的reactiveEffect
  let getter;
  if (isReactive(source)) {
    getter = () => reactiveGetter(source);
  } else if (isRef(source)) {
    getter = () => source;
  } else if (isFunction(source)) {
    getter = source;
  }

  let clean;
  const onCleanup = (fn) => {
    clean = () => {
      fn();
      clean = undefined;
    };
  };

  let oldValue;
  const obj = () => {
    if (cb) {
      const newValue = effect.run();

      if (clean) {
        // 在执行回调前，调用前一次的清理操作进行清理
        clean();
      }

      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else {
      effect.run(); // watchEffect
    }
  };

  const effect = new ReactiveEffect(getter, obj);

  if (cb) {
    if (immediate) {
      //立即执行一次回调，传递新值和老值
      obj();
    } else {
      oldValue = effect.run();
    }
  } else {
    // watchEffect
    effect.run();
  }

  const unwatch = () => {
    effect.stop();
  };

  return unwatch;
}
