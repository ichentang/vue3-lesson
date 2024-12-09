import { proxyRefs, reactive } from '@vue/reactivity';
import { hasOwn, isFunction } from '@vue/shared';

export function createComponentInstance(vnode) {
  const instance = {
    data: null,
    vnode: vnode,
    subTree: null,
    isMounted: false,
    update: null,
    attrs: {},
    props: {},
    propsOptions: vnode.type.props, //用户生命的那些属性是组件的属性
    component: null,
    proxy: null, //代理props，attrs，data
    setupState: {}
  };

  return instance;
}

// 初始化属性
const initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};

  const propsOptions = instance.propsOptions || {}; //组件中定义的

  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key];

      if (key in propsOptions) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  instance.attrs = attrs;
  instance.props = reactive(props);
};

const publicProperty = {
  $attrs: (instance) => instance.attrs,
};

// 代理对象
const handler = {
  get(target, key) {
    const { props, data, setupState } = target;

    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key]
    }

    // 对于无法修改的属性 $slots ...
    const getter = publicProperty[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, value, receiver) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      console.warn('props are readOnly');
      return false;
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key] = value
    }
    return true;
  },
};

export function setupComponent(instance) {
  // 根据propsOptions 来区分出props,attrs
  const { vnode } = instance;
  // 赋值属性
  initProps(instance, vnode.props);
  // 赋值代理对象
  instance.proxy = new Proxy(instance, handler);

  const { data = () => { }, render, setup } = vnode.type;

  if (setup) {
    const setupContext = {}
    const setupResult = setup(instance.props, setupContext)

    if (isFunction(setupResult)) {
      instance.render = setupResult
    } else {
      instance.setupState = proxyRefs(setupResult)
    }
  }

  if (!isFunction(data)) {
    console.warn('data option must be a function');
  } else {
    // data 中可以拿到props
    instance.data = reactive(data.call(instance.proxy));
  }

  if (!instance.render) {
    instance.render = render;
  }
}
