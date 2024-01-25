// import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { JwtService } from '@nestjs/jwt';

// @Injectable()
// export class AuthGuard implements CanActivate {
//   constructor(
//     private reflector: Reflector,
//     private jwtService: JwtService, // Inject JwtService
//   ) {}
//   canActivate(context: ExecutionContext): boolean {
//     const request = context.switchToHttp().getRequest();
//     const token = request.headers?.authorization;
//     return request.headers?.authorization === 'valid_token';
//   }
// }
