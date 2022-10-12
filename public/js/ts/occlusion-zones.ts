import { stringify } from "querystring";

interface Zone {
    bounds: THREE.Box3,
    objects: THREE.Object3D[],
    visible: boolean
}

export class OcclusionZones {

    zones: Record<string, Zone> = {};

    public addZone(bounds: THREE.Box3, zoneName: string) {
        this.zones[zoneName] = {bounds: bounds, objects: [], visible: true};
    }

    public addObject(zoneName: string, obj: THREE.Object3D) {
        this.zones[zoneName].objects.push(obj);
    }

    public update(playerPos: THREE.Vector3) {
        Object.entries(this.zones).forEach(([name, zone])=>{
            const visible = zone.bounds.containsPoint(playerPos);
            if(zone.visible != visible) {
                console.log('setting ', name, ' visible: ', visible);
                zone.objects.forEach((obj: THREE.Object3D) => {
                    obj.visible = visible;
                });
                zone.visible = visible;
            }
        });
    }

    constructor() {
    }
}