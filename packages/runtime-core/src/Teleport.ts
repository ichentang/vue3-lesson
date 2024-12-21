import { ShapeFlags } from '@vue/shared';

export const Teleport = {
  __v_isTeleport: true,
  remove(vnode, unmountChildren) {
    const { ShapeFlag, children } = vnode;
    if (ShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children);
    }
  },
  process(n1, n2, container, anchor, parentComponent, internals) {
    let { mountChildren, patchChildren, move } = internals;

    if (!n1) {
      const target = (n2.target = document.querySelector(n2.props.to));

      if (target) {
        mountChildren(n2.children, target, parentComponent);
      }
    } else {
      patchChildren(n1, n2, n2.target, parentComponent);

      if (n2.props.to !== n1.props.to) {
        const nextTarget = (n2.target = document.querySelector(n2.props.to));

        n2.children.forEach((child) => move(child, nextTarget, anchor));
      }
    }
  },
};

export const isTeleport = (value) => value.__v_isTeleport;