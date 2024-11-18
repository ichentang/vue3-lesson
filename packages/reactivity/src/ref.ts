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
  public __v_isRef = true; //增加ref标识
  public _value; //用来保存ref的值
  public dep;

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

// ObjectRefImpl
class ObjectRefImpl {
  public __v_isRef = true; // 增加ref标识

  constructor(public _object, public _key) {}

  // get
  get value() {
    return this._object[this._key];
  }

  // set
  set value(newValue) {
    this._object[this._key] = newValue;
  }
}

// toRef
export function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}

// toRefs
export function toRefs(object) {
  const res = {};

  for (let key in object) {
    res[key] = toRef(object, key);
  }

  return res;
}

// ref解包，去掉value
export function proxyRefs(objectWithRef) {
  return new Proxy(objectWithRef, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver);
      return r.__v_isRef ? r.value : r; // 自动脱ref
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];

      if (oldValue.__v_isRef) {
        oldValue.value = value; //如果老值是ref，给ref赋值
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}
