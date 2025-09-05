import { useState } from "react";
export default function ForgotPassword() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false);
  const submit = (e) => { e.preventDefault(); setSent(true); };
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-emerald-50 to-lime-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Forgot password?</h1>
        <p className="text-sm opacity-70 mb-6">Enter your account email and we’ll send a reset link.</p>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="block text-sm mb-1">Email</label>
            <input className="w-full border rounded-xl p-3" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@uni.edu" /></div>
          {!sent ? (<button className="w-full py-3 rounded-xl bg-black text-white">Send reset link</button>)
                 : (<div className="text-green-700 text-sm">If an account exists, a reset link has been sent.</div>)}
          <div className="text-sm text-center"><a href="/login" className="underline">Back to login</a></div>
        </form>
      </div>
    </div>
  );
}