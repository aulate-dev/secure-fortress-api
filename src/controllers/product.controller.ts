import { type Response } from "express";

import { database } from "../config/database";
import { type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { type UserRole } from "../services/auth.service";
import { logEvent } from "../services/audit.service";

interface ProductRecord {
  id: number;
  sku_alfanumerico: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precio: number;
}

const BASIC_TEXT_PATTERN = /^[\p{L}\p{N}\s.,;:!?'"()\-]+$/u;
const ALPHANUMERIC_CODE_PATTERN = /^[A-Za-z0-9]+$/;

const normalizeStringField = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseNonNegativeNumber = (value: unknown): number | null => {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }

  return numericValue;
};

const buildProductPatchByRole = (
  payload: Record<string, unknown>,
  role: UserRole,
): Partial<Omit<ProductRecord, "id">> | "forbidden" | null => {
  if (role === "Auditor") {
    return "forbidden";
  }

  const requestedCode = payload.codigo ?? payload.sku_alfanumerico;
  const requestedNombre = payload.nombre;
  const requestedDescripcion = payload.descripcion;
  const requestedCantidad = payload.cantidad;
  const requestedPrecio = payload.precio;

  if (
    role === "Registrador" &&
    (requestedPrecio !== undefined || requestedNombre !== undefined || requestedCode !== undefined)
  ) {
    return "forbidden";
  }

  const patch: Partial<Omit<ProductRecord, "id">> = {};

  if (requestedCode !== undefined && role === "SuperAdmin") {
    const code = normalizeStringField(requestedCode);
    if (!code || !ALPHANUMERIC_CODE_PATTERN.test(code)) {
      return null;
    }

    patch.sku_alfanumerico = code;
  }

  if (requestedNombre !== undefined && role === "SuperAdmin") {
    const nombre = normalizeStringField(requestedNombre);
    if (!nombre || !BASIC_TEXT_PATTERN.test(nombre)) {
      return null;
    }

    patch.nombre = nombre;
  }

  if (requestedDescripcion !== undefined) {
    const descripcion = normalizeStringField(requestedDescripcion);
    if (!descripcion || !BASIC_TEXT_PATTERN.test(descripcion)) {
      return null;
    }

    patch.descripcion = descripcion;
  }

  if (requestedCantidad !== undefined) {
    const cantidad = parseNonNegativeNumber(requestedCantidad);
    if (cantidad === null) {
      return null;
    }

    patch.cantidad = cantidad;
  }

  if (requestedPrecio !== undefined && role === "SuperAdmin") {
    const precio = parseNonNegativeNumber(requestedPrecio);
    if (precio === null) {
      return null;
    }

    patch.precio = precio;
  }

  return Object.keys(patch).length > 0 ? patch : null;
};

export const listProducts = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const products = await database<ProductRecord>("products").select("*").orderBy("id", "asc");
  res.status(200).json({ products });
};

export const getProductById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const product = await database<ProductRecord>("products").where({ id: productId }).first();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.status(200).json({ product });
};

export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const productPayload = req.body as Omit<ProductRecord, "id">;
    const [createdProduct] = await database<ProductRecord>("products")
      .insert(productPayload)
      .returning("*");

    await logEvent({
      event_type: "PRODUCT_CREATED",
      user_id: req.user?.sub ? Number(req.user.sub) : null,
      details: `Product ${createdProduct?.sku_alfanumerico ?? "unknown"} created`,
      req,
    });

    res.status(201).json({ product: createdProduct });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create product";
    res.status(400).json({ error: message });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({ error: "Invalid product id" });
      return;
    }

    const userRole = req.user?.role;
    if (!userRole) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const productPayload = buildProductPatchByRole(body, userRole);
    if (productPayload === "forbidden") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (!productPayload) {
      res.status(400).json({ error: "Invalid product payload" });
      return;
    }

    const [updatedProduct] = await database("products")
      .where({ id: productId })
      .update({ ...productPayload, updated_at: new Date() })
      .returning<ProductRecord[]>("*");

    if (!updatedProduct) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await logEvent({
      event_type: "PRODUCT_UPDATED",
      user_id: req.user?.sub ? Number(req.user.sub) : null,
      details: `Product ${updatedProduct.sku_alfanumerico} updated`,
      req,
    });

    res.status(200).json({ product: updatedProduct });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update product";
    res.status(400).json({ error: message });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const [deletedProduct] = await database<ProductRecord>("products")
    .where({ id: productId })
    .delete()
    .returning("*");

  if (!deletedProduct) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  await logEvent({
    event_type: "PRODUCT_DELETED",
    user_id: req.user?.sub ? Number(req.user.sub) : null,
    details: `Product ${deletedProduct.sku_alfanumerico} deleted`,
    req,
  });

  res.status(200).json({ message: "Product deleted" });
};
