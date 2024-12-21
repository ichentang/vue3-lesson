import { currentInstance, setCurrentInstance, unSetCurrentInstance } from './component';

export const enum LifeCycles {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
}

export const onBeforeMount = createHook(LifeCycles.BEFORE_MOUNT);
export const onMounted = createHook(LifeCycles.MOUNTED);
export const onBeforeUpdate = createHook(LifeCycles.BEFORE_UPDATE);
export const onUpdated = createHook(LifeCycles.UPDATED);
export const onBeforeUnmount = createHook(LifeCycles.BEFORE_UNMOUNT);
export const onUnmounted = createHook(LifeCycles.UNMOUNTED);

function createHook(type) {
  // 将当前实例存到钩子上
  return (hook, target = currentInstance) => {
    if (target) {
      // 获取当前实例的钩子
      const hooks = target[type] || (target[type] = []);

      //让currentInstance存到hook上
      const wrapHook = () => {
        setCurrentInstance(target);
        hook.call(target);
        unSetCurrentInstance();
      };

      hooks.push(wrapHook);
    }
  };
}

export function invokeArray(fns) {
  for (let fn of fns) {
    fn();
  }
}
