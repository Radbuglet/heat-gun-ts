import { ParticleSystem, SquareParticle } from "../../helpers-client/ParticleSystem";
import { CanvasSubApplication } from "../../helpers-client/CanvasApplication";
import Vector from "../../helpers-common/helpers/Vector";

export class AmmoParticle extends SquareParticle {
    constructor(system : ParticleSystem, app : CanvasSubApplication, position : Vector, velocity : Vector) {
        super(system, app, position, velocity, new Vector(0, 1), 1000);
    }

    get_color() {
        return "yellow";
    }

    get_opacity() {
        return 1;
    }

    get_color_border() {
        return "black";
    }

    get_size_border() {
        return 1;
    }

    get_size() {
        return 10;
    }

    get_rotation() {
        return (this.life_counter / this.life_max) * 360 * 5;
    }
}


export class BloodParticle extends SquareParticle {
    constructor(system : ParticleSystem, app : CanvasSubApplication, position : Vector, velocity : Vector, private size : number) {
        super(system, app, position, velocity, new Vector(0, 1), 1000);
    }

    get_color() {
        return "red";
    }

    get_opacity() {
        return 1;
    }

    get_color_border() {
        return "darkred";
    }

    get_size_border() {
        return 1;
    }

    get_size() {
        return this.size;
    }

    get_rotation() {
        return 0; //(this.life_counter / this.life_max) * 360 * 5;
    }
}