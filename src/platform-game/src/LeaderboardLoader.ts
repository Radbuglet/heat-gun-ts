import { ILbDBRoot } from "../../helpers-common/LeaderboardScheme";

export class LeaderboardLoader {
    public data : ILbDBRoot = null;

    constructor(private url : string) {
        this.load();
    }

    load() {
        this.data = null;
        fetch(this.url).then(response => {
            if (response.status !== 200) throw "Invalid response code!";

            response.json().then(lb_data => {
                this.data = lb_data;
            });
        }).catch(error => {
            throw error;
        });
    }

    has_loaded() {
        return this.data !== null;
    }
}