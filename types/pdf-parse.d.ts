declare module "pdf-parse" {
  function pdfParse(
    data: Buffer | Uint8Array
  ): Promise<{ text: string; numpages?: number; info?: unknown }>;
  export = pdfParse;
}
