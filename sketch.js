let animals = [];
let foods = [];
const attractionRadius = 100;
const foodSpawnInterval = 100;
let frameCounter = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < 60; i++) {
    animals.push(new Animal(random(width), random(height)));
  }
}

function draw() {
  background(30);
  
  // Generar comida periódicamente
  frameCounter++;
  if (frameCounter % foodSpawnInterval === 0) {
    foods.push(new Food(random(width), random(height)));
  }

  // Mostrar y actualizar comida
  for (let i = foods.length - 1; i >= 0; i--) {
    let f = foods[i];
    f.update();
    f.show();
    if (f.size <= 0) {
      foods.splice(i, 1);
    }
  }

  // Mostrar y actualizar animales
  for (let a of animals) {
    a.behaviors(animals, foods);
    a.update();
    a.borders();
    a.show();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Ajustar animales dentro del área visible para evitar que queden fuera en redimensionamiento
  for (let a of animals) {
    a.position.x = constrain(a.position.x, -a.r, width + a.r);
    a.position.y = constrain(a.position.y, -a.r, height + a.r);
  }
}

// === CLASES ===

class Animal {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector(0, 0);
    this.r = 6;
    this.baseSpeed = 2.5;
    this.maxspeed = this.baseSpeed;
    this.maxforce = 0.05;
    this.targetFood = null;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  behaviors(others, foods) {
    let sep = this.separate(others);
    sep.mult(1.5);
    this.applyForce(sep);

    let closest = null;
    let minDist = attractionRadius;
    let competitors = 0;

    for (let f of foods) {
      let d = p5.Vector.dist(this.position, f.pos);
      if (d < minDist) {
        minDist = d;
        closest = f;
      }
    }

    if (closest !== null) {
      for (let o of others) {
        if (o !== this && p5.Vector.dist(o.position, closest.pos) < attractionRadius) {
          competitors++;
        }
      }

      this.maxspeed = this.baseSpeed / sqrt(competitors + 1);

      let seek = this.seek(closest.pos);
      seek.mult(1.0);
      this.applyForce(seek);

      let edgeDistance = this.r + closest.size / 2;
      if (minDist < edgeDistance && closest.size > 0) {
        closest.size -= 2;
        this.targetFood = closest;
      } else {
        this.targetFood = null;
      }
    } else {
      this.maxspeed = this.baseSpeed;
      this.targetFood = null;
    }
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.position);
    desired.setMag(this.maxspeed);
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  }

  separate(vehicles) {
    let desiredSeparation = this.r * 2.5;
    let steer = createVector(0, 0);
    let count = 0;

    for (let other of vehicles) {
      let d = p5.Vector.dist(this.position, other.position);
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
      steer.setMag(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }

    return steer;
  }

  update() {
    if (this.targetFood !== null && this.targetFood.size > 0) {
      this.acceleration.mult(0);
      this.velocity.mult(0);
      return;
    }
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  show() {
    fill(100, 200, 255);
    stroke(255);
    ellipse(this.position.x, this.position.y, this.r * 2, this.r * 2);
  }

  borders() {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
  }
}

class Food {
  constructor(x, y) {
    this.size = random(6, 20);
    this.pos = createVector(x, y);
  }

  update() {
    this.size -= 0.01;
    this.size = max(0, this.size);
  }

  show() {
    noStroke();
    fill(0, 255, 100);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}