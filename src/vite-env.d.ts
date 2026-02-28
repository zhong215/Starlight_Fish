/// <reference types="vite/client" />

// 扩展 JSX 以支持 React Three Fiber 元素
declare namespace JSX {
  interface IntrinsicElements {
    primitive: any;
    ambientLight: any;
    pointLight: any;
    directionalLight: any;
    group: any;
    mesh: any;
    points: any;
    line: any;
    lineSegments: any;
    bufferGeometry: any;
    bufferAttribute: any;
    pointsMaterial: any;
    meshBasicMaterial: any;
    meshStandardMaterial: any;
  }
}
