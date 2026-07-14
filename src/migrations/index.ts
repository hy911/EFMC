import * as migration_20260714_113009_initial from './20260714_113009_initial';
import * as migration_20260714_122741_phase2_cases_posts from './20260714_122741_phase2_cases_posts';

export const migrations = [
  {
    up: migration_20260714_113009_initial.up,
    down: migration_20260714_113009_initial.down,
    name: '20260714_113009_initial',
  },
  {
    up: migration_20260714_122741_phase2_cases_posts.up,
    down: migration_20260714_122741_phase2_cases_posts.down,
    name: '20260714_122741_phase2_cases_posts'
  },
];
