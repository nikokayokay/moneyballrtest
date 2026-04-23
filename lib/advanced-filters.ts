export type FilterOperator = "eq" | "gte" | "lte" | "includes";

export interface FilterRule<T> {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
}

export function applyFilters<T extends Record<string, unknown>>(rows: T[], filters: Array<FilterRule<T>>) {
  return rows.filter((row) => filters.every((filter) => {
    const current = row[filter.field];
    if (filter.operator === "eq") return current === filter.value;
    if (filter.operator === "gte") return Number(current) >= Number(filter.value);
    if (filter.operator === "lte") return Number(current) <= Number(filter.value);
    if (filter.operator === "includes") return String(current || "").toLowerCase().includes(String(filter.value).toLowerCase());
    return true;
  }));
}
