function rotateEffect(obj, rotsPerSec, axis) {
    const rotQuat = new THREE.Quaternion();
    return {
        update: 
            (dt) => {
                rotQuat.setFromAxisAngle(axis, 2 * Math.PI * dt * rotsPerSec);
                obj.quaternion = obj.quaternion.multiply(rotQuat);
            }
    }
}

function hoverEffect(obj, height, frequency, axis) {
    const d = new THREE.Vector3();
    let t = .5;
    return {
        update: 
            (dt) => {
                d.copy(axis);
                t += frequency * dt;
                d.multiplyScalar(height * Math.sin(2 * Math.PI * t));
                obj.position.add(d);
            }
    }
}