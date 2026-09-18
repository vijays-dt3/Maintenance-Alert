// apps/backend/src/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { sendError, sendSuccess } from '../utils/response.js';

export class DashboardController {
  static async getOverview(req: Request, res: Response) {
    try {
      const data = await DashboardService.getOverview();
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, 'DASHBOARD_ERROR', err.message, 500);
    }
  }
}
