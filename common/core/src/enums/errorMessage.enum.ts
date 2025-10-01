export enum AccountManagementErrMessage {
  INVALID_USERID = 'The provided user ID is invalid.',
  USER_NOT_FOUND = 'No user was found with the specified ID.',
  INVALID_MANAGERID = 'The provided manager ID is invalid.',
  INVALID_NEW_MANAGERID = 'The provided new manager ID is invalid.',
  MANAGER_NOT_FOUND = 'No manager was found with the specified ID.',
  ENGINEER_NOT_FOUND = 'No engineer was found with the specified ID.',
  INVALID_REQUEST_USERID = 'logged in user ID is invalid.',
  ROLE_MUST_DIFFERENT = 'Same role cannot be assigned to the user.',
  USER_EXIST = 'User already exist in SLAMint IDP.',
  EMAIL_TRIGGER = 'Unable to trigger email for the provided user.',
  MANAGER_HAS_ENGINEER = 'The manager has engineers assigned and cannot be deleted.',
  DEPARTMENT_NOT_ASSIGNED = 'The manager does not have a department assigned.',
  DEPARTMENT_ID_REQUIRED = 'departmentId is required when role is manager',
  MANAGER_ID_REQUIRED = 'managerId is required when role is engineer',
  ROLE_NOT_EXIST = 'The specified role does not exist.',
  ROLE_CANNOT_BE_ASSIGNED = 'The specified role cannot be assigned to the user.',
  MANAGER_CANNOT_BE_ASSIGNED = 'The user is not an engineer, so a manager cannot be assigned.',
  INVALID_STATUS = 'The provided status is invalid. Valid statuses are locked and active.',
}

export enum DepartmentErrMessage {
  INVALID_DEPT = 'The provided department ID is invalid.',
  DEPT_NOT_FOUND = 'No department was found with the specified ID.',
  DEPT_EXIST = 'Department already exist, Try adding new department details',
  DEPT_IN_USE = 'The department is currently in use and cannot be deleted',
  INVALID_DEPT_DETAILS = 'The details provided to create new department are not valid',
}

export enum ServerErrorMessage {
  INTERNAL_SERVER_ERROR = 'An unexpected error occurred on the server. Please try again later.',
  GATEWAY_TIMEOUT = 'The request timed out. Please try again in a few moments.',
  UNAUTHORIZED = 'Authentication required inorder to access this API',
  FORBIDDEN = 'You are not authorized to access this API',
}
