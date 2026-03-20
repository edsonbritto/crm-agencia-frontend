'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass })
    })
    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Usuário ou senha incorretos')
      setLoading(false)
    }
  }

  return (
    <div style={{background:'#0f172a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{background:'#1e293b',padding:'40px',borderRadius:'16px',width:'360px',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <span style={{fontSize:'32px'}}>✦</span>
          <h1 style={{color:'#22c55e',margin:'8px 0 4px',fontSize:'22px'}}>AgênciaCRM</h1>
          <p style={{color:'#64748b',fontSize:'14px'}}>Faça login para continuar</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:'16px'}}>
            <label style={{color:'#94a3b8',fontSize:'13px',display:'block',marginBottom:'6px'}}>Usuário</label>
            <input value={user} onChange={e=>setUser(e.target.value)} placeholder='admin' style={{width:'100%',padding:'10px 14px',background:'#0f172a',border:'1px solid #334155',borderRadius:'8px',color:'white',fontSize:'15px',boxSizing:'border-box' as const}}/>
          </div>
          <div style={{marginBottom:'24px'}}>
            <label style={{color:'#94a3b8',fontSize:'13px',display:'block',marginBottom:'6px'}}>Senha</label>
            <input type='password' value={pass} onChange={e=>setPass(e.target.value)} placeholder='••••••••' style={{width:'100%',padding:'10px 14px',background:'#0f172a',border:'1px solid #334155',borderRadius:'8px',color:'white',fontSize:'15px',boxSizing:'border-box' as const}}/>
          </div>
          {error && <p style={{color:'#ef4444',fontSize:'13px',marginBottom:'16px',textAlign:'center'}}>{error}</p>}
          <button type='submit' disabled={loading} style={{width:'100%',padding:'12px',background: loading ? '#166534' : '#22c55e',border:'none',borderRadius:'8px',color:'white',fontSize:'16px',fontWeight:'bold',cursor:'pointer'}}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p style={{color:'#475569',fontSize:'12px',textAlign:'center',marginTop:'24px'}}>usuário: admin · senha: crm2024</p>
      </div>
    </div>
  )
}
