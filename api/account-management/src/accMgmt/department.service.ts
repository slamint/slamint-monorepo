import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AppUser,
  DepartmentAddOrUpdateDto,
  DepartmentDto,
  DepartmentsDto,
  ListDepartmentQueryDto,
} from '@slamint/core';
import {
  Department,
  DepartmentErrCodes,
  DepartmentErrMessage,
  RPCCode,
  rpcErr,
  serverError,
  ServerErrorMessage,
} from '@slamint/core';
import { plainToInstance } from 'class-transformer';
import { isUUID } from 'class-validator';
import {
  Between,
  FindOptionsSelect,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

const departmentViewSelect: FindOptionsSelect<Department> = {
  id: true,
  code: true,
  name: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly department: Repository<Department>,
    @InjectRepository(AppUser)
    private readonly accMgmt: Repository<AppUser>
  ) {}

  async getAllDepartments(
    query: ListDepartmentQueryDto
  ): Promise<DepartmentsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sort = query.sort ?? 'createdAt';
    const order = query.order ?? 'DESC';

    const base: FindOptionsWhere<Department> = {
      ...(query.id && { id: query.id }),
      ...(typeof query.isActive === 'boolean' && { isActive: query.isActive }),
    };

    const toDate = (s?: string) => (s ? new Date(s) : undefined);

    const cf = toDate(query.createdFrom);
    const ct = toDate(query.createdTo);
    if (cf && ct) base.createdAt = Between(cf, ct);
    else if (cf) base.createdAt = MoreThanOrEqual(cf);
    else if (ct) base.createdAt = LessThanOrEqual(ct);

    let where: FindOptionsWhere<Department> | FindOptionsWhere<Department>[] =
      base;
    if (query.q?.trim()) {
      const term = ILike(`%${query.q.trim()}%`);
      where = [
        { ...base, name: term },
        { ...base, code: term },
      ];
    }
    const [rows, total] = await this.department.findAndCount({
      where,
      select: departmentViewSelect,
      order: { [sort]: order, id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = plainToInstance(Department, rows, {
      enableImplicitConversion: true,
    });
    return { items, total, page, limit };
  }

  async getDeptById(id: string): Promise<DepartmentDto> {
    if (!id || !isUUID(id)) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: DepartmentErrCodes.INVALID_DEPT,
        message: DepartmentErrMessage.INVALID_DEPT,
      });
    }

    const dept = this.department.findOne({ where: { id } });

    if (!dept) {
      throw rpcErr({
        type: RPCCode.NOT_FOUND,
        code: DepartmentErrCodes.DEPT_NOT_FOUND,
        message: DepartmentErrMessage.DEPT_NOT_FOUND,
      });
    }
    return plainToInstance(Department, dept, {
      enableImplicitConversion: true,
    });
  }

  async addDept(data: DepartmentAddOrUpdateDto): Promise<DepartmentDto> {
    if (!data) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: DepartmentErrCodes.DEPT_NOT_FOUND,
        message: DepartmentErrMessage.DEPT_NOT_FOUND,
      });
    }
    const dept = await this.department.findOne({ where: { code: data.code } });
    if (dept?.id) {
      throw rpcErr({
        type: RPCCode.CONFLICT,
        code: DepartmentErrCodes.DEPT_EXIST,
        message: DepartmentErrMessage.DEPT_EXIST,
      });
    }

    const newDept = new Department();
    newDept.code = data.code;
    newDept.name = data.name;

    const savedDept = await this.department.save(newDept);

    return plainToInstance(Department, savedDept, {
      enableImplicitConversion: true,
    });
  }

  async deleteDepartment(id: string): Promise<boolean> {
    if (!id || !isUUID(id)) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: DepartmentErrCodes.INVALID_DEPT,
        message: DepartmentErrMessage.INVALID_DEPT,
      });
    }
    const dept = await this.department.findOne({ where: { id } });
    if (!dept) {
      throw rpcErr({
        type: RPCCode.CONFLICT,
        code: DepartmentErrCodes.DEPT_NOT_FOUND,
        message: DepartmentErrMessage.DEPT_NOT_FOUND,
      });
    }

    const count = await this.accMgmt.count({ where: { department: { id } } });

    if (count > 0) {
      throw rpcErr({
        type: RPCCode.CONFLICT,
        code: DepartmentErrCodes.DEPT_IN_USE,
        message: DepartmentErrMessage.DEPT_IN_USE,
      });
    }
    const result = await this.department.remove(dept);

    if (!result) {
      throw rpcErr({
        type: RPCCode.INTERNAL_SERVER_ERROR,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
      });
    }

    return true;
  }

  async updateDepartment(data: {
    id: string;
    code: string;
    name: string;
  }): Promise<DepartmentDto> {
    if (!data?.id || !isUUID(data?.id)) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: DepartmentErrCodes.INVALID_DEPT,
        message: DepartmentErrMessage.INVALID_DEPT,
      });
    }
    const dept = await this.department.findOne({ where: { id: data.id } });
    if (!dept) {
      throw rpcErr({
        type: RPCCode.CONFLICT,
        code: DepartmentErrCodes.DEPT_NOT_FOUND,
        message: DepartmentErrMessage.DEPT_NOT_FOUND,
      });
    }

    const updatedDept = await this.department.save({
      ...dept,
      code: data.code ?? dept.code,
      name: data.name ?? dept.name,
    });

    return plainToInstance(Department, updatedDept, {
      enableImplicitConversion: true,
    });
  }
}
