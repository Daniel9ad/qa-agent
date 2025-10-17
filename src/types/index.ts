export interface Project {
  id: string;
  name: string;
  url: string;
  viewsCount: number;
  flowsCount: number;
  isActive?: boolean;
}

export interface DashboardStats {
  totalTests: number;
  testsChange: number;
  successRate: number;
  successRateChange: number;
  avgDuration: number;
  durationChange: number;
  activeFlows: number;
  totalFlows: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}
