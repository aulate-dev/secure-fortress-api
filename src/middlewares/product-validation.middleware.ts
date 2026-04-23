import { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";

const INVALID_CHARACTERS_MESSAGE = "Caracteres no permitidos detectados";

const BASIC_TEXT_PATTERN = /^[\p{L}\p{N}\s.,;:!?'"()\-]+$/u;
const ALPHANUMERIC_CODE_PATTERN = /^[A-Za-z0-9]+$/;

const trimmedString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
}, z.string().min(1));

const productPayloadSchema = z
  .object({
    codigo: trimmedString.optional(),
    sku_alfanumerico: trimmedString.optional(),
    nombre: trimmedString,
    descripcion: trimmedString,
    cantidad: z.coerce.number().finite().min(0),
    precio: z.coerce.number().finite().min(0),
  })
  .superRefine((payload, context) => {
    const code = payload.codigo ?? payload.sku_alfanumerico;

    if (!code || !ALPHANUMERIC_CODE_PATTERN.test(code)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: INVALID_CHARACTERS_MESSAGE,
        path: ["codigo"],
      });
    }

    if (!BASIC_TEXT_PATTERN.test(payload.nombre)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: INVALID_CHARACTERS_MESSAGE,
        path: ["nombre"],
      });
    }

    if (!BASIC_TEXT_PATTERN.test(payload.descripcion)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: INVALID_CHARACTERS_MESSAGE,
        path: ["descripcion"],
      });
    }
  })
  .transform((payload) => ({
    sku_alfanumerico: payload.codigo ?? payload.sku_alfanumerico ?? "",
    nombre: payload.nombre,
    descripcion: payload.descripcion,
    cantidad: payload.cantidad,
    precio: payload.precio,
  }));

export const validateProductPayload = (req: Request, res: Response, next: NextFunction): void => {
  const result = productPayloadSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: INVALID_CHARACTERS_MESSAGE });
    return;
  }

  req.body = result.data;
  next();
};
