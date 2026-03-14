export type Workspace = {
  id: string;
  name: string;
  rootPath: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkspaceInput = {
  name?: string;
  rootPath?: string;
  description?: string;
};
