export function paginate(items, page = 1, perPage = 15) {
  const current = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(perPage) || 15);
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / size));
  const start = (current - 1) * size;
  const slice = items.slice(start, start + size);
  const from = total === 0 ? 0 : start + 1;
  const to = start + slice.length;

  return {
    data: slice,
    meta: {
      current_page: current,
      last_page: lastPage,
      per_page: size,
      total,
      from,
      to,
    },
  };
}
