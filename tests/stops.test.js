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
    HOLIDAY_CALENDARS,
    resolveDayProfile,
    buildTrip,
    getServicesForDate,
    getUpcomingTrips,
    renderMainTrip,
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
    secondCanteenToCollege: 8,
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
  assert.equal(dining.stopOffsets.secondCanteenToCollege, 8);
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
    "07:35", "07:45", "07:55", "08:05", "08:15", "08:25", "08:35", "08:45", "08:55",
    "09:05", "09:15", "09:25", "09:35", "09:45", "10:05", "10:15", "10:35", "10:45",
    "10:55", "11:05", "11:15", "11:25", "11:35", "11:45", "11:55", "12:05", "12:15",
    "12:25", "12:35", "14:05", "14:15", "14:25", "14:35", "14:45", "14:55", "15:15",
    "15:25", "15:35", "15:45", "16:05", "16:15", "16:25", "16:35", "16:45", "16:55", "17:05",
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

test("official holidays use the holiday schedule and adjusted workdays use Monday schedule", () => {
  const hasLoopTwo = (date) => app.getServicesForDate(date)
    .some((service) => service.lineLabel === "环线2路（观光车）");

  assert.equal(hasLoopTwo(new Date(2026, 8, 10)), true);
  assert.equal(hasLoopTwo(new Date(2026, 8, 11)), true);
  assert.equal(hasLoopTwo(new Date(2026, 8, 12)), true);
  assert.equal(hasLoopTwo(new Date(2026, 8, 13)), true);
  assert.equal(hasLoopTwo(new Date(2026, 8, 24)), true);
  assert.equal(hasLoopTwo(new Date(2026, 8, 25)), true);
  assert.equal(hasLoopTwo(new Date(2026, 8, 20)), true);
  assert.equal(app.resolveDayProfile(new Date(2026, 8, 20)).key, "monThu");
  assert.equal(app.resolveDayProfile(new Date(2026, 8, 25)).key, "holiday");
  assert.equal(app.resolveDayProfile(new Date(2026, 9, 10)).key, "monThu");
});

test("2026 official and 2027 provisional holiday calendars are loaded", () => {
  assert.equal(app.HOLIDAY_CALENDARS[2026].status, "official");
  assert.equal(app.HOLIDAY_CALENDARS[2026].adjustedWorkdays.has("2026-09-20"), true);
  assert.equal(app.HOLIDAY_CALENDARS[2027].status, "provisional");
  assert.equal(app.HOLIDAY_CALENDARS[2027].holidayDates.has("2027-02-05"), true);
  assert.equal(app.HOLIDAY_CALENDARS[2027].holidayDates.has("2027-10-07"), true);
  assert.equal(app.resolveDayProfile(new Date(2027, 0, 1)).key, "holiday");
});

test("whole-minute offsets produce a zero-second boarding timestamp", () => {
  const loopOne = app.SCHEDULES.everyday.find((service) => service.lineLabel === "环线1路");
  const trip = app.buildTrip(loopOne, "07:30", new Date(2026, 6, 22), "eastGate");

  assert.equal(trip.boardingDate.getHours(), 7);
  assert.equal(trip.boardingDate.getMinutes(), 31);
  assert.equal(trip.boardingDate.getSeconds(), 0);
  assert.equal(trip.routeLabel, "宿舍 -> 系统楼 -> 宿舍（环线）");
});

test("holiday loop 2 uses exact departures and weekday stops", () => {
  const expected = "07:50 08:15 08:40 09:05 09:30 09:55 10:20 10:45 11:20 11:45 12:10 12:35 14:20 14:45 15:10 15:35 16:00 16:25 16:50 17:15 17:40 18:05 18:30 18:55 19:20 19:45 20:10 20:35 21:00 21:25 21:50 22:15".split(" ");
  for (const date of [new Date(2026, 8, 12), new Date(2026, 8, 13), new Date(2026, 9, 1)]) {
    const services = app.getServicesForDate(date).filter(service => service.lineLabel.includes("环线2路"));
    assert.equal(services.length, 1);
    assert.deepEqual([...services[0].departures], expected);
    assert.deepEqual({...services[0].stopOffsets}, {dorm: 0, secondCanteenToCollege: 3, laserInstitute: 6, college: 10});
    assert.ok(!app.getServicesForDate(date).some(service => service.lineLabel === "环线1路"));
  }
});

test("removed boarding stops and same-day-only results", () => {
  assert.equal(app.STOPS.scienceCollege, undefined);
  assert.equal(app.STOPS.laserInstitute, undefined);
  const query = new Date(2026, 9, 1, 21, 50);
  const trips = app.getUpcomingTrips(query, "dorm", 100);
  assert.ok(trips.length > 0);
  assert.ok(trips.every(trip => trip.boardingDate >= query && trip.boardingDate.getDate() === 1));
  const late = new Date(2026, 9, 1, 23, 59);
  assert.equal(app.getUpcomingTrips(late, "dorm").length, 0);
  assert.doesNotThrow(() => app.renderMainTrip(late, "dorm"));
  assert.equal(app.getUpcomingTrips(new Date(2026, 9, 1, 12), "eastGate").length, 0);
  assert.doesNotThrow(() => app.renderMainTrip(new Date(2026, 9, 1, 12), "eastGate"));
});

test("holidays run only loop 2 while weekends and adjusted workdays stay distinct", () => {
  for (const date of [new Date(2026, 9, 1), new Date(2026, 9, 3), new Date(2026, 9, 4), new Date(2027, 0, 1)]) {
    const services = app.getServicesForDate(date);
    assert.equal(services.length, 1);
    assert.ok(services[0].lineLabel.includes("环线2路"));
    assert.equal(services[0].departures.length, 32);
    assert.equal(app.resolveDayProfile(date).key, "holiday");
  }
  const saturday = app.getServicesForDate(new Date(2026, 8, 12)).map(service => service.lineLabel);
  assert.ok(saturday.includes("线路2"));
  assert.ok(saturday.includes("线路8"));
  assert.ok(saturday.some(label => label.includes("环线2路")));
  const sunday = app.getServicesForDate(new Date(2026, 8, 13)).map(service => service.lineLabel);
  assert.ok(sunday.includes("线路8"));
  assert.ok(!sunday.includes("线路2"));
  assert.ok(sunday.some(label => label.includes("环线2路")));
  assert.ok(app.getServicesForDate(new Date(2026, 9, 10)).some(service => service.lineLabel === "线路8"));
});
