import { UserProfile, UserPermissions, ModulePermissions } from '../types';

export const getRoleDefaults = (role: string): UserPermissions => {
  const defaultPermissions: UserPermissions = {
    clients: { access: true, view: true, add: false, edit: false, delete: false },
    machines: { access: true, view: true, add: false, edit: false, delete: false },
    inventory: { access: true, view: true, add: false, edit: false, delete: false },
    partsIssue: { access: true, view: true, issuePart: false, cancelIssue: false },
    engineerBag: { access: true, view: true, add: false, edit: false, delete: false },
    workshop: { access: true, view: true, createIn: false, addActivity: false, markReady: false, prepareOut: false, approveIn: false, approveOut: false },
    serviceReports: { access: true, view: true, add: false, edit: false, delete: false },
    workEntries: { access: true, view: true, add: false, edit: false, delete: false },
    users: { access: false, view: false, createUser: false, resetPassword: false, disableUser: false, deleteUser: false, manageRights: false },
    reports: { access: true, view: true, export: false }
  };

  if (role === 'ADMIN') {
    return {
      clients: { access: true, view: true, add: true, edit: true, delete: true },
      machines: { access: true, view: true, add: true, edit: true, delete: true },
      inventory: { access: true, view: true, add: true, edit: true, delete: true },
      partsIssue: { access: true, view: true, issuePart: true, cancelIssue: true },
      engineerBag: { access: true, view: true, add: true, edit: true, delete: true },
      workshop: { access: true, view: true, createIn: true, addActivity: true, markReady: true, prepareOut: true, approveIn: true, approveOut: true },
      serviceReports: { access: true, view: true, add: true, edit: true, delete: true },
      workEntries: { access: true, view: true, add: true, edit: true, delete: true },
      users: { access: true, view: true, createUser: true, resetPassword: true, disableUser: true, deleteUser: true, manageRights: true },
      reports: { access: true, view: true, export: true }
    };
  } else if (role === 'STORE') {
    return {
      ...defaultPermissions,
      inventory: { ...defaultPermissions.inventory, add: true, edit: true },
      partsIssue: { ...defaultPermissions.partsIssue, issuePart: true },
      workshop: { ...defaultPermissions.workshop, approveIn: true, approveOut: true },
    };
  } else {
    // ENGINEER
    return {
      ...defaultPermissions,
      serviceReports: { ...defaultPermissions.serviceReports, add: true, edit: true },
      workEntries: { ...defaultPermissions.workEntries, add: true, edit: true },
      workshop: { ...defaultPermissions.workshop, createIn: true, addActivity: true, markReady: true, prepareOut: true }
    };
  }
};

export const getUserPermissions = (user: UserProfile): UserPermissions => {
  if (user.role === 'ADMIN') return getRoleDefaults('ADMIN');
  return user.permissions || getRoleDefaults(user.role);
};

export const canAccessModule = (user: UserProfile, module: keyof UserPermissions): boolean => {
  const perms = getUserPermissions(user);
  return !!perms[module]?.access;
};

export const canPerform = (user: UserProfile, module: keyof UserPermissions, action: string): boolean => {
  if (!canAccessModule(user, module)) return false;
  const perms = getUserPermissions(user);
  const modPerms = perms[module] as any;
  return !!modPerms[action];
};
