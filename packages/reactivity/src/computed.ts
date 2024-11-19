import { isFunction } from '@vue/shared';
import { ReactiveEffect } from './effect';
import { trackRefValue, triggerRefValue } from './ref';

class ComputedRefImpl {
  public _value;
  public effect;
  constructor(getter, public setter) {
    // 创建effect来关联当前计算属性的dirty属性

    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        // 计算属性依赖的之变化了，我们应该触发渲染 effect重新执行

        // 依赖的属性变化后需要触发重新渲染，还需要将dirty变为true
        triggerRefValue(this);
      }
    );
  }

  get value() {
    // 做额外处理
    if (this.effect.dirty) {
      // 默认取值一定是脏的，执行一次run后就不脏了
      this._value = this.effect.run();

      // 如果在effect中访问了计算属性，计算属性是可以收集effect的
      trackRefValue(this);
    }
    return this._value;
  }

  set value(v) {
    // set执行ref的setter
    this.setter(v);
  }
}

// computed
export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);

  let getter;
  let setter;

  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  console.log(getter, setter);

  return new ComputedRefImpl(getter, setter); //计算属性ref
}

//计算属性aliasName，计算属性依赖的值name
//计算属性本身就是一个effect，有一个标识dirty = true，访问的时候会，触发name属性的get方法（依赖收集)
//将name属性和计算属性做一个映射，稍后name变化后会触发计算属性的scheduler
//计算属性可能在effect中使用，当取计算属性的时候，会对当前的effect进行依赖收集
//如果name属性变化了，会通知计算属性将dirty 变为true(触发计粪属性收集的effect)
// name-→>计算属性dirty=true -》计算属性的scheduler ->触发计算属性收集的effect
