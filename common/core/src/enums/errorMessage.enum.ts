export enum AccountManagementErrMessage {
  INVALID_USERID = 'The provided user ID is invalid.',
  USER_NOT_FOUND = 'No user was found with the specified ID.',
  INVALID_MANAGERID = 'The provided manager ID is invalid.',
  MANAGER_NOT_FOUND = 'No manager was found with the specified ID.',
  ENGINEER_NOT_FOUND = 'No engineer was found with the specified ID.',
  INVALID_REQUEST_USERID = 'logged in user ID is invalid.',
  ROLE_MUST_DIFFERENT = 'Same role cannot be assigned to the user.',
  USER_EXIST = 'User already exist in SLAMint IDP.',
  EMAIL_TRIGGER = 'Unable to trigger email for the provided user.',
}

export enum DepartmentErrMessage {
  INVALID_DEPT = 'The provided department ID is invalid.',
  DEPT_NOT_FOUND = 'No department was found with the specified ID.',
  DEPT_EXIST = 'Department already exist, Try adding new department details',
  INVALID_DEPT_DETAILS = 'The details provided to create new department are not valid',
}

export enum ServerErrorMessage {
  INTERNAL_SERVER_ERROR = 'An unexpected error occurred on the server. Please try again later.',
  GATEWAY_TIMEOUT = 'The request timed out. Please try again in a few moments.',
  UNAUTHORIZED = 'Authentication required inorder to access this API',
  FORBIDDEN = 'You are not authorized to access this API',
}
