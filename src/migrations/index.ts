import * as migration_20261001_235010_initial from './20261001_235010_initial';
import * as migration_20261002_005154_site_settings from './20261002_005154_site_settings';
import * as migration_20261004_171356_hours_note from './20261004_171356_hours_note';
import * as migration_20261009_021748_menus_specials_gallery from './20261009_021748_menus_specials_gallery';
import * as migration_20261018_181844_group_menu_pdf from './20261018_181844_group_menu_pdf';

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
  {
    up: migration_20261004_171356_hours_note.up,
    down: migration_20261004_171356_hours_note.down,
    name: '20261004_171356_hours_note',
  },
  {
    up: migration_20261009_021748_menus_specials_gallery.up,
    down: migration_20261009_021748_menus_specials_gallery.down,
    name: '20261009_021748_menus_specials_gallery',
  },
  {
    up: migration_20261018_181844_group_menu_pdf.up,
    down: migration_20261018_181844_group_menu_pdf.down,
    name: '20261018_181844_group_menu_pdf',
  },
];
