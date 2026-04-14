const ADMIN_ROLE_VALUES = new Set([
  'admin',
  'administrator',
  'superadmin',
  'super_admin',
  'superuser',
  'super_user',
  'staff',
]);

const TRUE_LIKE_VALUES = new Set(['1', 'true', 'yes']);

const ADMIN_PERMISSION_VALUES = new Set([
  'admin',
  'admin:access',
  'admin_access',
  'manage_admin',
  'manage_catalog',
  'staff',
  'superadmin',
  'superuser',
]);

export const normalizeRoleValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const toBooleanFlag = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    return TRUE_LIKE_VALUES.has(normalizeRoleValue(value));
  }

  // Objects, arrays, and other non-primitive types are NOT valid boolean flags.
  // This prevents decoded JWT payloads (stored as the `admin` field) from being
  // mistakenly treated as `true`.
  return false;
};

const getCandidateObjects = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  return [
    payload.user,
    payload.profile,
    payload.admin,
    payload.account,
    payload.me,
    payload,
  ].filter((candidate) => candidate && typeof candidate === 'object' && !Array.isArray(candidate));
};

const getFirstDefinedValue = (objects, keys) => {
  for (const object of objects) {
    for (const key of keys) {
      if (object[key] !== undefined && object[key] !== null && object[key] !== '') {
        return object[key];
      }
    }
  }

  return undefined;
};

const collectStringValues = (objects, keys) => {
  const values = [];

  objects.forEach((object) => {
    keys.forEach((key) => {
      const value = object?.[key];
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry !== undefined && entry !== null && entry !== '') {
            values.push(entry);
          }
        });
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        values.push(value);
      }
    });
  });

  return values;
};

export const getAuthUserSource = (payload = {}) => {
  const [nestedSource] = getCandidateObjects(payload).filter((candidate) => candidate !== payload);
  return nestedSource || (payload && typeof payload === 'object' ? payload : {});
};

export const isAdminRole = (value) => {
  const normalizedValue = normalizeRoleValue(value);

  return (
    ADMIN_ROLE_VALUES.has(normalizedValue) ||
    normalizedValue === 'admin' ||
    normalizedValue === 'superuser'
  );
};

export const hasAdminGroup = (groups) =>
  Array.isArray(groups) &&
  groups.some((group) =>
    isAdminRole(typeof group === 'string' ? group : group?.name || group?.slug || group?.role),
  );

export const isAdminUser = (...sources) => {
  const candidates = sources.flatMap((source) => getCandidateObjects(source));

  if (!candidates.length) {
    return false;
  }

  const rawRole = getFirstDefinedValue(candidates, [
    'role',
    'user_role',
    'user_type',
    'userType',
    'role_name',
    'type',
    'account_type',
    'accountType',
    'kind',
  ]);

  if (isAdminRole(rawRole)) {
    return true;
  }

  const permissionValues = collectStringValues(candidates, [
    'permissions',
    'permission',
    'scopes',
    'scope',
  ]);

  if (
    permissionValues.some((value) =>
      ADMIN_PERMISSION_VALUES.has(normalizeRoleValue(typeof value === 'string' ? value : value?.name || value?.code || value?.slug)),
    )
  ) {
    return true;
  }

  return candidates.some(
    (candidate) =>
      toBooleanFlag(candidate.is_superuser) ||
      toBooleanFlag(candidate.isSuperuser) ||
      toBooleanFlag(candidate.is_staff) ||
      toBooleanFlag(candidate.isStaff) ||
      toBooleanFlag(candidate.is_admin) ||
      toBooleanFlag(candidate.isAdmin) ||
      // NOTE: Do NOT check `candidate.admin` here — it is used as a container
      // key for the user profile object (e.g. decoded JWT), not as a boolean flag.
      hasAdminGroup(candidate.groups),
  );
};

export const resolveUserRole = (...sources) => {
  if (isAdminUser(...sources)) {
    return 'admin';
  }

  return 'customer';
};
