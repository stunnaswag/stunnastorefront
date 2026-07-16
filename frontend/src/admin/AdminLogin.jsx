import React, { useState } from 'react';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('PLEASE FILL IN ALL FIELDS.');
      return;
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'AUTHENTICATION FAILED.');
      }

      localStorage.setItem('stunna_admin_token', data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err.message.toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-[#2C1414] flex flex-col items-center justify-center p-6 text-[#EAEAEA] w-full">
      <div className="w-full max-w-sm border-[1px] border-[#EAEAEA]/20 p-12 flex flex-col items-center">
        <h1 className="text-2xl lowercase tracking-tighter mb-2">stunna swag season</h1>
        <p className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50 mb-8">SYSTEM AUTHENTICATION</p>
        
        {error && <p className="text-[10px] tracking-widest text-red-400 mb-8 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="EMAIL ADDRESS"
            className="w-full bg-transparent border-b-[1px] border-[#EAEAEA]/20 pb-3 text-[10px] tracking-widest uppercase focus:outline-none focus:border-[#EAEAEA] transition-colors text-center placeholder:text-[#EAEAEA]/30"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="PASSWORD"
            className="w-full bg-transparent border-b-[1px] border-[#EAEAEA]/20 pb-3 text-[10px] tracking-widest uppercase focus:outline-none focus:border-[#EAEAEA] transition-colors text-center placeholder:text-[#EAEAEA]/30"
          />
          <button type="submit" className="w-full border-[1px] border-[#EAEAEA] py-4 text-[10px] tracking-widest uppercase hover:bg-[#EAEAEA] hover:text-[#2C1414] transition-colors font-medium">
            AUTHORIZE
          </button>
        </form>
      </div>
    </div>
  );
}
