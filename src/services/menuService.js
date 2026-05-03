import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export function listenToMenu(callback, onError) {
  const menuQuery = query(collection(db, "menu"), orderBy("createdAt", "desc"));
  return onSnapshot(menuQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, onError);
}

export function addMenuItem(item) {
  return addDoc(collection(db, "menu"), {
    ...item,
    price: Number(item.price),
    available: true,
    createdAt: serverTimestamp(),
  });
}

export function toggleMenuAvailability(item) {
  return updateDoc(doc(db, "menu", item.id), { available: !item.available });
}

export function deleteMenuItem(id) {
  return deleteDoc(doc(db, "menu", id));
}
