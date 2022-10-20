export class TouchEventHandler {
  constructor(document) {
    this.touchStart = function (event) {};
    this.touchMove = function (event) {};
    this.touchEnd = function (event) {};
    
    this.clickOrTouchStart = function(x, y, id){};
    this.clickOrTouchMove = function(x, y, id){};
    this.clickOrTouchEnd = function(id){};
    this.clicksOrTouchesCancelled = function() {};

    this.numTouches = 0;

    function preventGestures(event) {
      event.target.dispatchEvent(event)
      event.stopPropagation();
      event.preventDefault(); // prevent scrolling
      event.stopImmediatePropagation();
    }

    function onTouchStart(event) {
      preventGestures(event);
      
      this.numTouches += event.changedTouches.length;
      if(this.numTouches != event.touches.length) {
        console.log('num touches discrepancy, canceling');
        this.numTouches = 0;
        this.clicksOrTouchesCancelled();
        return;
      }
      
      this.touchStart(event);

      for (let i = 0; i < event.changedTouches.length; i++) {
        let touch = event.changedTouches[i];
        this.clickOrTouchStart(touch.pageX, touch.pageY, touch.identifier);
      }
    }

    function onTouchMove(event) {
      preventGestures(event);
      this.touchMove(event);

      for (let i = 0; i < event.changedTouches.length; i++) {
        let touch = event.changedTouches[i];
        this.clickOrTouchMove(touch.pageX, touch.pageY, touch.identifier);
      }
    }

    function onTouchEnd(event) {
      preventGestures(event);

      this.numTouches -= event.changedTouches.length;
      if(this.numTouches < 0) {
        console.log('num touches negative...');
        this.numTouches = 0;
      }

      this.touchEnd(event);

      for (let i = 0; i < event.changedTouches.length; i++) {
        let touch = event.changedTouches[i];
        this.clickOrTouchEnd(touch.identifier);
      }
    }

    function onMouseDown(event) {
      this.clickOrTouchStart(event.clientX, event.clientY, 0);
    }

    function onMouseMove(event) {
      this.clickOrTouchMove(event.clientX, event.clientY, 0);
    }

    function onMouseUp(event) {
      this.clickOrTouchEnd(0);
    }

    function onScreenBlurred() {
      this.clicksOrTouchesCancelled();
    }

    const _onTouchStart = onTouchStart.bind(this);
    const _onTouchEnd = onTouchEnd.bind(this);
    const _onTouchMove = onTouchMove.bind(this);
   
    const _onMouseDown = onMouseDown.bind(this);
    const _onMouseMove = onMouseMove.bind(this);
    const _onMouseUp = onMouseUp.bind(this);
    const _screenBlurred = onScreenBlurred.bind(this);

    const el = document.getElementById("container");
    el.addEventListener("touchstart", _onTouchStart, { passive: false });
    el.addEventListener("touchend", _onTouchEnd, { passive: false });
    el.addEventListener("touchmove", _onTouchMove, { passive: false });
    el.addEventListener('mousedown', _onMouseDown, {passive: false});
    el.addEventListener('mousemove', _onMouseMove, {passive: false});
    el.addEventListener('mouseup', _onMouseUp, {passive: false});
    window.addEventListener("blur", _screenBlurred);
    document.addEventListener("visibilitychange", () => { 
      if(document.hidden) {
        _screenBlurred();
      }
    }, false);
  }
}
