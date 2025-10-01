import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartment1759200176978 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
  INSERT INTO departments (id, code, name, "isActive")
  VALUES
    (gen_random_uuid(), 'ITSD', 'IT Service Desk (L1 Support)', true),
    (gen_random_uuid(), 'DSS', 'Desktop / Field Support (L2)', true),
    (gen_random_uuid(), 'NET', 'Network & Infrastructure', true),
    (gen_random_uuid(), 'APP', 'Application Support / Development', true),
    (gen_random_uuid(), 'DBA', 'Database Administration', true),
    (gen_random_uuid(), 'SEC', 'Information Security / Cybersecurity', true),
    (gen_random_uuid(), 'OPS', 'Cloud / Systems Operations', true),
    (gen_random_uuid(), 'CAB', 'Change Advisory Board / Change Mgmt', true),
    (gen_random_uuid(), 'MGMT', 'IT Management / Governance', true)
  ON CONFLICT (code) DO NOTHING;
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
