(function () {
    class PointAndClickControls {
        constructor(gameCam, physicsBody, uiScene, uiCam, touchEventHandler) {

            let dpad;
            const loader = new THREE.TextureLoader();
            const raycaster = new THREE.Raycaster();
            const pointer = new THREE.Vector2();

            const _euler = new THREE.Euler( 0, 0, 0, 'YXZ' );
            
            const minPolarAngle = 0; // radians
			const maxPolarAngle = Math.PI; // radians

            const _PI_2 = Math.PI / 2;

            loader.load(
                'textures/dpad.png',
                function (texture) {
                    const geometry = new THREE.PlaneGeometry(.1, .1);
                    const material = new THREE.MeshBasicMaterial({
                        map: texture
                    });

                    dpad = new THREE.Mesh(geometry, material);
                    dpad.position.set(.8, 0, -5);
                    uiScene.add(dpad);

                    touchEventHandler.clickOrTap = onClick;
                },
                undefined,
                function (err) {
                    console.error('Error loading dpad tex!');
                }
            );

            function onClick(x, y) {
                pointer.x = (x / window.innerWidth) * 2 - 1;
                pointer.y = - (y / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(pointer, uiCam);
                const intersect = raycaster.intersectObject(dpad, false);
                if (intersect.length > 0) {
                    console.log('hit dpad!!!');
                    intersect[0].point.sub(dpad.position);
                    let rx = intersect[0].point.x;
                    let ry = intersect[0].point.y;

                    console.log('rotating ', rx,',', ry);

                    _euler.setFromQuaternion( gameCam.quaternion );

                    _euler.y -= rx * 4;
                    _euler.x -= -ry * 4;
                    _euler.x = Math.max( _PI_2 - maxPolarAngle, Math.min( _PI_2 - minPolarAngle, _euler.x ) );
                    gameCam.quaternion.setFromEuler( _euler );

                    copyMeshRot(physicsBody, gameCam);
                }
            }


            this.update = function () {
                return function update(delta) {
                    if (!dpad) {
                        return;
                    }


                };
            }();

            this.resize = function(aspect) {
                if(dpad) {
                    dpad.position.y = - 1 / aspect - .1;

                }
            }
        }
    }

    THREE.PointAndClickControls = PointAndClickControls;
})();
