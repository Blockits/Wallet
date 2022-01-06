// Migrations must start at version 1 or later
// They are objects with a `version` number
// and a `migrate` function
//
// The `migrate` function receives the previous
// config data format, and returns the new one.

import m002 from './002';

const migrations = [
  m002
]

export default migrations;