import * as migration_20261001_235010_initial from './20261001_235010_initial';

export const migrations = [
  {
    up: migration_20261001_235010_initial.up,
    down: migration_20261001_235010_initial.down,
    name: '20261001_235010_initial',
  },
];
