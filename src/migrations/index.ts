import * as migration_20261001_235010_initial from './20261001_235010_initial';
import * as migration_20261002_005154_site_settings from './20261002_005154_site_settings';
import * as migration_20261004_171356_hours_note from './20261004_171356_hours_note';
import * as migration_20261009_021748_menus_specials_gallery from './20261009_021748_menus_specials_gallery';
import * as migration_20261018_181844_group_menu_pdf from './20261018_181844_group_menu_pdf';
import * as migration_20261021_224248_gallery_category from './20261021_224248_gallery_category';
import * as migration_20261023_220023_contact_messages from './20261023_220023_contact_messages';
import * as migration_20261107_164650_specials_repeat from './20261107_164650_specials_repeat';
import * as migration_20261115_195355_event_requests from './20261115_195355_event_requests';

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
  {
    up: migration_20261021_224248_gallery_category.up,
    down: migration_20261021_224248_gallery_category.down,
    name: '20261021_224248_gallery_category',
  },
  {
    up: migration_20261023_220023_contact_messages.up,
    down: migration_20261023_220023_contact_messages.down,
    name: '20261023_220023_contact_messages',
  },
  {
    up: migration_20261107_164650_specials_repeat.up,
    down: migration_20261107_164650_specials_repeat.down,
    name: '20261107_164650_specials_repeat',
  },
  {
    up: migration_20261115_195355_event_requests.up,
    down: migration_20261115_195355_event_requests.down,
    name: '20261115_195355_event_requests'
  },
];
