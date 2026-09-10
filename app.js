const EMAILJS_CONFIG = {
  publicKey: "LO15atCFtgwf_cNMb",
  serviceId: "service_pfl0z5l",
  templateId: "template_hfn70fr",
};

const COLLEGE_OFFSET_SPECIAL_MINUTES = 7;
const STOP_STORAGE_KEY = "bus-stop-preference";
const UPDATE_NOTICE_STORAGE_KEY = "bus-update-notice-2026-09-10-v7-2";
const UPDATE_NOTICE_DISMISSED_VALUE = "dismissed";
const UPDATE_NOTICE_EXPIRES_AT = new Date(2026, 8, 23, 0, 0, 0, 0).getTime();

const STOPS = {
  dorm: {
    id: "dorm",
    label: "宿舍",
  },
  college: {
    id: "college",
    label: "系统楼",
  },
  eastGate: {
    id: "eastGate",
    label: "东门",
  },
  northGate: {
    id: "northGate",
    label: "北门",
  },
  militaryCenter: {
    id: "militaryCenter",
    label: "军体",
  },
  laserInstitute: {
    id: "laserInstitute",
    label: "激光所",
  },
  gaochaoNorth: {
    id: "gaochaoNorth",
    label: "高超北侧",
  },
  scienceCollege: {
    id: "scienceCollege",
    label: "理学院",
  },
  secondCanteen: {
    id: "secondCanteen",
    label: "二食堂（去往研究生宿舍）",
  },
  secondCanteenToCollege: {
    id: "secondCanteenToCollege",
    label: "二食堂（去往系统楼）",
  },
};

const DAY_PROFILES = {
  monThu: { key: "monThu", label: "周一至周四运行表" },
  friday: { key: "friday", label: "周五运行表" },
  saturday: { key: "saturday", label: "周六运行表" },
  sunday: { key: "sunday", label: "周日运行表" },
};

const CROWD_RULES = {
  dorm: {
    mild: ["08:10", "08:20"],
    high: ["08:30", "08:40", "08:50"],
  },
  college: {
    mild: ["17:00"],
    high: [],
  },
};

const DORM_WALK_LINES = new Set(["线路2", "线路5", "线路7", "线路8"]);
const ORIGIN_VISIBLE_LINES = new Set(["环线1路", "环线2路", "就餐专线"]);
const CIRCULAR_ROUTE_LINES = new Set(["环线1路"]);
const ADDITIONAL_STOP_IDS = new Set([
  "eastGate",
  "northGate",
  "militaryCenter",
  "laserInstitute",
  "gaochaoNorth",
  "scienceCollege",
  "secondCanteen",
  "secondCanteenToCollege",
]);
const DORM_WALK_NOTICE = "提醒：这班车的上车点不在宿舍楼下，从宿舍出发需要先步行到对应站点。";

// New-stop offsets use whole minutes. Existing dorm and college offsets stay
// unchanged so this version does not alter the results already used in
// production.
const LOOP_ONE_ADDITIONAL_STOP_OFFSETS = {
  eastGate: 1,
  militaryCenter: 3,
  laserInstitute: 5,
  northGate: 6,
  gaochaoNorth: 8,
  scienceCollege: 8,
  secondCanteen: 11,
};

const DINING_ADDITIONAL_STOP_OFFSETS = {
  scienceCollege: 1,
  secondCanteen: 5,
};

function createService(lineLabel, origin, destination, departures, stopOffsets) {
  return {
    lineLabel,
    origin,
    destination,
    routeLabel: `${origin} -> ${destination}`,
    departures,
    stopOffsets,
  };
}

const SCHEDULES = {
  everyday: [
    createService("环线1路", "宿舍", "系统楼", [
      "07:30", "07:40", "07:50",
      "08:00", "08:10", "08:20",
      "08:30", "08:40", "08:50",
      "09:00", "09:10", "09:20", "09:30", "09:40", "09:50",
      "10:00", "10:20", "10:30", "10:40",
      "11:00", "11:20", "11:40",
      "12:00", "12:20", "12:40",
      "14:00", "14:10", "14:20", "14:30", "14:40", "14:50",
      "15:00", "15:10", "15:20", "15:30", "15:40", "15:50",
      "16:00", "16:10", "16:20", "16:30", "16:40",
      "17:00", "17:10", "17:20", "17:30", "17:40",
      "18:00", "18:20", "18:40",
      "19:00", "19:20", "19:40",
      "20:00", "20:20", "20:40",
      "21:00", "21:20", "21:40", "21:50",
      "22:10", "22:30"
    ], {
      dorm: 0,
      college: COLLEGE_OFFSET_SPECIAL_MINUTES,
      ...LOOP_ONE_ADDITIONAL_STOP_OFFSETS,
    }),
    createService("就餐专线", "系统楼", "二食堂", [
      "11:20", "11:40", "12:00", "12:20", "12:40",
      "16:30", "16:50", "17:10", "17:30", "17:50"
    ], {
      college: 0,
      ...DINING_ADDITIONAL_STOP_OFFSETS,
    }),
    createService("环线2路", "宿舍", "系统楼", [
      "07:30", "07:40", "07:50",
      "08:00", "08:10", "08:20", "08:30", "08:40", "08:50",
      "09:00", "09:10", "09:20", "09:30", "09:40", "09:50",
      "10:00", "10:20", "10:30", "10:40",
      "11:00", "11:20", "11:40",
      "12:00", "12:20", "12:40",
      "14:00", "14:10", "14:20", "14:30", "14:40", "14:50",
      "15:00", "15:10", "15:20", "15:30", "15:40", "15:50",
      "16:00", "16:10", "16:20", "16:30", "16:35", "16:45", "16:55",
      "17:05", "17:15", "17:25", "17:35", "17:45", "17:55",
      "18:05", "18:35", "19:05", "19:35", "20:05", "20:35",
      "21:05", "21:35", "22:05"
    ], {
      dorm: 0,
      secondCanteenToCollege: 3,
      laserInstitute: 6,
      college: 10,
    }),
  ],
  monThu: [
    createService("线路2", "科大佳园", "系统楼", ["07:05", "07:20", "14:00"], { dorm: 20 }),
    createService("线路2", "系统楼", "科大佳园", ["12:05", "17:35", "21:35"], { college: 0 }),
    createService("线路5", "科大景园东门", "系统楼", ["07:20"], { dorm: 15 }),
    createService("线路5", "系统楼", "科大景园东门", ["17:30"], { college: 0 }),
    createService("线路7", "四号院家属区", "系统楼", ["07:00"], { dorm: 40 }),
    createService("线路7", "系统楼", "四号院家属区", ["17:10"], { college: 0 }),
    createService("线路8", "一号院", "系统楼", [
      "07:10", "07:20", "07:30", "09:20", "09:30", "11:25",
      "13:50", "14:00", "15:30", "16:25", "18:55", "21:00"
    ], { dorm: 25 }),
    createService("线路8", "系统楼", "一号院", [
      "07:50", "09:45", "10:00", "12:00", "12:35", "13:45",
      "16:25", "17:05", "17:30", "17:40", "17:55", "18:25",
      "21:00", "21:30", "21:35", "21:55", "22:15"
    ], { college: 0 }),
  ],
  friday: [
    createService("线路2", "科大佳园", "系统楼", ["07:05", "07:20", "14:00"], { dorm: 20 }),
    createService("线路2", "系统楼", "科大佳园", ["12:05", "17:35", "21:35"], { college: 0 }),
    createService("线路5", "科大景园东门", "系统楼", ["07:20"], { dorm: 15 }),
    createService("线路5", "系统楼", "科大景园东门", ["17:30"], { college: 0 }),
    createService("线路7", "四号院家属区", "系统楼", ["07:00"], { dorm: 40 }),
    createService("线路7", "系统楼", "四号院家属区", ["17:10"], { college: 0 }),
    createService("线路8", "一号院", "系统楼", [
      "07:10", "07:20", "07:30", "09:20", "09:30", "11:25",
      "13:50", "14:00", "15:30", "16:25", "18:55", "21:00"
    ], { dorm: 25 }),
    createService("线路8", "系统楼", "一号院", [
      "07:50", "09:45", "10:00", "12:00", "12:35", "13:45",
      "16:25", "17:05", "17:30", "17:40", "17:55", "18:25",
      "21:00", "21:35", "21:55", "22:15"
    ], { college: 0 }),
  ],
  saturday: [
    createService("线路2", "科大佳园", "系统楼", ["07:23", "13:55"], { dorm: 20 }),
    createService("线路8", "一号院", "系统楼", ["07:20", "09:30", "11:25", "13:50", "15:30", "18:55"], { dorm: 25 }),
    createService("线路8", "系统楼", "一号院", ["07:50", "10:00", "12:00", "12:35", "16:25", "17:30", "18:25", "21:35", "22:15"], { college: 0 }),
  ],
  sunday: [
    createService("线路8", "一号院", "系统楼", ["07:20", "09:30", "13:50"], { dorm: 25 }),
    createService("线路8", "系统楼", "一号院", ["12:35", "17:30", "22:15"], { college: 0 }),
  ],
};

const elements = {
  currentTime: document.getElementById("currentTime"),
  currentDate: document.getElementById("currentDate"),
  activeScheduleLabel: document.getElementById("activeScheduleLabel"),
  queryReferenceText: document.getElementById("queryReferenceText"),
  queryReferenceNote: document.getElementById("queryReferenceNote"),
  queryDateTime: document.getElementById("queryDateTime"),
  manualField: document.getElementById("manualField"),
  selectedStopLabel: document.getElementById("selectedStopLabel"),
  nextDayLabel: document.getElementById("nextDayLabel"),
  nextTime: document.getElementById("nextTime"),
  nextLineLabel: document.getElementById("nextLineLabel"),
  waitText: document.getElementById("waitText"),
  tripMeta: document.getElementById("tripMeta"),
  walkWarning: document.getElementById("walkWarning"),
  crowdNote: document.getElementById("crowdNote"),
  secondaryTrip: document.getElementById("secondaryTrip"),
  timeline: document.getElementById("timeline"),
  timelineNote: document.getElementById("timelineNote"),
  feedbackForm: document.getElementById("feedbackForm"),
  feedbackText: document.getElementById("feedbackText"),
  feedbackContact: document.getElementById("feedbackContact"),
  feedbackStatus: document.getElementById("feedbackStatus"),
  updateNotice: document.getElementById("updateNotice"),
  updateNoticeClose: document.getElementById("updateNoticeClose"),
  updateNoticeDismiss: document.getElementById("updateNoticeDismiss"),
  stopButtons: [...document.querySelectorAll("[data-stop]")],
  modeButtons: [...document.querySelectorAll("[data-query-mode]")],
};

const state = {
  selectedStop: readInitialStop(),
  queryMode: "now",
};

initializeEmailJs();
elements.queryDateTime.value = formatDateTimeLocal(new Date());

function initializeEmailJs() {
  if (!window.emailjs) {
    return;
  }

  if (!EMAILJS_CONFIG.publicKey || EMAILJS_CONFIG.publicKey === "YOUR_EMAILJS_PUBLIC_KEY") {
    return;
  }

  window.emailjs.init({
    publicKey: EMAILJS_CONFIG.publicKey,
  });
}

function isEmailJsConfigured() {
  return window.emailjs
    && EMAILJS_CONFIG.publicKey !== "YOUR_EMAILJS_PUBLIC_KEY"
    && EMAILJS_CONFIG.serviceId !== "YOUR_EMAILJS_SERVICE_ID"
    && EMAILJS_CONFIG.templateId !== "YOUR_EMAILJS_TEMPLATE_ID";
}

function shouldShowUpdateNotice() {
  return Date.now() < UPDATE_NOTICE_EXPIRES_AT
    && window.localStorage.getItem(UPDATE_NOTICE_STORAGE_KEY) !== UPDATE_NOTICE_DISMISSED_VALUE;
}

function showUpdateNotice() {
  elements.updateNotice.hidden = false;
  document.body.classList.add("notice-open");
  elements.updateNoticeClose.focus();
}

function hideUpdateNotice() {
  elements.updateNotice.hidden = true;
  document.body.classList.remove("notice-open");
}

function dismissUpdateNoticePermanently() {
  window.localStorage.setItem(UPDATE_NOTICE_STORAGE_KEY, UPDATE_NOTICE_DISMISSED_VALUE);
  hideUpdateNotice();
}

function initializeUpdateNotice() {
  if (!elements.updateNotice) {
    return;
  }

  elements.updateNoticeClose.addEventListener("click", hideUpdateNotice);
  elements.updateNoticeDismiss.addEventListener("click", dismissUpdateNoticePermanently);
  elements.updateNotice.addEventListener("click", (event) => {
    if (event.target.dataset.updateNoticeClose !== undefined) {
      hideUpdateNotice();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.updateNotice.hidden) {
      hideUpdateNotice();
    }
  });

  if (shouldShowUpdateNotice()) {
    showUpdateNotice();
  }
}

function readInitialStop() {
  const params = new URLSearchParams(window.location.search);
  const paramStop = params.get("stop");

  if (paramStop && STOPS[paramStop]) {
    return paramStop;
  }

  const storedStop = window.localStorage.getItem(STOP_STORAGE_KEY);
  return STOPS[storedStop] ? storedStop : "dorm";
}

function toMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, date.getHours(), date.getMinutes(), 0, 0);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function differenceInCalendarDays(later, earlier) {
  const laterStart = startOfDay(later).getTime();
  const earlierStart = startOfDay(earlier).getTime();
  return Math.round((laterStart - earlierStart) / (24 * 60 * 60 * 1000));
}

function formatTime(date) {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(date) {
  return date.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function formatDateTimeLabel(date) {
  return `${formatDateLabel(date)} ${formatTime(date)}`;
}

function formatShortDateTime(date) {
  return `${date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  })} ${formatTime(date)}`;
}

function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseDateTimeLocal(value) {
  if (!value) {
    return null;
  }

  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) {
    return null;
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  if ([year, month, day, hours, minutes].some((part) => Number.isNaN(part))) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function resolveDayProfile(date) {
  const day = date.getDay();

  if (day === 0) {
    return DAY_PROFILES.sunday;
  }
  if (day === 6) {
    return DAY_PROFILES.saturday;
  }
  if (day === 5) {
    return DAY_PROFILES.friday;
  }
  return DAY_PROFILES.monThu;
}

function getServicesForDate(date) {
  const profile = resolveDayProfile(date);
  const everydayServices = profile.key === "saturday" || profile.key === "sunday"
    ? []
    : SCHEDULES.everyday;
  return [...everydayServices, ...SCHEDULES[profile.key]];
}

function buildDateAtTime(date, hhmm) {
  const totalMinutes = toMinutes(hhmm);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
}

function getCrowdLevel(lineLabel, stopId, departureTime) {
  if (lineLabel !== "环线1路") {
    return null;
  }

  const stopRules = CROWD_RULES[stopId];
  if (!stopRules) {
    return null;
  }

  if (stopRules.high.includes(departureTime)) {
    return { level: "high", text: "高度拥挤" };
  }

  if (stopRules.mild.includes(departureTime)) {
    return { level: "mild", text: "轻微拥挤" };
  }

  return null;
}

function buildTrip(service, departure, date, stopId) {
  const selectedStopOffset = service.stopOffsets[stopId];
  if (selectedStopOffset === undefined) {
    return null;
  }

  const departureDate = buildDateAtTime(date, departure);
  const stopDates = {};

  Object.entries(service.stopOffsets).forEach(([key, offset]) => {
    stopDates[key] = addMinutes(departureDate, offset);
  });

  return {
    lineLabel: service.lineLabel,
    origin: service.origin,
    destination: service.destination,
    routeLabel: CIRCULAR_ROUTE_LINES.has(service.lineLabel) && ADDITIONAL_STOP_IDS.has(stopId)
      ? `${service.origin} -> ${service.destination} -> ${service.origin}（环线）`
      : service.routeLabel,
    departureTime: departure,
    boardingDate: stopDates[stopId],
    stopDates,
    crowd: getCrowdLevel(service.lineLabel, stopId, departure),
  };
}

function buildTripsForDate(date, stopId) {
  return getServicesForDate(date)
    .flatMap((service) => service.departures.map((departure) => buildTrip(service, departure, date, stopId)))
    .filter(Boolean)
    .sort((left, right) => left.boardingDate - right.boardingDate);
}

function getUpcomingTrips(queryDate, stopId, count = 6, horizonDays = 8) {
  const trips = [];
  const firstDay = startOfDay(queryDate);

  for (let offset = 0; offset < horizonDays; offset += 1) {
    trips.push(...buildTripsForDate(addDays(firstDay, offset), stopId));
  }

  return trips
    .filter((trip) => trip.boardingDate >= queryDate)
    .sort((left, right) => left.boardingDate - right.boardingDate)
    .slice(0, count);
}

function getQueryDate() {
  if (state.queryMode === "manual") {
    return parseDateTimeLocal(elements.queryDateTime.value) || new Date();
  }
  return new Date();
}

function getReferenceDayLabel(date, referenceDate) {
  const dayDiff = differenceInCalendarDays(date, referenceDate);
  if (dayDiff === 0) {
    return "今天";
  }
  if (dayDiff === 1) {
    return "明天";
  }
  if (dayDiff === 2) {
    return "后天";
  }

  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function describeWait(fromDate, toDate) {
  const waitMinutes = Math.max(0, Math.round((toDate - fromDate) / (60 * 1000)));
  if (waitMinutes === 0) {
    return "就是现在";
  }

  const days = Math.floor(waitMinutes / 1440);
  const hours = Math.floor((waitMinutes % 1440) / 60);
  const minutes = waitMinutes % 60;
  const parts = [];

  if (days > 0) {
    parts.push(`${days} 天`);
  }
  if (hours > 0) {
    parts.push(`${hours} 小时`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} 分钟`);
  }

  return `${parts.join(" ")}后`;
}

function buildBoardingText(trip, stopId) {
  return `${STOPS[stopId].label} ${formatTime(trip.boardingDate)} 可上车`;
}

function buildDepartureText(trip) {
  if (ORIGIN_VISIBLE_LINES.has(trip.lineLabel)) {
    return `起点为${trip.origin} ${trip.departureTime} 发车`;
  }

  return `起点 ${trip.departureTime} 发车`;
}

function getWalkWarning(trip, stopId) {
  if (stopId !== "dorm") {
    return "";
  }

  return DORM_WALK_LINES.has(trip.lineLabel) ? DORM_WALK_NOTICE : "";
}

function renderClock() {
  const now = new Date();
  elements.currentTime.textContent = formatTime(now);
  elements.currentDate.textContent = formatDateLabel(now);
}

function renderQueryControls(queryDate, profile) {
  const isManual = state.queryMode === "manual";

  elements.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.queryMode === state.queryMode);
  });

  elements.manualField.classList.toggle("is-hidden", !isManual);
  elements.queryDateTime.disabled = !isManual;
  elements.activeScheduleLabel.textContent = profile.label;
  elements.queryReferenceText.textContent = state.queryMode === "manual"
    ? formatDateTimeLabel(queryDate)
    : `现在 · ${formatDateTimeLabel(queryDate)}`;
  elements.queryReferenceNote.textContent = "";
  elements.queryReferenceNote.hidden = true;
}

function renderToggle() {
  elements.stopButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.stop === state.selectedStop);
  });
}

function renderCrowdNote(trip) {
  elements.crowdNote.className = "crowd-note is-hidden";
  elements.crowdNote.textContent = "";

  if (!trip.crowd) {
    return;
  }

  elements.crowdNote.className = `crowd-note ${trip.crowd.level}`;
  elements.crowdNote.textContent = trip.crowd.text;
}

function renderMainTrip(queryDate, stopId) {
  const trips = getUpcomingTrips(queryDate, stopId, 2);
  const nextTrip = trips[0];
  const secondTrip = trips[1];
  const walkWarning = getWalkWarning(nextTrip, stopId);

  elements.selectedStopLabel.textContent = `${STOPS[stopId].label}最近一班`;
  elements.nextDayLabel.textContent = getReferenceDayLabel(nextTrip.boardingDate, queryDate);
  elements.nextTime.textContent = formatTime(nextTrip.boardingDate);
  elements.nextLineLabel.textContent = `${nextTrip.lineLabel} · ${nextTrip.routeLabel}`;
  elements.waitText.textContent = `${describeWait(queryDate, nextTrip.boardingDate)} · ${buildBoardingText(nextTrip, stopId)} · ${buildDepartureText(nextTrip)}`;
  elements.tripMeta.textContent = "";
  elements.tripMeta.hidden = true;
  elements.walkWarning.classList.toggle("is-hidden", !walkWarning);
  elements.walkWarning.textContent = walkWarning;
  renderCrowdNote(nextTrip);
  elements.secondaryTrip.textContent = secondTrip
    ? `下一班 ${formatTime(secondTrip.boardingDate)} · （${buildDepartureText(secondTrip)}）`
    : "查询范围内没有更多班次";
}

function createTimelineItem(trip, queryDate, stopId) {
  const item = document.createElement("article");
  const head = document.createElement("div");
  const time = document.createElement("strong");
  const day = document.createElement("span");
  const line = document.createElement("p");
  const meta = document.createElement("p");
  const warning = document.createElement("p");
  const wait = document.createElement("p");

  item.className = "timeline-item";
  head.className = "timeline-head";
  time.className = "timeline-time";
  day.className = "timeline-day";
  line.className = "timeline-line";
  meta.className = "timeline-meta";
  warning.className = "timeline-warning";
  wait.className = "timeline-wait";

  time.textContent = formatTime(trip.boardingDate);
  day.textContent = getReferenceDayLabel(trip.boardingDate, queryDate);
  line.textContent = `${trip.lineLabel} · ${trip.routeLabel}`;
  meta.textContent = `（${buildDepartureText(trip)}） · ${buildBoardingText(trip, stopId)}`;
  warning.textContent = getWalkWarning(trip, stopId);
  wait.textContent = describeWait(queryDate, trip.boardingDate);

  head.appendChild(time);
  head.appendChild(day);
  item.appendChild(head);
  item.appendChild(line);
  item.appendChild(meta);
  if (warning.textContent) {
    item.appendChild(warning);
  }

  if (trip.crowd) {
    const crowd = document.createElement("p");
    crowd.className = `timeline-crowd ${trip.crowd.level}`;
    crowd.textContent = trip.crowd.text;
    item.appendChild(crowd);
  }

  item.appendChild(wait);
  return item;
}

function renderTimeline(queryDate, stopId) {
  const trips = getUpcomingTrips(queryDate, stopId, 6);

  elements.timeline.innerHTML = "";
  trips.forEach((trip) => {
    elements.timeline.appendChild(createTimelineItem(trip, queryDate, stopId));
  });
  elements.timelineNote.textContent = `按 ${formatShortDateTime(queryDate)} 查询 ${STOPS[stopId].label}`;
}

async function handleFeedbackSubmit(event) {
  event.preventDefault();

  const text = elements.feedbackText.value.trim();
  const contact = elements.feedbackContact.value.trim();
  const contactText = contact || "未填写";
  const messageWithContact = contact
    ? `${text}\n\n联系方式：${contact}`
    : `${text}\n\n联系方式：未填写`;

  if (!text) {
    elements.feedbackStatus.textContent = "先填写一点意见再提交。";
    return;
  }

  if (!isEmailJsConfigured()) {
    elements.feedbackStatus.textContent = "还没填 EmailJS 配置。请先在 app.js 顶部填写 public key、service id、template id。";
    return;
  }

  elements.feedbackStatus.textContent = "发送中...";

  try {
    await window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
      message: messageWithContact,
      contact: contactText,
      user_contact: contactText,
      reply_to: contact,
      submitted_at: formatDateTimeLabel(new Date()),
      page_url: window.location.href,
      selected_stop: STOPS[state.selectedStop].label,
      query_mode: state.queryMode === "manual" ? "手动时间" : "按现在",
      query_time: elements.queryReferenceText.textContent,
    });

    elements.feedbackText.value = "";
    elements.feedbackContact.value = "";
    elements.feedbackStatus.textContent = "已经提交意见。";
  } catch (error) {
    elements.feedbackStatus.textContent = "意见提交失败，EmailIJS服务失效。";
  }
}

function render() {
  const queryDate = getQueryDate();
  const profile = resolveDayProfile(queryDate);

  renderClock();
  renderQueryControls(queryDate, profile);
  renderToggle();
  renderMainTrip(queryDate, state.selectedStop);
  renderTimeline(queryDate, state.selectedStop);
}

function setSelectedStop(stopId) {
  if (!STOPS[stopId]) {
    return;
  }

  state.selectedStop = stopId;
  window.localStorage.setItem(STOP_STORAGE_KEY, stopId);
  render();
}

function setQueryMode(mode) {
  if (mode !== "now" && mode !== "manual") {
    return;
  }

  state.queryMode = mode;
  if (mode === "manual" && !elements.queryDateTime.value) {
    elements.queryDateTime.value = formatDateTimeLocal(new Date());
  }
  render();
}

elements.stopButtons.forEach((button) => {
  button.addEventListener("click", () => setSelectedStop(button.dataset.stop));
});

elements.modeButtons.forEach((button) => {
  button.addEventListener("click", () => setQueryMode(button.dataset.queryMode));
});

elements.queryDateTime.addEventListener("input", () => {
  if (state.queryMode === "manual") {
    render();
  }
});

elements.feedbackForm.addEventListener("submit", handleFeedbackSubmit);

render();
initializeUpdateNotice();
setInterval(() => {
  renderClock();
  if (state.queryMode === "now") {
    render();
  }
}, 30000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if (window.caches) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key.startsWith("bus-checker-"))
            .map((key) => window.caches.delete(key))
        );
      }
    } catch {
      // Ignore cleanup errors so the page still works as a plain static site.
    }
  });
}
