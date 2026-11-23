import * as migration_20261001_235010_initial from './20261001_235010_initial';
import * as migration_20261002_005154_site_settings from './20261002_005154_site_settings';
import * as migration_20261004_171356_hours_note from './20261004_171356_hours_note';
import * as migration_20261009_021748_menus_specials_gallery from './20261009_021748_menus_specials_gallery';
import * as migration_20261018_181844_group_menu_pdf from './20261018_181844_group_menu_pdf';
import * as migration_20261021_224248_gallery_category from './20261021_224248_gallery_category';
import * as migration_20261023_220023_contact_messages from './20261023_220023_contact_messages';
import * as migration_20261107_164650_specials_repeat from './20261107_164650_specials_repeat';
import * as migration_20261115_195355_event_requests from './20261115_195355_event_requests';
import * as migration_20261118_022849_contact_message_replies from './20261118_022849_contact_message_replies';
import * as migration_20261118_034916_event_reply_templates from './20261118_034916_event_reply_templates';
import * as migration_20261121_192029_request_number_sequence from './20261121_192029_request_number_sequence';
import * as migration_20261122_152035_contact_message_emails from './20261122_152035_contact_message_emails';
import * as migration_20261122_200000_singular_event_types from './20261122_200000_singular_event_types';
import * as migration_20261122_230000_event_request_confirmation_subject from './20261122_230000_event_request_confirmation_subject';

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
    name: '20261115_195355_event_requests',
  },
  {
    up: migration_20261118_022849_contact_message_replies.up,
    down: migration_20261118_022849_contact_message_replies.down,
    name: '20261118_022849_contact_message_replies',
  },
  {
    up: migration_20261118_034916_event_reply_templates.up,
    down: migration_20261118_034916_event_reply_templates.down,
    name: '20261118_034916_event_reply_templates',
  },
  {
    up: migration_20261121_192029_request_number_sequence.up,
    down: migration_20261121_192029_request_number_sequence.down,
    name: '20261121_192029_request_number_sequence',
  },
  {
    up: migration_20261122_152035_contact_message_emails.up,
    down: migration_20261122_152035_contact_message_emails.down,
    name: '20261122_152035_contact_message_emails'
  },
  {
    up: migration_20261122_200000_singular_event_types.up,
    down: migration_20261122_200000_singular_event_types.down,
    name: '20261122_200000_singular_event_types',
  },
  {
    up: migration_20261122_230000_event_request_confirmation_subject.up,
    down: migration_20261122_230000_event_request_confirmation_subject.down,
    name: '20261122_230000_event_request_confirmation_subject',
  },
];
