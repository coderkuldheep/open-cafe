import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export function listenToPhotos(callback, onError) {
  const photoQuery = query(collection(db, "photos"), orderBy("createdAt", "desc"));
  return onSnapshot(photoQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, onError);
}

export function addCafePhoto(url) {
  return addDoc(collection(db, "photos"), {
    url,
    createdAt: serverTimestamp(),
  });
}

export function deleteCafePhoto(id) {
  return deleteDoc(doc(db, "photos", id));
}
