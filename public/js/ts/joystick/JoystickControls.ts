// import * as THREE from 'three';
import isTouchOutOfBounds from './helpers/isTouchOutOfBounds.js';
import degreesToRadians from './helpers/degreesToRadians.js';
import getPositionInScene from './helpers/getPositionInScene.js';
import { ClientRequest } from 'http';

export class JoystickControls {
  /**
   * This is the three.js scene
   */
  scene: THREE.Scene;
  /**
   * This is the three.js  camera
   */
  camera: THREE.PerspectiveCamera;
  /**
   * This is used to detect if the user has moved outside the
   * joystick base. It will snap the joystick ball to the bounds
   * of the base of the joystick
   */
  joystickTouchZone = .3;
  /**
   * Anchor of the joystick base
   */
  baseAnchorPoint: THREE.Vector2 = new THREE.Vector2();
  /**
   * Current point of the joystick ball
   */
  touchPoint: THREE.Vector2 = new THREE.Vector2();
  /**
   * Function that allows you to prevent the joystick
   * from attaching
   */
  preventAction: () => boolean = () => false;
  /**
   * True when user has begun interaction
   */
  interactionHasBegan = false;
  /**
   * True when the joystick has been attached to the scene
   */
  isJoystickAttached = false;
  /**
   * Setting joystickScale will scale the joystick up or down in size
   */
  joystickScale = 5;
  /**
   * scales the value returned by update 
   */
  joystickSensitivity = 15;
  /**
   * percentage of touch zone that is dead 
   */
  deadZone = .2;
  /**
   * y offset of joystick from touch 
   */
  yOffset = 0;

  uiOpacity = .75;

  baseTex: THREE.Texture;
  knobTex: THREE.Texture;

  baseObject: THREE.Object3D;
  knobObject: THREE.Object3D;

  viewPos: THREE.Vector2;
  anchorOffset: THREE.Vector2;

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    baseTex: THREE.Texture,
    knobTex: THREE.Texture,
    viewPos: THREE.Vector2,
    anchorOffset: THREE.Vector2,
    width: number,
    height: number,
  ) {
    this.camera = camera;
    this.scene = scene;
    this.baseTex = baseTex;
    this.knobTex = knobTex;
    this.viewPos = viewPos;
    this.anchorOffset = anchorOffset;
    this.create();

    this.updateBaseAnchorPoint(width, height);

    const positionInScene = getPositionInScene(
      this.baseAnchorPoint.x,
      this.baseAnchorPoint.y,
      this.camera,
      this.yOffset,
      this.joystickScale,
    );

    this.attachJoystick(positionInScene);
  }

  private updateBaseAnchorPoint(width, height) {
    const worldCenter = getPositionInScene(
      this.viewPos.x * width,
      this.viewPos.y * height,
      this.camera,
      this.yOffset,
      this.joystickScale
    );

    worldCenter.x += this.anchorOffset.x;
    worldCenter.y += this.anchorOffset.y;
    
    const screenPivot = worldCenter.clone().project(this.camera);
    // worldPivot.project(this.camera);
    screenPivot.x = ( screenPivot.x * width / 2 ) + width / 2;
    screenPivot.y = - ( screenPivot.y * height / 2 ) + height / 2;
  

    // const vFOV = this.camera.fov * Math.PI / 180;        // convert vertical fov to radians
    // const stickWidth = height / (2 * Math.tan( vFOV / 2 ) * this.joystickScale); // visible height'
    //   console.log('stick width: ', stickWidth)

    // this.baseAnchorPoint = new THREE.Vector2(
    //   this.viewPos.x * width + this.pivot.x * stickWidth,
    //   this.viewPos.y * height + this.pivot.y * stickWidth);
      this.baseAnchorPoint = new THREE.Vector2(screenPivot.x, screenPivot.y);
      // console.log(this.baseAnchorPoint);
  }

  public onResize(width: number, height: number) {
    this.updateBaseAnchorPoint(width, height);

    const positionInScene = getPositionInScene(
      this.baseAnchorPoint.x,
      this.baseAnchorPoint.y,
      this.camera,
      this.yOffset,
      this.joystickScale,
    );

    this.baseObject.position.copy(positionInScene);
    this.knobObject.position.copy(positionInScene);

    // const scaleMod = (width > 2 * height) ? 1.5 : 1;
    // this.baseObject.scale.set(scaleMod, scaleMod, scaleMod);
    // this.knobObject.scale.set(scaleMod, scaleMod, scaleMod);
  }

  /**
   * Plots the anchor point
   */
  public onStart = (clientX: number, clientY: number) => {
    const positionInScene = getPositionInScene(
      clientX,
      clientY,
      this.camera,
      this.yOffset,
      this.joystickScale,
    );

    const startRange = this.joystickTouchZone * 5;
    if(positionInScene.sub(this.baseObject.position).length() < startRange) {
      this.interactionHasBegan = true;
      this.onMove(clientX, clientY);
    }
  };

  /**
   * Updates the joystick position during user interaction
   */
  public onMove = (clientX: number, clientY: number) => {
    if (!this.interactionHasBegan) {
      return;
    }

    this.touchPoint = new THREE.Vector2(clientX, clientY);

    const positionInScene = getPositionInScene(
      clientX,
      clientY,
      this.camera,
      this.yOffset,
      this.joystickScale,
    );

    this.updateJoystickBallPosition(clientX, clientY, positionInScene);
  };

  /**
   * Clean up joystick when the user interaction has finished
   */
  public onEnd = () => {
    this.interactionHasBegan = false;

    this.knobObject.position.copy(this.baseObject.position);
  };

  /**
   * Draws the joystick base and ball
   *
   * TODO: Add feature to allow an image to be loaded.
   * TODO: Add option to change color and size of the joystick
   */
  private attachJoystickUI = (
    isBase: boolean,
    position: THREE.Vector3,
  ) => {
    const tex = (isBase) ? this.baseTex : this.knobTex;
    const renderOrder = (isBase) ? 1 : 2;
    const name = (isBase) ? 'joystick-base' : 'joystick-ball';

    // const geometry = new THREE.CircleGeometry(size * zoomScale, 72);
    const geometry = new THREE.PlaneGeometry(1, 1,1,1);
    const material = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
      opacity: this.uiOpacity,
    });
    new THREE.MeshBasicMaterial()
    const uiElement = new THREE.Mesh(geometry, material);

    uiElement.renderOrder = renderOrder;
    uiElement.name = name;
    uiElement.position.copy(position);

    this.scene.add(uiElement);

    return uiElement;
  };

  /**
   * Creates the ball and base of the joystick
   */
  private attachJoystick = (positionInScene: THREE.Vector3) => {
    this.baseObject = this.attachJoystickUI(
      true,
      positionInScene
    );
    this.knobObject = this.attachJoystickUI(
      false,
      positionInScene
    );

    this.isJoystickAttached = true;
  };

  /**
   * Calculates if the touch point was outside the joystick and
   * either returns the joystick ball position bound to the perimeter of
   * the base, or the position inside the base.
   */
  private getJoystickBallPosition = (
    clientX: number,
    clientY: number,
    positionInScene: THREE.Vector3,
  ): THREE.Vector3 => {

    const d = positionInScene.clone().sub(this.baseObject.position);
    d.z = 0;

    const dLen = d.length();
    if(dLen > this.joystickTouchZone) {
      d.set(clientX - this.baseAnchorPoint.x, -(clientY - this.baseAnchorPoint.y), 0);
      d.normalize();
      d.multiplyScalar(this.joystickTouchZone);
      return this.baseObject.position.clone().add(d);
    } else if(dLen / this.joystickTouchZone < this.deadZone) {
      return this.baseObject.position.clone();
    }

    /**
     * Touch was inside the Base so just set the joystick ball to that
     * position
     */
    return positionInScene;    
    
    const touchWasOutsideJoystick = isTouchOutOfBounds(
      clientX,
      clientY,
      this.baseAnchorPoint,
      this.joystickTouchZone,
    );

    if (touchWasOutsideJoystick) {
      /**
       * Touch was outside Base so restrict the ball to the base perimeter
       */
      const angle = Math.atan2(
        clientY - this.baseAnchorPoint.y,
        clientX - this.baseAnchorPoint.x,
      ) - degreesToRadians(90);
      const xDistance = Math.sin(angle) * this.joystickTouchZone;
      const yDistance = Math.cos(angle) * this.joystickTouchZone;
      const direction = new THREE.Vector3(-xDistance, -yDistance, 0)
        .normalize();
      const joyStickBase = this.scene.getObjectByName('joystick-base');

      /**
       * positionInScene restricted to the perimeter of the joystick
       * base
       */
      return (joyStickBase as THREE.Object3D).position.clone().add(direction);
    }
  };

  /**
   * Attaches the joystick or updates the joystick ball position
   */
  private updateJoystickBallPosition = (
    clientX: number,
    clientY: number,
    positionInScene: THREE.Vector3,
  ) => {
    const joystickBallPosition = this.getJoystickBallPosition(
      clientX,
      clientY,
      positionInScene,
    );

    /**
     * Inside Base so just copy the position
     */
    this.knobObject?.position.copy(joystickBallPosition);
  };

  /**
   * Calculates and returns the distance the user has moved the
   * joystick from the center of the joystick base.
   */
  protected getJoystickMovement = (): TMovement | null => {
    if (!this.isJoystickAttached) {
      return null;
    }

    const d = this.knobObject.position.clone().sub(this.baseObject.position);
    d.z = 0;

    const dAmt = ((d.length() / this.joystickTouchZone) - this.deadZone) / (1 - this.deadZone);
    const moveLen = this.joystickSensitivity * Math.max(0, dAmt);
    d.normalize();
    d.multiplyScalar(moveLen);

    return {
      moveX: d.x,
      moveY: d.y,
    };
  };

  /**
   * Adds event listeners to the document
   */
  public create = (): void => {
    // window.addEventListener('touchstart', this.handleTouchStart);
    // window.addEventListener('touchmove', this.handleTouchMove);
    // window.addEventListener('touchend', this.handleEventEnd);
    // window.addEventListener('mousedown', this.handleMouseDown);
    // window.addEventListener('mousemove', this.handleMouseMove);
    // window.addEventListener('mouseup', this.handleEventEnd);
  };

  /**
   * Removes event listeners from the document
   */
  public destroy = (): void => {
    // window.removeEventListener('touchstart', this.handleTouchStart);
    // window.removeEventListener('touchmove', this.handleTouchMove);
    // window.removeEventListener('touchend', this.handleEventEnd);
    // window.removeEventListener('mousedown', this.handleMouseDown);
    // window.removeEventListener('mousemove', this.handleMouseMove);
    // window.removeEventListener('mouseup', this.handleEventEnd);
  };

  /**
   * function that updates the positioning, this needs to be called
   * in the animation loop
   */
  public update = (callback?: (movement?: TMovement | null) => void): void => {
    const movement = this.getJoystickMovement();

    callback?.(movement);
  };
}
