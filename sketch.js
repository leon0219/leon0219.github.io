let vehicles = [];

function setup() {
  createCanvas(800, 600);
  for (let i = 0; i < 100; i++) {
    vehicles.push(new Vehicle(random(width), random(height)));
  }
}

function draw() {
  background(51);
  for (let v of vehicles) {
    let sep = v.separate(vehicles);
    sep.mult(1.5);
    v.applyForce(sep);
    v.update();
    v.borders();
    v.display();
  }
}

class Vehicle {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector(0, 0);
    this.r = 6;
    this.maxspeed = 3;
    this.maxforce = 0.05;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  separate(vehicles) {
    let desiredSeparation = this.r * 2.5;
    let steer = createVector(0, 0);
    let count = 0;

    for (let other of vehicles) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (d > 0 && d < desiredSeparation) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.normalize();
        diff.div(d);
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
    }

    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }

    return steer;
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  display() {
    fill(127, 200);
    stroke(255);
    ellipse(this.position.x, this.position.y, this.r * 2);
  }

  borders() {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
  }
}