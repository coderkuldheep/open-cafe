import React, { useEffect, useMemo, useState } from "react";
import {
  listenToReservations,
  updateReservationStatus,
  deleteReservation,
} from "../services/reservationService";

export default function AdminDashboard({
  menuItems,
  photos,
  newItem,
  setNewItem,
  newPhoto,
  setNewPhoto,
  handleAddMenuItem,
  handleAddPhoto,
  handleDeleteMenuItem,
  handleToggleAvailability,
  handleDeletePhoto,
  handleAdminLogout,
  setNotice,
}) {
  const [tab, setTab] = useState("overview");
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const unsub = listenToReservations(setReservations, console.error);
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    return {
      menu: menuItems.length,
      photos: photos.length,
      reservations: reservations.length,
      confirmed: reservations.filter((item) => item.status === "confirmed").length,
    };
  }, [menuItems, photos, reservations]);

  async function changeReservationStatus(id, status) {
    await updateReservationStatus(id, status);
    setNotice("Reservation status updated.");
  }

  async function removeReservation(id) {
    await deleteReservation(id);
    setNotice("Reservation deleted.");
  }

  return (
    <section id="admin" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-black text-pink-600">Owner Dashboard</p>
          <h2 className="text-3xl font-black sm:text-5xl">Admin Control Panel</h2>
        </div>

        <button onClick={handleAdminLogout} className="rounded-2xl bg-red-600 px-6 py-3 font-black text-white">
          Logout Admin
        </button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Menu Items" value={stats.menu} />
        <Stat title="Cafe Photos" value={stats.photos} />
        <Stat title="Reservations" value={stats.reservations} />
        <Stat title="Confirmed" value={stats.confirmed} />
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {["overview", "menu", "photos", "reservations"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-2xl px-5 py-3 font-black capitalize ${
              tab === item ? "bg-[#0b3a78] text-white" : "bg-white text-[#26170f]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <h3 className="text-2xl font-black">Dashboard Overview</h3>
          <p className="mt-3 text-stone-600">
            Manage menu items, gallery photos, and customer reservations from one secure admin dashboard.
          </p>
        </div>
      )}

      {tab === "menu" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleAddMenuItem} className="grid gap-4 rounded-3xl bg-white p-6 shadow-lg">
            <h3 className="text-2xl font-black">Add Menu Item</h3>

            <input required placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="rounded-xl border p-3" />

            <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="rounded-xl border p-3">
              <option>Coffee</option>
              <option>Snacks</option>
              <option>Desserts</option>
              <option>Meals</option>
              <option>Mocktails</option>
            </select>

            <input required placeholder="Price" type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="rounded-xl border p-3" />

            <textarea required placeholder="Description" value={newItem.desc} onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })} className="rounded-xl border p-3" />

            <button className="rounded-2xl bg-[#0b3a78] px-6 py-3 font-black text-white">
              Add Menu Item
            </button>
          </form>

          <div className="grid gap-3 rounded-3xl bg-white p-6 shadow-lg">
            <h3 className="text-2xl font-black">Manage Menu</h3>

            {menuItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div>
                  <p className="font-black">{item.name}</p>
                  <p className="text-sm text-stone-500">
                    ₹{item.price} • {item.category} • {item.available ? "Available" : "Hidden"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => handleToggleAvailability(item)} className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-bold">
                    {item.available ? "Hide" : "Show"}
                  </button>

                  <button type="button" onClick={() => handleDeleteMenuItem(item)} className="rounded-lg bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "photos" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleAddPhoto} className="grid content-start gap-4 rounded-3xl bg-white p-6 shadow-lg">
            <h3 className="text-2xl font-black">Add Cafe Photo</h3>

            <input required placeholder="Paste image URL" value={newPhoto} onChange={(e) => setNewPhoto(e.target.value)} className="rounded-xl border p-3" />

            <button className="rounded-2xl bg-pink-600 px-6 py-3 font-black text-white">
              Add Photo
            </button>
          </form>

          <div className="grid gap-3 rounded-3xl bg-white p-6 shadow-lg">
            <h3 className="text-2xl font-black">Manage Photos</h3>

            {photos.map((photo) => (
              <div key={photo.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <img src={photo.url} className="h-14 w-20 rounded-lg object-cover" alt="Cafe" />
                <span className="truncate text-sm">{photo.url}</span>

                <button type="button" onClick={() => handleDeletePhoto(photo)} className="rounded-lg bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "reservations" && (
        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-2xl font-black">Customer Reservations</h3>

          <div className="grid gap-3">
            {reservations.length === 0 && <p className="text-stone-500">No reservations yet.</p>}

            {reservations.map((booking) => (
              <div key={booking.id} className="grid gap-3 rounded-2xl border p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="font-black">{booking.name}</p>
                  <p className="text-sm text-stone-600">
                    {booking.phone} • {booking.date} • {booking.time} • {booking.table}
                  </p>
                  {booking.note && <p className="mt-1 text-sm text-stone-500">Note: {booking.note}</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <select value={booking.status || "confirmed"} onChange={(e) => changeReservationStatus(booking.id, e.target.value)} className="rounded-xl border px-3 py-2">
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <button onClick={() => removeReservation(booking.id)} className="rounded-xl bg-red-100 px-4 py-2 font-bold text-red-700">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ title, value }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg">
      <p className="text-sm font-black text-stone-500">{title}</p>
      <h3 className="mt-2 text-4xl font-black text-[#0b3a78]">{value}</h3>
    </div>
  );
}