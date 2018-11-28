import LerpNum from "./LerpNum";
import { round, todeg } from "./Math";

export default class Vector {
    private x : LerpNum;
    private y : LerpNum;
  
    private non_inherited_mutlistener : (vector : Vector) => void = null;

    constructor(x : number, y : number = null) {
      if (y === null) y = x;

      this.x = new LerpNum(x, x, 0);
      this.y = new LerpNum(y, y, 0);
    }

    // Getters and setters
    getX() : number {
      return round(this.x.getCurrentVal(), 4);
    }

    getY() : number {
      return round(this.y.getCurrentVal(), 4);
    }

    setX(x : number, duration : number = 0) {
      this.x = new LerpNum(this.getX(), x, duration);
      this.notify_modification();
    }

    setY(y : number, duration : number = 0) {
      this.y = new LerpNum(this.getY(), y, duration);
      this.notify_modification();
    }

    setPair(x : number, y : number, duration : number = 0) {
      this.setX(x, duration);
      this.setY(y, duration);
      this.notify_modification();
    }

    copyOther(vec : Vector) {
      this.setPair(vec.getX(), vec.getY());
    }

    // Clone
    clone() {
      return new Vector(this.getX(), this.getY());
    }

    // Arithmetic
    mutnegate() {
      this.setX(-this.getX());
      this.setY(-this.getY());

      this.notify_modification();
      return this;
    }

    negate() {
      return this.clone().mutnegate();
    }

    mutadd(other : Vector) {
      this.setX(this.getX() + other.getX());
      this.setY(this.getY() + other.getY());

      this.notify_modification();
      return this;
    }

    add(other : Vector) {
      return this.clone().mutadd(other);
    }

    mutsub(other : Vector) {
      this.mutadd(other.clone().negate());
      this.notify_modification();
      return this;
    }

    sub(other : Vector) {
      return this.clone().mutsub(other);
    }

    mutmult(other : Vector) {
      this.setX(this.getX() * other.getX());
      this.setY(this.getY() * other.getY());

      this.notify_modification();
      return this;
    }

    mult(other : Vector) {
      return this.clone().mutmult(other);
    }

    mutdiv(other : Vector) {
      this.setX(this.getX() / other.getX());
      this.setY(this.getY() / other.getY());

      this.notify_modification();
      return this;
    }

    div(other : Vector) {
      return this.clone().mutdiv(other);
    }

    len() {
      return Math.sqrt(this.getX() * this.getX() + this.getY() * this.getY());
    }

    mutnormalize() {
      const l = this.len();
      if (l > 0) {
        this.setX(this.getX() / l);
        this.setY(this.getY() / l);
      }

      this.notify_modification();
      return this;
    }

    normalized() {
      return this.clone().mutnormalize();
    }

    roundmut(acc : number) {
      this.setX(round(this.getX(), acc));
      this.setY(round(this.getY(), acc));

      this.notify_modification();
      return this;
    }

    round(acc : number) {
      return this.clone().roundmut(acc || 1);
    }

    mutfloor() {
      this.setX(Math.floor(this.getX()));
      this.setY(Math.floor(this.getY()));

      this.notify_modification();
      return this;
    }

    floor() {
      return this.clone().mutfloor();
    }

    distance(other : Vector) {
      var a = this.getX() - other.getX();
      var b = this.getY() - other.getY();

      return Math.sqrt(a * a + b * b);
    }

    getdeg() {
      return todeg(this.getrad());
    }

    getrad() {
      return Math.atan2(this.getX(), this.getY());
    }

    serialize() : ISerializedVector {
      return { x: this.getX(), y: this.getY() }
    }

    private notify_modification() {
      if (this.non_inherited_mutlistener !== null) this.non_inherited_mutlistener(this);
    }

    is_lerping() : boolean {
      return this.x.is_lerping() || this.y.is_lerping();
    }

    bind_owninstance_modification_listener(listener : (vector : Vector) => void) : Vector {
      if (this.non_inherited_mutlistener !== null) throw Error("Not allowed to bind two modification listeners to the same instance!");

      this.non_inherited_mutlistener = listener;
      return this;
    }

    isolate_x() : Vector {
      return new Vector(this.getX(), 0);
    }

    isolate_y() : Vector {
      return new Vector(this.getY(), 0);
    }

    toString() : string {
      return this.getX() + " " + this.getY();
    }

    static deserialize(obj : ISerializedVector) {
      return new Vector(obj.x, obj.y);
    }

    static is_valid_serialized_vector(obj : ISerializedVector) {
      return typeof obj === "object" &&
        typeof obj.x === "number" && typeof obj.y === "number";
    }

    static from_angle(angle : number) {
      return new Vector(
        Math.sin(angle),
        Math.cos(angle)
      );
    }
}

export interface ISerializedVector {
  x : number, y : number
}