import { Route } from 'vue-router';

export const uniq = (iterable) => [...new Set(iterable)];
export const flatten = (iterable) => [].concat(...iterable);
export const scalarArraysEqual = (array1, array2) =>
  array1.length === array2.length &&
  array1.every((value, index) => value === array2[index]);
export const range = (lower, upper) => Array.from(Array(upper - lower), (x, i) => lower + i);

export const SEMESTER_WEEK_1 = parseInt(process.env.SEMESTER_WEEK_1 || '10');

export function customScheduleToRoute(customTimetable) {
  const query = {
    id: customTimetable.id,
    course: customTimetable.whitelist,
    name: customTimetable.label,
    v: '1',
  };

  return { name: 'plan-timetable', params: {}, query };
}

export function scheduleToRoute(timetable) {
  return {
    name: 'plan-timetable',
    params: { timetable: timetable.id },
  };
}

export function shortenTimetableDegree(timetable) {
  let shortenedDegree;

  switch(timetable.degree){
    case 'Bachelor of Science': shortenedDegree = 'B.Sc.'; break;
    case 'Master of Science': shortenedDegree = 'M.Sc.'; break;
    case 'Bachelor of Arts': shortenedDegree = 'B.A.'; break;
    case 'Master of Arts': shortenedDegree = 'M.A.'; break;
    case 'Bachelor of Engineering': shortenedDegree = 'B.Eng.'; break;
    case 'Master of Engineering': shortenedDegree = 'M.Eng.'; break;
    case 'Bachelor of Laws': shortenedDegree = 'LL.B.'; break;
    case 'Master of Laws': shortenedDegree = 'LL.M.'; break;
    default: shortenedDegree = timetable.degree;
  }

  return shortenedDegree;
}