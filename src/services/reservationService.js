import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export function saveReservation(reservation) {
  return addDoc(collection(db, "reservations"), {
    ...reservation,
    status: "confirmed",
    createdAt: serverTimestamp(),
  });
}

export function listenToReservations(callback, errorCallback) {
  const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    },
    errorCallback
  );
}

export function updateReservationStatus(id, status) {
  return updateDoc(doc(db, "reservations", id), { status });
}

export function deleteReservation(id) {
  return deleteDoc(doc(db, "reservations", id));
}
