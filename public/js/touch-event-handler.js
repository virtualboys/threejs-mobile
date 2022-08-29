(function () {
    class TouchEventHandler{
        constructor(document) {
            this.touchStart = function(event){}
            this.touchMove = function(event){}
            this.touchEnd = function(event){}
            this.clickOrTap = function(x, y){}

            function preventGestures(event) {
                event.stopPropagation();
                event.preventDefault(); // prevent scrolling
                event.stopImmediatePropagation();
            }

            function onTouchStart(event) {
                preventGestures(event);
                this.touchStart(event);
                let touch = event.changedTouches[0];
                this.clickOrTap(touch.pageX, touch.pageY);
            }

            function onTouchMove(event) {
                preventGestures(event);
                this.touchMove(event);
            }

            function onTouchEnd(event) {
                preventGestures(event);
                this.touchEnd(event);
            }

            function onClick(event) {
                this.clickOrTap(event.clientX, event.clientY);
            }

            const _onTouchStart = onTouchStart.bind(this);
            const _onTouchEnd = onTouchEnd.bind(this);
            const _onTouchMove = onTouchMove.bind(this);
            const _onClick = onClick.bind(this);

            window.addEventListener('touchstart', _onTouchStart, { passive: false });
            window.addEventListener('touchend', _onTouchEnd, { passive: false });
            window.addEventListener('touchmove', _onTouchMove, { passive: false });

            document.body.addEventListener('click', _onClick);
        }
    }

    THREE.TouchEventHandler = TouchEventHandler;
})();