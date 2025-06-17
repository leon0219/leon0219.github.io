let currentScene = 1;

let animals = [];
let foods = [];
const attractionRadius = 100;
const foodSpawnInterval = 60;
let frameCounter = 0;
const COMPONENT_COLORS = ['red', 'green', 'blue', 'yellow', 'magenta'];
const MAX_FOOD = 50;

function setup() {
  createCanvas(windowWidth, windowHeight);
  initScene1();
  initScene2();
}

function draw() {
  background(30);
  if (currentScene === 1) {
    drawScene1();
  } else {
    drawScene2();
  }
}

function mousePressed() {
  // Cambia de escena al tocar/click en el canvas
  currentScene = (currentScene === 1) ? 2 : 1;
}

// --- ESCENA 1: círculos moviéndose aleatoriamente ---

let circles = [];

function initScene1() {
  circles = [];
  for (let i = 0; i < 20; i++) {
    circles.push({
      pos: createVector(random(width), random(height)),
      vel: p5.Vector.random2D().mult(2),
      r: random(15, 30),
      col: color(random(100, 255), random(100, 255), random(100, 255))
    });
  }
}

function drawScene1() {
  for (let c of circles) {
    c.pos.add(c.vel);
    // rebote en bordes
    if (c.pos.x < c.r || c.pos.x > width - c.r) c.vel.x *= -1;
    if (c.pos.y < c.r || c.pos.y > height - c.r) c.vel.y *= -1;
    fill(c.col);
    noStroke();
    ellipse(c.pos.x, c.pos.y, c.r * 2);
  }
}

// --- ESCENA 2: simulación de animales y comida ---

function initScene2() {
  animals = [];
  foods = [];
  frameCounter = 0;
  for (let i = 0; i < 10; i++) {
    animals.push(new Animal(random(width), random(height)));
  }
}

function drawScene2() {
  frameCounter++;
  if (frameCounter % foodSpawnInterval === 0 && foods.length < MAX_FOOD) {
    foods.push(new Food(random(width), random(height)));
  }

  for (let i = foods.length - 1; i >= 0; i--) {
    foods[i].update();
    foods[i].show();
    if (foods[i].lifespan <= 0) {
      foods.splice(i, 1);
    }
  }

  for (let a of animals) {
    a.behaviors(animals, foods);
    a.update();
    a.borders();
    a.show();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- CLASES: Food, Component, Animal (copiados de tu código) ---

class Food {
  constructor(x, y) {
    this.basePos = createVector(x, y);
    this.pos = this.basePos.copy();
    this.offset = p5.Vector.random2D().mult(random(1, 3));
    this.type = floor(random(COMPONENT_COLORS.length));
    this.color = COMPONENT_COLORS[this.type];
    this.size = 5;
    this.floatAngle = random(TWO_PI);
    this.lifespan = 600; // frames
  }

  update() {
    this.floatAngle += 0.1;
    let wobble = sin(this.floatAngle) * 1.5;
    this.offset.rotate(radians(wobble));
    this.pos = p5.Vector.add(this.basePos, this.offset);
    this.lifespan--;
  }

  show() {
    noStroke();
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}

class Component {
  constructor(type, color) {
    this.type = type;
    this.color = color;
    this.offset = p5.Vector.random2D().mult(random(5, 12));
    this.floatAngle = random(TWO_PI);
    this.targetOffset = null;
  }

  updateFloating() {
    this.floatAngle += 0.05;
    let wobble = sin(this.floatAngle) * 1.5;
    this.offset.rotate(radians(wobble));
  }

  moveToTarget() {
    if (!this.targetOffset) return;
    let dir = p5.Vector.sub(this.targetOffset, this.offset);
    this.offset.add(dir.mult(0.2));
  }

  drawAt(cx, cy) {
    noStroke();
    fill(this.color);
    ellipse(cx + this.offset.x, cy + this.offset.y, 5);
  }
}

class Animal {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector(0, 0);
    this.r = 20;
    this.baseSpeed = 2.5;
    this.maxspeed = this.baseSpeed;
    this.maxforce = 0.05;
    this.components = [];
    this.collectedTypes = new Set();
    this.evolved = false;
    this.evolveTimer = 0;
    this.finalColor = color(random(255), random(255), random(255));
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  behaviors(others, foods) {
    if (this.evolved) return;

    let sep = this.separate(others);
    sep.mult(1.5);
    this.applyForce(sep);

    let closest = null;
    let minDist = attractionRadius;

    for (let f of foods) {
      if (this.collectedTypes.has(f.type)) continue;
      let d = p5.Vector.dist(this.position, f.pos);
      if (d < minDist) {
        minDist = d;
        closest = f;
      }
    }

    if (closest !== null) {
      let seek = this.seek(closest.pos);
      this.applyForce(seek);

      if (minDist < this.r + closest.size / 2) {
        this.collectedTypes.add(closest.type);
        this.components.push(new Component(closest.type, closest.color));
        foods.splice(foods.indexOf(closest), 1);
      }
    }

    if (this.collectedTypes.size === COMPONENT_COLORS.length && !this.evolved) {
      this.evolveTimer = 60;
      this.evolved = true;

      // Forma de S (bien ajustada)
      const spacing = 5;
      const sOffsets = [
        createVector(-spacing, -spacing * 1.5),
        createVector(0, -spacing * 1.5),
        createVector(spacing, -spacing),
        createVector(-spacing, 0),
        createVector(0, spacing),
      ];
      for (let i = 0; i < this.components.length; i++) {
        this.components[i].targetOffset = sOffsets[i];
      }
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
    if (this.evolved && this.evolveTimer > 0) {
      this.evolveTimer--;
      return;
    }
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  show() {
    // Cuerpo
    if (this.evolved && this.evolveTimer === 0) {
      fill(this.finalColor);
    } else {
      fill(100, 200, 255);
    }
    stroke(255);
    ellipse(this.position.x, this.position.y, this.r * 2);

    // Componentes internos
    for (let comp of this.components) {
      if (!this.evolved || this.evolveTimer > 0) {
        comp.updateFloating();
      } else {
        comp.moveToTarget();
      }
      comp.drawAt(this.position.x, this.position.y);
    }
  }

  borders() {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
  }
}
