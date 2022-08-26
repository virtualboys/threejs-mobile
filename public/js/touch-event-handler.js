(function () {
    class TouchEventHandler{
        constructor() {
            this.touchStart = function(event){}
            this.touchMove = function(event){}
            this.touchEnd = function(event){}

            function preventGestures(event) {
                event.stopPropagation();
                event.preventDefault(); // prevent scrolling
                event.stopImmediatePropagation();
            }

            function onTouchStart(event) {
                preventGestures(event);
                this.touchStart(event);
            }

            function onTouchMove(event) {
                preventGestures(event);
                this.touchMove(event);
            }

            function onTouchEnd(event) {
                preventGestures(event);
                this.touchEnd(event);
            }

            const _onTouchStart = onTouchStart.bind(this);
            const _onTouchEnd = onTouchEnd.bind(this);
            const _onTouchMove = onTouchMove.bind(this);

            window.addEventListener('touchstart', _onTouchStart, { passive: false });
            window.addEventListener('touchend', _onTouchEnd, { passive: false });
            window.addEventListener('touchmove', _onTouchMove, { passive: false });
        }
    }

    THREE.TouchEventHandler = TouchEventHandler;
})();