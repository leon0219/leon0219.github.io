let scene = 1;

// ----- ESCENA 1 -----
let animals1 = [];
let foods1 = [];
const attractionRadius = 100;
const foodSpawnInterval = 100;
let frameCounter1 = 0;

class Animal1 {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector(0, 0);
    this.r = 18;  // un poco más grande
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

      this.maxspeed = this.baseSpeed / Math.sqrt(competitors + 1);

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

class Food1 {
  constructor(x, y) {
    this.size = random(6, 15); // más pequeño
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

// ----- ESCENA 2 -----
const colors2 = [
  '#E74C3C', // rojo
  '#3498DB', // azul
  '#2ECC71', // verde
  '#F1C40F', // amarillo
  '#9B59B6'  // morado
];
const pointCount2 = 50;
const pointRadius2 = 5;
const animalRadius2 = 20;
const floatSpeed2 = 0.7;

let animals2 = [];
let points2 = [];

class Animal2 {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D().mult(1.5);
    this.acceleration = createVector(0, 0);
    this.r = animalRadius2;
    this.collectedPoints = [];
    this.color = color(100, 200, 255);
    this.stopped = false;
    this.SForming = false;
    this.SPointsPos = [];
    this.SMoveTimer = 0;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  behaviors(points) {
    if (this.stopped) {
      if (this.SForming) {
        this.SMoveTimer++;
        if (this.SMoveTimer < 100) {
          for (let i = 0; i < this.collectedPoints.length; i++) {
            let target = this.SPointsPos[i];
            let pt = this.collectedPoints[i];
            let dir = p5.Vector.sub(target, pt.position);
            dir.mult(0.1);
            pt.velocity.add(dir);
            pt.velocity.limit(floatSpeed2);
            pt.position.add(pt.velocity);
          }
        } else {
          this.stopped = false;
          this.SForming = false;
          this.collectedPoints = [];
          this.color = color(100, 200, 255);
        }
      }
      return;
    }

    this.velocity.add(this.acceleration);
    this.velocity.limit(2);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    if (this.position.x < this.r) this.velocity.x *= -1;
    if (this.position.x > width - this.r) this.velocity.x *= -1;
    if (this.position.y < this.r) this.velocity.y *= -1;
    if (this.position.y > height - this.r) this.velocity.y *= -1;

    for (let pt of points) {
      if (this.collectedPoints.length === colors2.length) break;
      let d = p5.Vector.dist(this.position, pt.position);
      if (d < this.r + pt.r) {
        if (!this.collectedPoints.some(cp => cp.color === pt.color)) {
          this.collectedPoints.push(pt);
          pt.collected = true;
          pt.velocity.set(0, 0);
          pt.position = pt.position.copy();
        }
      }
    }

    if (this.collectedPoints.length === colors2.length && !this.SForming) {
      this.stopped = true;
      this.SForming = true;
      this.color = color(255, 100, 100);

      this.SPointsPos = [];
      let spacing = pointRadius2 * 2.2;
      let center = this.position.copy();
      let offsetX = -spacing;
      let offsetY = spacing * 2;

      // Forma de S con 5 puntos
      this.SPointsPos.push(createVector(center.x + offsetX, center.y + offsetY));
      this.SPointsPos.push(createVector(center.x + offsetX, center.y + offsetY - spacing));
      this.SPointsPos.push(createVector(center.x + offsetX + spacing, center.y + offsetY - spacing));
      this.SPointsPos.push(createVector(center.x + offsetX + spacing * 2, center.y + offsetY - spacing));
      this.SPointsPos.push(createVector(center.x + offsetX + spacing * 2, center.y + offsetY));

      this.SMoveTimer = 0;
    }
  }

  show() {
    noFill();
    stroke(100, 200, 255);
    strokeWeight(3);
    ellipse(this.position.x, this.position.y, this.r * 2, this.r * 2);

    for (let pt of this.collectedPoints) {
      noStroke();
      fill(pt.color);
      ellipse(pt.position.x, pt.position.y, pt.r * 2, pt.r * 2);
    }
  }
}

class Point2 {
  constructor(x, y, color) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D().mult(floatSpeed2);
    this.r = pointRadius2;
    this.color = color;
    this.collected = false;
    this.life = frameCount + floor(random(600, 1200));
  }

  update() {
    if (!this.collected) {
      this.position.add(this.velocity);

      if (this.position.x < this.r || this.position.x > width - this.r) this.velocity.x *= -1;
      if (this.position.y < this.r || this.position.y > height - this.r) this.velocity.y *= -1;

      let randomForce = p5.Vector.random2D().mult(0.05);
      this.velocity.add(randomForce);
      this.velocity.limit(floatSpeed2);
    }
  }

  show() {
    if (!this.collected) {
      noStroke();
      fill(this.color);
      ellipse(this.position.x, this.position.y, this.r * 2, this.r * 2);
    }
  }

  isExpired(currentFrame) {
    return !this.collected && currentFrame > this.life;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  initScene1();
  initScene2();
}

function draw() {
  background(20);
  if (scene === 1) drawScene1();
  else if (scene === 2) drawScene2();
}

function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    scene = scene === 1 ? 2 : 1;
  }
}

// --- Scene 1 ---
function initScene1() {
  animals1 = [];
  foods1 = [];
  frameCounter1 = 0;
  for (let i = 0; i < 20; i++) {
    animals1.push(new Animal1(random(width), random(height)));
  }
}

function drawScene1() {
  frameCounter1++;
  if (frameCounter1 % foodSpawnInterval === 0) {
    foods1.push(new Food1(random(width), random(height)));
  }

  for (let i = foods1.length - 1; i >= 0; i--) {
    let f = foods1[i];
    f.update();
    f.show();
    if (f.size <= 0) foods1.splice(i, 1);
  }

  for (let a of animals1) {
    a.behaviors(animals1, foods1);
    a.update();
    a.borders();
    a.show();
  }
}

// --- Scene 2 ---
function initScene2() {
  animals2 = [];
  points2 = [];
  for (let i = 0; i < 10; i++) {
    animals2.push(new Animal2(random(width), random(height)));
  }
  for (let i = 0; i < pointCount2; i++) {
    let c = color(colors2[floor(random(colors2.length))]);
    points2.push(new Point2(random(width), random(height), c));
  }
}

function drawScene2() {
  for (let i = points2.length - 1; i >= 0; i--) {
    let pt = points2[i];
    pt.update();
    pt.show();
    if (pt.isExpired(frameCount)) points2.splice(i, 1);
  }

  for (let a of animals2) {
    a.behaviors(points2);
    a.show();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

