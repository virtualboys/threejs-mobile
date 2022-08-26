(function () {

    const _lookDirection = new THREE.Vector3();

    const _spherical = new THREE.Spherical();

    const _target = new THREE.Vector3();

    class FPSMultiplatformControls {

        constructor(object, physicsBody, world, domElement, touchEventHandler) {

            if (domElement === undefined) {

                console.warn('THREE.FPSMultiplatformControls: The second parameter "domElement" is now mandatory.');
                domElement = document;

            }

            this.object = object;
            this.physicsBody = physicsBody;
            this.domElement = domElement; // API

            this.playerHeight = .5;
            this.playerSpeed = 50;
            this.jumpSpeed = 10;
            this.gravity = 20;
            this.deceleration = 10;

            this.touchRotSpeed = .3;
            this.touchMoveSpeed = .05;
            this.touchDeadZone = 30;

            let moveForward = false;
            let moveBackward = false;
            let moveLeft = false;
            let moveRight = false;
            let canJump = false;

            let velocity = new THREE.Vector3();
            let direction = new THREE.Vector3();

            const realVelocity = new THREE.Vector3();
            this.pointerLock = new THREE.PointerLockControls(camera, document.body);

            let moveTouchStart = new THREE.Vector2();

            let rotTouchStart = new THREE.Vector2();
            let camRot = new THREE.Vector2();
            let axisMovement = new THREE.Vector2();
            let usingAxisMovement = false;

            let moveTouchId = -1;
            let rotTouchId = -1;

            const raycastTarget = new CANNON.Vec3();

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

                // event.stopPropagation();
                // event.preventDefault(); // prevent scrolling
                // event.stopImmediatePropagation();

                for (let i = 0; i < event.changedTouches.length; i++) {
                    let touch = event.changedTouches[i];
                    if (touch.pageX < window.innerWidth / 2) {
                        if (moveTouchId == -1) {
                            moveTouchId = touch.identifier;
                            moveTouchStart.x = touch.pageX;
                            moveTouchStart.y = touch.pageY;
                            usingAxisMovement = true;
                        }
                    } else {
                        if (rotTouchId == -1) {
                            rotTouchId = touch.identifier;
                            rotTouchStart.x = touch.pageX;
                            rotTouchStart.y = touch.pageY;
                        }
                    }
                }
                switch (event.touches.length) {
                    case 1:
                        break;

                    case 2:
                        break;
                }
            }

            function getTouchVec(touchStart, touch, deadZone) {
                let dx = touchStart.x - touch.pageX;
                let dy = touchStart.y - touch.pageY;
                let touchVec = new THREE.Vector2(dx, dy);
                let vecLength = touchVec.length();
                if (vecLength < deadZone) {
                    touchVec.x = 0;
                    touchVec.y = 0;
                } else {
                    vecLength -= deadZone;
                    touchVec.normalize();
                    touchVec.multiplyScalar(vecLength);
                }

                return touchVec;
            }

            this.onTouchMove = function (event) {

                // event.stopPropagation();
                // event.preventDefault(); // prevent scrolling
                // event.stopImmediatePropagation();

                for (let i = 0; i < event.changedTouches.length; i++) {
                    let touch = event.changedTouches[i];
                    if (touch.identifier == moveTouchId) {
                        let touchVec = getTouchVec(moveTouchStart, touch, this.touchDeadZone);
                        // let dx = moveTouchStart.x - touch.pageX;
                        // let dy = moveTouchStart.y - touch.pageY;

                        axisMovement.x = -this.touchMoveSpeed * touchVec.x;
                        axisMovement.y = this.touchMoveSpeed * touchVec.y;

                    } else if (touch.identifier == rotTouchId) {
                        let touchVec = getTouchVec(rotTouchStart, touch, this.touchDeadZone);
                        // let dx = rotTouchStart.x - touch.pageX;
                        // let dy = rotTouchStart.y - touch.pageY;
                        camRot.x = touchVec.x;
                        camRot.y = touchVec.y;
                    }
                }
                if (event.touches.length >= 1) {

                    // moveLeft = dx > 0;
                    // moveRight = dx < 0;
                    // moveForward = dy > 0;
                    // moveBackward = dy < 0;
                }
                if (event.touches.length >= 2) {

                }

            }

            this.onTouchEnd = function (event) {
                // event.stopPropagation();
                // event.preventDefault(); // prevent scrolling
                // event.stopImmediatePropagation();

                for (let i = 0; i < event.changedTouches.length; i++) {
                    let touch = event.changedTouches[i];
                    if (touch.identifier == moveTouchId) {

                        moveTouchId = -1;
                        axisMovement.x = 0;
                        axisMovement.y = 0;
                        usingAxisMovement = false;

                    } else if (touch.identifier == rotTouchId) {

                        rotTouchId = -1;
                        camRot.x = 0;
                        camRot.y = 0;
                    }
                }

                if (event.touches.length == 0) {
                    // moveLeft = false;
                    // moveRight = false;
                    // moveForward = false;
                    // moveBackward = false;
                } else if (event.touches.length == 1) {

                }
            }
            this.moveForward = function (distance) {

                // move forward parallel to the xz-plane
                // assumes camera.up is y-up
                _vector.setFromMatrixColumn(camera.matrix, 0);

                _vector.crossVectors(camera.up, _vector);

                camera.position.addScaledVector(_vector, distance);

            };

            this.moveRight = function (distance) {

                _vector.setFromMatrixColumn(camera.matrix, 0);

                camera.position.addScaledVector(_vector, distance);

            };

            this.update = function () {

                return function update(delta) {

                    this.pointerLock.rotateCamera(-this.touchRotSpeed * camRot.x, -this.touchRotSpeed * camRot.y);

                    velocity.x -= velocity.x * deceleration * delta;
                    velocity.z -= velocity.z * deceleration * delta;

                    // velocity.y -= gravity * delta; // 100.0 = mass

                    direction.z = Number(moveForward) - Number(moveBackward);
                    direction.x = Number(moveRight) - Number(moveLeft);
                    direction.normalize(); // this ensures consistent movements in all directions

                    if (usingAxisMovement) {
                        // axisMovement.normalize();
                        if (axisMovement.length() > 1) {
                            axisMovement.normalize();
                        }
                        velocity.z -= axisMovement.y * this.playerSpeed * delta;
                        velocity.x -= axisMovement.x * this.playerSpeed * delta;
                    } else {
                        if (moveForward || moveBackward) velocity.z -= direction.z * this.playerSpeed * delta;
                        if (moveLeft || moveRight) velocity.x -= direction.x * this.playerSpeed * delta;
                    }


                    // if ( onObject === true ) {

                    // 	velocity.y = Math.max( 0, velocity.y );
                    // 	canJump = true;

                    // }
                    var rightMag = - velocity.x;
                    var forwardMag = - velocity.z;
                    // this.pointerLock.moveRight(- velocity.x * delta);
                    // this.pointerLock.moveForward(- velocity.z * delta);

                    // this.pointerLock.getObject().position.y += (velocity.y * delta); // new behavior

                    // if (this.pointerLock.getObject().position.y < this.playerHeight) {

                    //     velocity.y = 0;
                    //     this.pointerLock.getObject().position.y = this.playerHeight;


                    // }

                    var forward = new THREE.Vector3();
                    object.getWorldDirection(forward);
                    forward.y = 0;
                    forward.normalize();

                    var right = new THREE.Vector3();
                    right.copy(forward);
                    right.cross(new THREE.Vector3(0, 1, 0));

                    forward.multiplyScalar(forwardMag);
                    right.multiplyScalar(rightMag);
                    // object.position.add(forward);
                    // object.position.add(right);
                    realVelocity.copy(forward);
                    realVelocity.add(right);
                    realVelocity.y = physicsBody.velocity.y + velocity.y;
                    velocity.y = 0;
                    physicsBody.velocity = CANNONVec(realVelocity);
                    copyMeshRot(physicsBody, object);

                    raycastTarget.copy(physicsBody.position);
                    raycastTarget.y -= this.playerHeight;

                    if(world.raycastClosest(physicsBody.position, raycastTarget,{collisionFilterMask: STATIC_GROUP | DYNAMIC_GROUP},new CANNON.RaycastResult())) {

                        canJump = true;
                    }else {
                        canJump = false;
                    }

                    // move forward parallel to the xz-plane
                    // assumes camera.up is y-up
                    // realVelocity.setFromMatrixColumn( object.matrix, 0 );

                    // realVelocity.crossVectors( object.up, realVelocity );
                    // realVelocity.multiplyScalar(forwardMag);
                    // physicsBody.velocity = CANNONVec(realVelocity);

                    // realVelocity.setFromMatrixColumn( object.matrix, 0 );
                    // realVelocity.multiplyScalar(rightMag);
                    // console.log('real vel: ', realVelocity);
                    // physicsBody.velocity.vadd(CANNONVec(realVelocity));

                    // camera.position.addScaledVector( realVelocity, distance );
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

                // window.removeEventListener('touchstart', _onTouchStart, false);
                // window.removeEventListener('touchend', _onTouchEnd, false);
                // window.removeEventListener('touchmove', _onTouchMove, false);

            };

            const _onKeyDown = this.onKeyDown.bind(this);
            const _onKeyUp = this.onKeyUp.bind(this);
            // const _onTouchStart = this.onTouchStart.bind(this);
            // const _onTouchEnd = this.onTouchEnd.bind(this);
            // const _onTouchMove = this.onTouchMove.bind(this);

            window.addEventListener('keydown', _onKeyDown);
            window.addEventListener('keyup', _onKeyUp);

            touchEventHandler.touchStart = this.onTouchStart.bind(this);
            touchEventHandler.touchMove = this.onTouchMove.bind(this);
            touchEventHandler.touchEnd = this.onTouchEnd.bind(this);


            // window.addEventListener('touchstart', _onTouchStart, { passive: false });
            // window.addEventListener('touchend', _onTouchEnd, { passive: false });
            // window.addEventListener('touchmove', _onTouchMove, { passive: false });
        }

    }


    THREE.FPSMultiplatformControls = FPSMultiplatformControls;

})();
