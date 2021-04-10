import dayjs from 'dayjs';
import colors from 'vuetify/lib/util/colors'
import * as chroma from '../lib/chroma';

import TIMETABLES from '~/assets/timetables.json';
import { SEMESTER_WEEK_1, shortenTimetableDegree, uniq, customTimetableToRoute, scalarArraysEqual } from '~/lib/util';

const formatDayjs = (date) => { return date.format('YYYY-MM-DD'); };

function defaultWeek () {
  if (dayjs().isoWeek() < SEMESTER_WEEK_1 && (SEMESTER_WEEK_1 - dayjs().isoWeek()) < 8) {
    // Use semester beginning instead of today if semester hasn't started yet
    // Do that only a few weeks before the semester so we avoid bugs with year wraparounds
    return formatDayjs(dayjs().isoWeek(SEMESTER_WEEK_1));
  }

  // if the user is looking at today and is on Sat/Sun, peek to the next week
  if (dayjs().isoWeekday() === 6 || dayjs().isoWeekday() === 7) {
    return formatDayjs(dayjs().startOf('isoweek').add('1', 'week'));
  } else {
    return formatDayjs(dayjs().startOf('isoweek'));
  }
}

/**
 * Return all events for the given timetable and week.
 */
export async function loadEvents (timetable, weeks, $get) {
  const isCustomTimetable = Array.isArray(timetable.id);

  let data;
  if (isCustomTimetable) {
    const ids = timetable.id.join(',');
    const whitelist = timetable.whitelist.join(',');
    data = await $get(`/api/splus/${ids}/${weeks}/${whitelist}/${timetable.label}`);
  } else {
    data = await $get(`/api/splus/${timetable.id}/${weeks}`);
  }

  return data.events;
}

/**
 * Return all unique lectures for the given timetable.
 */
export async function loadUniqueLectures (timetable, $get) {
  return await $get(`/api/splus/${timetable.id}/lectures`);
}

/**
 * Transform v2 events to v1 lectures.
 */
export function eventsAsLectures (events) {
  return events.map((event) => {
    const startMoment = dayjs(event.start);
    return {
      title: event.title,
      day: startMoment.isoWeekday(),
      begin: startMoment.hour() + startMoment.minute() / 60,
      info: event.meta.description,
      room: event.location,
      lecturer: event.meta.organiserName,
      titleId: event.id,
      organiserShortname: event.meta.organiserShortname,
      start: event.start,
      duration: event.duration
    };
  });
}

export const state = () => ({
  /**
   * Current timetable, either one of TIMETABLES or customTimetable.
   */
  schedule: undefined,
  schedules: TIMETABLES.map(
    (timetable) => ({
      ...timetable,
      path: `${timetable.faculty} ${timetable.degree}`,
      route: {
        name: 'plan-timetable',
        params: { timetable: timetable.id }
      },
      description: `${shortenTimetableDegree(timetable)} ${timetable.label} - ${timetable.semester}. Sem.`,
      longDescription: timetable.degree === 'Räume'
        ? `${timetable.semester} – Raum ${timetable.label}`
        : `${timetable.label} ${timetable.semester}. Semester ${shortenTimetableDegree(timetable)}`
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
   * Currently viewed week as a date string. The date string specifies the first day of that week.
   */
  week: undefined,
  /**
   * state for upcoming-lectures-card
   */
  upcomingLecturesTimetable: undefined,
  upcomingEvents: []
});

export const getters = {
  weekOrDefault: (state) => {
    return state.week || defaultWeek();
  },
  getHasEventsOnWeekend: (state) => {
    return state.events
      .map(({ start }) => dayjs(start).isoWeekday())
      .filter((day) => day > 5) // 1: Monday, 5: Friday
      .length > 0;
  },
  /**
   * @return The events as timestamp-aware dayspan calendar event inputs.
   * @see https://clickermonkey.github.io/dayspan/docs/interfaces/eventinput.html
   */
  getCalendarEvents: (state) => {
    const uniqueIds = uniq(state.events
      .map((event) => event.meta.organiserShortname)
      .sort());

    const colorScale = chroma
      .scale([colors.blue.darken2, colors.teal.darken4])
      .colors(uniqueIds.length);

    const eventsByStart = new Map();
    state.events.forEach((event) =>
      eventsByStart.set(event.start, [...(eventsByStart.get(event.start) || []), event]));

    return state.events.map((event) => {
      const color = colorScale[uniqueIds.indexOf(event.meta.organiserShortname)];
      const description = event.meta.organiserName ? `${event.meta.organiserName}\n${event.meta.description}` : `${event.meta.description}`;

      const startMoment = dayjs(event.start);
      return {
        name: event.title,
        start: startMoment.format('YYYY-MM-DD HH:mm'),
        end: startMoment.add(event.duration, 'hours').format('YYYY-MM-DD HH:mm'),
        desc: description,
        location: event.location,
        color: color
      };
    });
  },
  /**
   * Convert the state's star schema: { faculty, degree, semester, ...timetable }
   * into a hierarchy: { (faculty, degree): { semester: timetables } }
   */
  getTimetablesAsTree: (state) => {
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
  timetableIds: (state) => {
    return state.schedules.map(({ id }) => id);
  },
  getTimetableById: (state) => (timetableId) => {
    return state.schedules.find(({ id }) => id === timetableId);
  },
  customTimetablesAsRoutes: (state) => {
    return Object.values(state.customSchedules)
      .map(customTimetableToRoute);
  },
  customTimetableLabels: (state) => {
    return Object.keys(state.customSchedules);
  },
  isCustomTimetable: (state) => {
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
  setLectures (state, lectures) {
    state.lectures = lectures;
  },
  setEvents (state, events) {
    state.events = events;
  },
  setUpcomingEvents (state, events) {
    state.upcomingEvents = events;
  },
  decrementWeek (state) {
    state.week = formatDayjs(dayjs(state.week).subtract('1', 'week'));
  },
  incrementWeek (state) {
    state.week = formatDayjs(dayjs(state.week).add('1', 'week'));
  },
  resetWeek (state, forceDefault) {
    if (forceDefault) {
      state.week = defaultWeek();
    } else {
      state.week = state.week || defaultWeek();
    }
  },
  setSchedule (state, timetable) {
    state.schedule = timetable;
  },
  setUpcomingLecturesTimetable (state, timetable) {
    state.upcomingLecturesTimetable = timetable;
  },
  addCustomSchedule (state, customTimetable) {
    const label = customTimetable.label;
    const customTimetableStored = state.customSchedules[label];

    // detect conflicts - never overwrite
    if (customTimetableStored !== undefined) {
      const coursesGiven = customTimetable.whitelist;
      const coursesStored = customTimetableStored.whitelist;

      if (customTimetable.id !== customTimetableStored.id ||
          !scalarArraysEqual(coursesGiven, coursesStored)) {
        console.log('not overwriting local custom timetable ' +
          'with different configuration');
      }

      return;
    }

    this._vm.$set(state.customSchedules, label, customTimetable);
    if (Object.keys(state.subscribedTimetable).length === 0) {
      state.subscribedTimetable = state.customSchedules[label];
    }
  },
  deleteCustomSchedule (state, customTimetable) {
    this._vm.$delete(state.customSchedules, customTimetable.label);
    if (state.subscribedTimetable.label === customTimetable.label) {
      const subscribables = [...Object.values(state.customSchedules), ...state.favoriteSchedules];
      state.subscribedTimetable = subscribables.length === 0 ? {} : subscribables[0];
    }
  },
  addFavoriteSchedule (state, favoriteTimetable) {
    if (state.favoriteSchedules.filter(favorite => favorite.id === favoriteTimetable.id).length === 0) {
      state.favoriteSchedules.push(favoriteTimetable);
      if (Object.keys(state.subscribedTimetable).length === 0) {
        state.subscribedTimetable = favoriteTimetable;
      }
    }
  },
  removeFavoriteSchedule (state, favoriteTimetable) {
    state.favoriteSchedules = state.favoriteSchedules
      .filter((timetable) => timetable.id !== favoriteTimetable.id);
    if (state.subscribedTimetable.id === favoriteTimetable.id) {
      const subscribables = [...Object.values(state.customSchedules), ...state.favoriteSchedules];
      state.subscribedTimetable = subscribables.length === 0 ? {} : subscribables[0];
    }
  },
  setSubscribedTimetable (state, timetable) {
    state.subscribedTimetable = timetable;
  }
};

export const actions = {
  /**
   * Request data for the given and the next week.
   */
  async load ({ state, commit }) {
    try {
      const events = await loadEvents(state.schedule, dayjs(state.week).isoWeek(), this.$axios.$get);
      const lectures = eventsAsLectures(events);
      commit('setLectures', lectures);
      commit('setEvents', events);
    } catch (error) {
      if (error.response.status === 403) {
        throw error;
      }
      commit('enqueueError', 'Stundenplan: API-Verbindung fehlgeschlagen', { root: true });
      console.error('error during API call', error.message);
    }
  },
  /**
   * Request lectures of upcomingLecturesTimetable for defaultWeek
   */
  async loadUpcomingEvents ({ state, commit }) {
    try {
      const events = await loadEvents(state.upcomingLecturesTimetable, dayjs(defaultWeek()).isoWeek(), this.$axios.$get);
      commit('setUpcomingEvents', events);
    } catch (error) {
      if (error.response.status === 403) {
        throw error;
      }
      commit('enqueueError', 'Stundenplan: API-Verbindung fehlgeschlagen', { root: true });
      console.error('error during API call', error.message);
    }
  },
  /**
   * Import timetable from route and set as current timetable.
   */
  importSchedule ({ state, commit }, { params, query, importCustomSchedule }) {
    switch (parseFloat(query.v)) {
      case 1: {
        const whitelist = Array.isArray(query.course || [])
          ? query.course
          : [query.course];
        const id = Array.isArray(query.id || [])
          ? query.id
          : [query.id];
        const label = query.name;
        const customTimetable = { id, label, whitelist };
        if (importCustomSchedule) commit('addCustomSchedule', customTimetable);
        commit('setSchedule', customTimetable);
        break;
      }
      default: {
        if (!isNaN(query.v)) {
          console.log('unsupported custom timetable query version', query);
        }

        const timetable = state.schedules
          .find((timetable) => timetable.id === params.timetable);

        // standard, no filters
        commit('setSchedule', timetable);
      }
    }
  }
};
