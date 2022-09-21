function rotateEffect(obj, rotsPerSec, axis) {
    const rotQuat = new THREE.Quaternion();
    return {
        update: 
            (dt) => {
                rotQuat.setFromAxisAngle(axis, 2 * Math.PI * dt * rotsPerSec);
                console.log(2 * Math.PI * dt * rotsPerSec);
                console.log(rotQuat);
                obj.quaternion = obj.quaternion.multiply(rotQuat);
            }
    }
}