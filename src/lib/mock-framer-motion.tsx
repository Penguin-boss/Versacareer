import React from 'react';

const createMockMotionComponent = (Tag: any) => {
  return React.forwardRef((props, ref) => {
    const {
      initial, animate, exit, variants, transition, layout, layoutId,
      whileHover, whileTap, whileInView, viewport, custom, onAnimationComplete,
      ...rest
    } = props as any;
    
    let className = rest.className || '';
    if (variants === 'fadeSlideUp' || (variants && variants.name === 'fadeSlideUp')) className += ' animate-slide-up';
    if (variants === 'fadeOnly' || (variants && variants.name === 'fadeOnly')) className += ' animate-fade-in';
    
    return React.createElement(Tag, { ...rest, ref, className: className.trim() });
  });
};

export const motion = {
  div: createMockMotionComponent('div'),
  span: createMockMotionComponent('span'),
  h1: createMockMotionComponent('h1'),
  h2: createMockMotionComponent('h2'),
  h3: createMockMotionComponent('h3'),
  p: createMockMotionComponent('p'),
  img: createMockMotionComponent('img'),
  button: createMockMotionComponent('button'),
  path: createMockMotionComponent('path'),
  svg: createMockMotionComponent('svg'),
  section: createMockMotionComponent('section'),
  a: createMockMotionComponent('a'),
  ul: createMockMotionComponent('ul'),
  li: createMockMotionComponent('li'),
  main: createMockMotionComponent('main'),
  nav: createMockMotionComponent('nav'),
  header: createMockMotionComponent('header'),
  footer: createMockMotionComponent('footer'),
};

export const AnimatePresence = ({ children }: any) => <>{children}</>;

