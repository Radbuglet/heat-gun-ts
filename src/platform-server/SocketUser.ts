import { Socket } from "socket.io";
import { ServerPlayer, IPacket } from "./ServerPlayer";
import { ServerWorld } from "./ServerWorld";
import { ITextComponent } from "../helpers-common/helpers/ITextComponent";
import { LAGSWITCH_SVTOCL } from "../config/Config";
import { PacketNames, decode_packet_name } from "../helpers-common/ProtocolDefs";
import { Leaderboard } from "./Leaderboard";

export class SocketUser {
    public player : ServerPlayer = null;

    constructor(private socket : Socket, private server_world : ServerWorld) {

    }

    // World modification
    play(username : string) {
        console.log("A user has joined with the username ", username);

        // Make sure to reset their queue level due to race conditions or other things that could make it non zero.
        this.queuing_packets_level = 0;

        this.server_world.wrapped_queue_packets(() => {
            // Broadcast message
            this.server_world.broadcast_message([]);
            this.server_world.broadcast_message([
                {
                    color: "#ee1a1a",
                    text: username
                },
                {
                    color: "gray",
                    text: " entered the area"
                }
            ]);
            this.server_world.broadcast_message([]);

            // Create the player object and spawn it
            this.player = new ServerPlayer(this, this.server_world, username);
            this.player.user.queue_packets();
            this.player.spawn();

            // Tell the client to change their state (needs name, uuid and spawn location)
            this.player.user.notify_statechange__to_game();

            // Adds player to world, replicating all of it's information
            this.server_world.add_player(this.player);
        });
    }

    remove_player_from_world() {
        this.server_world.remove_player(this.player);
        this.player = null;
        console.log("Player removed!");
    }


    // Gamestate own client notification methods
    notify_statechange__to_game() {
        this.send_packet(PacketNames.state_change__to_game, this.player.uuid, this.player.name, this.player.position.serialize());
    }
    
    notify_kill_and_remove(personal_message : ITextComponent[], socket_disconnected = false) {
        if (!socket_disconnected) this.send_packet_noqueue(PacketNames.state_change__to_death, personal_message);
        Leaderboard.log_record(this.player.name, this.player.total_energy);

        this.remove_player_from_world();
    }


    /*
        Helpers
    */

    private queuing_packets_level : number = 0;
    private send_queue : IPacket[] = [];

    is_playing() : boolean {
        return this.player !== null;
    }

    queue_packets() {
        this.queuing_packets_level++;
    }

    unqueue_packets() {
        this.queuing_packets_level--;
        if (this.queuing_packets_level < 0) {
            console.trace();
            throw "Unqueue packets called when they weren't being queued";
        }

        if (this.queuing_packets_level === 0 && this.send_queue.length > 0) {
            this.__send_packet_clump(this.send_queue);
            this.send_queue = [];
        }
    }

    send_packet(evt_name : PacketNames, ...args) {
        if (this.queuing_packets_level > 0) {
            this.send_queue.push({
                evt_name, args
            });
        } else {
            this.send_packet_noqueue(evt_name, ...args);
        }
    }

    send_packet_noqueue(evt_name : PacketNames, ...args) {
        this.__send_packet_clump([{ evt_name, args }]);
    }

    private __send_packet_clump(pkts : IPacket[]) {
        const clumped_pkt = [];
        pkts.forEach(pkt => {
            clumped_pkt.push([pkt.evt_name].concat(pkt.args));
        })
        setTimeout(() => {
            if (this.socket !== null) this.socket.emit("pktclump", clumped_pkt);
        }, LAGSWITCH_SVTOCL);
    }
}