/**
 * NEXUSMOBILITY — MULTI-TABBED ENTERPRISE ECO-TECH PLATFORM
 * Core Engine & Multi-View Controller
 * Featuring Animated Transit Car Simulation, Ambient Eco Particle Canvas,
 * EcoSprout Mascot, and Enterprise Confirmation Modals.
 * 100% Zero CS / Academic Jargon.
 */

// ==========================================
// 1. METROPOLITAN TRANSIT STATIONS & NETWORK
// ==========================================
const TRANSIT_STATIONS = [
  { id: 'ALPHA', name: 'Tech Park Alpha', x: -160, y: -70, z: 20, zone: 'North Industrial', icon: 'fa-microchip' },
  { id: 'HARBOR', name: 'Bayfront Terminal', x: -80, y: 110, z: -15, zone: 'Maritime District', icon: 'fa-anchor' },
  { id: 'METRO', name: 'Central Financial Core', x: 0, y: 0, z: 40, zone: 'Downtown Metro', icon: 'fa-building-columns' },
  { id: 'SKYPORT', name: 'AeroPort Interchange', x: 130, y: -90, z: 30, zone: 'Aviation Corridor', icon: 'fa-plane-departure' },
  { id: 'QUANTUM', name: 'Green Innovation Campus', x: 90, y: 100, z: -10, zone: 'Eco District', icon: 'fa-seedling' },
  { id: 'HORIZON', name: 'Waterfront Marina', x: 200, y: 30, z: 5, zone: 'East Residential', icon: 'fa-water' }
];

// Transit Corridors with distances (km)
const TRANSIT_CORRIDORS = [
  { u: 'ALPHA', v: 'METRO', distance: 8.2 },
  { u: 'ALPHA', v: 'HARBOR', distance: 11.5 },
  { u: 'HARBOR', v: 'METRO', distance: 6.4 },
  { u: 'HARBOR', v: 'QUANTUM', distance: 13.8 },
  { u: 'METRO', v: 'SKYPORT', distance: 9.6 },
  { u: 'METRO', v: 'QUANTUM', distance: 7.1 },
  { u: 'SKYPORT', v: 'HORIZON', distance: 8.8 },
  { u: 'QUANTUM', v: 'HORIZON', distance: 10.4 }
];

// ==========================================
// 2. NEXUS LOGISTICS STATE ENGINE
// ==========================================
class NexusTransitEngine {
  constructor() {
    this.stations = TRANSIT_STATIONS;
    this.corridors = TRANSIT_CORRIDORS;

    this.dispatchStream = [];

    // Priority Standby Lounge (Max 5 Slots)
    this.standbyCap = 5;
    this.standbyLounge = new Array(this.standbyCap).fill(null);
    this.standbyFront = 0;
    this.standbyRear = 0;
    this.standbyCount = 0;

    // Driver Fleet Directory
    this.fleetPartners = [];

    // Active Shared Trips
    this.activeTrips = [];

    // Reversible Dispatch Audit Log
    this.reversalAuditLog = [];

    // Top Eco-Partners Leaderboard with Gamified Achievement Badges
    this.leaderboard = [
      { name: 'Kaelen Chen', trips: 42, co2: '168.4 kg', rating: 4.98, badge: 'Carbon Crusader' },
      { name: 'Elena Rostova', trips: 37, co2: '142.1 kg', rating: 4.95, badge: '5-Star Commute' },
      { name: 'Marcus Vance', trips: 31, co2: '128.0 kg', rating: 4.92, badge: 'Zero-Emission Pioneer' },
      { name: 'Siddharth Rao', trips: 28, co2: '115.6 kg', rating: 4.89, badge: 'Master Navigator' }
    ];

    this.counters = {
      driver: 101,
      booking: 501,
      passenger: 201
    };

    this.commuterDensity = 2;
  }

  findOptimalEcoRoute(startId, endId) {
    const adj = {};
    TRANSIT_STATIONS.forEach(s => { adj[s.id] = []; });
    TRANSIT_CORRIDORS.forEach(c => {
      adj[c.u].push({ node: c.v, distance: c.distance });
      adj[c.v].push({ node: c.u, distance: c.distance });
    });

    const dist = {};
    const prev = {};
    TRANSIT_STATIONS.forEach(s => {
      dist[s.id] = Infinity;
      prev[s.id] = null;
    });

    dist[startId] = 0;
    const activeCorridors = [[0, startId]];

    while (activeCorridors.length > 0) {
      activeCorridors.sort((a, b) => a[0] - b[0]);
      const [d, u] = activeCorridors.shift();

      if (u === endId) break;
      if (d > dist[u]) continue;

      for (const edge of adj[u]) {
        const v = edge.node;
        const newDist = dist[u] + edge.distance;
        if (newDist < dist[v]) {
          dist[v] = newDist;
          prev[v] = u;
          activeCorridors.push([newDist, v]);
        }
      }
    }

    const path = [];
    let curr = endId;
    if (dist[endId] !== Infinity) {
      while (curr) {
        path.unshift(curr);
        curr = prev[curr];
      }
    }

    const totalDist = dist[endId] === Infinity ? 0 : parseFloat(dist[endId].toFixed(1));
    const estTime = Math.round(totalDist * 2.2);
    const baseCO2 = totalDist * 0.171;
    const co2Offset = parseFloat((baseCO2 * (0.8 + this.commuterDensity * 0.4)).toFixed(2));

    const baseTripCost = 4.0 + totalDist * 1.5;
    const pooledFare = parseFloat(((baseTripCost * (1 + (this.commuterDensity - 1) * 0.25)) / this.commuterDensity).toFixed(2));

    return {
      path,
      totalDist,
      estTime,
      co2Offset,
      fare: pooledFare,
      soloCarsSaved: Math.max(0, this.commuterDensity - 1)
    };
  }

  submitRideRequest(name, pickup, drop) {
    const passenger = {
      id: `BK-${this.counters.passenger++}`,
      name,
      pickup,
      drop,
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Pending Dispatch'
    };
    this.dispatchStream.push(passenger);
    return passenger;
  }

  dequeueNextRequest() {
    return this.dispatchStream.shift() || null;
  }

  pushToStandby(item) {
    if (this.standbyCount === this.standbyCap) {
      return { success: false, message: 'Priority Standby Lounge is currently at maximum capacity (5/5).' };
    }
    this.standbyLounge[this.standbyRear] = item;
    this.standbyRear = (this.standbyRear + 1) % this.standbyCap;
    this.standbyCount++;
    return { success: true };
  }

  popFromStandby() {
    if (this.standbyCount === 0) {
      return { success: false, message: 'Standby lounge is currently empty.' };
    }
    const item = this.standbyLounge[this.standbyFront];
    this.standbyLounge[this.standbyFront] = null;
    this.standbyFront = (this.standbyFront + 1) % this.standbyCap;
    this.standbyCount--;
    return { success: true, item };
  }

  onboardDriver(name, station, seats) {
    const driverId = this.counters.driver++;
    const newPartner = {
      id: driverId,
      name,
      station,
      seats: parseInt(seats, 10),
      originalSeats: parseInt(seats, 10),
      tripsCompleted: 0
    };
    this.fleetPartners.push(newPartner);
    return newPartner;
  }

  getDriverById(id) {
    const cleanId = String(id).replace(/[^0-9]/g, '');
    return this.fleetPartners.find(d => String(d.id) === cleanId) || null;
  }

  getBookingByRef(ref) {
    const upper = String(ref).trim().toUpperCase();
    return this.activeTrips.find(t => t.tripRef.toUpperCase() === upper || t.passenger.id.toUpperCase() === upper) || null;
  }

  dispatchSharedTrip(passenger, driver, corridorPath, distance, time, fare, co2Saved, matchScore = 94) {
    const tripRef = `NX-${this.counters.booking++}`;
    const trip = {
      tripRef,
      passenger,
      driverId: driver.id,
      driverName: driver.name,
      corridorPath,
      distance,
      time,
      fare,
      co2Saved,
      matchScore,
      dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.activeTrips.push(trip);
    driver.seats -= 1;
    driver.tripsCompleted += 1;

    this.reversalAuditLog.push({
      type: 'DISPATCH_CONFIRMATION',
      tripRef,
      driverId: driver.id,
      passenger,
      trip
    });

    return trip;
  }

  cancelActiveTrip(tripRef) {
    const index = this.activeTrips.findIndex(t => t.tripRef === tripRef);
    if (index !== -1) {
      const removed = this.activeTrips.splice(index, 1)[0];
      return removed;
    }
    return null;
  }

  revertLatestConfirmation() {
    if (this.reversalAuditLog.length === 0) {
      return { success: false, message: 'No recent dispatch confirmations available to revert.' };
    }

    const action = this.reversalAuditLog.pop();
    if (action.type === 'DISPATCH_CONFIRMATION') {
      this.cancelActiveTrip(action.tripRef);

      const driver = this.getDriverById(action.driverId);
      if (driver) {
        driver.seats = Math.min(driver.seats + 1, driver.originalSeats);
      }

      action.passenger.status = 'Restored to Dispatch';
      this.dispatchStream.unshift(action.passenger);

      return { success: true, action, driver };
    }

    return { success: false, message: 'Unable to process reversal.' };
  }
}

const engine = new NexusTransitEngine();

// ==========================================
// 3. AMBIENT BACKGROUND CANVAS (FLOATING LEAVES & ENERGY NODES)
// ==========================================
class AmbientEcoCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 35;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 8 + 4,
        speedY: -(Math.random() * 0.45 + 0.15),
        speedX: Math.sin(Math.random() * Math.PI) * 0.25,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        type: Math.random() > 0.45 ? 'leaf' : 'node',
        opacity: Math.random() * 0.4 + 0.15
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.y * 0.01) * 0.2;
      p.rotation += p.rotSpeed;

      // Wrap around
      if (p.y < -20) {
        p.y = this.height + 20;
        p.x = Math.random() * this.width;
      }
      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);

      if (p.type === 'leaf') {
        // Draw delicate eco-leaf
        this.ctx.fillStyle = `rgba(5, 150, 105, ${p.opacity * 0.55})`;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Leaf stem line
        this.ctx.strokeStyle = `rgba(5, 150, 105, ${p.opacity * 0.7})`;
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(-p.size, 0);
        this.ctx.lineTo(p.size, 0);
        this.ctx.stroke();
      } else {
        // Light glowing electric energy node
        this.ctx.fillStyle = `rgba(37, 99, 235, ${p.opacity * 0.45})`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });

    requestAnimationFrame(() => this.animate());
  }
}

// ==========================================
// 4. 3D SPATIAL METROPOLITAN CANVAS MAP
// WITH DIRECTIONAL CORRIDORS & ANIMATED TRANSIT VEHICLE
// ==========================================
class Urban3DCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.wrapper = this.canvas.parentElement;

    this.rotX = 0.45;
    this.rotY = -0.32;
    this.scale = 1.08;

    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.activeCorridorPath = [];
    this.hoveredStation = null;

    // Animated Car along active path
    this.carProgress = 0; // 0 to (path.length - 1)
    this.carSpeed = 0.0085;
    this.isCarDriving = false;
    this.flowDashOffset = 0;

    this.initEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    if (!this.wrapper) return;
    this.width = this.wrapper.clientWidth || 800;
    this.height = this.wrapper.clientHeight || 420;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        this.rotY += deltaX * 0.007;
        this.rotX += deltaY * 0.007;
        this.rotX = Math.max(0.12, Math.min(1.2, this.rotX));
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
      this.checkHover(e);
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.scale += e.deltaY * -0.001;
      this.scale = Math.max(0.65, Math.min(1.85, this.scale));
    });
  }

  checkHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found = null;
    TRANSIT_STATIONS.forEach(s => {
      const p = this.project(s.x, s.y, s.z);
      const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
      if (dist < 22) {
        found = s;
      }
    });

    this.hoveredStation = found;
    const hud = document.getElementById('map-hud-overlay');
    if (hud) {
      if (found) {
        hud.innerHTML = `<span class="text-emerald font-bold">📍 ${found.name}</span> &bull; Transit Zone: ${found.zone} &bull; Elevation: +${found.z}m`;
      } else {
        hud.innerHTML = `<i class="fa-solid fa-hand-pointer text-emerald"></i> Click & drag to orbit 3D city corridors &bull; Scroll to zoom`;
      }
    }
  }

  project(x, y, z) {
    const cosY = Math.cos(this.rotY);
    const sinY = Math.sin(this.rotY);
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;

    const cosX = Math.cos(this.rotX);
    const sinX = Math.sin(this.rotX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    const cameraDist = 440;
    const fov = cameraDist / (cameraDist + z2);

    const screenX = this.width / 2 + x1 * fov * this.scale;
    const screenY = this.height / 2 + y2 * fov * this.scale;

    return { x: screenX, y: screenY, scale: fov, z: z2 };
  }

  setActivePath(path) {
    this.activeCorridorPath = path;
    this.carProgress = 0;
    this.isCarDriving = path && path.length > 1;
  }

  startCarSimulation() {
    if (this.activeCorridorPath && this.activeCorridorPath.length > 1) {
      this.carProgress = 0;
      this.isCarDriving = true;
    }
  }

  resetCamera() {
    this.rotX = 0.45;
    this.rotY = -0.32;
    this.scale = 1.08;
  }

  animate() {
    this.flowDashOffset -= 0.6;
    this.render();

    // Advance transit vehicle along path
    if (this.isCarDriving && this.activeCorridorPath.length > 1) {
      this.carProgress += this.carSpeed;
      if (this.carProgress >= this.activeCorridorPath.length - 1) {
        this.carProgress = 0; // Loop or stop
      }
    }

    requestAnimationFrame(() => this.animate());
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawGroundGrid();

    // Draw Corridors
    TRANSIT_CORRIDORS.forEach(corridor => {
      const uStation = TRANSIT_STATIONS.find(s => s.id === corridor.u);
      const vStation = TRANSIT_STATIONS.find(s => s.id === corridor.v);
      const p1 = this.project(uStation.x, uStation.y, uStation.z);
      const p2 = this.project(vStation.x, vStation.y, vStation.z);

      let isPath = false;
      let pathDirection = 0; // 1: u->v, -1: v->u

      for (let i = 0; i < this.activeCorridorPath.length - 1; i++) {
        const a = this.activeCorridorPath[i];
        const b = this.activeCorridorPath[i + 1];
        if (a === corridor.u && b === corridor.v) {
          isPath = true;
          pathDirection = 1;
          break;
        } else if (a === corridor.v && b === corridor.u) {
          isPath = true;
          pathDirection = -1;
          break;
        }
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      if (isPath) {
        // Base route vector line
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 4.5;
        ctx.stroke();

        // Directional Flow Animation (Chevrons / dashed energy pulses)
        ctx.save();
        ctx.beginPath();
        const startP = pathDirection === 1 ? p1 : p2;
        const endP = pathDirection === 1 ? p2 : p1;
        ctx.moveTo(startP.x, startP.y);
        ctx.lineTo(endP.x, endP.y);
        ctx.strokeStyle = '#60A5FA';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 12]);
        ctx.lineDashOffset = this.flowDashOffset;
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      // Corridor Distance Tag
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.save();
      ctx.fillStyle = isPath ? '#2563EB' : '#FFFFFF';
      ctx.strokeStyle = isPath ? '#1D4ED8' : '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(midX - 16, midY - 9, 32, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isPath ? '#FFFFFF' : '#475569';
      ctx.font = 'bold 9px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${corridor.distance}km`, midX, midY);
      ctx.restore();
    });

    // Draw Stations (Sorted by Z for depth)
    const sorted = [...TRANSIT_STATIONS].map(s => ({
      station: s,
      proj: this.project(s.x, s.y, s.z)
    })).sort((a, b) => b.proj.z - a.proj.z);

    sorted.forEach(({ station, proj }) => {
      const isPath = this.activeCorridorPath.includes(station.id);
      const isHovered = this.hoveredStation && this.hoveredStation.id === station.id;

      ctx.save();

      // Floor Shadow
      const floorProj = this.project(station.x, station.y, -30);
      ctx.beginPath();
      ctx.ellipse(floorProj.x, floorProj.y, 14 * proj.scale, 7 * proj.scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.fill();

      // Elevation Stem
      ctx.beginPath();
      ctx.moveTo(floorProj.x, floorProj.y);
      ctx.lineTo(proj.x, proj.y);
      ctx.strokeStyle = isPath ? 'rgba(5, 150, 105, 0.6)' : '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Station Circle
      ctx.beginPath();
      const radius = (isHovered ? 14 : 11) * proj.scale;
      ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);

      if (isPath) {
        ctx.fillStyle = '#059669';
        ctx.shadowColor = 'rgba(5, 150, 105, 0.4)';
        ctx.shadowBlur = 14;
      } else if (isHovered) {
        ctx.fillStyle = '#2563EB';
        ctx.shadowColor = 'rgba(37, 99, 235, 0.4)';
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.fill();
      ctx.restore();

      // Station Label & Zone
      ctx.save();
      ctx.font = '600 11px "Inter"';
      ctx.fillStyle = isPath ? '#059669' : '#0F172A';
      ctx.textAlign = 'center';
      ctx.fillText(station.name, proj.x, proj.y - 18 * proj.scale);
      ctx.font = '500 9px "JetBrains Mono"';
      ctx.fillStyle = '#64748B';
      ctx.fillText(station.zone, proj.x, proj.y + 20 * proj.scale);
      ctx.restore();
    });

    // Draw Animated Electric Transit Car Driving Along Route
    if (this.isCarDriving && this.activeCorridorPath.length > 1) {
      this.drawAnimatedCar();
    }
  }

  drawAnimatedCar() {
    const ctx = this.ctx;
    const segmentIndex = Math.floor(this.carProgress);
    const segmentT = this.carProgress - segmentIndex;

    const fromId = this.activeCorridorPath[segmentIndex];
    const toId = this.activeCorridorPath[segmentIndex + 1];

    if (!fromId || !toId) return;

    const s1 = TRANSIT_STATIONS.find(s => s.id === fromId);
    const s2 = TRANSIT_STATIONS.find(s => s.id === toId);

    // Interpolate 3D coordinates
    const curX = s1.x + (s2.x - s1.x) * segmentT;
    const curY = s1.y + (s2.y - s1.y) * segmentT;
    const curZ = s1.z + (s2.z - s1.z) * segmentT;

    const carProj = this.project(curX, curY, curZ);

    // Calculate heading angle
    const p1 = this.project(s1.x, s1.y, s1.z);
    const p2 = this.project(s2.x, s2.y, s2.z);
    const heading = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();
    ctx.translate(carProj.x, carProj.y);
    ctx.rotate(heading);

    // Glowing Headlight Beams
    ctx.beginPath();
    ctx.moveTo(12 * carProj.scale, -4 * carProj.scale);
    ctx.lineTo(26 * carProj.scale, -12 * carProj.scale);
    ctx.lineTo(26 * carProj.scale, 12 * carProj.scale);
    ctx.lineTo(12 * carProj.scale, 4 * carProj.scale);
    ctx.closePath();
    const lightGrad = ctx.createLinearGradient(12 * carProj.scale, 0, 26 * carProj.scale, 0);
    lightGrad.addColorStop(0, 'rgba(32, 201, 176, 0.45)');
    lightGrad.addColorStop(1, 'rgba(32, 201, 176, 0)');
    ctx.fillStyle = lightGrad;
    ctx.fill();

    // Electric Vehicle Chassis
    ctx.beginPath();
    ctx.roundRect(-10 * carProj.scale, -6 * carProj.scale, 20 * carProj.scale, 12 * carProj.scale, 4 * carProj.scale);
    ctx.fillStyle = '#059669';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Windshield
    ctx.beginPath();
    ctx.roundRect(0, -4 * carProj.scale, 5 * carProj.scale, 8 * carProj.scale, 2 * carProj.scale);
    ctx.fillStyle = '#93C5FD';
    ctx.fill();

    // Headlight bulbs
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(8 * carProj.scale, -5 * carProj.scale, 2 * carProj.scale, 2 * carProj.scale);
    ctx.fillRect(8 * carProj.scale, 3 * carProj.scale, 2 * carProj.scale, 2 * carProj.scale);

    ctx.restore();
  }

  drawGroundGrid() {
    const ctx = this.ctx;
    const size = 220;
    const step = 44;
    const floorZ = -30;

    ctx.save();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    ctx.lineWidth = 1;

    for (let i = -size; i <= size; i += step) {
      const p1 = this.project(i, -size, floorZ);
      const p2 = this.project(i, size, floorZ);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const p3 = this.project(-size, i, floorZ);
      const p4 = this.project(size, i, floorZ);
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

let urbanCanvasInstance = null;
let ambientCanvasInstance = null;

// ==========================================
// 5. ECOSPROUT MASCOT VECTOR TEMPLATE
// ==========================================
function getEcoSproutSVG() {
  return `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Mascot Head -->
      <circle cx="32" cy="38" r="18" fill="#10B981"/>
      <ellipse cx="32" cy="42" rx="14" ry="10" fill="#34D399"/>
      
      <!-- Leaf Cap on top -->
      <path d="M32 20C32 20 22 14 26 6C34 10 32 20 32 20Z" fill="#059669"/>
      <path d="M32 20C32 20 42 14 38 6C30 10 32 20 32 20Z" fill="#34D399"/>
      <circle cx="32" cy="20" r="3" fill="#D97706"/>
      
      <!-- Aviator Goggles -->
      <rect x="18" y="28" width="12" height="9" rx="3" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
      <rect x="34" y="28" width="12" height="9" rx="3" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
      <line x1="30" y1="32" x2="34" y2="32" stroke="#F59E0B" stroke-width="2"/>
      <circle cx="24" cy="32" r="3" fill="#38BDF8"/>
      <circle cx="40" cy="32" r="3" fill="#38BDF8"/>
      
      <!-- Cheerful Smile -->
      <path d="M26 43C28 47 36 47 38 43" stroke="#064E3B" stroke-width="2" stroke-linecap="round"/>
      <!-- Rosy Cheeks -->
      <circle cx="21" cy="41" r="2.5" fill="#F87171" opacity="0.7"/>
      <circle cx="43" cy="41" r="2.5" fill="#F87171" opacity="0.7"/>
    </svg>
  `;
}

// ==========================================
// 6. MULTI-TAB SWITCHING CONTROLLER
// ==========================================
function initTabNavigation() {
  const triggers = document.querySelectorAll('.tab-trigger');
  const views = document.querySelectorAll('.tab-view');

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const targetTabId = trigger.dataset.tab;

      triggers.forEach(t => t.classList.remove('active'));
      trigger.classList.add('active');

      views.forEach(v => {
        v.classList.remove('active');
        if (v.id === targetTabId) {
          v.classList.add('active');
        }
      });

      if (targetTabId === 'tab-route-finder' && urbanCanvasInstance) {
        setTimeout(() => {
          urbanCanvasInstance.resize();
        }, 50);
      }
    });
  });
}

// ==========================================
// 7. UI REFRESH & COMPONENT RENDERERS
// ==========================================
function refreshPlatformUI() {
  renderPassengerDispatchStream();
  renderStandbyLounge();
  renderFleetDirectory();
  renderActiveTrips();
  renderTransitHierarchyCanvas();
  renderAuditHistory();
  renderLeaderboard();
  updateTopKPIs();
}

function updateTopKPIs() {
  document.getElementById('kpi-commuters').innerHTML = `${engine.dispatchStream.length} <span class="kpi-unit">commuters</span>`;
  document.getElementById('kpi-active-trips').innerHTML = `${engine.activeTrips.length} <span class="kpi-unit">trips</span>`;

  const passBadge = document.getElementById('tab-passengers-badge');
  if (passBadge) passBadge.textContent = engine.dispatchStream.length + engine.standbyCount;

  const fleetBadge = document.getElementById('tab-fleet-badge');
  if (fleetBadge) fleetBadge.textContent = engine.fleetPartners.length;

  let totalSavedCO2 = 148.5;
  let totalDistance = 1420;
  engine.activeTrips.forEach(t => {
    totalSavedCO2 += t.co2Saved;
    totalDistance += t.distance;
  });

  document.getElementById('kpi-co2').innerHTML = `${totalSavedCO2.toFixed(1)} <span class="kpi-unit">kg</span>`;
  document.getElementById('eco-total-co2').textContent = `${totalSavedCO2.toFixed(1)} kg`;
  document.getElementById('eco-shared-km').textContent = `${Math.round(totalDistance).toLocaleString()} km`;

  document.getElementById('fleet-count-badge').textContent = `${engine.fleetPartners.length} Active Partners`;
  document.getElementById('active-trips-badge').textContent = `${engine.activeTrips.length} In-Transit`;
}

// --- Passenger Dispatch Stream with EcoSprout Empty State ---
function renderPassengerDispatchStream() {
  const container = document.getElementById('passenger-conveyor');
  if (!container) return;

  if (engine.dispatchStream.length === 0) {
    container.innerHTML = `
      <div class="ecosprout-container">
        <div class="ecosprout-avatar">${getEcoSproutSVG()}</div>
        <div class="ecosprout-bubble">
          <b>EcoSprout here!</b> The dispatch conveyor is clear. Submit a commuter request above to plan a green trip!
        </div>
      </div>`;
    return;
  }

  container.innerHTML = engine.dispatchStream.map((pass, idx) => `
    <div class="commuter-token ${idx === 0 ? 'head-token' : ''} eco-card-hover">
      <div class="token-badge">${idx === 0 ? 'NEXT DISPATCH' : `PRIORITY #${idx + 1}`}</div>
      <div class="token-name">${pass.name}</div>
      <div class="token-route"><i class="fa-solid fa-route"></i> ${pass.pickup} &rarr; ${pass.drop}</div>
      <div class="token-meta">${pass.id} &bull; ${pass.requestedAt}</div>
    </div>
  `).join('');
}

// --- Priority Standby Lounge ---
function renderStandbyLounge() {
  const ring = document.getElementById('standby-ring');
  const counter = document.getElementById('standby-slot-counter');
  const pill = document.getElementById('standby-status-pill');
  if (!ring || !counter || !pill) return;

  counter.textContent = `${engine.standbyCount} / ${engine.standbyCap}`;
  pill.textContent = `Available Slots: ${engine.standbyCap - engine.standbyCount} / ${engine.standbyCap}`;

  ring.innerHTML = '';
  const total = engine.standbyCap;
  const radius = 90;

  for (let i = 0; i < total; i++) {
    const angle = (i * 2 * Math.PI) / total - Math.PI / 2;
    const x = Math.round(radius * Math.cos(angle) + 105);
    const y = Math.round(radius * Math.sin(angle) + 105);

    const isOccupied = engine.standbyLounge[i] !== null;
    const isActivePointer = i === engine.standbyFront && engine.standbyCount > 0;

    const slotEl = document.createElement('div');
    slotEl.className = `standby-slot ${isOccupied ? 'occupied' : ''} ${isActivePointer ? 'is-active-pointer' : ''}`;
    slotEl.style.left = `${x}px`;
    slotEl.style.top = `${y}px`;

    const passenger = engine.standbyLounge[i];
    slotEl.innerHTML = `
      <div class="font-bold">SLOT ${i + 1}</div>
      <div class="text-[9px] truncate max-w-[42px]">${passenger ? passenger.name.split(' ')[0] : 'FREE'}</div>
    `;
    slotEl.title = passenger ? `Standby: ${passenger.name} (${passenger.pickup} -> ${passenger.drop})` : `Slot ${i + 1}: Empty`;
    ring.appendChild(slotEl);
  }
}

// --- Driver Fleet Directory with EcoSprout Empty State ---
function renderFleetDirectory() {
  const container = document.getElementById('fleet-stream-container');
  const capacityPill = document.getElementById('fleet-capacity-pill');
  if (!container || !capacityPill) return;

  let totalAvailableSeats = 0;
  engine.fleetPartners.forEach(p => { totalAvailableSeats += p.seats; });
  capacityPill.textContent = `Total Available Seats: ${totalAvailableSeats}`;

  if (engine.fleetPartners.length === 0) {
    container.innerHTML = `
      <div class="ecosprout-container">
        <div class="ecosprout-avatar">${getEcoSproutSVG()}</div>
        <div class="ecosprout-bubble">
          <b>EcoSprout needs partners!</b> Toggle vehicle seats above and onboard a driver partner to open seat capacity.
        </div>
      </div>`;
    return;
  }

  let html = '';
  engine.fleetPartners.forEach((partner, idx) => {
    html += `
      <div class="driver-partner-card eco-card-hover">
        <div class="card-top">
          <span class="driver-id-badge">ID: #${partner.id}</span>
          <span class="seat-counter-pill">${partner.seats}/${partner.originalSeats} Seats</span>
        </div>
        <div class="driver-name">${partner.name}</div>
        <div class="driver-corridor"><i class="fa-solid fa-location-dot text-emerald"></i> ${partner.station} Station</div>
        <div class="text-[10px] text-slate-500 mt-1">${partner.tripsCompleted} Shared Trips</div>
      </div>
    `;

    if (idx < engine.fleetPartners.length - 1) {
      html += `<div class="fleet-pointer"><i class="fa-solid fa-arrow-right"></i></div>`;
    }
  });

  container.innerHTML = html;
}

// --- Active Shared Trips with EcoSprout Empty State ---
function renderActiveTrips() {
  const container = document.getElementById('active-trips-stream');
  if (!container) return;

  if (engine.activeTrips.length === 0) {
    container.innerHTML = `
      <div class="ecosprout-container">
        <div class="ecosprout-avatar">${getEcoSproutSVG()}</div>
        <div class="ecosprout-bubble">
          <b>EcoSprout is ready to roll!</b> Dispatch a trip or launch the Rush-Hour simulation to watch active pooled rides.
        </div>
      </div>`;
    return;
  }

  container.innerHTML = engine.activeTrips.map(trip => `
    <div class="shared-trip-card eco-card-hover">
      <button class="btn-cancel-trip" title="Complete / Cancel Trip" onclick="handleCompleteTrip('${trip.tripRef}')">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="flex justify-between items-center">
        <span class="trip-ref">${trip.tripRef}</span>
        <span class="route-match-badge">${trip.matchScore}% Route Match</span>
      </div>
      <div class="text-xs font-bold text-slate-900 mt-0.5">${trip.passenger.name}</div>
      <div class="text-[10px] text-electric font-semibold">${trip.corridorPath.join(' &rarr; ')}</div>
      <div class="text-[10px] text-slate-600 mt-1"><i class="fa-solid fa-id-badge text-emerald"></i> ${trip.driverName}</div>
      <div class="flex justify-between items-center text-[9px] text-slate-500 pt-1 border-t border-slate-200 mt-1">
        <span>+${trip.co2Saved}kg CO₂</span>
        <button class="text-emerald hover:underline font-bold" onclick="viewEcoReceipt('${trip.tripRef}')">
          <i class="fa-solid fa-receipt"></i> Eco-Receipt
        </button>
        <span class="text-slate-900 font-bold">$${trip.fare}</span>
      </div>
    </div>
  `).join('');
}

// --- Transit Hierarchy Canvas ---
function renderTransitHierarchyCanvas() {
  const canvas = document.getElementById('trip-hierarchy-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const countPill = document.getElementById('registry-count-pill');

  countPill.textContent = `${engine.activeTrips.length} Active Trips`;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (engine.activeTrips.length === 0) {
    ctx.fillStyle = '#64748B';
    ctx.font = '11px "Inter"';
    ctx.textAlign = 'center';
    ctx.fillText('Transit Dispatch Registry Ready. Active shared trips will display here.', canvas.width / 2, canvas.height / 2);
    return;
  }

  // Draw Root Hub
  const rootX = canvas.width / 2;
  const rootY = 24;

  ctx.beginPath();
  ctx.arc(rootX, rootY, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2.5;
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 9px "Inter"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NEXUS', rootX, rootY);

  // Draw Branches
  const count = engine.activeTrips.length;
  const spacing = Math.min(80, (canvas.width - 60) / Math.max(count, 1));
  const startX = rootX - ((count - 1) * spacing) / 2;

  engine.activeTrips.forEach((trip, idx) => {
    const nodeX = startX + idx * spacing;
    const nodeY = 110;

    ctx.beginPath();
    ctx.moveTo(rootX, rootY + 14);
    ctx.lineTo(nodeX, nodeY - 14);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(nodeX, nodeY, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(37, 99, 235, 0.2)';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 8px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(trip.tripRef.replace('NX-', ''), nodeX, nodeY);

    ctx.fillStyle = '#059669';
    ctx.font = '500 8px "Inter"';
    ctx.fillText(trip.passenger.name.split(' ')[0], nodeX, nodeY + 22);
  });
}

// --- Reversal Audit History List ---
function renderAuditHistory() {
  const container = document.getElementById('audit-history-list');
  const pill = document.getElementById('audit-log-pill');
  if (!container || !pill) return;

  pill.textContent = `${engine.reversalAuditLog.length} Rollbacks Available`;

  if (engine.reversalAuditLog.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Reversal log clear. Confirm a trip to create a restorable dispatch state.</p>
      </div>`;
    return;
  }

  const latestIdx = engine.reversalAuditLog.length - 1;
  container.innerHTML = engine.reversalAuditLog.map((entry, idx) => `
    <div class="audit-entry ${idx === latestIdx ? 'latest-entry' : ''}">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-shield-check text-emerald"></i>
        <span class="font-semibold text-slate-800">${entry.tripRef} &bull; ${entry.passenger.name}</span>
      </div>
      <span class="text-slate-500 font-mono text-[10px]">Driver #${entry.driverId}</span>
    </div>
  `).join('');
}

// --- Leaderboard with Gamified Achievement Badges ---
function renderLeaderboard() {
  const container = document.getElementById('eco-leaderboard-list');
  if (!container) return;

  container.innerHTML = engine.leaderboard.map((item, idx) => `
    <div class="leader-item">
      <div class="flex items-center gap-2">
        <span class="text-amber-500 font-bold">#${idx + 1}</span>
        <div>
          <div class="font-semibold text-slate-800">${item.name}</div>
          <span class="gamified-badge"><i class="fa-solid fa-award"></i> ${item.badge}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-slate-500">${item.trips} trips</span>
        <span class="text-emerald font-semibold">${item.co2}</span>
        <span class="text-amber-600 font-mono text-[11px]"><i class="fa-solid fa-star"></i> ${item.rating}</span>
      </div>
    </div>
  `).join('');
}

// ==========================================
// 8. ENTERPRISE CONFIRMATION MODALS
// ==========================================
function openDispatchModal(trip, driver) {
  const modal = document.getElementById('dispatch-confirm-modal');
  const body = document.getElementById('dispatch-modal-body');

  body.innerHTML = `
    <div class="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
      <div class="text-2xl text-emerald"><i class="fa-solid fa-circle-check"></i></div>
      <div>
        <div class="text-sm font-bold text-slate-900">Trip Reference: ${trip.tripRef}</div>
        <div class="text-xs text-slate-600">Passenger ${trip.passenger.name} matched with ${driver.name} (ID: #${driver.id})</div>
      </div>
    </div>

    <div class="modal-stat-grid">
      <div class="modal-stat-box">
        <span class="stat-label">CORRIDOR ALIGNMENT</span>
        <span class="stat-val text-emerald">${trip.matchScore}% Match</span>
      </div>
      <div class="modal-stat-box">
        <span class="stat-label">EST. COMMUTE TIME</span>
        <span class="stat-val text-electric">~${trip.time} mins (${trip.distance}km)</span>
      </div>
      <div class="modal-stat-box">
        <span class="stat-label">POOLED FARE</span>
        <span class="stat-val text-slate-900">$${trip.fare} USD</span>
      </div>
      <div class="modal-stat-box">
        <span class="stat-label">CARBON OFFSET</span>
        <span class="stat-val text-emerald">+${trip.co2Saved} kg CO₂</span>
      </div>
    </div>

    <div class="text-xs text-slate-500 font-mono">
      Route Transit: ${trip.corridorPath.join(' &rarr; ')} &bull; Fleet seats remaining for #${driver.id}: ${driver.seats}
    </div>
  `;

  modal.classList.remove('hidden');
}

function openReversalModal(action, driver) {
  const modal = document.getElementById('reversal-confirm-modal');
  const body = document.getElementById('reversal-modal-body');

  body.innerHTML = `
    <div class="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
      <div class="text-2xl text-rose"><i class="fa-solid fa-arrow-rotate-left"></i></div>
      <div>
        <div class="text-sm font-bold text-slate-900">Reverted Trip: ${action.tripRef}</div>
        <div class="text-xs text-slate-600">The most recent dispatch confirmation was safely reversed.</div>
      </div>
    </div>

    <div class="modal-stat-grid">
      <div class="modal-stat-box">
        <span class="stat-label">RESTORED DRIVER</span>
        <span class="stat-val text-slate-900">${driver ? driver.name : `ID #${action.driverId}`}</span>
      </div>
      <div class="modal-stat-box">
        <span class="stat-label">UPDATED SEAT CAPACITY</span>
        <span class="stat-val text-emerald">${driver ? `${driver.seats}/${driver.originalSeats} Seats` : 'Restored'}</span>
      </div>
    </div>

    <div class="text-xs text-slate-600">
      Commuter <b>${action.passenger.name}</b> has been returned to the front of the dispatch queue without losing priority.
    </div>
  `;

  modal.classList.remove('hidden');
}

// Global Toast System
function showPlatformToast(message, type = 'emerald') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 300);
  }, 3600);
}

// Global trip completion hook
window.handleCompleteTrip = function(tripRef) {
  const removed = engine.cancelActiveTrip(tripRef);
  if (removed) {
    showPlatformToast(`Trip ${tripRef} successfully completed. Corridors updated.`, 'blue');
    refreshPlatformUI();
  }
};

// Global Eco-Receipt viewer hook
window.viewEcoReceipt = function(tripRef) {
  const trip = engine.activeTrips.find(t => t.tripRef === tripRef);
  if (!trip) return;

  const modal = document.getElementById('receipt-modal-overlay');
  const content = document.getElementById('receipt-content-area');

  content.innerHTML = `
    <div class="receipt-item-row">
      <span>Booking Reference:</span>
      <span class="font-mono font-bold text-slate-800">${trip.tripRef}</span>
    </div>
    <div class="receipt-item-row">
      <span>Commuter Name:</span>
      <span class="font-semibold text-slate-800">${trip.passenger.name}</span>
    </div>
    <div class="receipt-item-row">
      <span>Driver Partner:</span>
      <span class="text-slate-800">${trip.driverName} (ID: #${trip.driverId})</span>
    </div>
    <div class="receipt-item-row">
      <span>Corridor Route:</span>
      <span class="text-electric font-semibold">${trip.corridorPath.join(' &rarr; ')}</span>
    </div>
    <div class="receipt-item-row">
      <span>Distance & Time:</span>
      <span class="text-slate-800">${trip.distance} km &bull; ~${trip.time} mins</span>
    </div>
    <div class="receipt-item-row">
      <span>Net Carbon Avoided:</span>
      <span class="text-emerald font-bold font-mono">+${trip.co2Saved} kg CO₂</span>
    </div>
    <div class="receipt-item-row">
      <span>Corridor Alignment Match:</span>
      <span class="text-emerald font-bold">${trip.matchScore}% Eco-Pooled Match</span>
    </div>
    <div class="receipt-item-row bold-row">
      <span>Total Pooled Fare Paid:</span>
      <span class="text-slate-900">$${trip.fare} USD</span>
    </div>
  `;

  modal.classList.remove('hidden');
};

// ==========================================
// 9. INITIALIZATION & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  urbanCanvasInstance = new Urban3DCanvas('urban-3d-canvas');
  ambientCanvasInstance = new AmbientEcoCanvas('ambient-canvas');
  initTabNavigation();

  // Populate Select Boxes
  const originSel = document.getElementById('route-origin');
  const destSel = document.getElementById('route-destination');
  const passPickup = document.getElementById('passenger-pickup-select');
  const passDrop = document.getElementById('passenger-drop-select');
  const driverStation = document.getElementById('driver-station-select');

  TRANSIT_STATIONS.forEach(s => {
    const opt = `<option value="${s.id}">${s.name} (${s.zone})</option>`;
    originSel.insertAdjacentHTML('beforeend', opt);
    destSel.insertAdjacentHTML('beforeend', opt);
    passPickup.insertAdjacentHTML('beforeend', opt);
    passDrop.insertAdjacentHTML('beforeend', opt);
    driverStation.insertAdjacentHTML('beforeend', opt);
  });

  originSel.value = 'ALPHA';
  destSel.value = 'HORIZON';
  passPickup.value = 'ALPHA';
  passDrop.value = 'HORIZON';
  driverStation.value = 'METRO';

  // --- Dynamic Commuter Slider Handler ---
  const commuterSlider = document.getElementById('commuter-range-slider');
  const sliderFareDisplay = document.getElementById('slider-fare-display');
  const sliderTicks = document.querySelectorAll('.slider-ticks .tick');

  function updateCommuterSliderMetrics() {
    const val = parseInt(commuterSlider.value, 10);
    engine.commuterDensity = val;

    sliderTicks.forEach((tick, idx) => {
      tick.classList.toggle('active-tick', idx + 1 === val);
    });

    computeAndDisplayRoute();
  }

  commuterSlider.addEventListener('input', updateCommuterSliderMetrics);

  // --- Interactive 4-Seat Vehicle Selector ---
  const seatButtons = [
    document.getElementById('seat-front-pass'),
    document.getElementById('seat-rear-left'),
    document.getElementById('seat-rear-right')
  ];
  const driverSeatsCountLabel = document.getElementById('driver-seats-count-label');

  function getActiveSeatsCount() {
    let count = 0;
    seatButtons.forEach(btn => {
      if (btn.classList.contains('active-seat')) count++;
    });
    return count;
  }

  seatButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active-seat')) {
        btn.classList.remove('active-seat');
        btn.classList.add('reserved-seat');
        btn.innerHTML = `<i class="fa-solid fa-ban"></i><span>OFF</span>`;
      } else {
        btn.classList.remove('reserved-seat');
        btn.classList.add('active-seat');
        btn.innerHTML = `<i class="fa-solid fa-user-check"></i><span>${btn.dataset.seat.toUpperCase()}</span>`;
      }
      const count = getActiveSeatsCount();
      driverSeatsCountLabel.textContent = count;
      showPlatformToast(`Car configuration: ${count} passenger seats available.`, 'emerald');
    });
  });

  // --- Calculate Route Button ---
  function computeAndDisplayRoute() {
    const orig = originSel.value;
    const dest = destSel.value;

    if (orig === dest) {
      showPlatformToast('Origin and Destination stations cannot be identical.', 'rose');
      return;
    }

    const res = engine.findOptimalEcoRoute(orig, dest);
    urbanCanvasInstance.setActivePath(res.path);

    document.getElementById('strip-path').textContent = res.path.join(' → ');
    document.getElementById('strip-distance').textContent = `${res.totalDist} km`;
    document.getElementById('strip-time').textContent = `~${res.estTime} min`;
    document.getElementById('strip-co2').textContent = `-${res.co2Offset} kg`;
    document.getElementById('strip-vehicles-saved').textContent = `${res.soloCarsSaved} ${res.soloCarsSaved === 1 ? 'Car' : 'Cars'}`;
    sliderFareDisplay.textContent = `$${res.fare}`;

    showPlatformToast(`Optimal eco-route: ${res.totalDist} km, saving ${res.co2Offset} kg CO₂.`, 'emerald');
  }

  document.getElementById('btn-calc-route').addEventListener('click', computeAndDisplayRoute);

  document.getElementById('btn-simulate-drive').addEventListener('click', () => {
    urbanCanvasInstance.startCarSimulation();
    showPlatformToast('Simulating top-down electric transit drive along route corridors!', 'blue');
  });

  document.getElementById('btn-swap-route').addEventListener('click', () => {
    const temp = originSel.value;
    originSel.value = destSel.value;
    destSel.value = temp;
    computeAndDisplayRoute();
  });

  document.getElementById('btn-reset-view').addEventListener('click', () => {
    urbanCanvasInstance.resetCamera();
  });

  // --- Passenger Request ---
  document.getElementById('btn-request-ride').addEventListener('click', () => {
    const nameInput = document.getElementById('passenger-name-input');
    const name = nameInput.value.trim() || `Commuter_${Math.floor(Math.random() * 900 + 100)}`;
    const pickup = passPickup.value;
    const drop = passDrop.value;

    if (pickup === drop) {
      showPlatformToast('Pickup and drop-off stations must be distinct.', 'rose');
      return;
    }

    const passenger = engine.submitRideRequest(name, pickup, drop);
    nameInput.value = '';
    refreshPlatformUI();
    showPlatformToast(`Ride request submitted for ${passenger.name} (${pickup} → ${drop}).`, 'emerald');
  });

  document.getElementById('btn-cancel-front-req').addEventListener('click', () => {
    const dequeued = engine.dequeueNextRequest();
    if (dequeued) {
      refreshPlatformUI();
      showPlatformToast(`Dispatched or cancelled request for ${dequeued.name} (${dequeued.id}).`, 'amber');
    } else {
      showPlatformToast('No pending passenger requests in the pipeline.', 'rose');
    }
  });

  // --- Priority Standby Lounge ---
  document.getElementById('btn-push-standby').addEventListener('click', () => {
    let candidate = engine.dequeueNextRequest();
    if (!candidate) {
      candidate = {
        id: `BK-STDBY-${Math.floor(Math.random() * 800 + 100)}`,
        name: `Standby_Passenger_${Math.floor(Math.random() * 90 + 10)}`,
        pickup: 'METRO',
        drop: 'SKYPORT',
        requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'In Priority Standby'
      };
    }

    const res = engine.pushToStandby(candidate);
    if (!res.success) {
      showPlatformToast(res.message, 'rose');
      engine.dispatchStream.unshift(candidate);
    } else {
      showPlatformToast(`${candidate.name} admitted to Priority Standby Lounge.`, 'amber');
    }
    refreshPlatformUI();
  });

  document.getElementById('btn-pop-standby').addEventListener('click', () => {
    const res = engine.popFromStandby();
    if (!res.success) {
      showPlatformToast(res.message, 'rose');
    } else {
      showPlatformToast(`Seated ${res.item.name} from Priority Standby Lounge.`, 'amber');
    }
    refreshPlatformUI();
  });

  // --- Driver Partner Registration with Visual Seat Selector ---
  document.getElementById('btn-register-driver').addEventListener('click', () => {
    const nameInput = document.getElementById('driver-name-input');
    const name = nameInput.value.trim() || `Partner_${Math.floor(Math.random() * 900 + 100)}`;
    const station = driverStation.value;
    const seats = getActiveSeatsCount();

    if (seats === 0) {
      showPlatformToast('Please toggle at least 1 passenger seat in the vehicle blueprint.', 'rose');
      return;
    }

    const partner = engine.onboardDriver(name, station, seats);
    nameInput.value = '';
    refreshPlatformUI();
    showPlatformToast(`Driver Partner ${partner.name} onboarded with ${partner.seats} passenger seats (ID: #${partner.id}).`, 'emerald');
  });

  // --- Flexible Verification & Lookup ---
  document.getElementById('btn-verify-id').addEventListener('click', () => {
    const idInput = document.getElementById('verify-id-input');
    const resultBox = document.getElementById('verification-result-box');
    const query = idInput.value.trim();

    if (!query) {
      resultBox.innerHTML = '<span class="text-rose-500 text-xs">Please enter a valid Driver Partner ID or Booking Reference.</span>';
      return;
    }

    const partner = engine.getDriverById(query);
    if (partner) {
      resultBox.innerHTML = `
        <div class="flex items-center justify-between w-full text-xs">
          <div>
            <span class="text-emerald font-bold"><i class="fa-solid fa-circle-check"></i> Verified Partner:</span>
            <span class="text-slate-900 font-semibold ml-1">${partner.name} (ID: #${partner.id})</span>
            <span class="text-slate-500 ml-2">&bull; ${partner.station} Station</span>
          </div>
          <span class="seat-counter-pill">${partner.seats} Seats Free</span>
        </div>`;
      showPlatformToast(`Verified operational identity for Partner #${partner.id}.`, 'emerald');
      return;
    }

    const booking = engine.getBookingByRef(query);
    if (booking) {
      resultBox.innerHTML = `
        <div class="flex items-center justify-between w-full text-xs">
          <div>
            <span class="text-electric font-bold"><i class="fa-solid fa-ticket"></i> Verified Booking:</span>
            <span class="text-slate-900 font-semibold ml-1">${booking.tripRef} (${booking.passenger.name})</span>
            <span class="text-slate-500 ml-2">&bull; Driver: ${booking.driverName}</span>
          </div>
          <span class="route-match-badge">${booking.matchScore}% Match</span>
        </div>`;
      showPlatformToast(`Verified booking reference ${booking.tripRef}.`, 'blue');
      return;
    }

    resultBox.innerHTML = `<span class="text-rose-500 text-xs"><i class="fa-solid fa-triangle-exclamation"></i> Reference "${query}" not found in metropolitan fleet or booking registry.</span>`;
    showPlatformToast(`Reference "${query}" not recognized.`, 'rose');
  });

  // --- Match & Dispatch Shared Trip (Triggering Enterprise Confirmation Modal) ---
  document.getElementById('btn-auto-match-trip').addEventListener('click', () => {
    let passenger = engine.dequeueNextRequest();
    if (!passenger && engine.standbyCount > 0) {
      passenger = engine.popFromStandby().item;
    }

    if (!passenger) {
      showPlatformToast('No pending commuter requests waiting to be dispatched.', 'rose');
      return;
    }

    let matchedPartner = null;
    for (const partner of engine.fleetPartners) {
      if (partner.seats > 0) {
        matchedPartner = partner;
        break;
      }
    }

    if (!matchedPartner) {
      engine.dispatchStream.unshift(passenger);
      showPlatformToast('All driver partners are currently at maximum passenger capacity.', 'rose');
      return;
    }

    const route = engine.findOptimalEcoRoute(passenger.pickup, passenger.drop);
    const matchScore = Math.floor(Math.random() * 14 + 85);

    const trip = engine.dispatchSharedTrip(
      passenger,
      matchedPartner,
      route.path,
      route.totalDist,
      route.estTime,
      route.fare,
      route.co2Offset,
      matchScore
    );

    urbanCanvasInstance.setActivePath(route.path);
    refreshPlatformUI();
    openDispatchModal(trip, matchedPartner);
  });

  // --- Revert Confirmation (Triggering Enterprise Reversal Modal) ---
  document.getElementById('btn-revert-confirmation').addEventListener('click', () => {
    const res = engine.revertLatestConfirmation();
    if (!res.success) {
      showPlatformToast(res.message, 'rose');
    } else {
      refreshPlatformUI();
      openReversalModal(res.action, res.driver);
    }
  });

  // --- Rush-Hour Simulation Scenario ---
  document.getElementById('btn-demo-rushhour').addEventListener('click', () => {
    engine.onboardDriver('Marcus Vance', 'ALPHA', 3);
    engine.onboardDriver('Elena Rostova', 'METRO', 3);
    engine.onboardDriver('Kaelen Chen', 'SKYPORT', 2);
    engine.onboardDriver('Siddharth Rao', 'QUANTUM', 3);

    engine.submitRideRequest('Dr. Aris Thorne', 'ALPHA', 'HORIZON');
    engine.submitRideRequest('Maya Lin', 'METRO', 'SKYPORT');
    engine.submitRideRequest('Amara Okafor', 'HARBOR', 'QUANTUM');

    engine.pushToStandby({
      id: 'BK-STDBY-01',
      name: 'Taro Watanabe',
      pickup: 'HARBOR',
      drop: 'HORIZON',
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Priority Standby'
    });

    const p = engine.dequeueNextRequest();
    const d = engine.fleetPartners[0];
    const r = engine.findOptimalEcoRoute(p.pickup, p.drop);
    const trip = engine.dispatchSharedTrip(p, d, r.path, r.totalDist, r.estTime, r.fare, r.co2Offset, 96);

    urbanCanvasInstance.setActivePath(r.path);
    refreshPlatformUI();
    showPlatformToast('Simulated Metropolitan Rush-Hour scenario loaded with live fleet, commuters, and active trips!', 'emerald');
  });

  // --- Quick Book CTA in Header ---
  document.getElementById('btn-quick-book').addEventListener('click', () => {
    const commuterTabBtn = document.querySelector('[data-tab="tab-passenger-hub"]');
    if (commuterTabBtn) commuterTabBtn.click();
    setTimeout(() => {
      document.getElementById('passenger-name-input').focus();
    }, 150);
  });

  // --- Dispatch Modal Actions ---
  const dispatchModal = document.getElementById('dispatch-confirm-modal');
  document.getElementById('btn-close-dispatch-modal').addEventListener('click', () => {
    dispatchModal.classList.add('hidden');
  });
  document.getElementById('btn-ack-dispatch').addEventListener('click', () => {
    dispatchModal.classList.add('hidden');
  });
  document.getElementById('btn-view-map-dispatch').addEventListener('click', () => {
    dispatchModal.classList.add('hidden');
    const mapTabBtn = document.querySelector('[data-tab="tab-route-finder"]');
    if (mapTabBtn) mapTabBtn.click();
    urbanCanvasInstance.startCarSimulation();
  });

  // --- Reversal Modal Actions ---
  const reversalModal = document.getElementById('reversal-confirm-modal');
  document.getElementById('btn-close-reversal-modal').addEventListener('click', () => {
    reversalModal.classList.add('hidden');
  });
  document.getElementById('btn-ack-reversal').addEventListener('click', () => {
    reversalModal.classList.add('hidden');
  });

  // --- Eco-Receipt Modal Controls ---
  const receiptModal = document.getElementById('receipt-modal-overlay');
  document.getElementById('btn-close-receipt').addEventListener('click', () => {
    receiptModal.classList.add('hidden');
  });
  document.getElementById('btn-done-receipt').addEventListener('click', () => {
    receiptModal.classList.add('hidden');
  });
  document.getElementById('btn-print-receipt').addEventListener('click', () => {
    window.print();
  });

  // Initial Startup
  refreshPlatformUI();
  computeAndDisplayRoute();
});
