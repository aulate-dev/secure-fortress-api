import { type Response } from "express";

import { database } from "../config/database";
import { type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { logEvent } from "../services/audit.service";
import { requireNonEmptyString, requirePositiveNumber } from "../utils/validation.util";

interface ProductRecord {
  id: number;
  sku_alfanumerico: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precio: number;
}

const parseProductPayload = (payload: unknown): Omit<ProductRecord, "id"> => {
  const body = payload as Record<string, unknown>;
  const sku = requireNonEmptyString(body.sku_alfanumerico, "sku_alfanumerico");
  const nombre = requireNonEmptyString(body.nombre, "nombre");
  const descripcion = requireNonEmptyString(body.descripcion, "descripcion");
  const cantidad = requirePositiveNumber(body.cantidad, "cantidad");
  const precio = requirePositiveNumber(body.precio, "precio");

  if (!/^[a-zA-Z0-9_-]+$/.test(sku)) {
    throw new Error("sku_alfanumerico must be alphanumeric");
  }

  return { sku_alfanumerico: sku, nombre, descripcion, cantidad, precio };
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
    const productPayload = parseProductPayload(req.body);
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

    const productPayload = parseProductPayload(req.body);
    const [updatedProduct] = await database<ProductRecord>("products")
      .where({ id: productId })
      .update(productPayload)
      .returning("*");

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
