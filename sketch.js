let animals = [];
let foods = [];
let poisons = [];
const attractionRadius = 100;
const foodSpawnInterval = 50;
const poisonSpawnInterval = 500; // menos frecuente
let frameCounter = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < 60; i++) {
    animals.push(new Animal(random(width), random(height)));
  }
}

function draw() {
  background(30);

  frameCounter++;

  // Generar comida normal
  if (frameCounter % foodSpawnInterval === 0) {
    foods.push(new Food(random(width), random(height)));
  }

  // Generar comida venenosa
  if (frameCounter % poisonSpawnInterval === 0) {
    poisons.push(new PoisonFood(random(width), random(height)));
  }

  // Actualizar y mostrar comida normal
  for (let i = foods.length - 1; i >= 0; i--) {
    let f = foods[i];
    f.update();
    f.show();
    if (f.size <= 0) foods.splice(i, 1);
  }

  // Actualizar y mostrar comida venenosa
  for (let i = poisons.length - 1; i >= 0; i--) {
    let p = poisons[i];
    p.update();
    p.show();
    if (p.size <= 0) poisons.splice(i, 1);
  }

  // Mostrar y actualizar animales
  for (let a of animals) {
    a.behaviors(animals, foods, poisons);
    a.update();
    a.borders();
    a.show();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  for (let a of animals) {
    a.position.x = constrain(a.position.x, -a.r, width + a.r);
    a.position.y = constrain(a.position.y, -a.r, height + a.r);
  }
}

// === CLASE ANIMAL ===
class Animal {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector(0, 0);
    this.baseR = 6;
    this.r = this.baseR;
    this.sizeFactor = 1.0;   // factor gradual
    this.baseSpeed = 2.5;
    this.maxspeed = this.baseSpeed;
    this.maxforce = 0.05;
    this.targetFood = null;
    this.poisoned = false;
    this.colorFactor = 0;    // 0 = azul, 1 = rojo
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

    // Buscar comida normal
    for (let f of foods) {
      let d = p5.Vector.dist(this.position, f.pos);
      if (d < minFoodDist) {
        minFoodDist = d;
        closestFood = f;
      }
    }

    // Buscar comida venenosa
    for (let p of poisons) {
      let d = p5.Vector.dist(this.position, p.pos);
      if (d < minPoisonDist) {
        minPoisonDist = d;
        closestPoison = p;
      }
    }

    if (closestFood !== null) {
      for (let o of others) {
        if (o !== this && p5.Vector.dist(o.position, closestFood.pos) < attractionRadius) {
          competitors++;
        }
      }

      this.maxspeed = this.baseSpeed / sqrt(competitors + 1);
      let seek = this.seek(closestFood.pos);
      this.applyForce(seek);

      let edgeDistance = this.r + closestFood.size / 2;
      if (minFoodDist < edgeDistance && closestFood.size > 0) {
        closestFood.size -= 2;
        this.targetFood = closestFood;
        this.poisoned = false;
      }
    } 
    else if (closestPoison !== null) {
      let seek = this.seek(closestPoison.pos);
      this.applyForce(seek);

      let edgeDistance = this.r + closestPoison.size / 2;
      if (minPoisonDist < edgeDistance && closestPoison.size > 0) {
        closestPoison.size -= 2;
        this.targetFood = closestPoison;
        this.poisoned = true;
      }
    } 
    else {
      this.maxspeed = this.baseSpeed;
      this.targetFood = null;
    }

    // Actualizar sizeFactor gradualmente
    let targetFactor = this.poisoned ? 0.5 : 1.0;
    this.sizeFactor += (targetFactor - this.sizeFactor) * 0.05;
    this.r = this.baseR * this.sizeFactor;

    // Actualizar colorFactor gradualmente
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
  }

  show() {
    // Mezclar color azul-rojo según colorFactor
    let c = lerpColor(color(100,200,255), color(255,100,100), this.colorFactor);
    fill(c);
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

// === CLASES COMIDA ===
class Food {
  constructor(x, y) {
    this.size = random(5, 30);
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
