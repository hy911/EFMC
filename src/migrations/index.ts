import * as migration_20260714_113009_initial from './20260714_113009_initial';
import * as migration_20260714_122741_phase2_cases_posts from './20260714_122741_phase2_cases_posts';
import * as migration_20260717_025355_qr_codes from './20260717_025355_qr_codes';
import * as migration_20260727_091134_add_feature_columns_and_logo_strip from './20260727_091134_add_feature_columns_and_logo_strip';

export const migrations = [
  {
    up: migration_20260714_113009_initial.up,
    down: migration_20260714_113009_initial.down,
    name: '20260714_113009_initial',
  },
  {
    up: migration_20260714_122741_phase2_cases_posts.up,
    down: migration_20260714_122741_phase2_cases_posts.down,
    name: '20260714_122741_phase2_cases_posts',
  },
  {
    up: migration_20260717_025355_qr_codes.up,
    down: migration_20260717_025355_qr_codes.down,
    name: '20260717_025355_qr_codes',
  },
  {
    up: migration_20260727_091134_add_feature_columns_and_logo_strip.up,
    down: migration_20260727_091134_add_feature_columns_and_logo_strip.down,
    name: '20260727_091134_add_feature_columns_and_logo_strip'
  },
];
