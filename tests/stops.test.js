const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function createClassList() {
  return {
    add() {},
    remove() {},
    toggle() {},
  };
}

function createElement() {
  return {
    appendChild() {},
    addEventListener() {},
    classList: createClassList(),
    className: "",
    dataset: {},
    disabled: false,
    focus() {},
    hidden: false,
    innerHTML: "",
    textContent: "",
    value: "",
  };
}

function loadAppForTesting() {
  const elements = new Map();
  const storage = new Map();
  const document = {
    addEventListener() {},
    body: createElement(),
    createElement,
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createElement());
      }
      return elements.get(id);
    },
    querySelectorAll() {
      return [];
    },
  };
  const window = {
    addEventListener() {},
    emailjs: null,
    localStorage: {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
    location: {
      href: "http://localhost/",
      search: "",
    },
  };
  const context = vm.createContext({
    console,
    document,
    navigator: {},
    setInterval() {},
    URLSearchParams,
    window,
  });
  const source = fs.readFileSync(path.join(projectRoot, "app.js"), "utf8");

  vm.runInContext(source, context);
  return vm.runInContext(`({
    STOPS,
    SCHEDULES,
    LOOP_ONE_ADDITIONAL_STOP_OFFSETS,
    DINING_ADDITIONAL_STOP_OFFSETS,
    buildTrip,
    getServicesForDate,
  })`, context);
}

const app = loadAppForTesting();

test("the HTML stop buttons match the configured stops", () => {
  const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const buttonStopIds = [...html.matchAll(/data-stop="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(buttonStopIds, Object.keys(app.STOPS));
});

test("existing production offsets remain unchanged", () => {
  const loopOne = app.SCHEDULES.everyday.find((service) => service.lineLabel === "环线1路");

  assert.equal(app.STOPS.college.label, "系统楼");
  assert.equal(app.STOPS.secondCanteen.label, "二食堂（去往研究生宿舍）");
  assert.equal(app.STOPS.secondCanteenToCollege.label, "二食堂（去往系统楼）");
  assert.equal(loopOne.stopOffsets.dorm, 0);
  assert.equal(loopOne.stopOffsets.college, 7);
});

test("new stop offsets use rounded whole minutes", () => {
  assert.deepEqual({ ...app.LOOP_ONE_ADDITIONAL_STOP_OFFSETS }, {
    eastGate: 1,
    militaryCenter: 3,
    laserInstitute: 5,
    northGate: 6,
    gaochaoNorth: 8,
    scienceCollege: 8,
    secondCanteen: 11,
  });
  assert.deepEqual({ ...app.DINING_ADDITIONAL_STOP_OFFSETS }, {
    scienceCollege: 1,
    secondCanteen: 5,
  });
});

test("new boarding points are attached only to their intended services", () => {
  const loopOne = app.SCHEDULES.everyday.find((service) => service.lineLabel === "环线1路");
  const loopTwo = app.SCHEDULES.everyday.find((service) => service.lineLabel === "环线2路（观光车）");
  const dining = app.SCHEDULES.everyday.find((service) => service.lineLabel === "就餐专线");

  [
    "eastGate",
    "northGate",
    "militaryCenter",
    "laserInstitute",
    "gaochaoNorth",
    "scienceCollege",
    "secondCanteen",
  ].forEach((stopId) => assert.ok(loopOne.stopOffsets[stopId] !== undefined));
  assert.ok(dining.stopOffsets.scienceCollege !== undefined);
  assert.ok(dining.stopOffsets.secondCanteen !== undefined);
  assert.equal(dining.stopOffsets.gaochaoNorth, undefined);
  assert.deepEqual(Object.keys(loopTwo.stopOffsets), [
    "dorm",
    "secondCanteenToCollege",
    "laserInstitute",
    "college",
  ]);
});

test("the active bus schedules exactly match the September update", () => {
  const loopOne = app.SCHEDULES.everyday.find((service) => service.lineLabel === "环线1路");
  const loopTwo = app.SCHEDULES.everyday.find((service) => service.lineLabel === "环线2路（观光车）");
  const dining = app.SCHEDULES.everyday.find((service) => service.lineLabel === "就餐专线");

  assert.deepEqual(Array.from(loopOne.departures), [
    "07:30", "07:40", "07:50", "08:00", "08:10", "08:20", "08:30", "08:40", "08:50",
    "09:00", "09:10", "09:20", "09:30", "09:40", "09:50", "10:00", "10:20", "10:30",
    "10:40", "11:00", "11:20", "11:40", "12:00", "12:20", "12:40", "14:00", "14:10",
    "14:20", "14:30", "14:40", "14:50", "15:00", "15:10", "15:20", "15:30", "15:40",
    "15:50", "16:00", "16:10", "16:20", "16:30", "16:40", "17:00", "17:10", "17:20",
    "17:30", "17:40", "18:00", "18:20", "18:40", "19:00", "19:20", "19:40", "20:00",
    "20:20", "20:40", "21:00", "21:20", "21:40", "21:50", "22:10", "22:30",
  ]);
  assert.deepEqual(Array.from(dining.departures), [
    "11:20", "11:40", "12:00", "12:20", "12:40",
    "16:30", "16:50", "17:10", "17:30", "17:50",
  ]);
  assert.deepEqual(Array.from(loopTwo.departures), [
    "07:30", "07:40", "07:50", "08:00", "08:10", "08:20", "08:30", "08:40", "08:50",
    "09:00", "09:10", "09:20", "09:30", "09:40", "09:50", "10:00", "10:20", "10:30",
    "10:40", "11:00", "11:20", "11:40", "12:00", "12:20", "12:40", "14:00", "14:10",
    "14:20", "14:30", "14:40", "14:50", "15:00", "15:10", "15:20", "15:30", "15:40",
    "15:50", "16:00", "16:10", "16:20", "16:30", "16:35", "16:45", "16:55", "17:05",
    "17:15", "17:25", "17:35", "17:45", "17:55", "18:05", "18:35", "19:05", "19:35",
    "20:05", "20:35", "21:05", "21:35", "22:05",
  ]);
  assert.deepEqual({ ...loopTwo.stopOffsets }, {
    dorm: 0,
    secondCanteenToCollege: 3,
    laserInstitute: 6,
    college: 10,
  });
});

test("regular line 2 and the renamed loop line are distinct services", () => {
  const services = Object.values(app.SCHEDULES).flat();
  const monThuLineTwo = app.SCHEDULES.monThu.filter((service) => service.lineLabel === "线路2");
  const fridayLineTwo = app.SCHEDULES.friday.filter((service) => service.lineLabel === "线路2");
  const saturdayLineTwo = app.SCHEDULES.saturday.filter((service) => service.lineLabel === "线路2");

  assert.equal(services.some((service) => service.lineLabel === "线路2"), true);
  assert.equal(services.some((service) => service.lineLabel === "环线2路（观光车）"), true);
  assert.equal(services.some((service) => service.lineLabel === "环线2路"), false);
  assert.equal(services.some((service) => service.lineLabel.includes("环线3路")), false);
  assert.deepEqual(Array.from(monThuLineTwo, (service) => Array.from(service.departures)), [
    ["07:05", "07:20", "14:00"],
    ["12:05", "17:35", "21:35"],
  ]);
  assert.deepEqual(Array.from(fridayLineTwo, (service) => Array.from(service.departures)), [
    ["07:05", "07:20", "14:00"],
    ["12:05", "17:35", "21:35"],
  ]);
  assert.deepEqual(Array.from(saturdayLineTwo, (service) => Array.from(service.departures)), [
    ["07:23", "13:55"],
  ]);
  assert.equal(app.SCHEDULES.sunday.some((service) => service.lineLabel === "线路2"), false);
  assert.equal(app.STOPS.gaochaoSouth, undefined);
});

test("loop line 2 runs on non-holiday weekdays only", () => {
  const hasLoopTwo = (date) => app.getServicesForDate(date)
    .some((service) => service.lineLabel === "环线2路（观光车）");

  assert.equal(hasLoopTwo(new Date(2026, 8, 10)), true);
  assert.equal(hasLoopTwo(new Date(2026, 8, 11)), true);
  assert.equal(hasLoopTwo(new Date(2026, 8, 12)), false);
  assert.equal(hasLoopTwo(new Date(2026, 8, 13)), false);
  assert.equal(hasLoopTwo(new Date(2026, 8, 24)), true);
  assert.equal(hasLoopTwo(new Date(2026, 8, 25)), false);
});

test("whole-minute offsets produce a zero-second boarding timestamp", () => {
  const loopOne = app.SCHEDULES.everyday.find((service) => service.lineLabel === "环线1路");
  const trip = app.buildTrip(loopOne, "07:30", new Date(2026, 6, 22), "eastGate");

  assert.equal(trip.boardingDate.getHours(), 7);
  assert.equal(trip.boardingDate.getMinutes(), 31);
  assert.equal(trip.boardingDate.getSeconds(), 0);
  assert.equal(trip.routeLabel, "宿舍 -> 系统楼 -> 宿舍（环线）");
});
