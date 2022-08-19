(function () {

    const _lookDirection = new THREE.Vector3();

    const _spherical = new THREE.Spherical();

    const _target = new THREE.Vector3();

    class FPSMultiplatformControls {

        constructor(object, domElement) {

            if (domElement === undefined) {

                console.warn('THREE.FPSMultiplatformControls: The second parameter "domElement" is now mandatory.');
                domElement = document;

            }

            this.object = object;
            this.domElement = domElement; // API

            this.playerHeight = .5;
            this.playerSpeed = 50;
            this.jumpSpeed = 10;
            this.gravity = 20;
            this.deceleration = 10;

            let moveForward = false;
            let moveBackward = false;
            let moveLeft = false;
            let moveRight = false;
            let canJump = false;

            let velocity = new THREE.Vector3();
            let direction = new THREE.Vector3();
            this.pointerLock = new THREE.PointerLockControls(camera, document.body);

            let moveTouchStart = new THREE.Vector2();

            let rotTouchStart = new THREE.Vector2();
            let camRot = new THREE.Vector2();

            this.onKeyDown = function (event) {

                switch (event.code) {

                    case 'ArrowUp':
                    case 'KeyW':
                        moveForward = true;
                        break;

                    case 'ArrowLeft':
                    case 'KeyA':
                        moveLeft = true;
                        break;

                    case 'ArrowDown':
                    case 'KeyS':
                        moveBackward = true;
                        break;

                    case 'ArrowRight':
                    case 'KeyD':
                        moveRight = true;
                        break;

                    case 'Space':
                        if (canJump === true) velocity.y += this.jumpSpeed;
                        canJump = false;
                        break;

                }

            };

            this.onKeyUp = function (event) {

                switch (event.code) {

                    case 'ArrowUp':
                    case 'KeyW':
                        moveForward = false;
                        break;

                    case 'ArrowLeft':
                    case 'KeyA':
                        moveLeft = false;
                        break;

                    case 'ArrowDown':
                    case 'KeyS':
                        moveBackward = false;
                        break;

                    case 'ArrowRight':
                    case 'KeyD':
                        moveRight = false;
                        break;

                }

            };

            this.onTouchStart = function (event) {

                event.preventDefault(); // prevent scrolling

                switch (event.touches.length) {
                    case 1:
                        moveTouchStart.x = event.touches[0].pageX;
                        moveTouchStart.y = event.touches[0].pageY;
                        break;

                    case 2:
                        rotTouchStart.x = event.touches[1].pageX;
                        rotTouchStart.y = event.touches[1].pageY;
                        break;
                }
            }


            this.onTouchMove = function (event) {

                event.preventDefault(); // prevent scrolling
                event.stopPropagation();

                if (event.touches.length >= 1) {
                    let dx = moveTouchStart.x - event.touches[0].pageX;
                    let dy = moveTouchStart.y - event.touches[0].pageY;


                    moveLeft = dx > 0;
                    moveRight = dx < 0;
                    moveForward = dy > 0;
                    moveBackward = dy < 0;
                }
                if(event.touches.length >= 2) {

                    let dx = rotTouchStart.x - event.touches[1].pageX;
                    let dy = rotTouchStart.y - event.touches[1].pageY;
                    camRot.x = dx;
                    camRot.y = dy;
                }

            }

            this.onTouchEnd = function (event) {
                if (event.touches.length == 0) {
                    moveLeft = false;
                    moveRight = false;
                    moveForward = false;
                    moveBackward = false;

                    camRot.x = 0;
                    camRot.y = 0;
                } else if(event.touches.length == 1) {

                    camRot.x = 0;
                    camRot.y = 0;
                }
            }

            this.update = function () {

                return function update(delta) {

                    this.pointerLock.rotateCamera(-.3 * camRot.x, -.3 * camRot.y);

                    velocity.x -= velocity.x * deceleration * delta;
                    velocity.z -= velocity.z * deceleration * delta;

                    velocity.y -= gravity * delta; // 100.0 = mass

                    direction.z = Number(moveForward) - Number(moveBackward);
                    direction.x = Number(moveRight) - Number(moveLeft);
                    direction.normalize(); // this ensures consistent movements in all directions

                    if (moveForward || moveBackward) velocity.z -= direction.z * this.playerSpeed * delta;
                    if (moveLeft || moveRight) velocity.x -= direction.x * this.playerSpeed * delta;

                    // if ( onObject === true ) {

                    // 	velocity.y = Math.max( 0, velocity.y );
                    // 	canJump = true;

                    // }

                    this.pointerLock.moveRight(- velocity.x * delta);
                    this.pointerLock.moveForward(- velocity.z * delta);

                    this.pointerLock.getObject().position.y += (velocity.y * delta); // new behavior

                    if (this.pointerLock.getObject().position.y < this.playerHeight) {

                        velocity.y = 0;
                        this.pointerLock.getObject().position.y = this.playerHeight;

                        canJump = true;

                    }


                };

            }();


            function onContextMenu(event) {
                if (scope.enabled === false) return;

                event.preventDefault();
            }

            this.getObject = function () {

                // retaining this method for backward compatibility
                return this.pointerLock.getObject();

            };

            this.dispose = function () {

                window.removeEventListener('keydown', _onKeyDown);
                window.removeEventListener('keyup', _onKeyUp);

                window.removeEventListener('touchstart', _onTouchStart, false);
                window.removeEventListener('touchend', _onTouchEnd, false);
                window.removeEventListener('touchmove', _onTouchMove, false);

            };

            const _onKeyDown = this.onKeyDown.bind(this);
            const _onKeyUp = this.onKeyUp.bind(this);
            const _onTouchStart = this.onTouchStart.bind(this);
            const _onTouchEnd = this.onTouchEnd.bind(this);
            const _onTouchMove = this.onTouchMove.bind(this);

            window.addEventListener('keydown', _onKeyDown);
            window.addEventListener('keyup', _onKeyUp);


            window.addEventListener('touchstart', _onTouchStart, {passive: false});
            window.addEventListener('touchend', _onTouchEnd, {passive: false});
            window.addEventListener('touchmove', _onTouchMove, {passive: false});
        }

    }


    THREE.FPSMultiplatformControls = FPSMultiplatformControls;

})();
