import { load } from 'cheerio';
import * as moment from 'moment-timezone';
import { ParsedLecture } from '../model/SplusModel';
import parseTable from './parseTable';
import * as CSV from 'csv-string';
import * as sanitize from 'sanitize-html';

moment.locale('de');

export function parseSkedList (html: string): ParsedLecture[] {
  const $ = load(html);

  const events = [] as ParsedLecture[];

  const lastDatum = '';
  let datum = '';
  let uhrzeitStart = '';
  let uhrzeitEnde = '';
  let veranstaltung = '';
  let dozent = '';
  let raum = '';
  let anmerkung = '';

  // format "Liste"
  $('body table.tbl tbody tr[class^="tr"]').each(function () {
    const cols = $(this).children('td').get()
      .map(col => $(col).text().replace(/-\s*$/, '').trim());

    switch (cols.length) {
      case 11:
        // Raumplan Informatik - https://stundenplan.ostfalia.de/i/R%c3%a4ume/Raumbelegung-Listenform/2-252.html
        raum = cols[0];
        datum = cols[2] || lastDatum;
        uhrzeitStart = cols[4];
        uhrzeitEnde = cols[5];
        dozent = cols[7];
        veranstaltung = cols[9];
        anmerkung = '';
        break;
      case 13:
        datum = cols[0] || lastDatum;
        uhrzeitStart = cols[2];
        uhrzeitEnde = cols[3];
        veranstaltung = cols[5];
        dozent = cols[7];
        raum = cols[9];
        anmerkung = cols[11];
        break
      case 15:
        datum = cols[0] || lastDatum;
        uhrzeitStart = cols[2];
        uhrzeitEnde = cols[3];
        veranstaltung = cols[5];
        dozent = cols[7];
        raum = cols[9];
        anmerkung = cols[13];
        break
      case 17:
        datum = cols[5] || lastDatum;
        uhrzeitStart = cols[0];
        uhrzeitEnde = cols[1];
        veranstaltung = cols[7];
        dozent = cols[3];
        raum = cols[9];
        anmerkung = cols[15];
        break
      default:
        /**
         * Does not mean that an error occured.
         * Possibly a wrong row is parsed.
         */
        return
    }
    const event = createEvent(datum, uhrzeitStart, uhrzeitEnde, veranstaltung, dozent, raum, anmerkung);
    if (event) events.push(event);
  });

  return events;
}

export function parseSkedCSV (csvString: string): ParsedLecture[] {
  const events = [] as ParsedLecture[];

  const arr = CSV.parse(csvString);
  // Pop the first row from the array since it contains the header strings
  const headerRow = arr.shift();

  // iterate through every CSV row
  arr.forEach(function (cols) {
    let datum = '';
    let uhrzeitStart = '';
    let uhrzeitEnde = '';
    let veranstaltung = '';
    let dozent = '';
    let raum = '';
    let anmerkung = '';
    // Iterate through every CSV column
    cols.forEach(function (content, index) {
      // Get the name of this column from the header row by the current index
      const columnName = headerRow[index].trim().toLowerCase();
      // Simply map the fields to the right variables by their column header
      switch (columnName) {
        case 'datum':
          datum = content;
          break;
        case 'uhrzeit': {
          const timeParts = content.split('Uhr')[0].split(' - ')
          uhrzeitStart = timeParts[0].trim();
          uhrzeitEnde = timeParts[1].trim();
          break;
        }
        case 'veranstaltung':
          // remove I- prefix from name if exists
          veranstaltung = content;
          break;
        case 'dozent':
          dozent = content;
          break;
        case 'raum':
          raum = content;
          break;
        case 'anmerkung':
          anmerkung = content;
          break;
        default:
          break;
      }
    });
    const event = createEvent(datum, uhrzeitStart, uhrzeitEnde, veranstaltung, dozent, raum, anmerkung);
    if (event) events.push(event);
  });

  return events;
}

export function parseSkedGraphical (html: string, faculty: string): ParsedLecture[] {
  const $ = load(html);
  const events = [] as ParsedLecture[];

  $('body table').each(function () {
    let cols = parseTable(load(this, { decodeEntities: false }), true, true, false)

    cols = cols.filter(c => c[0].length > 0) // filter pseudo columns -> first entry is not date string
    cols = cols.map(col => col.filter(text =>
      !new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$', 'g').test(text) && // filter time entries
        text.length > 1 && // filter empty entries and empty tags -> 1
        !text.startsWith('['))) // filter footnotes
    cols = cols.filter(col => col.length > 1) // filter empty
    cols = cols.map(col => [...new Set(col)]) // filter duplicates
    cols = cols.map(col => col.map(text => text
      .replace(/<span.+>.+<\/span>/g, '') // remove <span>
      .replace(/\s\[\d+\]/g, ''))); // replace footnote links: e.g. [1]

    cols.forEach(col => {
      col.forEach((entry, index) => {
        if (index == 0) {
          // is date
          return;
        }
        const datum = col[0].split(', ')[1]
        const parts = entry.split('<br>');
        if (parts.length < 3) {
          // Should at least have time & name, otherwise no valid column
          return;
        }
        const time = parts[0].split('Uhr')[0].split(' - ')
        const uhrzeitStart = time[0];
        const uhrzeitEnde = time[1];

        let dozent = ''
        let veranstaltung = ''
        let raum = ''
        let anmerkung = ''

        switch (faculty) {
          case 'Versorgungstechnik':
            dozent = parts[1];
            veranstaltung = parts[2];
            raum = parts[3]
            anmerkung = parts.splice(4).join(', ') || ''
            break;
          case 'Recht':
            // Sometimes has the room in the second row and sometimes not.
            // This regex detects it based on the fact that it either starts with digits and only has non whitespace chars until EOL or next comma
            // or it starts with 1-3 letters followed by digits and non whitespace chars.
            if (parts[1].match(/^\w{0,3}\d+\S*(,|$)/)) {
              dozent = parts[3];
              veranstaltung = parts[2];
              raum = parts[1]
              anmerkung = parts.splice(4).join(', ') || ''
            } else {
              dozent = parts[2];
              veranstaltung = parts[1];
              anmerkung = parts.splice(3).join(', ') || ''
            }
            break;
          case 'Bau-Wasser-Boden':
            dozent = parts[3];
            veranstaltung = parts[2];
            raum = parts[4]
            anmerkung = parts[1];
            break;
          case 'Handel und Soziale Arbeit':
            // Leider ohne Dozent / Raum, da die Zeilen in dieser Fakultät zu unterschiedlich genutzt werden
            veranstaltung = parts[2];
            anmerkung = parts[1];
            break;
          case 'Fahrzeugtechnik':
          case 'Gesundheitswesen':
          case 'Soziale Arbeit':
          case 'Verkehr-Sport-Tourismus-Medien':
          case 'Elektrotechnik':
            if (parts[2].includes('Tutorium')) {
              veranstaltung = parts[1] + ' ' + parts[2];
              dozent = parts[3];
              raum = parts[4];
              anmerkung = parts.splice(5).join(', ') || ''
            } else {
              dozent = parts[2];
              veranstaltung = parts[1];
              raum = parts[3]
              anmerkung = parts.splice(4).join(', ') || ''
            }
            break;
          default:
            console.log('No parser defined for faculty ' + faculty)
            throw new Error('This faculty is not supported.');
        }

        const event = createEvent(datum, uhrzeitStart, uhrzeitEnde, veranstaltung, dozent, raum, anmerkung);
        if (event) events.push(event);
      })
    })
  });

  return events;
}

function createEvent (datum: string, uhrzeitStart: string, uhrzeitEnde: string, veranstaltung: string, dozent: string, raum: string, anmerkung: string): ParsedLecture {
  let start = null;
  let end = null;
  for (const format of ['DD.MM.YYYY H:m', 'LLL YYYY H:m']) {
    start = moment.tz(datum + ' ' + uhrzeitStart, format, 'Europe/Berlin');
    end = moment.tz(datum + ' ' + uhrzeitEnde, format, 'Europe/Berlin');
    if (start.isValid() && end.isValid()) {
      break;
    }
  }
  if (!start.isValid() || !end.isValid()) {
    return;
  }

  if (raum) {
    // Allow only specific HTML attributes for the room since we directly render the HTML in the client
    // Not doing this could lead to XSS possibilities, or some weird rendering if classes or styles are present in the tag
    raum = sanitize(raum, {
      allowedTags: ['a'],
      allowedAttributes: {
        a: ['href', 'target']
      }
    })
  }
  // Strip all html from dozent
  dozent = sanitize(dozent, {})

  if (veranstaltung === 'I-Information') {
    // Ganztägige Informationsevents Fakultät I entfernen, da die im Kalender sehr schlecht aussehen
    // todo ws21 diesen if-block entfernen, das ist nur ein workaround für ss21
    return;
  }

  return {
    info: anmerkung,
    room: raum,
    lecturer: dozent,
    title: veranstaltung.replace(/^I-/, ''),
    start: start.toDate(),
    end: end.toDate(),
    duration: end.diff(start, 'hours', true)
  } as ParsedLecture;
}
