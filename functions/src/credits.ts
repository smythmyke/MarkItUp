import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Credit pack definitions
export const CREDIT_PACKS = [
  { id: "pack_10", credits: 10, price: 200, label: "10 credits", perCredit: "$0.20" },
  { id: "pack_25", credits: 25, price: 450, label: "25 credits", perCredit: "$0.18" },
  { id: "pack_50", credits: 50, price: 800, label: "50 credits", perCredit: "$0.16" },
  { id: "pack_100", credits: 100, price: 1500, label: "100 credits", perCredit: "$0.15" },
] as const;

const FREE_CREDITS_ON_SIGNUP = 5;

interface CreditDoc {
  balance: number;
  freeCreditsGranted: boolean;
  totalPurchased: number;
  totalUsed: number;
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
}

function defaultCreditDoc(): CreditDoc {
  return {
    balance: 0,
    freeCreditsGranted: false,
    totalPurchased: 0,
    totalUsed: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

// Get balance for a user
export async function getBalance(
  db: FirebaseFirestore.Firestore,
  uid: string
): Promise<{ balance: number; freeCreditsGranted: boolean; totalUsed: number }> {
  const docRef = db.collection("credits").doc(uid);
  const snap = await docRef.get();

  if (!snap.exists) {
    return { balance: 0, freeCreditsGranted: false, totalUsed: 0 };
  }

  const data = snap.data() as CreditDoc;
  return {
    balance: data.balance || 0,
    freeCreditsGranted: data.freeCreditsGranted || false,
    totalUsed: data.totalUsed || 0,
  };
}

// Initialize credits for a new user — grants 5 free credits on first sign-in
export async function initCredits(
  db: FirebaseFirestore.Firestore,
  uid: string
): Promise<void> {
  const docRef = db.collection("credits").doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);

    if (!snap.exists) {
      // New user — create doc with free credits
      tx.set(docRef, {
        ...defaultCreditDoc(),
        balance: FREE_CREDITS_ON_SIGNUP,
        freeCreditsGranted: true,
      });
      return;
    }

    const data = snap.data() as CreditDoc;
    if (!data.freeCreditsGranted) {
      // Existing doc but free credits not yet granted
      tx.update(docRef, {
        balance: admin.firestore.FieldValue.increment(FREE_CREDITS_ON_SIGNUP),
        freeCreditsGranted: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    // Already granted — do nothing
  });
}

// Atomically deduct 1 credit
export async function useCredit(
  db: FirebaseFirestore.Firestore,
  uid: string
): Promise<{ remaining: number }> {
  const docRef = db.collection("credits").doc(uid);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);

    if (!snap.exists) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "No credits available. Purchase credits to continue."
      );
    }

    const data = snap.data() as CreditDoc;
    const balance = data.balance || 0;

    if (balance < 1) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "No credits remaining. Purchase credits to continue."
      );
    }

    const newBalance = balance - 1;
    tx.update(docRef, {
      balance: newBalance,
      totalUsed: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { remaining: newBalance };
  });
}

export interface PurchaseMetadata {
  packId: string;
  packLabel: string;
  amountPaid: number; // cents
}

// Add purchased credits
export async function addCredits(
  db: FirebaseFirestore.Firestore,
  uid: string,
  amount: number,
  purchaseMetadata?: PurchaseMetadata
): Promise<void> {
  const docRef = db.collection("credits").doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);

    if (!snap.exists) {
      tx.set(docRef, {
        ...defaultCreditDoc(),
        balance: amount,
        totalPurchased: amount,
      });
    } else {
      tx.update(docRef, {
        balance: admin.firestore.FieldValue.increment(amount),
        totalPurchased: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Write purchase record to subcollection
    if (purchaseMetadata) {
      const purchaseRef = db
        .collection("credits")
        .doc(uid)
        .collection("purchases")
        .doc();
      tx.set(purchaseRef, {
        date: admin.firestore.FieldValue.serverTimestamp(),
        packId: purchaseMetadata.packId,
        packLabel: purchaseMetadata.packLabel,
        credits: amount,
        amountPaid: purchaseMetadata.amountPaid,
      });
    }
  });
}

// Route credit requests
export async function handleCreditRequest(
  path: string,
  body: Record<string, unknown>,
  user: admin.auth.DecodedIdToken
): Promise<unknown> {
  const db = admin.firestore();
  const subPath = path.replace(/^\/credits\/?/, "");

  switch (subPath) {
    case "balance":
      return getBalance(db, user.uid);

    case "init":
      await initCredits(db, user.uid);
      return getBalance(db, user.uid);

    case "checkout": {
      const { createCreditCheckoutSession } = await import("./stripe");
      const packId = body.packId as string;
      if (!packId) {
        throw new functions.https.HttpsError("invalid-argument", "packId is required");
      }
      return createCreditCheckoutSession(user.uid, user.email || "", packId);
    }

    case "packs":
      return { packs: CREDIT_PACKS };

    default:
      throw new functions.https.HttpsError("not-found", `Unknown credit endpoint: ${subPath}`);
  }
}
