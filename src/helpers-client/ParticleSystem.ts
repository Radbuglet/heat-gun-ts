import { IUpdate } from "../helpers-common/helpers/IUpdate";
import { CanvasApplicationInterface } from "./CanvasApplication";
import Vector from "../helpers-common/helpers/Vector";
import { todeg } from "../helpers-common/helpers/Math";

export class ParticleSystem {
    private particles : Map<Particle, Particle> = new Map();

    constructor() {
        
    }

    register_particle(particle : Particle) {
        this.particles.set(particle, particle);
    }

    destroy_particle(particle : Particle) {
        this.particles.delete(particle);
    }

    update(evt : IUpdate) {
        this.particles.forEach(particle => {
            particle.update(evt);
        });
    }

    render() {
        this.particles.forEach(particle => {
            particle.render();
        });
    }
}

export abstract class Particle {
    constructor(private system : ParticleSystem) {}

    abstract update(evt : IUpdate);
    abstract render();

    destroy() {
        this.system.destroy_particle(this);    
    }
}

export abstract class SquareParticle extends Particle {
    protected position : Vector;
    protected velocity : Vector;

    protected life_counter : number = 0;

    constructor(system : ParticleSystem, private canvas_app : CanvasApplicationInterface, initial_position : Vector, initial_velocity : Vector, protected gravity_force : Vector, protected life_max : number) {
        super(system);
        this.position = initial_position.clone();
        this.velocity = initial_velocity.clone();
    }

    update(evt : IUpdate) {
        this.position.mutadd(this.velocity.mult(new Vector(evt.ticks)));
        this.velocity.mutadd(this.gravity_force.mult(new Vector(evt.ticks)));
        this.life_counter += evt.ticks;

        if (this.life_counter >= this.life_max) {
            this.destroy();
        }
    }

    render() {
        this.canvas_app.draw(ctx => {
            ctx.translate(this.position.getX(), this.position.getY());
            ctx.rotate(todeg(this.get_rotation()));
            ctx.globalAlpha = this.get_opacity();

            const size = this.get_size();
            ctx.fillStyle = this.get_color();
            ctx.fillRect(-size / 2, -size / 2, size, size);

            ctx.strokeStyle = this.get_color_border();
            ctx.lineWidth = this.get_size_border();

            ctx.strokeRect(-size / 2, -size / 2, size, size);
        });
    }

    abstract get_color() : string;
    abstract get_size() : number;
    abstract get_rotation() : number;
    abstract get_opacity() : number;
    abstract get_color_border() : string;
    abstract get_size_border() : number;
}