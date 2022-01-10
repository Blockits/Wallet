// Migrations must start at version 1 or later
// They are objects with a `version` number
// and a `migrate` function
//
// The `migrate` function receives the previous
// config data format, and returns the new one.

import m002 from './002';
import m003 from './003';
import m004 from './004';
import m005 from './005';
import m006 from './006';
import m007 from './007';
import m008 from './008';
import m009 from './009';
import m010 from './010';
import m011 from './011';
import m012 from './012';
import m013 from './013';
import m014 from './014';
import m015 from './015';
import m016 from './016';

const migrations = [
  m002,
  m003,
  m004,
  m005,
  m006,
  m007,
  m008,
  m009,
  m010,
  m011,
  m012,
  m013,
  m014,
  m015,
  m016
]

export default migrations;