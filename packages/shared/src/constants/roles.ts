// packages/shared/src/constants/roles.ts
export const USER_ROLES = {
  MAINTENANCE_ENGINEER: 'MAINTENANCE_ENGINEER',
  PLANT_MANAGER: 'PLANT_MANAGER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
