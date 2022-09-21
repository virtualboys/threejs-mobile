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
}