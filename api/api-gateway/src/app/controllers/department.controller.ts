import { Body, Controller, Inject, Param, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { catchError, map } from 'rxjs/operators';

import {
  ApiVersion,
  Controllers,
  DepartmentAddOrUpdateDto,
  DepartmentCommands,
  DepartmentDto,
  DepartmentEndpoints,
  DepartmentsDto,
  ListDepartmentQueryDto,
  mapRpcToHttp,
  MICRO_SERVICES,
  RoleName,
  RolesRoute,
  withCtx,
} from '@slamint/core';
import { firstValueFrom } from 'rxjs';

@ApiTags('Departments')
@Controller(`${Controllers.DEPARTMENTS}/${ApiVersion.VERSION_ONE}`)
export class DepartmentController {
  constructor(
    @Inject(MICRO_SERVICES.ACCOUNT_MANAGEMENT)
    private readonly accMgmt: ClientProxy
  ) {}

  @ApiOperation({
    summary: 'Get all departments for admin',
    description: `This Routes can be accessed with the Bearer token along with **admin** role`,
  })
  @ApiExtraModels(DepartmentsDto, DepartmentDto, ListDepartmentQueryDto)
  @RolesRoute('GET', DepartmentEndpoints.LIST_ALL, [RoleName.admin], {
    model: DepartmentsDto,
  })
  async getDeptList(@Query() query: ListDepartmentQueryDto) {
    return this.accMgmt
      .send(DepartmentCommands.DEPT_LIST, withCtx(query))
      .pipe(catchError(mapRpcToHttp));
  }

  @ApiOperation({
    summary: 'Get department by depeartment id for admin',
    description: `This Routes can be accessed with the Bearer token along with **admin** role`,
  })
  @ApiParam({ name: 'id', type: String })
  @RolesRoute('GET', DepartmentEndpoints.GET_BY_ID, [RoleName.admin], {
    model: DepartmentDto,
  })
  async getDeptByID(@Param('id') id: string) {
    return this.accMgmt
      .send(DepartmentCommands.GET_BY_ID, withCtx({ id }))
      .pipe(catchError(mapRpcToHttp));
  }

  @ApiOperation({
    summary: 'Update department by depeartment id for admin',
    description: `This Routes can be accessed with the Bearer token along with **admin** role`,
  })
  @ApiBody({ type: DepartmentAddOrUpdateDto })
  @ApiParam({ name: 'id', type: String })
  @RolesRoute('GET', DepartmentEndpoints.GET_BY_ID, [RoleName.admin], {
    model: DepartmentDto,
  })
  async updateDepartment(
    @Param('id') id: string,
    @Body() dept: DepartmentAddOrUpdateDto
  ) {
    return this.accMgmt
      .send(DepartmentCommands.UPDATE_BY_ID, withCtx({ id, ...dept }))
      .pipe(catchError(mapRpcToHttp));
  }

  @ApiOperation({
    summary: 'Add department for admin',
    description: `This Routes can be accessed with the Bearer token along with **admin** role`,
  })
  @ApiBody({ type: DepartmentAddOrUpdateDto })
  @RolesRoute('POST', DepartmentEndpoints.ADD, [RoleName.admin], {
    model: DepartmentDto,
  })
  async changeStatus(@Body() dept: DepartmentAddOrUpdateDto) {
    return this.accMgmt
      .send(DepartmentCommands.DEPT_ADD, withCtx({ dept }))
      .pipe(catchError(mapRpcToHttp));
  }

  @ApiOperation({
    summary: 'Delete department (admin)',
    description:
      'Deletes a department by ID if no mapping done to any users else throws error. Returns 204 on success.',
  })
  @RolesRoute('DELETE', DepartmentEndpoints.GET_BY_ID, [RoleName.admin], {
    success: 204,
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async deleteDepartment(@Param('id') id: string) {
    return firstValueFrom(
      this.accMgmt.send(DepartmentCommands.DELETE_BY_ID, withCtx({ id })).pipe(
        map(() => undefined),
        catchError(mapRpcToHttp)
      )
    );
  }
}
