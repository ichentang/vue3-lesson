import { nodeOps } from './nodeOps';
import patchProp from './patchProp';

import { createRenderer } from '@vue/runtime-core';

// 将节点操作和属性操作合在一起
const renderOptions = Object.assign({ patchProp }, nodeOps);

// render方法采用domApi来进行渲染
export const render = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container);
};

export * from '@vue/runtime-core';

// runtime-dom -> runtime-core
