export enum ExecMode {
    client, server
}

export class RunPlatform {
    static platform : ExecMode;

    static set_platform(platform : ExecMode) {
        this.platform = platform;
    }

    static is_client() : boolean {
        return this.platform === ExecMode.client;
    }

    static is_server() : boolean {
        return this.platform === ExecMode.server;
    }
}