/** Top user by completed tasks (for analytics). */
export interface TopUserByCompletedTasks {
  userId: string;
  userName: string;
  userEmail: string;
  completedCount: number;
  totalCostFromCompleted: number;
}

/** GET /tasks/analytics response. */
export interface TaskAnalytics {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  completionRate: number;
  overdueTasks: number;
  totalCost: number;
  averageCostPerTask: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  averageActualHoursPerCompletedTask: number;
  totalAssignments: number;
  totalUsers: number;
  usersWithAssignments: number;
  topUserByCompletedTasks: TopUserByCompletedTasks | null;
}
