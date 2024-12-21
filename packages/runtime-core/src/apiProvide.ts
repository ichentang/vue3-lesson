import { currentInstance } from './component';

export function provide(key, value) {
  if (!currentInstance) {
    console.warn(`provide() can only be used inside setup().`);
  }
  // 如果当前实例没有provides属性，那么就创建一个新的对象
  if (!currentInstance.provides) {
    currentInstance.provides = Object.create(null);
  }
  // 获取父级的provides
  const parentProvides = currentInstance.parent?.provides;
  // 获取当前实例的provides
  let provides = currentInstance.provides;
  // 如果父级的provides和当前的provides是同一个对象，那么就需要创建一个新的对象
  if (parentProvides === provides) {
    provides = currentInstance.provides = Object.create(provides);
  }
  provides[key] = value;
}

export function inject(key, defaultValue) {
  // 如果当前实例不存在，那么就提示错误
  if (!currentInstance) {
    console.warn(`inject() can only be used inside setup().`);
  }
  // 获取当前实例的provides
  const provides = currentInstance.parent?.provides;

  if (provide && key in provides) {
    // 找到了，返回对应的值
    return provides[key];
  } else {
    // 没有找到，返回默认值
    return defaultValue;
  }
}
