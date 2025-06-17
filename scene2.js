const sketch = (p) => {
  const colors = [
    '#E74C3C', // rojo
    '#3498DB', // azul
    '#2ECC71', // verde
    '#F1C40F', // amarillo
    '#9B59B6'  // morado
  ];
  const pointCount = 50;
  const pointRadius = 5;  // puntos más pequeños
  const animalRadius = 20; // organismos más grandes
  const floatSpeed = 0.7;

  let animals = [];

  class Animal {
    constructor(x, y) {
      this.position = p.createVector(x, y);
      this.velocity = p5.Vector.random2D().mult(1.5);
      this.acceleration = p.createVector(0, 0);
      this.r = animalRadius;
      this.collectedPoints = [];
      this.color = p.color(100, 200, 255);
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
        // Mover puntos dentro formando S
        if (this.SForming) {
          this.SMoveTimer++;
          if (this.SMoveTimer < 100) {
            // Mover puntos hacia posiciones en S dentro animal
            for (let i = 0; i < this.collectedPoints.length; i++) {
              let target = this.SPointsPos[i];
              let pt = this.collectedPoints[i];
              let dir = p5.Vector.sub(target, pt.position);
              dir.mult(0.1);
              pt.velocity.add(dir);
              pt.velocity.limit(floatSpeed);
              pt.position.add(pt.velocity);
            }
          } else {
            // Después de animar S, reanuda movimiento
            this.stopped = false;
            this.SForming = false;
            this.collectedPoints = [];
            this.color = p.color(100, 200, 255);
          }
        }
        return;
      }

      // Mover organismo
      this.velocity.add(this.acceleration);
      this.velocity.limit(2);
      this.position.add(this.velocity);
      this.acceleration.mult(0);

      // Rebotar en bordes
      if (this.position.x < this.r) this.velocity.x *= -1;
      if (this.position.x > p.width - this.r) this.velocity.x *= -1;
      if (this.position.y < this.r) this.velocity.y *= -1;
      if (this.position.y > p.height - this.r) this.velocity.y *= -1;

      // Buscar puntos cercanos
      for (let pt of points) {
        if (this.collectedPoints.length === colors.length) break; // ya tiene todos
        let d = p5.Vector.dist(this.position, pt.position);
        if (d < this.r + pt.r) {
          // Si punto de color no está ya recogido y colores no repetidos
          if (!this.collectedPoints.some(cp => cp.color === pt.color)) {
            this.collectedPoints.push(pt);
            pt.collected = true;
            pt.velocity.set(0, 0);
            pt.position = pt.position.copy(); // fija posición por ahora
          }
        }
      }

      // Revisar si ya tiene todos los colores
      if (this.collectedPoints.length === colors.length && !this.SForming) {
        this.stopped = true;
        this.SForming = true;
        this.color = p.color(255, 100, 100);

        // Calcular posiciones para la S dentro del organismo (pegadas y juntas)
        this.SPointsPos = [];
        let spacing = pointRadius * 2.2;
        // Crear la S usando 5 puntos:
        // 1 y 2 vertical abajo a arriba,
        // 3 y 4 horizontal izquierda a derecha,
        // 5 vertical arriba a abajo

        let center = this.position.copy();
        let offsetX = -spacing;
        let offsetY = spacing * 2;

        // Posiciones relativas para formar S (orden en collectedPoints)
        this.SPointsPos.push(p.createVector(center.x + offsetX, center.y + offsetY));
        this.SPointsPos.push(p.createVector(center.x + offsetX, center.y + offsetY - spacing));
        this.SPointsPos.push(p.createVector(center.x + offsetX + spacing, center.y + offsetY - spacing));
        this.SPointsPos.push(p.createVector(center.x + offsetX + spacing * 2, center.y + offsetY - spacing));
        this.SPointsPos.push(p.createVector(center.x + offsetX + spacing * 2, center.y + offsetY));

        // Si hay más de 5 puntos, se ajusta, pero en este caso solo 5 colores.

        this.SMoveTimer = 0;
      }
    }

    show() {
      p.noFill();
      p.stroke(100, 200, 255);
      p.strokeWeight(3);
      p.ellipse(this.position.x, this.position.y, this.r * 2, this.r * 2);

      // Dibujar puntos dentro
      for (let pt of this.collectedPoints) {
        p.noStroke();
        p.fill(pt.color);
        p.ellipse(pt.position.x, pt.position.y, pt.r * 2, pt.r * 2);
      }
    }
  }

  class Point {
    constructor(x, y, color) {
      this.position = p.createVector(x, y);
      this.velocity = p5.Vector.random2D().mult(floatSpeed);
      this.r = pointRadius;
      this.color = color;
      this.collected = false;
      this.life = p.frameCount + p.floor(p.random(600, 1200)); // desaparece en 10-20s aprox
    }

    update() {
      if (!this.collected) {
        this.position.add(this.velocity);

        // Rebotar en bordes
        if (this.position.x < this.r || this.position.x > p.width - this.r) this.velocity.x *= -1;
        if (this.position.y < this.r || this.position.y > p.height - this.r) this.velocity.y *= -1;

        // Pequeña aleatoriedad para simular fluido
        let randomForce = p5.Vector.random2D().mult(0.05);
        this.velocity.add(randomForce);
        this.velocity.limit(floatSpeed);
      }
    }

    show() {
      if (!this.collected) {
        p.noStroke();
        p.fill(this.color);
        p.ellipse(this.position.x, this.position.y, this.r * 2, this.r * 2);
      }
    }

    isExpired(currentFrame) {
      return !this.collected && currentFrame > this.life;
    }
  }

  let points = [];

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    animals = [];
    points = [];

    for (let i = 0; i < 10; i++) {
      animals.push(new Animal(p.random(p.width), p.random(p.height)));
    }
    for (let i = 0; i < pointCount; i++) {
      const c = p.color(colors[p.floor(p.random(colors.length))]);
      points.push(new Point(p.random(p.width), p.random(p.height), c));
    }
  };

  p.draw = () => {
    p.background(20);

    for (let i = points.length - 1; i >= 0; i--) {
      let pt = points[i];
      pt.update();
      pt.show();
      if (pt.isExpired(p.frameCount)) points.splice(i, 1);
    }

    for (let a of animals) {
      a.behaviors(points);
      a.show();
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};
