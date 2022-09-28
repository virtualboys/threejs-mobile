export {};
declare global {
  interface Window {
    Detector: any;
    previewGLTF: boolean;
  }
  interface Document {
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
    webkitFullscreenElement?: Element;
  }

  interface HTMLElement {
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
    webkitFullscreenElement?: Element;
    mozRequestFullScreen: () => Promise<void>;
    webkitRequestFullScreen: () => Promise<void>;
    msRequestFullscreen: () => Promise<void>;
  }
  type TMovement = {
    moveX: number;
    moveY: number;
  }
  class HalfEdge {
    next: HalfEdge;
    head: () => {point: Vector3};
  }

  class Face {
    edge: HalfEdge;
    normal: Vector3;
  }

  class ConvexHull {
    public faces: Face[];
    setFromObject(mesh: Mesh): this;
  }

}

