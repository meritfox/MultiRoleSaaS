import { db, ensureFirebaseInit } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { ReviewSummary, SellerReview, ServiceReview } from "@/types";

const getServiceReviewsRef = () => {
  ensureFirebaseInit();
  return collection(db, "serviceReviews");
};

const getSellerReviewsRef = () => {
  ensureFirebaseInit();
  return collection(db, "sellerReviews");
};

const getServiceRequestsRef = () => {
  ensureFirebaseInit();
  return collection(db, "serviceRequests");
};

const getServicesRef = () => {
  ensureFirebaseInit();
  return collection(db, "services");
};

function buildSummary(ratings: number[]): ReviewSummary {
  if (ratings.length === 0) return { average: 0, count: 0 };
  const total = ratings.reduce((sum, r) => sum + r, 0);
  return {
    average: Math.round((total / ratings.length) * 10) / 10,
    count: ratings.length,
  };
}

export async function canReviewService(
  reviewerId: string,
  serviceId: string
): Promise<boolean> {
  const snap = await getDocs(
    query(
      getServiceRequestsRef(),
      where("studentId", "==", reviewerId),
      where("serviceId", "==", serviceId),
      where("status", "==", "APPROVED")
    )
  );
  return !snap.empty;
}

export async function getServiceReviews(serviceId: string): Promise<ServiceReview[]> {
  const snap = await getDocs(
    query(
      getServiceReviewsRef(),
      where("serviceId", "==", serviceId),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceReview);
}

async function recalculateServiceMetrics(serviceId: string): Promise<ReviewSummary> {
  const reviews = await getServiceReviews(serviceId);
  const summary = buildSummary(reviews.map((r) => r.rating));
  try {
    await updateDoc(doc(getServicesRef(), serviceId), {
      rating: summary.average,
      reviews: summary.count,
      updatedAt: Date.now(),
    });
  } catch {
    // Aggregation persistence is best-effort from the client;
    // list/detail UIs still receive up-to-date summary from review reads.
  }
  return summary;
}

export async function addServiceReview(params: {
  serviceId: string;
  providerId: string;
  reviewerId: string;
  reviewerName?: string;
  rating: number;
  comment: string;
}): Promise<{ review: ServiceReview; summary: ReviewSummary }> {
  const eligible = await canReviewService(params.reviewerId, params.serviceId);
  if (!eligible) {
    throw new Error("You can review this service only after your request is approved.");
  }

  const existing = await getDocs(
    query(
      getServiceReviewsRef(),
      where("serviceId", "==", params.serviceId),
      where("reviewerId", "==", params.reviewerId)
    )
  );
  if (!existing.empty) {
    throw new Error("You have already reviewed this service.");
  }

  const payload: Omit<ServiceReview, "id"> = {
    serviceId: params.serviceId,
    providerId: params.providerId,
    reviewerId: params.reviewerId,
    reviewerName: params.reviewerName,
    rating: Math.max(1, Math.min(5, Math.round(params.rating))),
    comment: params.comment.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const docRef = await addDoc(getServiceReviewsRef(), payload);
  const summary = await recalculateServiceMetrics(params.serviceId);
  return { review: { id: docRef.id, ...payload }, summary };
}

export async function getSellerReviews(sellerId: string): Promise<SellerReview[]> {
  const snap = await getDocs(
    query(
      getSellerReviewsRef(),
      where("sellerId", "==", sellerId),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SellerReview);
}

export async function getSellerReviewSummary(sellerId: string): Promise<ReviewSummary> {
  const reviews = await getSellerReviews(sellerId);
  return buildSummary(reviews.map((r) => r.rating));
}

export async function addSellerReview(params: {
  sellerId: string;
  reviewerId: string;
  reviewerName?: string;
  rating: number;
  comment: string;
}): Promise<{ review: SellerReview; summary: ReviewSummary }> {
  const existing = await getDocs(
    query(
      getSellerReviewsRef(),
      where("sellerId", "==", params.sellerId),
      where("reviewerId", "==", params.reviewerId)
    )
  );
  if (!existing.empty) {
    throw new Error("You have already reviewed this seller.");
  }

  const payload: Omit<SellerReview, "id"> = {
    sellerId: params.sellerId,
    reviewerId: params.reviewerId,
    reviewerName: params.reviewerName,
    rating: Math.max(1, Math.min(5, Math.round(params.rating))),
    comment: params.comment.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const docRef = await addDoc(getSellerReviewsRef(), payload);
  const summary = await getSellerReviewSummary(params.sellerId);
  return { review: { id: docRef.id, ...payload }, summary };
}
