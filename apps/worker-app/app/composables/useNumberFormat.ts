export const useNumberFormat = (value: Ref<string | number | bigint>) => {
  const formattedValue = computed(() => {
    if (typeof value.value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "decimal",
        maximumFractionDigits: 2,
      }).format(value.value);
    } else if (typeof value.value === "string") {
      const numValue = parseFloat(value.value);
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat("en-US", {
          style: "decimal",
          maximumFractionDigits: 2,
        }).format(numValue);
      }
    } else if (typeof value.value === "bigint") {
      return new Intl.NumberFormat("en-US", {
        style: "decimal",
        maximumFractionDigits: 0,
      }).format(Number(value.value));
    }

    return value.value;
  });

  return formattedValue;
};
