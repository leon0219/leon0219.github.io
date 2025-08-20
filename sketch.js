let animals = [];
let foods = [];
let attractionRadius = 100;
let foodSpawnInterval = 240;
let frameCounter = 0;

function setup() {
  createCanvas(windowWidth, windowHeight); // Canvas adaptativo
  for (let i = 0; i < 60; i++) {
    animals.push(new Animal(random(width), random(height)));
  }
}

function draw() {
  background(30);

  // Generar comida periódicamente
  frameCounter++;
  if (frameCounter % foodSpawnInterval == 0) {
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
}
