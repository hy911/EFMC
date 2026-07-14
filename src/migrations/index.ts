import * as migration_20260714_113009_initial from './20260714_113009_initial';

export const migrations = [
  {
    up: migration_20260714_113009_initial.up,
    down: migration_20260714_113009_initial.down,
    name: '20260714_113009_initial'
  },
];
