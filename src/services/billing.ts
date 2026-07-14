import { Platform } from "react-native";
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  ProductSubscription,
  type ProductSubscriptionAndroid,
  type ProductSubscriptionIOS,
  Purchase,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type PurchaseError,
} from "react-native-iap";
import { supabase } from "./supabase";
import { User } from "../types";

export const SOCIO_PLUS_PRODUCT_ID = "socio_plus_monthly";
const SOCIO_PLUS_PRODUCT_IDS = [SOCIO_PLUS_PRODUCT_ID];

export type BillingPlatform = "ios" | "android";
export type BillingStatus =
  | "active"
  | "inactive"
  | "pending"
  | "expired"
  | "cancelled"
  | "refunded"
  | "billing_retry";

export interface SocioPlusProduct {
  productId: string;
  title: string;
  description: string;
  localizedPrice: string;
  currency: string;
  billingPeriod: string;
  raw: ProductSubscription;
}

export interface SocioPlusEntitlement {
  isSocioPlus: boolean;
  subscriptionStatus: BillingStatus;
  expiresAt?: string | null;
  productId?: string | null;
  platform?: BillingPlatform | null;
}

export type SocioPlusAccessRole =
  | {
      role: "user" | "moderator" | "admin";
      status: "active" | "suspended" | "banned";
    }
  | null
  | undefined;

type BillingListeners = {
  onPurchaseVerified?: (entitlement: SocioPlusEntitlement) => void;
  onPurchasePending?: () => void;
  onPurchaseError?: (message: string) => void;
};

let connected = false;
let cleanupListeners: (() => void) | null = null;
let purchaseInFlightResolver:
  | ((result: SocioPlusEntitlement | "pending") => void)
  | null = null;
let purchaseInFlightRejecter: ((error: Error) => void) | null = null;

const getPlatform = (): BillingPlatform => {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  throw new Error("In-app purchases are only available on iOS and Android.");
};

const ensureConnection = async () => {
  if (connected) return;
  connected = await initConnection();
};

const normalizeProduct = (product: ProductSubscription): SocioPlusProduct => {
  const androidProduct =
    product.platform === "android"
      ? (product as ProductSubscriptionAndroid)
      : null;
  const iosProduct =
    product.platform === "ios" ? (product as ProductSubscriptionIOS) : null;
  const androidOffer =
    androidProduct?.subscriptionOfferDetailsAndroid?.[0];
  const androidPricingPhase =
    androidOffer?.pricingPhases?.pricingPhaseList?.[0];
  const billingPeriod =
    androidPricingPhase?.billingPeriod ||
    (iosProduct?.subscriptionPeriodUnitIOS
      ? String(iosProduct.subscriptionPeriodUnitIOS).toLowerCase()
      : "month");

  return {
    productId: product.id,
    title: product.displayName || product.title || "Sociol+",
    description: product.description || "Unlock Sociol+",
    localizedPrice:
      androidPricingPhase?.formattedPrice ||
      product.displayPrice ||
      (typeof product.price === "number" ? String(product.price) : ""),
    currency: androidPricingPhase?.priceCurrencyCode || product.currency || "",
    billingPeriod: String(billingPeriod),
    raw: product,
  };
};

const getAndroidOfferToken = (product?: ProductSubscription | null) => {
  if (!product || product.platform !== "android") return undefined;
  return (product as ProductSubscriptionAndroid).subscriptionOfferDetailsAndroid
    ?.[0]?.offerToken;
};

const callVerifyFunction = async (
  payload: Record<string, unknown>,
): Promise<SocioPlusEntitlement> => {
  const { data, error } = await supabase.functions.invoke(
    "verify-socio-plus",
    { body: payload },
  );

  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));

  return {
    isSocioPlus: Boolean(data?.isSocioPlus),
    subscriptionStatus: (data?.subscriptionStatus || "inactive") as BillingStatus,
    expiresAt: data?.expiresAt ?? null,
    productId: data?.productId ?? null,
    platform: data?.platform ?? null,
  };
};

const buildVerificationPayload = (
  purchase: Purchase,
  action: "verify_purchase" | "restore" = "verify_purchase",
) => {
  const platform = getPlatform();
  const productId = purchase.productId || SOCIO_PLUS_PRODUCT_ID;

  return {
    action,
    platform,
    productId,
    purchaseToken: purchase.purchaseToken ?? null,
    transactionId: purchase.transactionId ?? purchase.id ?? null,
    purchaseState: purchase.purchaseState,
  };
};

const verifyPurchaseWithBackend = async (
  purchase: Purchase,
  action: "verify_purchase" | "restore" = "verify_purchase",
) => {
  const entitlement = await callVerifyFunction(
    buildVerificationPayload(purchase, action),
  );

  if (entitlement.isSocioPlus) {
    await finishTransaction({ purchase, isConsumable: false });
  }

  return entitlement;
};

const friendlyPurchaseError = (error: PurchaseError | Error) => {
  const code = "code" in error ? String(error.code) : "";
  if (code.includes("USER_CANCELLED") || code.includes("CANCEL")) {
    return "Purchase cancelled.";
  }
  if (code.includes("ALREADY") || code.includes("OWNED")) {
    return "You already own this subscription. Restoring purchase...";
  }
  return error.message || "Purchase failed. Please try again.";
};

export const initBilling = async (listeners: BillingListeners = {}) => {
  await ensureConnection();

  if (cleanupListeners) return cleanupListeners;

  const purchaseSub = purchaseUpdatedListener(async (purchase) => {
    try {
      if (purchase.purchaseState === "pending") {
        listeners.onPurchasePending?.();
        purchaseInFlightResolver?.("pending");
        purchaseInFlightResolver = null;
        purchaseInFlightRejecter = null;
        return;
      }

      const entitlement = await verifyPurchaseWithBackend(purchase);
      listeners.onPurchaseVerified?.(entitlement);
      purchaseInFlightResolver?.(entitlement);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not verify purchase.";
      listeners.onPurchaseError?.(message);
      purchaseInFlightRejecter?.(new Error(message));
    } finally {
      purchaseInFlightResolver = null;
      purchaseInFlightRejecter = null;
    }
  });

  const errorSub = purchaseErrorListener((error) => {
    const message = friendlyPurchaseError(error);
    listeners.onPurchaseError?.(message);
    purchaseInFlightRejecter?.(new Error(message));
    purchaseInFlightResolver = null;
    purchaseInFlightRejecter = null;
  });

  cleanupListeners = () => {
    purchaseSub.remove();
    errorSub.remove();
    cleanupListeners = null;
  };

  return cleanupListeners;
};

export const endBilling = async () => {
  cleanupListeners?.();
  await endConnection();
  connected = false;
};

export const getProducts = async (): Promise<SocioPlusProduct[]> => {
  await ensureConnection();
  const products = await fetchProducts({
    skus: SOCIO_PLUS_PRODUCT_IDS,
    type: "subs",
  });

  return ((products || []) as ProductSubscription[]).map(normalizeProduct);
};

export const purchaseSocioPlus = async (
  product?: SocioPlusProduct | null,
): Promise<SocioPlusEntitlement | "pending"> => {
  await ensureConnection();
  const platform = getPlatform();
  const productId = product?.productId || SOCIO_PLUS_PRODUCT_ID;

  const purchasePromise = new Promise<SocioPlusEntitlement | "pending">(
    (resolve, reject) => {
      purchaseInFlightResolver = resolve;
      purchaseInFlightRejecter = reject;
    },
  );

  try {
    await requestPurchase({
      type: "subs",
      request: {
        ios: {
          sku: productId,
          andDangerouslyFinishTransactionAutomatically: false,
        },
        android: {
          skus: [productId],
          subscriptionOffers: getAndroidOfferToken(product?.raw)
            ? [
                {
                  sku: productId,
                  offerToken: getAndroidOfferToken(product?.raw)!,
                },
              ]
            : undefined,
        },
      },
    });
  } catch (error) {
    purchaseInFlightResolver = null;
    purchaseInFlightRejecter = null;
    throw new Error(
      error instanceof Error ? friendlyPurchaseError(error) : "Purchase failed.",
    );
  }

  return platform ? purchasePromise : purchasePromise;
};

export const restorePurchases = async (): Promise<SocioPlusEntitlement> => {
  await ensureConnection();
  const purchases = await getAvailablePurchases({
    onlyIncludeActiveItemsIOS: true,
  });
  const socioPurchase = purchases.find((purchase) =>
    SOCIO_PLUS_PRODUCT_IDS.includes(purchase.productId),
  );

  if (!socioPurchase) {
    const entitlement = await refreshSubscriptionStatus();
    if (!entitlement.isSocioPlus) {
      throw new Error("No active Sociol+ subscription was found.");
    }
    return entitlement;
  }

  return verifyPurchaseWithBackend(socioPurchase, "restore");
};

export const refreshSubscriptionStatus =
  async (): Promise<SocioPlusEntitlement> => {
    return callVerifyFunction({ action: "refresh_status" });
  };

export const hasStaffSocioPlusAccess = (role: SocioPlusAccessRole) =>
  role?.status === "active" &&
  (role.role === "moderator" || role.role === "admin");

export const hasSocioPlusAccess = (
  profile: User | null | undefined,
  role?: SocioPlusAccessRole,
) =>
  hasStaffSocioPlusAccess(role) ||
  (Boolean(profile?.isSocioPlus) &&
    profile?.subscriptionStatus !== "expired" &&
    profile?.subscriptionStatus !== "cancelled" &&
    profile?.subscriptionStatus !== "refunded");

export const withStaffSocioPlusAccess = (
  profile: User | null,
  role: SocioPlusAccessRole,
): User | null => {
  if (!profile || !hasStaffSocioPlusAccess(role)) return profile;

  return {
    ...profile,
    isSocioPlus: true,
    subscriptionStatus: "active",
  };
};
