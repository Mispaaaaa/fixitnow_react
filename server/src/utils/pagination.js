export function getPagination(query, defaultLimit = 10) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}

export function pagedData(items, total, page, limit) {
  return {
    items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export function getSort(query, allowed, fallback = [['createdAt', 'DESC']]) {
  const field = allowed[query.sort];
  if (!field) return fallback;
  const direction = String(query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return [[field, direction]];
}