import { BaseRaycaster } from "./helpers/Raycast";
import Vector from "./helpers/Vector";
import { World } from "./World";
import { Player } from "./Player";
import { Rect } from "./helpers/Rect";
import { Weapon } from "./Weapon";
import { PowerUpCrystal } from "./PowerUpCrystal";

// @TODO implement reflections properly

export interface BeamRaycasterConstructionArgs<TWorld extends World<TWorld, TPlayer, TWeapon, TCrystal>, TPlayer extends Player<TWorld, TPlayer, TWeapon, TCrystal>, TWeapon extends Weapon<TWorld, TPlayer, TWeapon, TCrystal>, TCrystal extends PowerUpCrystal<TWorld, TPlayer, TWeapon, TCrystal>> {
    starting_position : Vector
    starting_direction : Vector
    max_dist : number
    world : TWorld
    ray_collision_box_size : Vector

    gravity_vec : Vector
    path_diff_until_change : number

    phase_world : boolean

    initiator_player : TPlayer

    chk_every : number
}

export class BeamRaycaster<TWorld extends World<TWorld, TPlayer, TWeapon, TCrystal>, TPlayer extends Player<TWorld, TPlayer, TWeapon, TCrystal>, TWeapon extends Weapon<TWorld, TPlayer, TWeapon, TCrystal>, TCrystal extends PowerUpCrystal<TWorld, TPlayer, TWeapon, TCrystal>> extends BaseRaycaster {
    private world : TWorld;
    private max_dist : number;
    private ray_collbox_size : Vector;

    private gravity_vec : Vector;

    private hidden_velocity : Vector;
    private path_diff_until_change : number;
    public beam_path : Vector[] = [];

    private phase_world : boolean;

    private initiator_player : TPlayer;
    private chk_every : number;

    public collided_player : TPlayer = null;

    constructor(args : BeamRaycasterConstructionArgs<TWorld, TPlayer, TWeapon, TCrystal>) {
        super(args.starting_position, args.starting_direction);

        this.hidden_velocity = this.direction.clone();
        this.world = args.world;
        this.phase_world = args.phase_world;
        this.max_dist = args.max_dist;
        this.ray_collbox_size = args.ray_collision_box_size;
        this.gravity_vec = args.gravity_vec;
        this.path_diff_until_change = args.path_diff_until_change;
        this.initiator_player = args.initiator_player;
        this.chk_every = args.chk_every;

        this.change_direction(this.direction);
    }

    public change_direction(new_direction : Vector) {
        this.beam_path.push(this.position.clone());
        this.direction = new_direction.clone();
        this.hidden_velocity = new_direction.clone();
    }

    check() : boolean {
        // Limit distance
        if (this.distance_done > this.max_dist) return false;

        // Check collisions for world
        // @TODO fix reflections
        if ((this.distance_done % this.chk_every) === 0) {
            if (!this.phase_world && !this.world.raycastaddon__check_collisions(this, this.ray_collbox_size)) return false;
        }

        // Apply gravity
        this.hidden_velocity.mutadd(this.gravity_vec);
        if (this.hidden_velocity.distance(this.direction) > this.path_diff_until_change) this.change_direction(this.hidden_velocity);

        // @TODO implement toggleable

        // Player collisions
        if ((this.distance_done % this.chk_every) === 0) {
            this.world.players.forEach(player => {
                if (player.uuid === this.initiator_player.uuid) return;
                if (player.collision_rect.testcollision(new Rect(this.position, this.ray_collbox_size))) {
                    this.collided_player = player;
                }
            });
            if (this.collided_player !== null) return false;
        }

        // @TODO check for powerup boxes

        return true;
    }

    end() {
        this.beam_path.push(this.position.clone());
    }
}