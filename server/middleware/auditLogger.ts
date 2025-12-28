import type { Request, Response, NextFunction } from 'express';

interface AuditLog {
  timestamp: Date;
  userId?: string;
  method: string;
  path: string;
  statusCode?: number;
  action: string;
  changes?: Record<string, any>;
}

const auditLogs: AuditLog[] = [];

export function auditLogger(req: Request, res: Response, next: NextFunction) {
  // Capture response details
  const originalJson = res.json;
  
  res.json = function(body: any) {
    const isAdminAction = (req.path.includes('/api/cards/') && req.method === 'PATCH') ||
                          req.path.includes('/api/settings') && req.method === 'PUT';
    
    if (isAdminAction) {
      const log: AuditLog = {
        timestamp: new Date(),
        userId: (req as any).user?.id || 'unknown',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        action: `${req.method} ${req.path}`,
        changes: req.body
      };
      
      auditLogs.push(log);
      
      // Keep only last 1000 logs in memory
      if (auditLogs.length > 1000) {
        auditLogs.shift();
      }
      
      console.log(`[AUDIT] ${log.action} by ${log.userId} - Status: ${log.statusCode}`);
    }
    
    return originalJson.call(res, body);
  };
  
  next();
}

export function getAuditLogs() {
  return auditLogs;
}

export function clearAuditLogs() {
  auditLogs.length = 0;
}
