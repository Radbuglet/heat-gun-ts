export default class LerpNum {
    private duration : number;
    private start_time : number;

    constructor(private start_val : number, private end_val : number, time : number, start_in : number = 0) {
      this.start_time = Date.now() + start_in;
      this.duration = time;
    }

    is_lerping() : boolean {
      return this.start_time + this.duration >= Date.now();
    }

    getCurrentVal() : number {
      if (this.duration === 0) {
        return this.end_val;
      }

      if (Date.now() < this.start_time) {
        return this.start_val;
      }

      return ((this.end_val - this.start_val) / this.duration) * Math.min(Date.now() - this.start_time, this.duration) + this.start_val;
    }
  }