import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../auth/schemas/auth.schema';
import { RolesGuard } from '../role.guard';
import { Roles } from '../roles';
import { AdminService, DashboardSnapshot } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  dashboard(): Promise<DashboardSnapshot> {
    return this.adminService.snapshot();
  }
}
