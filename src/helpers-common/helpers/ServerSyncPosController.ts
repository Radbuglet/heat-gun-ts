import Vector from "./Vector";

interface IActiveDataSync {
    position : Vector
    tries_left : number
    max_dist : number
    callback : (found_position : boolean) => void
}

export class ServerPosRollbacker {
    private rollback_entries : Vector[];

    private active_sync_data : IActiveDataSync = null;

    constructor(rec_entries_count : number) {
        this.rollback_entries = new Array(rec_entries_count).fill(null);
    }

    record_position(position : Vector) {
        this.rollback_entries.shift();
        this.rollback_entries.push(position);
    }

    clear_entries() {
        this.rollback_entries = this.rollback_entries.fill(null);
    }

    sync_serverclient_positions(
        expected_position : Vector,
        max_rollback_point_distance: number,
        max_sync_tries : number, max_sync_distance: number,
        callback : (found_position : boolean) => void
    ) {
        // Cancel previous sync
        if (this.active_sync_data !== null) {
            this.active_sync_data.callback(false);
            console.log("FALSE : Cancelled previous sync!");
            this.active_sync_data = null;
        }

        // Check if we can rollback
        if (this.rollback_entries.filter(entry => entry !== null && expected_position.distance(entry) <= max_rollback_point_distance).length > 0) {
            callback(true);
            console.log("TRUE : Can rollback!");
            return;
        }

        // Set active sync data
        this.clear_entries();
        this.active_sync_data = {
            position: expected_position,
            tries_left: max_sync_tries,
            max_dist: max_sync_distance,
            callback: callback
        }
    }

    attempt_sync(current_position : Vector) {
        if (this.active_sync_data !== null) {
            this.active_sync_data.tries_left--;

            if (this.active_sync_data.position.distance(current_position) <= this.active_sync_data.max_dist) {
                this.active_sync_data.callback(true);
                console.log("TRUE : Synced pos in world!");
                this.active_sync_data = null;
                return;
            }

            if (this.active_sync_data.tries_left <= 0) {
                this.active_sync_data.callback(false);
                console.log("FALSE : No more tries!");
                this.active_sync_data = null;
                return;
            }
        }
    }
}