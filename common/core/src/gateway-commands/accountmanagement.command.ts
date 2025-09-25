export enum AccountManagementCommands {
  ACC_ME = 'acc:users:me',
  ACC_ME_UPDATE = 'acc:users:me:update',
  ACC_LIST_USERS = 'acc:users:list',
  ACC_GET_USER_BY_ID = 'acc:users:id',
  ACC_CHANGE_STATUS_USER_BY_ID = 'acc:users:id:changestatus',
  ACC_CHANGE_DEPT_USER_BY_ID = 'acc:users:id:department',
  ACC_CHANGE_MANAGER_USER_BY_ID = 'acc:users:id:manager',
  ACC_CHANGE_ROLE_USER_BY_ID = 'acc:users:id:changerole',
  ACC_ENSURE_FROM_JWT = 'acc:user:from:jwt',
}
