import Vector from "./Vector";

export abstract class BaseRaycaster {
    public last_checked_position : Vector;
    public last_checked_distance : number;
    
    public position : Vector;
    public direction : Vector;
    public distance_done : number;

    constructor(starting_position : Vector, start_direction : Vector) {
        this.last_checked_position = starting_position.clone();
        this.position = starting_position.clone();
        this.direction = start_direction.clone();
        this.distance_done = 0;
    }

    abstract check() : boolean;

    abstract end() : void;

    raycast() {
        while (true) {
            this.position.mutadd(this.direction.normalized());
            this.distance_done += 1;

            if (!this.check()) {
                break;
            }

            this.last_checked_distance = this.distance_done;
            this.last_checked_position = this.position.clone();
        }

        this.end();
    }
}