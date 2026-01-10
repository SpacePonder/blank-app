window.onload = function() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const pHealthEl = document.getElementById('pIntegrity');
  const eHealthEl = document.getElementById('eIntegrity');
  const scoreEl = document.getElementById('score');
  const gameOverUI = document.getElementById('game-over');
  const weapons = [document.getElementById('wep1'), document.getElementById('wep2'), document.getElementById('wep3')];

  const BIT_SPACING_V = 11;
  const BIT_SPACING_H = 15;
  const PROJECTILE_SPEED = 14;
  const FIRE_RATE = 4;
  const HARVEST_SPEED = 0.12;

  let score = 0;
  let isGameOver = false;
  let frameCount = 0;
  let currentWeapon = 1;
  let mouse = { x: 450, y: 250, down: false };
  let gridOffset = 0;

  function drawGrid() {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    gridOffset = (gridOffset + 0.5) % 40;

    // Vertical lines
    for (let x = gridOffset; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  class Bit {
    constructor(x, y, bit, owner) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.bit = bit;
      this.owner = owner;
      this.state = 'idle';
      this.active = true;
      this.isBombHead = false;
      this.isShieldHead = false;
      this.scatterTimer = 0;
      this.shieldIndex = 0;
      this.isLarge = false;
    }

    update(targetSlotX = this.x, targetSlotY = this.y) {
      if (this.state === 'projectile') {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -200 || this.x > 1100 || this.y < -100 || this.y > 600) {
          this.active = false;
        }

        if (this.owner === 'player') {
          enemy.bits.forEach((eBit, idx) => {
            if (eBit.active && eBit.state === 'idle') {
              const dx = this.x - eBit.x;
              const dy = this.y - eBit.y;
              if (dx*dx + dy*dy < 144) {
                if (this.isBombHead) {
                  this.explode();
                  this.active = false;
                } else {
                  score += 10;
                  scoreEl.innerText = "SCORE: " + score;
                  eBit.state = 'harvesting';
                  eBit.owner = 'player';
                  player.bits.push(eBit);
                  enemy.bits.splice(idx, 1);
                  this.active = false;
                }
              }
            }
          });
        } else {
          player.bits.forEach(pBit => {
            if (pBit.active && (pBit.state === 'idle' || pBit.state === 'shield')) {
              const dx = this.x - pBit.x;
              const dy = this.y - pBit.y;
              if (dx*dx + dy*dy < 144) {
                pBit.active = false;
                this.active = false;
              }
            }
          });
        }
      } else if (this.state === 'shield') {
        const tx = player.x + 60;
        const ty = player.y + (this.shieldIndex * BIT_SPACING_V);
        this.x += (tx - this.x) * 0.2;
        this.y += (ty - this.y) * 0.2;
      } else if (this.state === 'harvesting') {
        this.x += (targetSlotX - this.x) * HARVEST_SPEED;
        this.y += (targetSlotY - this.y) * HARVEST_SPEED;
        if (Math.sqrt((targetSlotX-this.x)**2 + (targetSlotY-this.y)**2) < 15) {
          this.state = 'idle';
          this.isLarge = false;
        }
      } else {
        if (this.scatterTimer > 0) {
          this.x += this.vx; this.y += this.vy;
          this.vx *= 0.95; this.vy *= 0.95;
          this.scatterTimer--;
        } else {
          this.x += (targetSlotX - this.x) * 0.15;
          this.y += (targetSlotY - this.y) * 0.15;
        }
      }
    }

    explode() {
      if (enemy.word === "TROJAN") {
        let harvestedCount = 0;
        for (let i = enemy.bits.length - 1; i >= 0; i--) {
          const eBit = enemy.bits[i];
          if (eBit.active && eBit.state === 'idle' && harvestedCount < 8) {
            eBit.state = 'harvesting';
            eBit.owner = 'player';
            player.bits.push(eBit);
            enemy.bits.splice(i, 1);
            harvestedCount++;
          }
        }
      } else {
        let destructionCount = 0;
        for (let i = enemy.bits.length - 1; i >= 0; i--) {
          const eBit = enemy.bits[i];
          const dx = eBit.x - this.x;
          const dy = eBit.y - this.y;
          if (eBit.active && eBit.state === 'idle' && dx*dx + dy*dy < 3600 && destructionCount < 8) {
            eBit.active = false;
            destructionCount++;
          }
        }
      }

      const allBits = [...player.bits, ...enemy.bits];
      allBits.forEach(bit => {
        if (!bit.active || bit.state === 'projectile') return;
        const dx = bit.x - this.x;
        const dy = bit.y - this.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 14400) {
          const dist = Math.sqrt(distSq);
          const push = (120 - dist) / 120 * 18;
          const angle = Math.atan2(dy, dx);
          bit.vx = Math.cos(angle) * push;
          bit.vy = Math.sin(angle) * push;
          bit.scatterTimer = 45;
        }
      });

      // Spawn particles
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        explosions.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: "0, 85, 255",
          life: 1.0,
          decay: Math.random() * 0.03 + 0.01
        });
      }
    }

    draw() {
      if (!this.active) return;
      ctx.font = this.isLarge ? "bold 13px 'JetBrains Mono'" : "bold 10px 'JetBrains Mono'";
      ctx.textAlign = "center";
      if (this.state === 'projectile') {
        ctx.fillStyle = this.owner === 'player' ? (this.isBombHead ? "#0055ff" : "#000") : "#ff3300";
      } else if (this.state === 'shield') {
        ctx.fillStyle = "#00ff88";
      } else if (this.state === 'harvesting') {
        ctx.fillStyle = "#0066ff";
      } else {
        ctx.fillStyle = this.owner === 'player' ? "#000" : "#777";
      }
      ctx.fillText(this.bit, this.x, this.y);
    }
  }

  class WordEntity {
    constructor(x, y, word, type) {
      this.x = x; this.y = y; this.word = word; this.type = type;
      this.bits = [];
      this.fireCooldown = 0;
      for (let i = 0; i < word.length; i++) {
        const binary = word[i].charCodeAt(0).toString(2).padStart(8, '0');
        for (let b = 0; b < 8; b++) this.bits.push(new Bit(x, y, binary[b], type));
      }
    }

    update() {
      if (this.type === 'enemy') {
        this.y = 250 + Math.sin(frameCount * 0.03) * 100;
        if (this.fireCooldown <= 0) {
          this.shoot(player.x, player.y);
          this.fireCooldown = 45 + Math.random() * 60;
        }
      }
      if (this.fireCooldown > 0) this.fireCooldown--;

      const formationBits = this.bits.filter(b => (b.state === 'idle' || b.state === 'harvesting') && b.active);
      const activeProjectiles = this.bits.filter(b => (b.state === 'projectile' || b.state === 'shield') && b.active);

      this.bits = [...formationBits, ...activeProjectiles];

      formationBits.forEach((bit, index) => {
        const col = Math.floor(index / 8);
        const row = index % 8;
        const tx = this.x + (col - (this.word.length/2)) * BIT_SPACING_H;
        const ty = this.y + (row * BIT_SPACING_V);
        bit.update(tx, ty);
      });

      activeProjectiles.forEach(bit => bit.update());
      this.bits = this.bits.filter(b => b.active);
    }

    shoot(targetX, targetY, weaponType = 1) {
      const idleBits = this.bits.filter(b => b.state === 'idle');
      if (idleBits.length === 0) return;

      if (weaponType === 2) { // BOMB
        if (idleBits.length < 8) return;
        // UNLOAD FROM BACK: Player(Left) back is start of array(P), Enemy(Right) back is end of array
        const cluster = (this.type === 'player') ? idleBits.slice(0, 8) : idleBits.slice(-8);
        const angle = Math.atan2(targetY - this.y, targetX - this.x);

        cluster.forEach((b, i) => {
          b.state = 'projectile';
          b.vx = Math.cos(angle) * (PROJECTILE_SPEED * 0.6);
          b.vy = Math.sin(angle) * (PROJECTILE_SPEED * 0.6);
          b.bit = "01000010"[i];
          b.isLarge = true;
          if (i === 0) b.isBombHead = true;
        });
      } else if (weaponType === 3) { // SHIELD
        if (idleBits.length < 8) return;
        // UNLOAD FROM BACK
        const cluster = (this.type === 'player') ? idleBits.slice(0, 8) : idleBits.slice(-8);

        cluster.forEach((b, i) => {
          b.state = 'shield';
          b.bit = "01010011"[i];
          b.shieldIndex = i;
          b.isLarge = true;
        });
      } else { // MGUN
        // UNLOAD FROM BACK: Player furthest side is left (start of word), Enemy furthest is right (end of word)
        const ammo = (this.type === 'player') ? idleBits[0] : idleBits[idleBits.length - 1];
        ammo.state = 'projectile';
        const angle = Math.atan2(targetY - ammo.y, targetX - ammo.x);
        ammo.vx = Math.cos(angle) * PROJECTILE_SPEED;
        ammo.vy = Math.sin(angle) * PROJECTILE_SPEED;
      }
    }

    draw() {
      this.bits.forEach(b => b.draw());
      const count = this.bits.filter(b => b.state === 'idle' || b.state === 'harvesting').length;

      if (count > 0) {
        ctx.font = "bold 12px 'JetBrains Mono'";
        ctx.fillStyle = this.type === 'player' ? "rgba(0,0,0,0.2)" : "rgba(255,0,0,0.2)";
        ctx.textAlign = "center";
        const activeLetters = Math.ceil(count / 8);
        for(let i=0; i < activeLetters; i++) {
          const tx = this.x + (i - (this.word.length/2)) * BIT_SPACING_H;
          ctx.fillText(this.word[i] || "?", tx, this.y - 15);
        }
      }
    }
  }

  let explosions = [];
  const player = new WordEntity(120, 250, "PLAYER", "player");
  let enemy = new WordEntity(780, 250, "DAEMON", "enemy");

  window.addEventListener('keydown', (e) => {
    if (['1','2','3'].includes(e.key)) {
      currentWeapon = parseInt(e.key);
      weapons.forEach((w, i) => w.classList.toggle('active-weapon', i === currentWeapon - 1));
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    if (!isGameOver) player.y = mouse.y - 40;
  });

  canvas.addEventListener('mousedown', () => {
    if (currentWeapon > 1) player.shoot(mouse.x, mouse.y, currentWeapon);
    else mouse.down = true;
  });

  window.addEventListener('mouseup', () => mouse.down = false);

  let fireTimer = 0;

  function frame() {
    if (isGameOver) return;
    frameCount++;

    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 900, 500);
    drawGrid();

    if (currentWeapon === 1 && mouse.down) {
      fireTimer++;
      if (fireTimer >= FIRE_RATE) { player.shoot(mouse.x, mouse.y); fireTimer = 0; }
    } else fireTimer = FIRE_RATE;

    player.update(); player.draw();
    enemy.update(); enemy.draw();

    explosions = explosions.filter(ex => ex.life > 0);
    explosions.forEach(ex => {
      ex.x += ex.vx;
      ex.y += ex.vy;
      ex.life -= ex.decay;
      ctx.fillStyle = `rgba(${ex.color}, ${ex.life})`;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    const pCount = player.bits.filter(b => b.state === 'idle').length;
    const eCount = enemy.bits.filter(b => b.state === 'idle').length;

    if (eCount === 0) {
      score += 100;
      scoreEl.innerText = "SCORE: " + score;
      const pool = ["KERNEL", "BUFFER", "SCRIPT", "TROJAN", "SOCKET", "DAEMON"];
      enemy = new WordEntity(780, 250, pool[Math.floor(Math.random() * pool.length)], "enemy");
    }

    pHealthEl.innerText = pCount;
    eHealthEl.innerText = eCount;

    if (pCount === 0 && !player.bits.some(b => b.state === 'harvesting')) {
      isGameOver = true; gameOverUI.style.display = 'block';
    }

    requestAnimationFrame(frame);
  }

  frame();
};