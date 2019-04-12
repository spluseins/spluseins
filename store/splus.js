import colors from 'vuetify/es5/util/colors';
import * as moment from 'moment';
import * as chroma from '../lib/chroma';

import TIMETABLES from '~/assets/timetables.json';
import { SEMESTER_WEEK_1, shortenTimetableDegree, uniq, customScheduleToRoute, scalarArraysEqual } from '~/lib/util';

function defaultWeek() {
  if (moment().isoWeek() < SEMESTER_WEEK_1) {
    return SEMESTER_WEEK_1;
  }

  // if the user is looking at today and is on Sat/Sun, peek to the next week
  if (moment().day() == 6 || moment().day() == 0) {
    return moment().isoWeek() + 1;
  } else {
    return moment().isoWeek();
  }
}

/**
 * Return all events for the given timetable and week.
 */
export async function loadEvents(timetable, week, $get) {
  const isCustomSchedule = Array.isArray(timetable.id);

  let data;
  if (isCustomSchedule) {
    const ids = timetable.id.join(',');
    const whitelist = timetable.whitelist.join(',');
    data = await $get(`/api/splus/${ids}/${week}/${whitelist}/${timetable.label}`);
  } else {
    data = await $get(`/api/splus/${timetable.id}/${week}`);
  }

  return data.events.map((event) => ({
    ...event,
    start: moment(event.start),
    end: moment(event.end),
  }));
}

/**
 * Transform v2 events to v1 lectures.
 */
export function eventsAsLectures(events) {
  return events.map((event) => ({
    title: event.title,
    day: event.start.day(),
    begin: event.start.hour() + event.start.minute()/60,
    info: event.meta.description,
    room: event.location,
    lecturer: event.meta.organiserName,
    titleId: event.id,
    lecturerId: event.meta.organiserId,
    start: event.start,
    duration: event.duration,
  }));
}

export const state = () => ({
  /**
   * Current schedule, either one of TIMETABLES or customSchedules.
   */
  schedule: undefined,
  schedules: TIMETABLES.map(
    (timetable) => ({
      ...timetable,
      path: `${timetable.faculty} ${timetable.degree}`,
      route: {
        name: 'plan-timetable',
        params: { timetable: timetable.id },
      },
      description: `${shortenTimetableDegree(timetable)} ${timetable.label} - ${timetable.semester}. Sem.`,
      longDescription: `${timetable.label} ${timetable.semester}. Semester ${shortenTimetableDegree(timetable)}`,
    })),
  /**
   * Map of created or visited custom timetables.
   * Key: label
   *
   * Values: custom timetable like this:
   * { ...timetable, label, whitelist: [ titleId ] }
   *
   * where
   * timetable: Base timetable.
   * label: Custom name.
   * filters: Whitelist array of keys.
   */
  customSchedules: {},
  favoriteSchedules: [],
  subscribedTimetable: {},
  /**
   * Events
   */
  events: [],
  lectures: [], // TODO deprecated in favor of events
  /**
   * Currently viewed week.
   * Week 53 of year 2018 equals week 1 of year 2019.
   */
  week: undefined,
  /**
   * state for upcoming-lectures-card
   */
  upcomingLecturesTimetable: undefined,
  upcomingEvents: [],
  upcomingLectures: [], // TODO deprecated in favor of events
});

export const getters = {
  weekOrDefault: (state) => {
    return state.week || defaultWeek();
  },
  getHasLecturesOnWeekend: (state) => {
    // 0: Monday, … 4: Friday, 5: Saturday, 6: Sunday
    return state.lectures.filter(lecture => lecture.day > 4).length > 0;
  },
  /**
   * @return The lectures as timestamp-aware dayspan calendar event inputs.
   * @see https://clickermonkey.github.io/dayspan/docs/interfaces/eventinput.html
   */
  getLecturesAsEvents: (state) => {
    const uniqueIds = uniq(state.lectures)
      .map(({ lecturerId }) => lecturerId)
      .sort();

    const colorScale = chroma
      .scale([colors.lightBlue.darken4, colors.cyan.darken4])
      .colors(uniqueIds.length);

    const lecturesByStart = new Map();
    const lectureStartKey = (lecture) => `${lecture.day} ${lecture.begin}`;
    state.lectures.forEach((lecture) =>
      lecturesByStart.set(lectureStartKey(lecture), [...
        (lecturesByStart.get(lectureStartKey(lecture)) || []),
        lecture]));

    return state.lectures.map((lecture) => {
      const start = moment(lecture.start);
      const color = colorScale[uniqueIds.indexOf(lecture.lecturerId)];

      return {
        data: {
          title: lecture.title,
          color, // needs to be a hex string
          description: lecture.lecturer ? `${lecture.lecturer}\n${lecture.info}`: `${lecture.info}`,
          location: lecture.room,
          concurrentCount: lecturesByStart.get(lectureStartKey(lecture))
            .length,
          concurrentOffset: lecturesByStart.get(lectureStartKey(lecture))
            .indexOf(lecture),
        },
        schedule: {
          on: start,
          times: [ {
            hour: parseInt(lecture.begin),
            minute: lecture.begin % 1 * 60,
          } ],
          duration: lecture.duration,
          durationUnit: 'hours',
        }
      };
    });
  },
  /**
   * Convert the state's star schema: { faculty, degree, semester, ...timetable }
   * into a hierarchy: { (faculty, degree): { semester: timetables } }
   */
  getSchedulesAsTree: (state) => {
    const tree = {};
    state.schedules.forEach((timetable) => {
      const path = timetable.path;
      if (tree[path] == undefined) {
        tree[path] = {};
      }

      const leaf1 = tree[path];
      if (leaf1[timetable.semester] == undefined) {
        leaf1[timetable.semester] = [];
      }

      const leaf2 = leaf1[timetable.semester];
      leaf2.push(timetable);
    });

    return tree;
  },
  scheduleIds: (state) => {
    return state.schedules.map(({ id }) => id);
  },
  getScheduleById: (state) => (timetableId) => {
    return state.schedules.find(({ id }) => id == timetableId);
  },
  customSchedulesAsRoutes: (state) => {
    return Object.values(state.customSchedules)
      .map(customScheduleToRoute);
  },
  customScheduleLabels: (state) => {
    return Object.keys(state.customSchedules);
  },
  isCustomSchedule: (state) => {
    return !!state.schedule && !!state.schedule.whitelist;
  },
  subscribableTimetables: (state) => {
    return [...Object.values(state.customSchedules), ...state.favoriteSchedules];
  },
  hasSubscribableTimetables: (state, getters) => {
    return getters.subscribableTimetables.length > 0;
  }
};

export const mutations = {
  setLectures(state, lectures) {
    state.lectures = lectures;
  },
  setEvents(state, events) {
    state.events = events;
  },
  setUpcomingLectures(state, lectures) {
    state.upcomingLectures = lectures;
  },
  setUpcomingEvents(state, events) {
    state.upcomingEvents = events;
  },
  setWeek(state, week) {
    state.week = week;
  },
  resetWeek(state, forceDefault) {
    if (forceDefault) {
      state.week = defaultWeek();
    } else {
      state.week = state.week || defaultWeek();
    }
  },
  setSchedule(state, timetable) {
    state.schedule = timetable;
  },
  setUpcomingLecturesTimetable(state, timetable) {
    state.upcomingLecturesTimetable = timetable;
  },
  addCustomSchedule(state, customTimetable) {
    const label = customTimetable.label;
    const customTimetableStored = state.customSchedules[label];

    // detect conflicts - never overwrite
    if (customTimetableStored != undefined) {
      const coursesGiven = customTimetable.whitelist;
      const coursesStored = customTimetableStored.whitelist;

      if (customTimetable.id != customTimetableStored.id ||
          !scalarArraysEqual(coursesGiven, coursesStored)) {
        console.log('not overwriting local custom timetable ' +
          'with different configuration');
      }

      return;
    }

    this._vm.$set(state.customSchedules, label, customTimetable);
    if(Object.keys(state.subscribedTimetable).length === 0) {
      state.subscribedTimetable = state.customSchedules[label];
    }
  },
  deleteCustomSchedule(state, customTimetable) {
    this._vm.$delete(state.customSchedules, customTimetable.label);
    if(state.subscribedTimetable.label == customTimetable.label) {
      const subscribables = [...Object.values(state.customSchedules), ...state.favoriteSchedules];
      state.subscribedTimetable = subscribables.length == 0? {} : subscribables[0];
    }
  },
  addFavoriteSchedule(state, favoriteTimetable){
    if(state.favoriteSchedules.filter(favorite => favorite.id == favoriteTimetable.id).length == 0){
      state.favoriteSchedules.push(favoriteTimetable);
      if(Object.keys(state.subscribedTimetable).length === 0) {
        state.subscribedTimetable = favoriteTimetable;
      }
    }
  },
  removeFavoriteSchedule(state, favoriteTimetable){
    state.favoriteSchedules = state.favoriteSchedules
      .filter((timetable) => timetable.id != favoriteTimetable.id);
    if(state.subscribedTimetable.id == favoriteTimetable.id) {
      const subscribables = [...Object.values(state.customSchedules), ...state.favoriteSchedules];
      state.subscribedTimetable = subscribables.length == 0? {} : subscribables[0];
    }
  },
  setSubscribedTimetable(state, timetable) {
    state.subscribedTimetable = timetable;
  },
};

export const actions = {
  /**
   * Request data for the given and the next week.
   */
  async load({ state, commit }) {
    try {
      const events = await loadEvents(state.schedule, state.week, this.$axios.$get);
      const lectures = eventsAsLectures(events);
      commit('setLectures', lectures);
      commit('setEvents', events);
    } catch (error) {
      commit('enqueueError', 'Stundenplan: API-Verbindung fehlgeschlagen', {root:true});
      console.error('error during API call', error.message);
    }
  },
  /**
   * Request lectures of upcomingLecturesTimetable for defaultWeek
   */
  async loadUpcomingLectures({ state, commit }) {
    try {
      const events = await loadEvents(state.upcomingLecturesTimetable, defaultWeek(), this.$axios.$get);
      const lectures = eventsAsLectures(events);
      commit('setUpcomingLectures', lectures);
      commit('setUpcomingEvents', events);
    } catch (error) {
      commit('enqueueError', 'Stundenplan: API-Verbindung fehlgeschlagen', {root:true});
      console.error('error during API call', error.message);
    }
  },
  /**
   * Import timetable from route and set as current timetable.
   */
  importSchedule({ state, commit }, { params, query }) {
    switch (parseFloat(query.v)) {
      case 1:
        const whitelist = Array.isArray(query.course || []) ?
          query.course : [query.course];
        const id = Array.isArray(query.id || []) ?
          query.id : [query.id];
        const label = query.name;
        const customTimetable = { id, label, whitelist };

        commit('addCustomSchedule', customTimetable);
        commit('setSchedule', customTimetable);
        break;
      default:
        if (!isNaN(query.v)) {
          console.log('unsupported custom timetable query version', query);
        }

        const timetable = state.schedules
          .find((timetable) => timetable.id == params.timetable);

        // standard, no filters
        commit('setSchedule', timetable);
    }
  },
};
