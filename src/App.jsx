import emailjs from "@emailjs/browser";
import AdminDashboard from "./components/AdminDashboard";
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "./services/firebase";
import {
  listenToMenu,
  addMenuItem,
  deleteMenuItem,
  toggleMenuAvailability,
} from "./services/menuService";
import {
  listenToPhotos,
  addCafePhoto,
  deleteCafePhoto,
} from "./services/photoService";
import { saveReservation } from "./services/reservationService";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const DEMO_MENU = [
  { id: "demo-1", name: "Signature Cappuccino", category: "Coffee", price: 149, desc: "Fresh espresso, silky foam, cinnamon dust.", available: true },
  { id: "demo-2", name: "Iced Caramel Latte", category: "Coffee", price: 179, desc: "Cold latte with smooth caramel finish.", available: true },
  { id: "demo-3", name: "Cheese Garlic Bread", category: "Snacks", price: 129, desc: "Crispy bread, garlic butter, melted cheese.", available: true },
  { id: "demo-4", name: "Veg Club Sandwich", category: "Snacks", price: 189, desc: "Triple-layer sandwich with fresh veggies.", available: true },
  { id: "demo-5", name: "Brownie Sundae", category: "Desserts", price: 159, desc: "Warm brownie with vanilla ice cream.", available: true },
  { id: "demo-6", name: "Margherita Pizza", category: "Meals", price: 279, desc: "Classic cheesy cafe-style pizza.", available: true },
];

const DEMO_PHOTOS = [
  { id: "demo-photo-1", url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop" },
  { id: "demo-photo-2", url: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1200&auto=format&fit=crop" },
  { id: "demo-photo-3", url: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=1200&auto=format&fit=crop" },
  { id: "demo-photo-4", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop" },
];

export default function App() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [category, setCategory] = useState("All");
  const [menuItems, setMenuItems] = useState(DEMO_MENU);
  const [photos, setPhotos] = useState(DEMO_PHOTOS);

  const [adminUser, setAdminUser] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [notice, setNotice] = useState("");
  const [reservation, setReservation] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    table: "Table for 2",
    note: "",
  });

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Coffee",
    price: "",
    desc: "",
  });

  const [newPhoto, setNewPhoto] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeMenu;
    let unsubscribePhotos;

    try {
      unsubscribeMenu = listenToMenu(
        (items) => items.length && setMenuItems(items),
        console.error
      );

      unsubscribePhotos = listenToPhotos(
        (items) => items.length && setPhotos(items),
        console.error
      );
    } catch (error) {
      console.warn("Firebase is not configured yet. Demo content is active.", error);
    }

    return () => {
      if (unsubscribeMenu) unsubscribeMenu();
      if (unsubscribePhotos) unsubscribePhotos();
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(menuItems.map((item) => item.category))],
    [menuItems]
  );

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const text = `${item.name} ${item.category} ${item.desc}`.toLowerCase();
      return (
        (category === "All" || item.category === category) &&
        text.includes(queryText.toLowerCase())
      );
    });
  }, [menuItems, category, queryText]);

  async function sendEmailConfirmation(data) {
    return emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        name: data.name,
        email: data.email,
        phone: data.phone,
        date: data.date,
        time: data.time,
        table: data.table,
        note: data.note || "None",
        to_email: data.email,
      },
      EMAILJS_PUBLIC_KEY
    );
  }

  async function handleAdminLogin(event) {
    event.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      setAdminEmail("");
      setAdminPassword("");
      setShowAdminLogin(false);
      setNotice("Admin logged in successfully.");
    } catch (error) {
      console.error(error);
      setNotice("Admin login failed. Check email and password.");
    }
  }

  async function handleAdminLogout() {
    await signOut(auth);
    setNotice("Admin logged out.");
  }

  async function handleReservation(event) {
    event.preventDefault();

    if (!reservation.email) {
      setNotice("Please enter a valid email address.");
      return;
    }

    const bookingData = {
      ...reservation,
      phone: reservation.phone.replace(/\D/g, ""),
    };

    try {
      await saveReservation(bookingData);
    } catch (error) {
      console.warn("Reservation was not saved to Firebase. Check .env setup.", error);
    }

    try {
      await sendEmailConfirmation(bookingData);
      setNotice("Reservation confirmed. Email confirmation sent successfully.");
    } catch (error) {
      console.error(error);
      setNotice("Reservation saved, but email failed. Check EmailJS setup.");
    }

    setReservation({
      name: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      table: "Table for 2",
      note: "",
    });
  }

  async function handleAddMenuItem(event) {
    event.preventDefault();

    if (!adminUser) {
      setNotice("Only admin can add menu items.");
      return;
    }

    try {
      await addMenuItem(newItem);
      setNotice("Menu item added successfully.");
      setNewItem({ name: "", category: "Coffee", price: "", desc: "" });
    } catch (error) {
      console.error(error);
      setNotice("Failed to add item. Check Firebase rules.");
    }
  }

  async function handleDeleteMenuItem(item) {
    if (!adminUser) {
      setNotice("Only admin can delete menu items.");
      return;
    }

    if (item.id.startsWith("demo")) {
      setNotice("Demo item cannot be deleted. Add Firebase items first.");
      return;
    }

    await deleteMenuItem(item.id);
    setNotice("Menu item deleted.");
  }

  async function handleToggleAvailability(item) {
    if (!adminUser) {
      setNotice("Only admin can update menu items.");
      return;
    }

    if (item.id.startsWith("demo")) {
      setNotice("Demo item cannot be edited. Add Firebase items first.");
      return;
    }

    await toggleMenuAvailability(item);
    setNotice("Menu availability updated.");
  }

  async function handleAddPhoto(event) {
    event.preventDefault();

    if (!adminUser) {
      setNotice("Only admin can add photos.");
      return;
    }

    try {
      await addCafePhoto(newPhoto);
      setNewPhoto("");
      setNotice("Photo added successfully.");
    } catch (error) {
      console.error(error);
      setNotice("Failed to add photo. Check Firebase rules.");
    }
  }

  async function handleDeletePhoto(photo) {
    if (!adminUser) {
      setNotice("Only admin can delete photos.");
      return;
    }

    if (photo.id.startsWith("demo")) {
      setNotice("Demo photo cannot be deleted. Add Firebase photos first.");
      return;
    }

    await deleteCafePhoto(photo.id);
    setNotice("Photo deleted.");
  }

  const navItems = ["Home", "Menu", "Reserve", "Photos", "About", "Contact"];

  return (
    <main className="min-h-screen bg-[#fff8ec] text-[#26170f]">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-amber-200/70 bg-[#fff8ec]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#home" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#0b3a78] text-xl text-white shadow-lg">☕</span>
            <span>
              <strong className="block text-lg font-black leading-tight sm:text-xl">Open Cafe</strong>
              <small className="hidden text-amber-800 sm:block">Fresh Coffee • Snacks • Tables</small>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-bold md:flex">
            {navItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-[#0b3a78]">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <a href="#reserve" className="rounded-full bg-[#0b3a78] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5">
              Book Table
            </a>

            {adminUser ? (
              <button onClick={handleAdminLogout} className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg">
                Logout
              </button>
            ) : (
              <button onClick={() => setShowAdminLogin(true)} className="rounded-full bg-[#26170f] px-5 py-3 text-sm font-black text-white shadow-lg">
                Admin
              </button>
            )}
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-2xl md:hidden">
            {mobileMenu ? "×" : "☰"}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenu && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-amber-200 bg-white md:hidden">
              <div className="grid gap-1 px-5 py-4">
                {navItems.map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenu(false)} className="rounded-xl px-4 py-3 font-bold hover:bg-amber-50">
                    {item}
                  </a>
                ))}

                {adminUser ? (
                  <button onClick={handleAdminLogout} className="rounded-xl bg-red-600 px-4 py-3 text-left font-bold text-white">
                    Logout Admin
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowAdminLogin(true);
                      setMobileMenu(false);
                    }}
                    className="rounded-xl bg-[#26170f] px-4 py-3 text-left font-bold text-white"
                  >
                    Admin Login
                  </button>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <section id="home" className="relative overflow-hidden px-4 pt-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#d99b2b 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex rounded-full border border-pink-300 bg-pink-50 px-4 py-2 text-xs font-black text-pink-700 sm:text-sm">
              Premium cafe experience
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Fresh Coffee, Cozy Tables & Beautiful Moments
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-stone-600 sm:text-lg">
              Explore the live menu, reserve a table, and view Open Cafe’s latest photos from any device.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#menu" className="rounded-2xl bg-[#0b3a78] px-7 py-4 text-center font-black text-white shadow-xl transition hover:-translate-y-1">
                View Menu
              </a>
              <a href="#reserve" className="rounded-2xl border-2 border-[#0b3a78] px-7 py-4 text-center font-black text-[#0b3a78] transition hover:-translate-y-1">
                Reserve Table
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative">
            <img className="h-[330px] w-full rounded-[2rem] object-cover shadow-2xl sm:h-[440px] lg:h-[520px]" src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop" alt="Coffee served at Open Cafe" />
            <div className="absolute -bottom-5 left-5 rounded-2xl bg-pink-600 px-5 py-3 text-sm font-black text-white shadow-xl sm:left-8 sm:text-base">
              Made Fresh Daily
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        {["Authentic Taste", "Fresh Daily", "Live Menu", "Email Booking"].map((item) => (
          <div key={item} className="rounded-3xl border border-amber-200 bg-white/80 p-6 shadow-sm">
            <span className="text-2xl">★</span>
            <strong className="mt-2 block">{item}</strong>
          </div>
        ))}
      </section>

      <section id="menu" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="font-black text-[#0b3a78]">Our Menu</p>
            <h2 className="text-3xl font-black sm:text-5xl">Explore Open Cafe Menu</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <span>🔍</span>
              <input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search menu..." className="w-full bg-transparent outline-none" />
            </label>

            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl bg-white px-4 py-3 shadow-sm outline-none">
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMenu.map((item, index) => (
            <motion.article key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }} className={`rounded-3xl bg-white p-6 shadow-lg transition hover:-translate-y-2 ${!item.available ? "opacity-50" : ""}`}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl">🍽️</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black">₹{item.price}</span>
              </div>
              <h3 className="text-xl font-black">{item.name}</h3>
              <p className="mt-2 min-h-12 text-stone-600">{item.desc}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-[#0b3a78]">{item.category}</span>
                <span className={`text-sm font-black ${item.available ? "text-green-700" : "text-red-700"}`}>
                  {item.available ? "Available" : "Unavailable"}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="reserve" className="bg-[#0b3a78] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="text-5xl">📅</span>
            <h2 className="mt-5 text-3xl font-black sm:text-5xl">Reserve Your Table</h2>
            <p className="mt-5 max-w-xl text-blue-100">
              Choose table size, date and time. Your reservation is saved and a confirmation email is sent automatically.
            </p>
          </div>

          <form onSubmit={handleReservation} className="grid gap-4 rounded-[2rem] bg-white p-5 text-stone-900 shadow-2xl sm:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <input required placeholder="Your name" value={reservation.name} onChange={(e) => setReservation({ ...reservation, name: e.target.value })} className="rounded-xl border p-3 outline-[#0b3a78]" />
              <input required type="email" placeholder="Your email" value={reservation.email} onChange={(e) => setReservation({ ...reservation, email: e.target.value })} className="rounded-xl border p-3 outline-[#0b3a78]" />
            </div>

            <input required placeholder="Phone number" value={reservation.phone} onChange={(e) => setReservation({ ...reservation, phone: e.target.value })} className="rounded-xl border p-3 outline-[#0b3a78]" />

            <div className="grid gap-4 sm:grid-cols-2">
              <input required type="date" value={reservation.date} onChange={(e) => setReservation({ ...reservation, date: e.target.value })} className="rounded-xl border p-3 outline-[#0b3a78]" />
              <input required type="time" value={reservation.time} onChange={(e) => setReservation({ ...reservation, time: e.target.value })} className="rounded-xl border p-3 outline-[#0b3a78]" />
            </div>

            <select value={reservation.table} onChange={(e) => setReservation({ ...reservation, table: e.target.value })} className="rounded-xl border p-3 outline-[#0b3a78]">
              <option>Table for 2</option>
              <option>Table for 5</option>
              <option>Table for 10</option>
              <option>Table for 15</option>
              <option>Birthday Party</option>
              <option>Family Party</option>
              <option>Corporate Party</option>
            </select>

            <textarea placeholder="Special request" value={reservation.note} onChange={(e) => setReservation({ ...reservation, note: e.target.value })} className="min-h-24 rounded-xl border p-3 outline-[#0b3a78]" />

            <button className="rounded-2xl bg-pink-600 px-6 py-4 font-black text-white shadow-lg transition hover:-translate-y-1">
              Confirm Reservation
            </button>
          </form>
        </div>
      </section>

      <section id="photos" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="font-black text-[#0b3a78]">Gallery</p>
        <h2 className="mb-8 text-3xl font-black sm:text-5xl">Latest Cafe Photos</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <motion.img key={photo.id || index} initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} src={photo.url} alt="Open Cafe gallery" className="h-72 w-full rounded-3xl object-cover shadow-lg" />
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-[2rem] bg-white p-6 shadow-xl sm:p-10 lg:grid-cols-2">
          <div>
            <p className="font-black text-[#0b3a78]">About Us</p>
            <h2 className="mt-2 text-3xl font-black sm:text-5xl">A calm place for coffee, snacks and celebrations.</h2>
          </div>
          <p className="text-lg leading-8 text-stone-600">
            Open Cafe is built for daily coffee lovers, students, families and party reservations.
          </p>
        </div>
      </section>

      {adminUser && (
        <AdminDashboard
          menuItems={menuItems}
          photos={photos}
          newItem={newItem}
          setNewItem={setNewItem}
          newPhoto={newPhoto}
          setNewPhoto={setNewPhoto}
          handleAddMenuItem={handleAddMenuItem}
          handleAddPhoto={handleAddPhoto}
          handleDeleteMenuItem={handleDeleteMenuItem}
          handleToggleAvailability={handleToggleAvailability}
          handleDeletePhoto={handleDeletePhoto}
          handleAdminLogout={handleAdminLogout}
          setNotice={setNotice}
        />
      )}

      <footer id="contact" className="bg-[#26170f] px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-2xl font-black">Open Cafe</h3>
            <p className="mt-2 text-stone-300">Good coffee. Good food. Good mood.</p>
          </div>
          <p>📍 Your cafe address here</p>
          <p>☎️ +91 98765 43210</p>
        </div>
      </footer>

      <AnimatePresence>
        {showAdminLogin && (
          <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <form onSubmit={handleAdminLogin} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <h2 className="text-2xl font-black">Admin Login</h2>
              <p className="mt-2 text-sm text-stone-600">Only the owner/admin can update menu and photos.</p>

              <input required type="email" placeholder="Admin email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="mt-5 w-full rounded-xl border p-3" />
              <input required type="password" placeholder="Admin password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="mt-3 w-full rounded-xl border p-3" />

              <div className="mt-5 flex gap-3">
                <button className="flex-1 rounded-2xl bg-[#0b3a78] px-5 py-3 font-black text-white">Login</button>
                <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 rounded-2xl bg-stone-200 px-5 py-3 font-black">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {notice && (
          <motion.button onClick={() => setNotice("")} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed bottom-5 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl bg-stone-950 px-5 py-4 text-center font-bold text-white shadow-2xl">
            {notice}
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}