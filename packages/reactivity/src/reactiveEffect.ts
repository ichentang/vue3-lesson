import { activeEffect } from './effect';

export function track(target, key) {
  // activeEffect 有这个属性，说明这个key实在effect中访问的，没有则说明

  if (activeEffect) {
    console.log('object :>> ', target, key, activeEffect);
  }
}
