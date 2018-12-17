import { PacketNames } from "../../helpers-common/ProtocolDefs";

export class ClientSocket {
    private handlers : Map<PacketNames, Handler[]> = new Map();

    constructor(public underlying_socket : SocketIOClient.Socket) {
        this.underlying_socket.on("pktclump", (data : [[any]]) => {
            data.forEach(packet => {
                const evtname = packet.shift();
                console.log(evtname, "->", ...packet);
                if (this.handlers.has(evtname)) {
                    const handler_list = this.handlers.get(evtname);
                    // I am doing it this way because handlers are able to register other handlers which updates the handler list
                    // (eg client registering more handlers after recieving gamestate change) and I'm not sure how .each works in that regard.
                    for (let index = 0; index < handler_list.length; index++) {
                        handler_list[index].cb(...packet);
                    }
                }
            });

            console.log("==================");
        });
    }

    emit(name : PacketNames, ...args) {
        this.underlying_socket.emit((name as number).toString(), ...args);
    }

    clump_on(name : PacketNames, removal_group : number, cb : (...args) => void) {
        if (!this.handlers.has(name)) this.handlers.set(name, []);

        this.handlers.get(name).push({
            name, removal_group, cb
        });
    }

    unregister_group(removal_group : number) {
        this.handlers.forEach((events, category) => {
            this.handlers.set(category, events.filter(evt => evt.removal_group !== removal_group));
        });
    }
}

interface Handler {
    name : PacketNames
    removal_group : number
    cb : (...args) => void
}