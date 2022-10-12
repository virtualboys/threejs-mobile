export class OcclusionZones {

    addZone: (bounds: THREE.Box3, objects: THREE.Object3D[]) => void;
    update: (playerPos: THREE.Vector3) => void;

    zones: {bounds: THREE.Box3, objects: THREE.Object3D[], visible: boolean}[];

    constructor() {
        this.zones = [];

        this.addZone = function (bounds: THREE.Box3, objects: THREE.Object3D[]) {
            this.zones.push({bounds: bounds, objects: objects, visible: true});
        }

        this.update = function(playerPos: THREE.Vector3) {
            this.zones.forEach((zone) => {
                const visible = zone.bounds.containsPoint(playerPos);
                if(zone.visible != visible) {
                    zone.objects.forEach((obj: THREE.Object3D) => {
                        obj.visible = visible;
                    });
                }
            });
        }
    }
}