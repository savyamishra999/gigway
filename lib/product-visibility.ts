// V1 discovery policy only. Legacy routes, authorization and stored content stay intact.
// Re-enable these independently when each product is ready to relaunch.
export const productVisibility = {
  joxCurrentProduct: false,
  glimpsCurrentProduct: false,
};

export function isCurrentProductCategory(category: string): boolean {
  if (category === "jox" || category === "vijox") return productVisibility.joxCurrentProduct;
  if (category === "glimps") return productVisibility.glimpsCurrentProduct;
  return true;
}

export function currentProductFormats(): string[] {
  return ["standard", ...(productVisibility.joxCurrentProduct ? ["vijox"] : []), ...(productVisibility.glimpsCurrentProduct ? ["glimps"] : [])];
}
