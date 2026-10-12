import * as migration_20261012_193753_initial from './20261012_193753_initial';

export const migrations = [
  {
    up: migration_20261012_193753_initial.up,
    down: migration_20261012_193753_initial.down,
    name: '20261012_193753_initial',
  },
];
