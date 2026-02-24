/** User list item with finished task count and total cost. */
export interface UserListResult {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  finishedTasksCount: number;
  totalFinishedTasksCost: number;
}
