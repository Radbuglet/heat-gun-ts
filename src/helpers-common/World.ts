import Vector from "./helpers/Vector";
import { ITile, Layers, OneWayDirections, MapLoader } from "./MapLoader";
import { Player } from "./Player";
import { IUpdate } from "./helpers/IUpdate";

import { CollisionFace, Rect } from "./helpers/Rect";
import { BeamRaycaster } from "./BeamRaycaster";
import { MapChunker } from "./MapChunker";
import { TPZONE_LEFT, TPZONE_RIGHT, TPZONE_TOP, TPZONE_BOTTOM } from "../config/Config";
import { RunPlatform } from "./helpers/RunPlatform";
import { ServerWorld } from "../platform-server/ServerWorld";
import { ServerPlayer } from "../platform-server/ServerPlayer";

export interface ITileCollided {
    tile: ITile
    face: CollisionFace
}

export interface IBeam {
    path : Vector[]
    size : number
    color : string
    path_lerping : boolean
    delete_flag : boolean
    is_from_other? : boolean
}

export abstract class World<PlayerClass extends Player<any>> {
    public tiles : ITile[] = null;
    public map_chunker : MapChunker = null;
    public players: Map<string, PlayerClass> = new Map();
    public beams : IBeam[] = [];

    constructor(map_loader: MapLoader) {
        this.tiles = map_loader.clone_map_object();
        this.chunk_map();
    }

    chunk_map() {
        console.log("Chunking map...");
        this.map_chunker = new MapChunker(this.tiles, TPZONE_LEFT, TPZONE_RIGHT, 200);
        console.log("Finished chunking map!");
    }

    add_player(player: PlayerClass) {
        this.players.set(player.uuid, player);
        
        if (RunPlatform.is_server()) {
            (this as unknown as ServerWorld).replicate__player_added();
        }
    }

    remove_player(player: PlayerClass) {
        this.players.delete(player.uuid);
        
        if (RunPlatform.is_server()) (this as unknown as ServerWorld).replicate__player_removed();
    }

    update(update_evt: IUpdate) {
        if (RunPlatform.is_server()) (this as unknown as ServerWorld).queue_all_players_packets();

        this.players.forEach(player => {
            player.update(update_evt);
        });
        
        if (RunPlatform.is_server()) (this as unknown as ServerWorld).unqueue_all_players_packets();

        // @TODO power-ups!

        this.beams.forEach(beam => {
            if (beam.path_lerping) {
                if (!beam.path[0].is_lerping()) {
                    beam.path.shift();
                    beam.path_lerping = false;
                }
            } else {
                if (beam.path.length >= 2) {
                    const lerp_duration = beam.path[0].distance(beam.path[1]) * 0.25;
                    beam.path[0].setPair(beam.path[1].getX(), beam.path[1].getY(), lerp_duration);
    
                    beam.path_lerping = true;
                } else {
                    beam.delete_flag = true;
                }
            }
        });
        this.beams = this.beams.filter(beam => beam.delete_flag === false);
    }

    get_tile_collisions(rect : Rect, foreground_no_ignore: boolean = false): ITile[] {
        return this.map_chunker.get_tiles_in_rect(rect).filter(tile => (tile.layer === Layers.obj || (foreground_no_ignore && tile.layer === Layers.dec)) && rect.testcollision(tile.rect));
    }

    get_movement_collisions(rect : Rect, vec: Vector, return_raw_collisions = false, one_way_do_inside_check : boolean = true): ITile[] { // @TODO make a helper somewhere else
        const nrect = rect.clone();
        nrect.top_left.mutadd(vec);

        return this.get_tile_collisions(nrect, return_raw_collisions).filter(collided_tile => {
            if (return_raw_collisions) return true; // No checking!

            // @TODO bring back from the dead
            if (typeof collided_tile.one_way === "number") { // The tile is specified as one way?
                if (one_way_do_inside_check && this.get_tile_collisions(rect).length > 0) { // The **original** position of the object is already inside an tile?
                    return false; // The tile doesn't block the object
                }

                // Check the entering direction
                if (
                    (collided_tile.one_way === OneWayDirections.negative_x && Math.sign(vec.getX()) === -1) ||
                    (collided_tile.one_way === OneWayDirections.positive_x && Math.sign(vec.getX()) === 1) ||

                    (collided_tile.one_way === OneWayDirections.negative_y && Math.sign(vec.getY()) === -1) ||
                    (collided_tile.one_way === OneWayDirections.positive_y && Math.sign(vec.getY()) === 1)
                ) {
                    return false; // The tile doesn't block the object
                }
            }

            return true; // The tile can block the object
        });
    }

    raycastaddon__check_collisions(raycaster: BeamRaycaster, ray_collision_box: Vector): boolean { // @TODO a lot of stuff!
        const ray_collisionbox_position = raycaster.position.sub(ray_collision_box.div(new Vector(2)));

        return this.get_movement_collisions(
            new Rect(ray_collisionbox_position, ray_collision_box),
            raycaster.direction,
            false,
            false
        ).filter(collided_tile => {
            if (collided_tile.bullet_phased) return false; // The tile isn't blocking the object

            if (collided_tile.reflective) {
                if (this.get_movement_collisions(
                    new Rect(ray_collisionbox_position, ray_collision_box),
                    new Vector(-raycaster.direction.getX(), raycaster.direction.getY()),
                ).length === 0) {
                    raycaster.change_direction(new Vector(-raycaster.direction.getX(), raycaster.direction.getY()));
                } else {
                    raycaster.change_direction(new Vector(raycaster.direction.getX(), -raycaster.direction.getY()));
                }

                return false; // The tile doesn't stop the beam but it does redirect it
            }

            return true; // The tile is blocking the bullet
        }).length === 0;
    }

    add_gun_beams(origin_player : Player<any>, path : Vector[], size : number, color : string) {
        const new_beam_index = this.beams.push({
            path, size, color,
            path_lerping: false,
            delete_flag: false
        });
        if (RunPlatform.is_server()) (this as unknown as ServerWorld).replicate__new_beam(origin_player, this.beams[new_beam_index - 1]);
    }
}