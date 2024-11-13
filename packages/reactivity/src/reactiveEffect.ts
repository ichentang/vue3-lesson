import { activeEffect, trackEffect, triggerEffect } from './effect';

const targetMap = new WeakMap(); //存放依赖收集的关系

export const createDep = (cleanup, key) => {
  const dep = new Map() as any; //创建的收集器还是一个map
  dep.cleanup = cleanup;
  dep.name = key; //自定义的标识，确认映射表是给那个属性服务的
  return dep;
};

export function track(target, key) {
  // activeEffect 有这个属性，说明这个key实在effect中访问的，没有则说明

  if (activeEffect) {
    // console.log('object :>> ', target, key, activeEffect);
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      // 新增的
      targetMap.set(target, (depsMap = new Map()));

      // console.log('targetMap1 :>> ', targetMap);
    }

    let dep = depsMap.get(key);
    if (!dep) {
      // 后面用于清理不需要的属性
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key)));
    }

    // console.log('targetMap2 :>> ', targetMap);

    // 将当前的effect放入到dep（映射表）中，后续可以根据值的变化触发dep中存放的effec
    trackEffect(activeEffect, dep);

    // console.log('targetMap3 :>> ', targetMap);
  }
}

export function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);

  if (!depsMap) {
    //找不到，直接return

    return;
  }

  let dep = depsMap.get(key);
  if (dep) {
    // 修改的属性对应effect
    triggerEffect(dep);
  }
}
