export enum HealthEndPoints {
  READY = 'ready',
  LIVE = 'live',
}

export enum AccountManagementEndPoints {
  ME = 'me',
  LIST_USERS = 'users',
  GET_USER_BY_ID = 'users/:id',
  CHANGE_STATUS_USER_BY_ID = 'users/:id/change-status',
  UPDATE_DEPARTMENT_USER_BY_ID = 'users/:id/update-department',
  UPDATE_MANAGER_USER_BY_ID = 'users/:id/update-manager',
}

export enum DepartmentEndpoints {
  LIST_ALL = 'list-all',
  ADD = 'add',
  GET_BY_ID = ':id',
  UPDATE_BY_ID = ':id/update',
  CHANGE_STATUS_BY_ID = ':id/change-status',
  DELETE_BY_ID = ':id',
}
