export async function downloadGuide() {
  const module = await import("./guidePdf");
  return module.downloadGuidePdf();
}
