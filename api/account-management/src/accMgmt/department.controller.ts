import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import type {
  DepartmentAddOrUpdateDto,
  DepartmentDto,
  DepartmentsDto,
  ListDepartmentQueryDto,
} from '@slamint/core';
import { DepartmentCommands } from '@slamint/core';

import { DepartmentService } from './department.service';

@Controller()
export class DepartmentControler {
  constructor(private readonly svc: DepartmentService) {}

  @MessagePattern(DepartmentCommands.DEPT_LIST)
  getDeptList(
    @Payload() query: ListDepartmentQueryDto
  ): Promise<DepartmentsDto> {
    return this.svc.getAllDepartments(query);
  }

  @MessagePattern(DepartmentCommands.GET_BY_ID)
  getDeptById(
    @Payload() { data: { id } }: { data: { id: string } }
  ): Promise<DepartmentDto> {
    return this.svc.getDeptById(id);
  }

  @MessagePattern(DepartmentCommands.DEPT_ADD)
  addNewDepartment(
    @Payload() { data: { dept } }: { data: { dept: DepartmentAddOrUpdateDto } }
  ): Promise<DepartmentDto> {
    return this.svc.addDept(dept);
  }

  @MessagePattern(DepartmentCommands.DELETE_BY_ID)
  deleteDepartment(
    @Payload() { data: { id } }: { data: { id: string } }
  ): Promise<boolean> {
    return this.svc.deleteDepartment(id);
  }

  @MessagePattern(DepartmentCommands.UPDATE_BY_ID)
  updateDepartment(
    @Payload()
    { data }: { data: { id: string; code: string; name: string } }
  ): Promise<DepartmentDto> {
    return this.svc.updateDepartment(data);
  }
}
