import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export function saveReservation(reservation) {
  return addDoc(collection(db, "reservations"), {
    ...reservation,
    status: "confirmed",
    createdAt: serverTimestamp(),
  });
}
