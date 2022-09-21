(function () {
  class CharacterController {
    constructor(object, physicsBody, world, domElement, touchEventHandler) {
      if (domElement === undefined) {
        domElement = document;
      }

      this.object = object;
      this.physicsBody = physicsBody;
      this.domElement = domElement; // API

      this.playerHeight = 0.5;
      this.playerSpeed = 50;
      this.jumpSpeed = 10;
      this.gravity = 20;
      this.deceleration = 10;

      this.touchRotSpeed = 0.3;
      this.touchMoveSpeed = 0.05;
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
          case "ArrowUp":
          case "KeyW":
            moveForward = true;
            break;

          case "ArrowLeft":
          case "KeyA":
            moveLeft = true;
            break;

          case "ArrowDown":
          case "KeyS":
            moveBackward = true;
            break;

          case "ArrowRight":
          case "KeyD":
            moveRight = true;
            break;

          case "Space":
            if (canJump === true) velocity.y += this.jumpSpeed;
            canJump = false;
            break;
        }
      };

      this.onKeyUp = function (event) {
        switch (event.code) {
          case "ArrowUp":
          case "KeyW":
            moveForward = false;
            break;

          case "ArrowLeft":
          case "KeyA":
            moveLeft = false;
            break;

          case "ArrowDown":
          case "KeyS":
            moveBackward = false;
            break;

          case "ArrowRight":
          case "KeyD":
            moveRight = false;
            break;
        }
      };

      this.onTouchStart = function (event) {
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
      };

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
        for (let i = 0; i < event.changedTouches.length; i++) {
          let touch = event.changedTouches[i];
          if (touch.identifier == moveTouchId) {
            let touchVec = getTouchVec(
              moveTouchStart,
              touch,
              this.touchDeadZone
            );

            axisMovement.x = -this.touchMoveSpeed * touchVec.x;
            axisMovement.y = this.touchMoveSpeed * touchVec.y;
          } else if (touch.identifier == rotTouchId) {
            let touchVec = getTouchVec(
              rotTouchStart,
              touch,
              this.touchDeadZone
            );

            camRot.x = touchVec.x;
            camRot.y = touchVec.y;
          }
        }
      };

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
      };

      this.update = (function () {
        return function update(delta) {
          this.pointerLock.rotateCamera(
            -this.touchRotSpeed * camRot.x,
            -this.touchRotSpeed * camRot.y
          );

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
            if (moveForward || moveBackward)
              velocity.z -= direction.z * this.playerSpeed * delta;
            if (moveLeft || moveRight)
              velocity.x -= direction.x * this.playerSpeed * delta;
          }

          var rightMag = -velocity.x;
          var forwardMag = -velocity.z;

          var forward = new THREE.Vector3();
          object.getWorldDirection(forward);
          forward.y = 0;
          forward.normalize();

          var right = new THREE.Vector3();
          right.copy(forward);
          right.cross(new THREE.Vector3(0, 1, 0));

          forward.multiplyScalar(forwardMag);
          right.multiplyScalar(rightMag);

          realVelocity.copy(forward);
          realVelocity.add(right);
          realVelocity.y = physicsBody.velocity.y + velocity.y;
          velocity.y = 0;
          physicsBody.velocity = CANNONVec(realVelocity);
          copyMeshRot(physicsBody, object);

          raycastTarget.copy(physicsBody.position);
          raycastTarget.y -= this.playerHeight;

          if (
            world.raycastClosest(
              physicsBody.position,
              raycastTarget,
              { collisionFilterMask: STATIC_GROUP | DYNAMIC_GROUP },
              new CANNON.RaycastResult()
            )
          ) {
            canJump = true;
          } else {
            canJump = false;
          }
        };
      })();
    }
  }

  THREE.CharacterController = CharacterController;
})();
