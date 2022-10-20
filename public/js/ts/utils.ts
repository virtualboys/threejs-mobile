
import { easeInQuad } from "./easing-functions.js";

interface UniVec {
  x: number;
  y: number;
  z: number;
}

export function isMobileBrowser(): boolean {
  console.log(window.navigator.userAgent);
  // return true;
  //@ts-ignore
  var md = new MobileDetect(window.navigator.userAgent);

  //@ts-ignore
  const hasTouchScreen = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

  return md.mobile() || md.tablet() || hasTouchScreen;

  let check = false;
  // @ts-ignore
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};

export function isHighDensityDisplay(){
  return ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) || (window.devicePixelRatio && window.devicePixelRatio > 1.3));
}


export function isChromeOrSafari(): boolean {
  const userAgentString = window.navigator.userAgent;
  // Detect Chrome
  let chromeAgent = userAgentString.indexOf("Chrome") > -1;

  // Detect Safari
  let safariAgent = userAgentString.indexOf("Safari") > -1;

  // Discard Safari since it also matches Chrome
  if ((chromeAgent) && (safariAgent)) safariAgent = false;

  return chromeAgent || safariAgent;
}

export function CANNONVec(vec3: UniVec) {
  return new CANNON.Vec3(vec3.x, vec3.y, vec3.z);
}

export function THREEVec(vec3: UniVec) {
  return new THREE.Vector3(vec3.x, vec3.y, vec3.z);
}

export function copyBodyTransform(body, mesh) {
  mesh.position.x = body.position.x;
  mesh.position.y = body.position.y;
  mesh.position.z = body.position.z;
  mesh.quaternion.x = body.quaternion.x;
  mesh.quaternion.y = body.quaternion.y;
  mesh.quaternion.z = body.quaternion.z;
  mesh.quaternion.w = body.quaternion.w;
}

export function copyBodyRot(body, mesh) {
  mesh.quaternion.x = body.quaternion.x;
  mesh.quaternion.y = body.quaternion.y;
  mesh.quaternion.z = body.quaternion.z;
  mesh.quaternion.w = body.quaternion.w;
}

export function copyMeshTransform(body, mesh) {
  body.position.x = mesh.position.x;
  body.position.y = mesh.position.y;
  body.position.z = mesh.position.z;
  body.quaternion.x = mesh.quaternion.x;
  body.quaternion.y = mesh.quaternion.y;
  body.quaternion.z = mesh.quaternion.z;
  body.quaternion.w = mesh.quaternion.w;
}

export function copyMeshRot(body, mesh) {
  body.quaternion.x = mesh.quaternion.x;
  body.quaternion.y = mesh.quaternion.y;
  body.quaternion.z = mesh.quaternion.z;
  body.quaternion.w = mesh.quaternion.w;
}

export function debounce(func) {
  var timer;
  return function (event) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(func, 100, event);
  };
}

export function reparentKeepWorldPos(obj: THREE.Object3D, newParent: THREE.Object3D) {
  const worldPos = obj.getWorldPosition(new THREE.Vector3());
  const worldQuat = obj.getWorldQuaternion(new THREE.Quaternion());
  const worldScale = obj.getWorldScale(new THREE.Vector3());

  obj.removeFromParent();
  obj.position.copy(worldPos);
  obj.quaternion.copy(worldQuat);
  obj.scale.copy(worldScale);

  newParent.attach(obj);
}

export function createParentAtCenter(obj: THREE.Object3D): THREE.Object3D {
  console.log(obj, "reparenting obj at ", obj.position);
  // return obj;

  // obj.geometry.computeBoundingBox();

  const bbox = new THREE.Box3();
  bbox.setFromObject(obj, true);
  console.log("bbox: ", bbox);
  // bbox.copy( obj.geometry.boundingBox ).applyMatrix4( obj.matrixWorld );
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  console.log("new center: ", center);

  const oldParent = obj.parent;
  obj.removeFromParent();

  const newParent = new THREE.Group();
  newParent.position.copy(center);

  newParent.attach(obj);

  // obj.geometry.center();
  oldParent.attach(newParent);
  // oldParent.add(newParent);
  console.log("ppos ", newParent.position, " pos; ", obj.position);

  return newParent;
}

export function easeVec(start: THREE.Vector3, diff: THREE.Vector3, val: THREE.Vector3, t: number, ease: typeof easeInQuad) {
  val.x = ease(t, start.x, diff.x, 1);
  val.y = ease(t, start.y, diff.y, 1);
  val.z = ease(t, start.z, diff.z, 1);
}

export function forEachMat(mesh: THREE.Mesh, op: (mat: THREE.Material) => void) {
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(op);
  } else {
    op(mesh.material);
  }
}

