import * as migration_20260714_113009_initial from './20260714_113009_initial';
import * as migration_20260714_122741_phase2_cases_posts from './20260714_122741_phase2_cases_posts';
import * as migration_20260717_025355_qr_codes from './20260717_025355_qr_codes';
import * as migration_20260727_091134_add_feature_columns_and_logo_strip from './20260727_091134_add_feature_columns_and_logo_strip';
import * as migration_20260728_071302_case_sections from './20260728_071302_case_sections';
import * as migration_20260730_084438_case_section_intro from './20260730_084438_case_section_intro';

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
    name: '20260727_091134_add_feature_columns_and_logo_strip',
  },
  {
    up: migration_20260728_071302_case_sections.up,
    down: migration_20260728_071302_case_sections.down,
    name: '20260728_071302_case_sections',
  },
  {
    up: migration_20260730_084438_case_section_intro.up,
    down: migration_20260730_084438_case_section_intro.down,
    name: '20260730_084438_case_section_intro'
  },
];
