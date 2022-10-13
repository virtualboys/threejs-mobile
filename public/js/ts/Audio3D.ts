
export class AudioSource3D extends THREE.Object3D {

    // maxRadius = 80;
    // minRadius = 8;
    falloffDist = 6;
    lookAwayDamping = .35;
    ignoreY = true;

    listenerParent: THREE.Object3D;
    audio: THREE.Audio;

    private d = new THREE.Vector3();
    private listenerForward = new THREE.Vector3();

    constructor(listener: THREE.Object3D, audio: THREE.Audio) {
        super();
        this.listenerParent = listener.parent;
        this.audio = audio;
    }

    updateMatrix(): void {
        super.updateMatrix();
        this.updateVolume();
    }

    updateVolume(): void {
        // console.log('updating audio 3d');
        // this.getWorldPosition(this.worldPos);
        // this.listener.getWorldPosition(this.listenerPos);
        this.d.copy(this.listenerParent.position);
        this.d.sub(this.position);
        
        if (this.ignoreY) {
            this.d.set(this.d.x, 0, this.d.z);
        }

        const dLen = this.d.length();
        this.d.normalize();

        const e = this.listenerParent.matrixWorld.elements;
        this.listenerForward.set(e[8], e[9], e[10]).normalize();

        const dot = this.d.dot(this.listenerForward);
        // console.log('dot: ', dot);
        // console.log(this.audio.id, 'distance:', distance);

        // if(distance < this.minRadius) {
        //     this.audio.volume = 1;
        // } else if(distance > this.maxRadius) {
        //     this.audio.volume = 0;
        // }

        // // keep volume within the range of 0 and 1
        // this.audio.volume = Math.min(1, Math.max(0, 1 - ((distance - this.minRadius) / (this.maxRadius - this.minRadius))));
        let vol = (this.falloffDist / (Math.max(.01, dLen))) * (1 + (dot / 2) * this.lookAwayDamping);
        // console.log('voL: ', vol);
        vol = Math.min(1, Math.max(0, vol));
        this.audio.setVolume(vol);
        // this.audio.volume = vol;
    }
}

export class AudioListener3D extends THREE.Object3D {

    sources: AudioSource3D[] = [];

    constructor() {
        super();
    }

    updateMatrix(): void {
        super.updateMatrix();
        this.sources.forEach((source) => {
            source.updateVolume();
        });
    }

    addSource(source: AudioSource3D) {
        this.sources.push(source);
    }
}