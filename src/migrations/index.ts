import * as migration_20261012_193753_initial from './20261012_193753_initial';
import * as migration_20261012_195835_site_settings from './20261012_195835_site_settings';
import * as migration_20261012_205633_hours_note from './20261012_205633_hours_note';

export const migrations = [
  {
    up: migration_20261012_193753_initial.up,
    down: migration_20261012_193753_initial.down,
    name: '20261012_193753_initial',
  },
  {
    up: migration_20261012_195835_site_settings.up,
    down: migration_20261012_195835_site_settings.down,
    name: '20261012_195835_site_settings',
  },
  {
    up: migration_20261012_205633_hours_note.up,
    down: migration_20261012_205633_hours_note.down,
    name: '20261012_205633_hours_note',
  },
];
