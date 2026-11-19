import * as migration_20261012_193753_initial from './20261012_193753_initial';
import * as migration_20261012_195835_site_settings from './20261012_195835_site_settings';
import * as migration_20261012_205633_hours_note from './20261012_205633_hours_note';
import * as migration_20261118_015727_menus_specials_gallery from './20261118_015727_menus_specials_gallery';
import * as migration_20261118_022023_group_menu_pdf from './20261118_022023_group_menu_pdf';
import * as migration_20261118_024252_gallery_category from './20261118_024252_gallery_category';
import * as migration_20261118_024631_contact_messages from './20261118_024631_contact_messages';
import * as migration_20261119_051436_specials_repeat from './20261119_051436_specials_repeat';
import * as migration_20261119_051945_event_requests from './20261119_051945_event_requests';
import * as migration_20261119_052352_contact_message_replies from './20261119_052352_contact_message_replies';

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
  {
    up: migration_20261118_024252_gallery_category.up,
    down: migration_20261118_024252_gallery_category.down,
    name: '20261118_024252_gallery_category',
  },
  {
    up: migration_20261118_024631_contact_messages.up,
    down: migration_20261118_024631_contact_messages.down,
    name: '20261118_024631_contact_messages',
  },
  {
    up: migration_20261119_051436_specials_repeat.up,
    down: migration_20261119_051436_specials_repeat.down,
    name: '20261119_051436_specials_repeat',
  },
  {
    up: migration_20261119_051945_event_requests.up,
    down: migration_20261119_051945_event_requests.down,
    name: '20261119_051945_event_requests',
  },
  {
    up: migration_20261119_052352_contact_message_replies.up,
    down: migration_20261119_052352_contact_message_replies.down,
    name: '20261119_052352_contact_message_replies'
  },
];
