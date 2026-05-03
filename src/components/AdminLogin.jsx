import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";

export default function AdminLogin({ setAdmin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAdmin(true);
      alert("Admin Logged In");
    } catch (err) {
      alert("Login Failed");
    }
  };

  return (
    <form onSubmit={login} className="p-5 bg-white rounded-xl shadow">
      <h2 className="font-bold text-xl mb-3">Admin Login</h2>
      <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)} className="border p-2 w-full mb-2"/>
      <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} className="border p-2 w-full mb-2"/>
      <button className="bg-blue-600 text-white px-4 py-2">Login</button>
    </form>
  );
}