import { ShapeFlags } from '@vue/shared';
import { createVnode, Fragment, isSameVnode, Text } from './createVnode';
import getSequence from './seq';
import { ReactiveEffect } from '@vue/reactivity';
import { queueJob } from './scheduler';
import { createComponentInstance, setupComponent } from './component';
import { invokeArray } from './apiLifeCycle';

export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = renderOptions;

  const normalize = (children) => {
    if (Array.isArray(children)) {
      for (let i = 0; i < children.length; i++) {
        if (typeof children[i] === 'string' || typeof children[i] === 'number') {
          children[i] = createVnode(Text, null, String(children[i]));
        }
      }
    }
    return children;
  };

  // 批量挂载
  const mountChildren = (children, container, parentComponent) => {
    const newChildren = normalize(children);
    for (let i = 0; i < newChildren.length; i++) {
      // children[i] 可能是纯文本元素
      patch(null, newChildren[i], container, parentComponent);
    }
  };

  // 挂载
  const mountElement = (vnode, container, anchor, parentComponent) => {
    // shapeFlag是vnode的节点类型和 子节点类型 取异或的值
    const { type, children, props, shapeFlag } = vnode;

    let el = (vnode.el = hostCreateElement(type));

    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    // 位运算  & 或（组合）  9 & 8 > 0 说明儿子是文本元素
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent);
    }

    hostInsert(el, container, anchor);
  };

  // 批量卸载
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      unmount(child);
    }
  };

  // 卸载
  const unmount = (vnode) => {
    const { shapeFlag } = vnode;
    if (vnode.type === Fragment) {
      unmountChildren(vnode.children);
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
      unmount(vnode.component.subTree);
    } else {
      hostRemove(vnode.el);
    }
  };

  // 比较属性
  const patchProps = (oldProps, newProps, el) => {
    // 新的全生效
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }

    for (let key in oldProps) {
      if (!(key in newProps)) {
        // 以前多的现在没有了，需要删除掉
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  // 比较两个儿子的差异更新
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0; //开始对比的索引
    let e1 = c1.length - 1; //第一个数组的索引
    let e2 = c2.length - 1; //第二个数组的索引

    while (i <= e1 && i <= e2) {
      // 有任何一方循环结束 就要终止比较
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el); // 更新当前节点的属性和儿子 （递归比较节点）
      } else {
        break;
      }
      i++;
    }

    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    if (i > e1) {
      // 新的个数多
      if (i <= e2) {
        let nextPos = e2 + 1; //看一下当前下一个元素是否存在
        let anchor = c2[nextPos]?.el;
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 旧的个数多
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    } else {
      let s1 = i;
      let s2 = i;

      const keyToNewIndexMap = new Map(); //做一个映射表用于快速查找，看老的是否在新的里面还有，没有就删除，有的就更新
      let toBePatched = e2 - s2 + 1; //倒序插入的个数
      let newIndexToOldMapIndex = new Array(toBePatched).fill(0); // 节点在老数组中对应的下标 如果为0说明是新增节点

      for (let i = s2; i <= e2; i++) {
        const vnode = c2[i];
        keyToNewIndexMap.set(vnode.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const vnode = c1[i];
        const newIndex = keyToNewIndexMap.get(vnode.key);
        if (newIndex == undefined) {
          //若干新的里面找不到，则说明老的有，要删除
          unmount(vnode);
        } else {
          // 有可能i为0 为了保证0是没有比对过的元素 直接i+1
          newIndexToOldMapIndex[newIndex - s2] = i + 1;
          // 比较前后节点的差异，更新属性和儿子
          patch(vnode, c2[newIndex], el);
        }
      }

      // 调整顺序，可以按照新的队列，倒序插入insertBefore，通过参照物往前插入
      // 插入的过程中，可能新的元素多，需要创建
      let increasingSeq = getSequence(newIndexToOldMapIndex);
      let j = increasingSeq.length - 1; //索引

      // 调整顺序 可以按照新的队列 倒序插入
      for (let i = toBePatched - 1; i >= 0; i--) {
        let newIndex = s2 + i; // 要插入的节点 在 新数组中 对应的索引，找他下个元素作为参照物进行插入
        let anchor = c2[newIndex + 1]?.el;
        let vnode = c2[newIndex];

        //新列表中插入的元素
        if (!vnode.el) {
          patch(null, vnode, el, anchor); //创建h插入
        } else {
          if (i === increasingSeq[j]) {
            j--;
          } else {
            hostInsert(vnode.el, el, anchor); //倒序插入
          }
        }
      }
    }
  };

  // 比较子节点
  const patchChildren = (n1, n2, el, parentComponent) => {
    // text array null
    const c1 = n1.children;
    const c2 = normalize(n2.children);

    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    // 1.新的是文本，老的是数组移除老的;
    // 2.新的是文本，老的也是文本，内容不相同替换
    // 3.老的是数组，新的是数组，全量diff算法
    // 4.老的是数组，新的不是数组，移除老的子节点
    // 5.老的是文本，新的是空
    // 6.老的是文本，新的是数组

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //1
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        //2
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          //3 全量diff算法，比对两个数组
          patchKeyedChildren(c1, c2, el);
        } else {
          // 4
          unmountChildren(c1);
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 5
          hostSetElementText(el, '');
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 6
          mountChildren(c2, el, parentComponent);
        }
      }
    }
  };

  // 比较元素
  const patchElement = (n1, n2, container, parentComponent) => {
    // 1.比较元素的差异，肯定需要复用的dom元素
    // 2.比较属性和元素的子节点

    // 对dom元素的复用
    let el = (n2.el = n1.el);

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    // hostPatchProp 只针对某一个属性来处理
    patchProps(oldProps, newProps, el);

    // 比较子节点
    patchChildren(n1, n2, el, parentComponent);
  };

  const processElement = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      // 初始化操作
      mountElement(n2, container, anchor, parentComponent);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  };

  const processText = (n1, n2, container) => {
    if (n1 === null) {
      // 虚拟节点要关联真实节点
      // 将节点插入道页面中
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetElementText(el, n2.children);
      }
    }
  };

  const processFragment = (n1, n2, container, parentComponent) => {
    if (n1 == null) {
      mountChildren(n2.children, container, parentComponent);
    } else {
      patchChildren(n1, n2, container, parentComponent);
    }
  };

  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    instance.vnode = next;
    updateProps(instance, instance.props, next.props);
  };

  const renderComponent = (instance) => {
    const { render, vnode, proxy, attrs } = instance;
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 非函数组件
      return render.call(proxy, proxy);
    } else {
      // 函数组件
      return vnode.type(attrs);
    }
  };

  const setupRenderEffect = (instance, container, anchor) => {
    const { render } = instance;

    // props，attrs，data
    const componentUpdateFn = () => {
      const { bm, m } = instance;
      if (!instance.isMounted) {
        if (bm) {
          invokeArray(bm);
        }

        const subTree = renderComponent(instance);
        patch(null, subTree, container, anchor, instance);

        instance.subTree = subTree;
        instance.isMounted = true;

        if (m) {
          invokeArray(m);
        }
      } else {
        // 基于状态的组件更新
        const { next, bu, u } = instance;

        if (next) {
          // 更新属性和插槽
          updateComponentPreRender(instance, next);
        }

        if (bu) {
          invokeArray(bu);
        }

        const subTree = renderComponent(instance);
        patch(instance.subTree, subTree, container, anchor, instance);
        instance.subTree = subTree;

        if (u) {
          invokeArray(u);
        }
      }
    };

    // 3.创建一个effect
    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(update));
    const update = (instance.update = () => effect.run());
    update();
  };

  const mountComponent = (vnode, container, anchor, parentComponent) => {
    // 1.先创建组件实例 并且把这个实例放到虚拟节点上
    const instance = (vnode.comment = createComponentInstance(vnode, parentComponent));

    // 2.给实例的属性赋值
    setupComponent(instance);

    // 3.创建一个effect 组件可以基于自己的状态重新渲染 其实每个组件相当于一个effect
    setupRenderEffect(instance, container, anchor);
  };

  const hasPropsChange = (prevProps, nextProps) => {
    let nKeys = Object.keys(nextProps);

    if (nKeys.length !== Object.keys(prevProps).length) {
      return true;
    }

    for (let i = 0; i < nKeys.length; i++) {
      const key = nKeys[i];
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }
  };

  const updateProps = (instance, prevProps, nextProps) => {
    if (hasPropsChange(prevProps, nextProps)) {
      for (let key in nextProps) {
        instance.props[key] = nextProps[key];
      }

      for (let key in instance.props) {
        if (!(key in nextProps)) {
          delete instance.props[key];
        }
      }
    }
  };

  const shouldComponentUpdate = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;

    if (prevChildren || nextChildren) return true; // 有插槽直接走重新渲染

    if (prevProps === nextProps) return false;

    return hasPropsChange(prevProps, nextProps);
  };

  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component); // 复用组件的实例

    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2; // 如果调用update方法时有next属性，说明是属性更新或插槽更新
      instance.update(); // 让更新逻辑统一
    }
  };

  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    if (n1 === null) {
      // 初始渲染
      mountComponent(n2, container, anchor, parentComponent);
    } else {
      // 组件更新
      updateComponent(n1, n2);
    }
  };

  // 渲染走这里
  const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
    // 两次渲染同一个元素直接跳过
    if (n1 == n2) {
      return;
    }

    // 直接移除老的dom元素，初始化新的dom元素
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      //执行n2的初始化
      n1 = null;
    }

    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent); // 对元素处理
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent);
        }
    }
  };

  // 多次调用虚拟节点 回进行虚拟节点的比较，在进行更新
  const render = (vnode, container) => {
    if (vnode === null) {
      // 移除当前容器中的dom元素
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      // 将虚拟节点变成真实节点渲染
      patch(container._vnode || null, vnode, container);
      container._vnode = vnode;
    }
  };

  return { render };
}
