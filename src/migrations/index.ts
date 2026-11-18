import * as migration_20261012_193753_initial from './20261012_193753_initial';
import * as migration_20261012_195835_site_settings from './20261012_195835_site_settings';
import * as migration_20261012_205633_hours_note from './20261012_205633_hours_note';
import * as migration_20261118_015727_menus_specials_gallery from './20261118_015727_menus_specials_gallery';
import * as migration_20261118_022023_group_menu_pdf from './20261118_022023_group_menu_pdf';

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
  {
    up: migration_20261118_015727_menus_specials_gallery.up,
    down: migration_20261118_015727_menus_specials_gallery.down,
    name: '20261118_015727_menus_specials_gallery',
  },
  {
    up: migration_20261118_022023_group_menu_pdf.up,
    down: migration_20261118_022023_group_menu_pdf.down,
    name: '20261118_022023_group_menu_pdf',
  },
];
