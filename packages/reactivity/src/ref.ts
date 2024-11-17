import { activeEffect, trackEffect, triggerEffects } from './effect';
import { createDep } from './reactiveEffect';
import { toReactive } from './reactive';

export function ref(value) {
  return createRef(value);
}

function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  __v_isRef = true; //增加ref标识
  _value; //用来保存ref的值

  constructor(public rawValue) {
    toReactive(rawValue);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this._value) {
      this.rawValue = newValue; //更新值
      this._value = newValue;
      triggerRefValue(this);
    }
  }
}

function trackRefValue(ref) {
  if (activeEffect) {
    trackEffect(activeEffect, (ref.dep = createDep(() => (ref.dep = undefined), 'undefined')));
  }
}

function triggerRefValue(ref) {
  let dep = ref.dep;
  if (dep) {
    triggerEffects(dep); //触发依赖更新
  }
}
