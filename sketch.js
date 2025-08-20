let animals = [];
let foods = [];
let poisons = [];
const attractionRadius = 100;
const foodSpawnInterval = 100;
const poisonSpawnInterval = 600;
let frameCounter = 0;

// Pozo circular con canales laterales ajustables
let pozo = {
  center: null,
  radius: 150,
  entrada: { w: 0, h: 90 },
  salida: { w: 0, h: 90 }
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  pozo.center = createVector(width / 2, height / 2);
  updateCanales();

  for (let i = 0; i < 60; i++) {
    let pos = randomInPozo();
    animals.push(new Animal(pos.x, pos.y));
  }
}

function draw() {
  background(50); // fondo fuera del pozo
  drawPozo();

  frameCounter++;

  // Generar comida normal
  if (frameCounter % foodSpawnInterval === 0) {
    let pos = randomInPozo();
    let f = new Food(pos.x, pos.y);
    if (isInPozo(f.pos.x, f.pos.y)) foods.push(f);
  }

  // Generar comida venenosa
  if (frameCounter % poisonSpawnInterval === 0) {
    let pos = randomInPozo();
    let p = new PoisonFood(pos.x, pos.y);
    if (isInPozo(p.pos.x, p.pos.y)) poisons.push(p);
  }

  // Actualizar y mostrar comida normal
  for (let i = foods.length - 1; i >= 0; i--) {
    let f = foods[i];
    if (!isInPozo(f.pos.x, f.pos.y)) {
      foods.splice(i, 1);
      continue;
    }
    f.update();
    f.show();
    if (f.size <= 0) foods.splice(i, 1);
  }

  // Actualizar y mostrar comida venenosa
  for (let i = poisons.length - 1; i >= 0; i--) {
    let p = poisons[i];
    if (!isInPozo(p.pos.x, p.pos.y)) {
      poisons.splice(i, 1);
      continue;
    }
    p.update();
    p.show();
    if (p.size <= 0) poisons.splice(i, 1);
  }

  // Actualizar y mostrar animales
  for (let a of animals) {
    a.behaviors(animals, foods, poisons);
    a.update();
    a.show();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pozo.center.set(width / 2, height / 2);
  updateCanales();
}

// ======== AJUSTE DE CANALES ========
function updateCanales() {
  pozo.entrada.h = pozo.radius * 0.6;
  pozo.salida.h = pozo.radius * 0.6;

  pozo.entrada.w = pozo.center.x - pozo.radius;
  pozo.salida.w = width - (pozo.center.x + pozo.radius);
}

// ======== POZO ========
function drawPozo() {
  fill(30);
  noStroke();

  // Canal izquierdo (entrada)
  rect(0, pozo.center.y - pozo.entrada.h / 2,
       pozo.entrada.w + pozo.radius, pozo.entrada.h);

  // Canal derecho (salida) con superposición
  rect(pozo.center.x + pozo.radius - 20, pozo.center.y - pozo.salida.h / 2,
       pozo.salida.w + 20, pozo.salida.h);

  // Círculo principal
  ellipse(pozo.center.x, pozo.center.y, pozo.radius * 2, pozo.radius * 2);
}

// ======== FUNCIONES DE VALIDACIÓN ========
function randomInPozo() {
  let x, y;
  let inside = false;
  while (!inside) {
    x = random(width);
    y = random(height);
    if (isInPozo(x, y)) inside = true;
  }
  return createVector(x, y);
}

function isInPozo(x, y) {
  let d = dist(x, y, pozo.center.x, pozo.center.y);
  let inEntrada = x >= 0 && x <= pozo.center.x &&
                  y > pozo.center.y - pozo.entrada.h / 2 &&
                  y < pozo.center.y + pozo.entrada.h / 2;
  let inSalida = x >= pozo.center.x && x <= width &&
                 y > pozo.center.y - pozo.salida.h / 2 &&
                 y < pozo.center.y + pozo.salida.h / 2;
  return d < pozo.radius || inEntrada || inSalida;
}

// ======== CLASE ANIMAL ========
class Animal {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector(0, 0);
    this.baseR = 6;
    this.r = this.baseR;
    this.sizeFactor = 1.0;
    this.baseSpeed = 2.5;
    this.maxspeed = this.baseSpeed;
    this.maxforce = 0.05;
    this.targetFood = null;
    this.poisoned = false;
    this.colorFactor = 0;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  behaviors(others, foods, poisons) {
    let sep = this.separate(others);
    sep.mult(1.5);
    this.applyForce(sep);

    let closestFood = null;
    let closestPoison = null;
    let minFoodDist = attractionRadius;
    let minPoisonDist = attractionRadius;
    let competitors = 0;

    for (let f of foods) {
      let d = p5.Vector.dist(this.position, f.pos);
      if (d < minFoodDist) {
        minFoodDist = d;
        closestFood = f;
      }
    }

    for (let p of poisons) {
      let d = p5.Vector.dist(this.position, p.pos);
      if (d < minPoisonDist) {
        minPoisonDist = d;
        closestPoison = p;
      }
    }

    if (closestFood !== null) {
      for (let o of others) {
        if (o !== this && p5.Vector.dist(o.position, closestFood.pos) < attractionRadius) competitors++;
      }
      this.maxspeed = this.baseSpeed / sqrt(competitors + 1);
      this.applyForce(this.seek(closestFood.pos));

      if (minFoodDist < this.r + closestFood.size / 2 && closestFood.size > 0) {
        closestFood.size -= 2;
        this.targetFood = closestFood;
        this.poisoned = false;
      }
    } else if (closestPoison !== null) {
      this.applyForce(this.seek(closestPoison.pos));
      if (minPoisonDist < this.r + closestPoison.size / 2 && closestPoison.size > 0) {
        closestPoison.size -= 2;
        this.targetFood = closestPoison;
        this.poisoned = true;
      }
    } else {
      this.maxspeed = this.baseSpeed;
      this.targetFood = null;
    }

    let targetFactor = this.poisoned ? 0.5 : 1.0;
    this.sizeFactor += (targetFactor - this.sizeFactor) * 0.05;
    this.r = this.baseR * this.sizeFactor;

    let targetColor = this.poisoned ? 1.0 : 0.0;
    this.colorFactor += (targetColor - this.colorFactor) * 0.05;
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
    if (count > 0) steer.div(count);
    if (steer.mag() > 0) {
      steer.setMag(this.maxspeed);
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

    let d = dist(this.position.x, this.position.y, pozo.center.x, pozo.center.y);
    let inEntrada = this.position.x >= 0 && this.position.x <= pozo.center.x &&
                    this.position.y > pozo.center.y - pozo.entrada.h / 2 &&
                    this.position.y < pozo.center.y + pozo.entrada.h / 2;
    let inSalida = this.position.x >= pozo.center.x && this.position.x <= width &&
                   this.position.y > pozo.center.y - pozo.salida.h / 2 &&
                   this.position.y < pozo.center.y + pozo.salida.h / 2;

    if (!(d < pozo.radius || inEntrada || inSalida)) {
      let dir = p5.Vector.sub(pozo.center, this.position);
      dir.setMag(this.maxspeed);
      this.velocity = dir;
      this.position.add(this.velocity);
    }
  }

  show() {
    let c = lerpColor(color(100, 200, 255), color(255, 100, 100), this.colorFactor);
    fill(c);
    stroke(255);
    ellipse(this.position.x, this.position.y, this.r * 2, this.r * 2);
  }
}

// ======== CLASES COMIDA ========
class Food {
  constructor(x, y) {
    this.size = random(6, 50);
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

class PoisonFood extends Food {
  show() {
    noStroke();
    fill(255, 0, 0);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}

