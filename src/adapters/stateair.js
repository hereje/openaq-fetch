/**
 * This code is responsible for implementing all methods related to fetching
 * and returning data for the SateAir data sources.
 */

'use strict';

import { convertUnits } from '../lib/utils.js';
import client from '../lib/requests.js';

import _ from 'lodash';
import { DateTime } from 'luxon';
import { load } from 'cheerio';
import { parallel } from 'async';

export const name = 'stateair';

export async function fetchData(source, cb) {
  // Generic fetch function
  const getData = async (url, done) => {
    try {
      const response = await client(url);
      return done(null, response.body);
    } catch (error) {
      if (error.response && error.response.statusCode === 404) {
        return done(null, '');
      }
      return done(error);
    }
  };
  // Check for PM2.5 and Ozone measurements
  const tasks = {
    pm25: (done) => {
      getData(source.url, done);
    },
    o3: (done) => {
      getData(source.url.replace('PM2.5', 'OZONE'), done);
    },
  };

  parallel(tasks, (err, results) => {
    if (err) {
      return cb({ message: 'Failure to load data urls.' });
    }

    // Wrap everything in a try/catch in case something goes wrong
    try {
      // Format the data
      let data = formatData(results);
      if (data === undefined) {
        return cb({ message: 'Failure to parse data.' });
      }
      cb(null, data);
    } catch (e) {
      return cb({ message: 'Unknown adapter error.' });
    }
  });
}

const formatData = function (data) {
  const getDate = function (dateString, location) {
    const getTZ = function (location) {
      switch (location) {
        case 'Chennai':
        case 'Hyderabad':
        case 'Kolkata':
        case 'Mumbai':
        case 'New Delhi':
          return 'Asia/Kolkata';
        case 'Hanoi':
        case 'Ho Chi Minh City':
          return 'Asia/Ho_Chi_Minh';
        case 'Ulaanbaatar':
          return 'Asia/Ulaanbaatar';
        case 'Lima':
          return 'America/Lima';
        case 'Dhaka':
          return 'Asia/Dhaka';
        case 'Jakarta South':
        case 'Jakarta Central':
          return 'Asia/Jakarta';
        case 'Bogota':
          return 'America/Bogota';
        case 'Pristina':
          return 'Europe/Skopje'; // Using Skopje as a same time-zone proxy
        case 'Addis Ababa Central':
        case 'Addis Ababa School':
          return 'Africa/Addis_Ababa';
        case 'Manama':
          return 'Asia/Bahrain';
        case 'Kuwait City':
          return 'Asia/Kuwait';
        case 'Kampala':
          return 'Africa/Kampala';
        case 'Embassy Kathmandu':
        case 'Phora Durbar Kathmandu':
          return 'Asia/Kathmandu';
        case 'Colombo':
          return 'Asia/Colombo';
        case 'Abu Dhabi':
        case 'Dubai':
          return 'Asia/Dubai';
        case 'Sarajevo':
          return 'Europe/Sarajevo';
        case 'Astana':
          return 'Asia/Almaty';
        case 'Curacao':
          return 'America/Curacao';
        case 'Tashkent':
          return 'Asia/Tashkent';
        case 'Bishkek':
          return 'Asia/Bishkek';
        case 'Baghdad':
          return 'Asia/Baghdad';
        case 'Islamabad':
        case 'Karachi':
        case 'Lahore':
        case 'Peshawar':
          return 'Asia/Karachi';
        case 'Vientiane':
          return 'Asia/Vientiane';
        case 'Algiers':
          return 'Africa/Algiers';
        case 'Rangoon':
          return 'Asia/Rangoon';
        case 'Kabul':
          return 'Asia/Kabul';
        case 'Dharan':
          return 'Asia/Riyadh';
        case 'Ashgabat':
          return 'Asia/Ashgabat';
        case 'Guatemala City':
          return 'America/Guatemala';
        case 'Amman':
          return 'Asia/Amman';
        case 'Dushanbe':
          return 'Asia/Dushanbe';
        case 'San Jose':
          return 'America/Costa_Rica';
        case 'Bamako':
          return 'Africa/Bamako';
        case 'Abidjan':
          return 'Africa/Abidjan';
        case "N'Djamena":
          return 'Africa/Ndjamena';
        case 'Khartoum Embassy':
        case 'Khartoum Residential':
          return 'Africa/Khartoum';
        case 'Conakry':
          return 'Africa/Conakry';
        case 'Accra':
          return 'Africa/Accra';
      }
    };

    const date = DateTime.fromFormat(
      dateString,
      'yyyy-MM-dd HH:mm:ss',
      { zone: getTZ(location) }
    );

    return {
      utc: date.toUTC().toISO({ suppressMilliseconds: true }),
      local: date.toISO({ suppressMilliseconds: true }),
    };
  };

  const getCoordinates = function (location) {
    switch (location) {
      case 'Chennai':
        return {
          latitude: 13.08784,
          longitude: 80.27847,
        };
      case 'Hyderabad':
        return {
          latitude: 17.38405,
          longitude: 78.45636,
        };
      case 'Kolkata':
        return {
          latitude: 22.56263,
          longitude: 88.36304,
        };
      case 'Mumbai':
        return {
          latitude: 19.07283,
          longitude: 72.88261,
        };
      case 'New Delhi':
        return {
          latitude: 28.63576,
          longitude: 77.22445,
        };
      case 'Hanoi':
        return {
          latitude: 21.021938,
          longitude: 105.81881,
        };
      case 'Ho Chi Minh City':
        return {
          latitude: 10.782773,
          longitude: 106.700035,
        };
      case 'Ulaanbaatar':
        return {
          latitude: 47.928387,
          longitude: 106.92947,
        };
      case 'Jakarta South':
        return {
          latitude: -6.236704,
          longitude: 106.79324,
        };
      case 'Jakarta Central':
        return {
          latitude: -6.182536,
          longitude: 106.834236,
        }; // Lima coordinates assume location is at Embassy
      case 'Lima':
        return {
          latitude: -12.099398,
          longitude: -76.96888,
        }; // Dhaka coordinates assume location is at American Center
      case 'Dhaka':
        return {
          latitude: 23.796373,
          longitude: 90.424614,
        };
      case 'Bogota':
        return {
          latitude: 4.637735,
          longitude: -74.09486,
        };
      case 'Pristina':
        return {
          latitude: 42.661995,
          longitude: 21.15055,
        };
      case 'Addis Ababa Central':
        return {
          latitude: 9.058498,
          longitude: 38.761642,
        };
      case 'Addis Ababa School':
        return {
          latitude: 8.996519,
          longitude: 38.725433,
        };
      case 'Manama':
        return {
          latitude: 26.204697,
          longitude: 50.57083,
        };
      case 'Kuwait City':
        return {
          latitude: 29.292316,
          longitude: 48.04768,
        };
      case 'Kampala':
        return {
          latitude: 0.300225,
          longitude: 32.591553,
        };
      case 'Phora Durbar Kathmandu':
        return {
          latitude: 27.712463,
          longitude: 85.315704,
        };
      case 'Embassy Kathmandu':
        return {
          latitude: 27.738703,
          longitude: 85.336205,
        };
      case 'Colombo':
        return {
          latitude: 6.913253,
          longitude: 79.848684,
        }; // Colombo coordinates assume location is at US Embassy
      case 'Abu Dhabi':
        return {
          latitude: 24.424399,
          longitude: 54.433746,
        }; // Abu Dhabi coordinates assume location is at US Embassy
      case 'Sarajevo':
        return {
          latitude: 43.856667,
          longitude: 18.398205,
        }; // Sarajevo coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Dubai':
        return {
          latitude: 25.25848,
          longitude: 55.309166,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Astana':
        return {
          latitude: 51.125286,
          longitude: 71.46722,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Curacao':
        return {
          latitude: 12.1696,
          longitude: -68.99,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Tashkent':
        return {
          latitude: 41.3672,
          longitude: 69.2725,
        }; // Coordinates from Google Maps for Embassy location
      case 'Bishkek':
        return {
          latitude: 42.8273,
          longitude: 74.5833,
        };
      case 'Baghdad':
        return {
          latitude: 33.298722,
          longitude: 44.395917,
        }; // Coordinates from Google Maps for Embassy location
      case 'Lahore':
        return {
          latitude: 31.560078,
          longitude: 74.33589,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Karachi':
        return {
          latitude: 24.8415,
          longitude: 67.0091,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Islamabad':
        return {
          latitude: 33.7235,
          longitude: 73.11822,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Peshawar':
        return {
          latitude: 34.00585,
          longitude: 71.53775,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Vientiane':
        return {
          latitude: 17.896122,
          longitude: 102.64,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Algiers':
        return {
          latitude: 36.7558,
          longitude: 3.039114,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Rangoon':
        return {
          latitude: 16.8256,
          longitude: 96.1445,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Kabul':
        return {
          latitude: 34.535812,
          longitude: 69.190514,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Dharan':
        return {
          latitude: 26.304855,
          longitude: 50.154302,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Ashgabat':
        return {
          latitude: 37.941857,
          longitude: 58.387945,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Guatemala City':
        return {
          latitude: 14.607198,
          longitude: -90.514255,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Amman':
        return {
          latitude: 31.945388,
          longitude: 35.880556,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Dushanbe':
        return {
          latitude: 38.579708,
          longitude: 68.712176,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'San Jose':
        return {
          latitude: 9.949488,
          longitude: -84.142876,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Bamako':
        return {
          latitude: 12.629813,
          longitude: -8.018847,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Abidjan':
        return {
          latitude: 5.335049,
          longitude: -3.976023,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case "N'Djamena":
        return {
          latitude: 12.1348,
          longitude: 15.0557,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Khartoum Embassy':
        return {
          latitude: 15.526226,
          longitude: 32.607622,
        }; // Coordinates from Google Maps for Embassy location
      case 'Khartoum Residential':
        return {
          latitude: 15.5007,
          longitude: 32.5599,
        };
      case 'Conakry':
        return {
          latitude: 9.594805,
          longitude: -13.636629,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
      case 'Accra':
        return {
          latitude: 5.579447,
          longitude: -0.170699,
        }; // Coordinates from https://www.dosairnowdata.org/dos/AllPosts24Hour.json
    }
  };

  // Create measurements array
  let measurements = [];

  // We could have both pm25 and ozone measurements, so loop over
  // results object
  for (let parameter in data) {
    // Load all the XML
    const $ = load(data[parameter], { xmlMode: true });

    // Build up the base object
    const location = $('channel').children('title').text().trim();
    const baseObj = {
      location: 'US Diplomatic Post: ' + location,
      parameter,
      unit: parameter === 'pm25' ? 'µg/m³' : 'ppb',
      averagingPeriod: { value: 1, unit: 'hours' },
      attribution: [
        {
          name: 'EPA AirNow DOS',
          url: 'http://airnow.gov/index.cfm?action=airnow.global_summary',
        },
      ],
      coordinates: getCoordinates(location),
    };
    // Loop over each item and save the object
    $('item').each(function (i, elem) {
      // Clone base object
      const obj = _.cloneDeep(baseObj);

      obj.value = parseFloat($(elem).children('Conc').text());
      obj.date = getDate(
        $(elem).children('ReadingDateTime').text(),
        location
      );

      measurements.push(obj);
    });
  }

  measurements = convertUnits(measurements);

  return {
    name: 'unused',
    measurements: measurements,
  };
};
