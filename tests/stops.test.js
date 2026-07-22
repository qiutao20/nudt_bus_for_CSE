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
    WEEKDAY_SIGHTSEEING_SERVICES,
    WEEKEND_HOLIDAY_SIGHTSEEING_SERVICES,
    LOOP_ONE_ADDITIONAL_STOP_OFFSETS,
    LOOP_THREE_FROM_DORM_ADDITIONAL_STOP_OFFSETS,
    LOOP_THREE_FROM_COLLEGE_ADDITIONAL_STOP_OFFSETS,
    DINING_ADDITIONAL_STOP_OFFSETS,
    buildTrip,
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
  const loopThreeFromDorm = app.WEEKDAY_SIGHTSEEING_SERVICES[0];
  const loopThreeFromCollege = app.WEEKDAY_SIGHTSEEING_SERVICES[1];

  assert.equal(app.STOPS.college.label, "系统楼");
  assert.equal(loopOne.stopOffsets.dorm, 0);
  assert.equal(loopOne.stopOffsets.college, 7);
  assert.equal(loopThreeFromDorm.stopOffsets.dorm, 0);
  assert.equal(loopThreeFromDorm.stopOffsets.college, 5);
  assert.equal(loopThreeFromCollege.stopOffsets.college, 0);
  assert.equal(loopThreeFromCollege.stopOffsets.dorm, 7);
});

test("new stop offsets match the reference app's cumulative seconds", () => {
  const assertOffsets = (actual, expectedSeconds) => {
    for (const [stopId, seconds] of Object.entries(expectedSeconds)) {
      assert.ok(Math.abs(actual[stopId] * 60 - seconds) < 1e-9, `${stopId} offset differs`);
    }
  };

  assertOffsets(app.LOOP_ONE_ADDITIONAL_STOP_OFFSETS, {
    eastGate: 75,
    militaryCenter: 207,
    laserInstitute: 283,
    northGate: 386,
    gaochaoNorth: 453,
    scienceCollege: 487,
    secondCanteen: 643,
  });
  assertOffsets(app.LOOP_THREE_FROM_DORM_ADDITIONAL_STOP_OFFSETS, {
    militaryCenter: 182,
    laserInstitute: 260,
    gaochaoSouth: 365,
    scienceCollege: 437,
    secondCanteen: 617,
  });
  assertOffsets(app.LOOP_THREE_FROM_COLLEGE_ADDITIONAL_STOP_OFFSETS, {
    scienceCollege: 44,
    secondCanteen: 224,
    militaryCenter: 706,
    laserInstitute: 784,
    gaochaoSouth: 889,
  });
  assertOffsets(app.DINING_ADDITIONAL_STOP_OFFSETS, {
    scienceCollege: 45,
    secondCanteen: 277,
  });
});

test("new boarding points are attached only to their intended services", () => {
  const loopOne = app.SCHEDULES.everyday.find((service) => service.lineLabel === "环线1路");
  const dining = app.SCHEDULES.everyday.find((service) => service.lineLabel === "就餐专线v2");
  const loopThreeServices = [
    ...app.WEEKDAY_SIGHTSEEING_SERVICES,
    ...app.WEEKEND_HOLIDAY_SIGHTSEEING_SERVICES,
  ];

  [
    "eastGate",
    "northGate",
    "militaryCenter",
    "laserInstitute",
    "gaochaoNorth",
    "scienceCollege",
    "secondCanteen",
  ].forEach((stopId) => assert.ok(loopOne.stopOffsets[stopId] !== undefined));
  assert.equal(loopOne.stopOffsets.gaochaoSouth, undefined);
  assert.ok(dining.stopOffsets.scienceCollege !== undefined);
  assert.ok(dining.stopOffsets.secondCanteen !== undefined);
  assert.equal(dining.stopOffsets.gaochaoNorth, undefined);
  assert.equal(dining.stopOffsets.gaochaoSouth, undefined);
  loopThreeServices.forEach((service) => {
    [
      "militaryCenter",
      "laserInstitute",
      "gaochaoSouth",
      "scienceCollege",
      "secondCanteen",
    ].forEach((stopId) => assert.ok(service.stopOffsets[stopId] !== undefined));
    assert.equal(service.stopOffsets.eastGate, undefined);
    assert.equal(service.stopOffsets.northGate, undefined);
    assert.equal(service.stopOffsets.gaochaoNorth, undefined);
  });
});

test("second-level offsets produce the expected boarding timestamp", () => {
  const loopOne = app.SCHEDULES.everyday.find((service) => service.lineLabel === "环线1路");
  const trip = app.buildTrip(loopOne, "07:30", new Date(2026, 6, 22), "eastGate");

  assert.equal(trip.boardingDate.getHours(), 7);
  assert.equal(trip.boardingDate.getMinutes(), 31);
  assert.equal(trip.boardingDate.getSeconds(), 15);
  assert.equal(trip.routeLabel, "宿舍 -> 系统楼 -> 宿舍（环线）");
});
