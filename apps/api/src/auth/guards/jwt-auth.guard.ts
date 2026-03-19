import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// ── JWT Access Token Guard ────────────────────────────────────────────────────
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// ── Admin Role Guard ──────────────────────────────────────────────────────────
@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const req = super.handleRequest(err, user, info, context);
    if (!req || req.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return req;
  }
}
