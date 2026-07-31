import * as migration_20260714_113009_initial from './20260714_113009_initial';
import * as migration_20260714_122741_phase2_cases_posts from './20260714_122741_phase2_cases_posts';
import * as migration_20260717_025355_qr_codes from './20260717_025355_qr_codes';
import * as migration_20260727_091134_add_feature_columns_and_logo_strip from './20260727_091134_add_feature_columns_and_logo_strip';
import * as migration_20260728_071302_case_sections from './20260728_071302_case_sections';
import * as migration_20260730_084438_case_section_intro from './20260730_084438_case_section_intro';
import * as migration_20260730_092040_case_cards_layout from './20260730_092040_case_cards_layout';
import * as migration_20260731_011318_case_contrast_panel from './20260731_011318_case_contrast_panel';
import * as migration_20260731_020850_case_figure_variant from './20260731_020850_case_figure_variant';
import * as migration_20260731_023222_case_section_themes from './20260731_023222_case_section_themes';
import * as migration_20260731_025051_case_step_pictogram from './20260731_025051_case_step_pictogram';
import * as migration_20260731_061231_case_drafts from './20260731_061231_case_drafts';

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
    name: '20260730_084438_case_section_intro',
  },
  {
    up: migration_20260730_092040_case_cards_layout.up,
    down: migration_20260730_092040_case_cards_layout.down,
    name: '20260730_092040_case_cards_layout',
  },
  {
    up: migration_20260731_011318_case_contrast_panel.up,
    down: migration_20260731_011318_case_contrast_panel.down,
    name: '20260731_011318_case_contrast_panel',
  },
  {
    up: migration_20260731_020850_case_figure_variant.up,
    down: migration_20260731_020850_case_figure_variant.down,
    name: '20260731_020850_case_figure_variant',
  },
  {
    up: migration_20260731_023222_case_section_themes.up,
    down: migration_20260731_023222_case_section_themes.down,
    name: '20260731_023222_case_section_themes',
  },
  {
    up: migration_20260731_025051_case_step_pictogram.up,
    down: migration_20260731_025051_case_step_pictogram.down,
    name: '20260731_025051_case_step_pictogram',
  },
  {
    up: migration_20260731_061231_case_drafts.up,
    down: migration_20260731_061231_case_drafts.down,
    name: '20260731_061231_case_drafts'
  },
];
