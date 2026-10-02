import * as migration_20261001_235010_initial from './20261001_235010_initial';
import * as migration_20261002_005154_site_settings from './20261002_005154_site_settings';

export const migrations = [
  {
    up: migration_20261001_235010_initial.up,
    down: migration_20261001_235010_initial.down,
    name: '20261001_235010_initial',
  },
  {
    up: migration_20261002_005154_site_settings.up,
    down: migration_20261002_005154_site_settings.down,
    name: '20261002_005154_site_settings',
  },
];
