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
  assert.equal(app.STOPS.secondCanteen.label, "二食堂（去往研究生宿舍）");
  assert.equal(loopOne.stopOffsets.dorm, 0);
  assert.equal(loopOne.stopOffsets.college, 7);
  assert.equal(loopThreeFromDorm.stopOffsets.dorm, 0);
  assert.equal(loopThreeFromDorm.stopOffsets.college, 5);
  assert.equal(loopThreeFromCollege.stopOffsets.college, 0);
  assert.equal(loopThreeFromCollege.stopOffsets.dorm, 7);
});

test("new stop offsets use rounded whole minutes", () => {
  assert.deepEqual(app.LOOP_ONE_ADDITIONAL_STOP_OFFSETS, {
    eastGate: 1,
    militaryCenter: 3,
    laserInstitute: 5,
    northGate: 6,
    gaochaoNorth: 8,
    scienceCollege: 8,
    secondCanteen: 11,
  });
  assert.deepEqual(app.LOOP_THREE_FROM_DORM_ADDITIONAL_STOP_OFFSETS, {
    militaryCenter: 3,
    laserInstitute: 4,
    gaochaoSouth: 6,
    scienceCollege: 7,
    secondCanteen: 10,
  });
  assert.deepEqual(app.LOOP_THREE_FROM_COLLEGE_ADDITIONAL_STOP_OFFSETS, {
    scienceCollege: 1,
    secondCanteen: 4,
    militaryCenter: 12,
    laserInstitute: 13,
    gaochaoSouth: 15,
  });
  assert.deepEqual(app.DINING_ADDITIONAL_STOP_OFFSETS, {
    scienceCollege: 1,
    secondCanteen: 5,
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

test("whole-minute offsets produce a zero-second boarding timestamp", () => {
  const loopOne = app.SCHEDULES.everyday.find((service) => service.lineLabel === "环线1路");
  const trip = app.buildTrip(loopOne, "07:30", new Date(2026, 6, 22), "eastGate");

  assert.equal(trip.boardingDate.getHours(), 7);
  assert.equal(trip.boardingDate.getMinutes(), 31);
  assert.equal(trip.boardingDate.getSeconds(), 0);
  assert.equal(trip.routeLabel, "宿舍 -> 系统楼 -> 宿舍（环线）");
});
