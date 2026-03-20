'use client'
import { useEffect, useState, useRef } from 'react'
import { leadsService } from '@/lib/api'

const stages = [
  { id: 'novo', label: 'Novos Leads', color: '#4f8ef7' },
  { id: 'contato', label: 'Em Contato', color: '#9b72f5' },
  { id: 'proposta', label: 'Proposta', color: '#f7953e' },
  { id: 'negociacao', label: 'Negociação', color: '#25d366' },
  { id: 'fechado', label: 'Fechados', color: '#f75f5f' },
]

function Avatar({ name, color, size = 36 }: any) {
  const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${color}22`, border: `1.5px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

export default function CRM() {
  const [leads, setLeads] = useState<any[]>([])
  const [view, setView] = useState('dashboard')
  const [activeContact, setActiveContact] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [waStatus, setWaStatus] = useState('unknown')
  const [messages, setMessages] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', value: '', tag: '', stage: 'novo' })
  const bottomRef = useRef<any>()

  const colors = ['#4f8ef7','#9b72f5','#f7953e','#25d366','#f75f5f','#e67e22','#1abc9c']

  useEffect(() => { leadsService.listar().then(r => setLeads(r.data)) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const criarLead = async () => {
    if (!form.name || !form.phone) return
    const r = await leadsService.criar({ ...form, value: parseFloat(form.value) || 0 })
    setLeads(l => [r.data, ...l])
    setForm({ name: '', company: '', phone: '', email: '', value: '', tag: '', stage: 'novo' })
    setShowForm(false)
  }

  const mudarStage = async (id: string, stage: string) => {
    await leadsService.atualizar(id, { stage })
    setLeads(l => l.map(x => x.id === id ? { ...x, stage } : x))
  }

  const openWhatsApp = async () => {
    setView('chat')
    await checkWaStatus()
  }

  const openChat = async (lead: any) => {
    setActiveContact(lead)
    setMessages([])
    setView('chat')
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const res = await fetch(`${API}/api/leads/${lead.id}/messages`)
      if (res.ok) {
        const msgs = await res.json()
        setMessages(msgs.map((m: any) => ({
          from: m.from,
          text: m.text,
          time: new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        })))
      }
    } catch(e) {
      console.error('Erro ao carregar mensagens:', e)
    }
  }

  const sendMsg = async () => {
    if (!msg.trim() || !activeContact) return
    const text = msg
    const now = new Date()
    setMessages(m => [...m, { from: 'me', text, time: `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}` }])
    setMsg('')
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads/${activeContact.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
    } catch(e) {
      console.error('Erro ao enviar mensagem:', e)
    }
  }

  const checkWaStatus = async () => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    try {
      const r = await fetch(`${API}/api/whatsapp/status`)
      const d = await r.json()
      setWaStatus(d.state)
      if (d.state !== 'open') {
        const qr = await fetch(`${API}/api/whatsapp/qr`)
        const q = await qr.json()
        if (q.base64) setQrCode(q.base64)
      } else {
        setQrCode('')
      }
    } catch(e) {}
  }

  const disconnect = async () => {
    if (!confirm('Desconectar o WhatsApp? Precisará escanear o QR Code novamente.')) return
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    await fetch(`${API}/api/disconnect`, { method: 'POST' })
    alert('WhatsApp desconectado!')
  }

  const totalPipeline = leads.reduce((s, l) => s + (l.value || 0), 0)

  const s = {
    wrap: { display: 'flex', height: '100vh', background: '#0f1117', color: '#e8eaf2', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' },
    sidebar: { width: 200, background: '#1a1d27', borderRight: '1px solid #2a2f47', display: 'flex', flexDirection: 'column' as const, padding: '16px 8px' },
    logo: { padding: '8px 12px 20px', fontSize: 15, fontWeight: 700, color: '#25d366' },
    navBtn: (active: boolean) => ({ width: '100%', padding: '9px 12px', borderRadius: 8, border: active ? '1px solid #25d36633' : '1px solid transparent', background: active ? '#25d36611' : 'none', color: active ? '#25d366' : '#8b90a8', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, textAlign: 'left' as const, marginBottom: 2 }),
    main: { flex: 1, overflow: 'auto', padding: 28 },
    card: { background: '#1a1d27', border: '1px solid #2a2f47', borderRadius: 12, padding: '16px 20px' },
    btn: { background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    input: { background: '#20243a', border: '1px solid #2a2f47', borderRadius: 8, padding: '9px 12px', color: '#e8eaf2', fontSize: 13, width: '100%', boxSizing: 'border-box' as const },
  }

  return (
    <div style={s.wrap}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.logo}>◈ AgênciaCRM</div>
        {[['dashboard','▦ Dashboard'],['kanban','⊟ Pipeline'],['contacts','◈ Contatos'],['chat', waStatus === 'open' ? '● WhatsApp' : '○ WhatsApp']].map(([id, label]) => (
          <button key={id} style={s.navBtn(view === id)} onClick={() => id === 'chat' ? openWhatsApp() : setView(id)}>{label}</button>
        ))}
        <div style={{flex:1}}/>
        <button onClick={disconnect} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #ef444433',background:'#ef444411',color:'#ef4444',cursor:'pointer',fontSize:12,fontWeight:600,textAlign:'left' as const}}>⊗ Desconectar WA</button>
      </div>

      {/* Dashboard */}
      {view === 'dashboard' && (
        <div style={s.main}>
          <h2 style={{ margin: '0 0 4px' }}>Dashboard</h2>
          <p style={{ color: '#8b90a8', margin: '0 0 24px', fontSize: 13 }}>Visão geral da sua agência</p>
          <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' as const }}>
            {[['👥 Leads', leads.length, 'total'],['💰 Pipeline', `R$ ${totalPipeline.toLocaleString('pt-BR')}`, 'em aberto'],['✅ Fechados', leads.filter(l=>l.stage==='fechado').length, 'leads'],['📊 Conversão', leads.length ? Math.round(leads.filter(l=>l.stage==='fechado').length/leads.length*100)+'%' : '0%', 'taxa']].map(([label, val, sub]) => (
              <div key={String(label)} style={{ ...s.card, flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 12, color: '#8b90a8', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 11, color: '#25d366', marginTop: 6 }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Leads recentes</h3>
            <button style={s.btn} onClick={() => setShowForm(true)}>+ Novo Lead</button>
          </div>
          <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
            {leads.slice(0, 5).map((lead, i) => (
              <div key={lead.id} onClick={() => openChat(lead)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < 4 ? '1px solid #2a2f47' : 'none', cursor: 'pointer' }}>
                <Avatar name={lead.name} color={colors[i % colors.length]} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{lead.name}</div>
                  <div style={{ fontSize: 12, color: '#8b90a8' }}>{lead.company} · {lead.tag}</div>
                </div>
                <div style={{ fontSize: 13, color: '#25d366', fontWeight: 600 }}>R$ {(lead.value||0).toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: 11, color: '#8b90a8', background: '#2a2f47', borderRadius: 6, padding: '2px 8px' }}>{lead.stage}</div>
              </div>
            ))}
            {leads.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#8b90a8', fontSize: 13 }}>Nenhum lead ainda. Crie o primeiro!</div>}
          </div>
        </div>
      )}

      {/* Kanban */}
      {view === 'kanban' && (
        <div style={{ ...s.main, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
            <div>
              <h2 style={{ margin: '0 0 4px' }}>Pipeline Kanban</h2>
              <p style={{ color: '#8b90a8', margin: 0, fontSize: 13 }}>{leads.length} leads · R$ {totalPipeline.toLocaleString('pt-BR')}</p>
            </div>
            <button style={s.btn} onClick={() => setShowForm(true)}>+ Novo Lead</button>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
            {stages.map(stage => {
              const cards = leads.filter(l => l.stage === stage.id)
              return (
                <div key={stage.id} style={{ minWidth: 210, background: '#1a1d27', border: '1px solid #2a2f47', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2f47', background: `${stage.color}0a` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, display: 'inline-block' }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{stage.label}</span>
                      <span style={{ marginLeft: 'auto', background: `${stage.color}22`, color: stage.color, borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{cards.length}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#8b90a8', marginTop: 3 }}>R$ {cards.reduce((s,l)=>s+(l.value||0),0).toLocaleString('pt-BR')}</div>
                  </div>
                  <div style={{ padding: 8, display: 'flex', flexDirection: 'column' as const, gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                    {cards.map((lead, i) => (
                      <div key={lead.id} style={{ background: '#20243a', border: '1px solid #2a2f47', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }} onClick={() => openChat(lead)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Avatar name={lead.name} color={colors[i % colors.length]} size={28} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{lead.name}</div>
                            <div style={{ fontSize: 11, color: '#8b90a8' }}>{lead.company}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, background: `${stage.color}18`, color: stage.color, borderRadius: 6, padding: '2px 7px' }}>{lead.tag || 'sem tag'}</span>
                          <span style={{ fontSize: 11, color: '#25d366', fontWeight: 600 }}>R$ {(lead.value||0).toLocaleString('pt-BR')}</span>
                        </div>
                        <select onChange={e => mudarStage(lead.id, e.target.value)} value={lead.stage} onClick={e => e.stopPropagation()} style={{ marginTop: 8, width: '100%', background: '#1a1d27', border: '1px solid #2a2f47', color: '#8b90a8', borderRadius: 6, padding: '4px 6px', fontSize: 11 }}>
                          {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Contacts */}
      {view === 'contacts' && (
        <div style={s.main}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0 }}>Contatos · {leads.length}</h2>
            <button style={s.btn} onClick={() => setShowForm(true)}>+ Novo Lead</button>
          </div>
          <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
            {leads.map((lead, i) => (
              <div key={lead.id} onClick={() => openChat(lead)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < leads.length-1 ? '1px solid #2a2f47' : 'none', cursor: 'pointer' }}>
                <Avatar name={lead.name} color={colors[i % colors.length]} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{lead.name}</div>
                  <div style={{ fontSize: 12, color: '#8b90a8' }}>{lead.company} · {lead.phone}</div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 13, color: '#25d366', fontWeight: 600 }}>R$ {(lead.value||0).toLocaleString('pt-BR')}</div>
                  <div style={{ fontSize: 11, color: '#8b90a8' }}>{lead.stage}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat */}
      {view === 'chat' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: 260, background: '#1a1d27', borderRight: '1px solid #2a2f47', overflowY: 'auto' as const }}>
            {waStatus !== 'open' && (
              <div style={{padding:'20px',textAlign:'center',borderBottom:'1px solid #2a2f47'}}>
                <p style={{color:'#ef4444',fontSize:13,marginBottom:12}}>⚠️ WhatsApp desconectado</p>
                {qrCode ? (
                  <div>
                    <img src={qrCode} style={{width:200,height:200,background:'white',padding:8,borderRadius:8}} alt="QR Code"/>
                    <p style={{color:'#94a3b8',fontSize:11,marginTop:8}}>Escaneie com o WhatsApp</p>
                    <button onClick={checkWaStatus} style={{marginTop:8,padding:'6px 12px',background:'#25d366',border:'none',borderRadius:6,color:'white',fontSize:12,cursor:'pointer'}}>Atualizar status</button>
                  </div>
                ) : (
                  <button onClick={checkWaStatus} style={{padding:'8px 16px',background:'#25d366',border:'none',borderRadius:8,color:'white',fontSize:13,cursor:'pointer'}}>Conectar WhatsApp</button>
                )}
              </div>
            )}
            <div style={{ padding: '16px', borderBottom: '1px solid #2a2f47', fontWeight: 600, fontSize: 14 }}>WhatsApp · {leads.length}</div>
            {leads.map((lead, i) => (
              <div key={lead.id} onClick={() => openChat(lead)} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid #2a2f4733', cursor: 'pointer', background: activeContact?.id === lead.id ? '#25d36611' : 'none' }}>
                <Avatar name={lead.name} color={colors[i % colors.length]} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{lead.name}</div>
                  <div style={{ fontSize: 11, color: '#8b90a8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.company}</div>
                </div>
              </div>
            ))}
          </div>
          {activeContact ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2f47', display: 'flex', alignItems: 'center', gap: 12, background: '#1a1d27' }}>
                <Avatar name={activeContact.name} color="#25d366" size={40} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{activeContact.name}</div>
                  <div style={{ fontSize: 12, color: '#8b90a8' }}>{activeContact.phone} · {activeContact.stage}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: '#25d366', fontWeight: 700, fontSize: 13 }}>R$ {(activeContact.value||0).toLocaleString('pt-BR')}</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' as const, padding: '20px 20px 8px', background: '#0f1117' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                    <div style={{ maxWidth: '72%', background: m.from === 'me' ? '#25d36622' : '#1a1d27', border: `1px solid ${m.from === 'me' ? '#25d36644' : '#2a2f47'}`, borderRadius: m.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '9px 14px' }}>
                      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
                      <div style={{ fontSize: 10, color: '#4a4f6a', textAlign: 'right' as const, marginTop: 3 }}>{m.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2f47', display: 'flex', gap: 10, background: '#1a1d27' }}>
                <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder={`Mensagem para ${activeContact.name.split(' ')[0]}...`} style={{ ...s.input, borderRadius: 24 }} />
                <button onClick={sendMsg} style={{ ...s.btn, borderRadius: '50%', width: 40, height: 40, padding: 0, flexShrink: 0, fontSize: 16 }}>➤</button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' as const, color: '#8b90a8' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#e8eaf2' }}>Selecione um contato</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>para iniciar uma conversa</div>
            </div>
          )}
        </div>
      )}

      {/* Modal novo lead */}
      {showForm && (
        <div style={{ position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1a1d27', border: '1px solid #2a2f47', borderRadius: 16, padding: 28, width: 400 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Novo Lead</h3>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {[['name','Nome *'],['company','Empresa'],['phone','Telefone *'],['email','Email'],['value','Valor (R$)'],['tag','Tag']].map(([field, label]) => (
                <div key={field}>
                  <div style={{ fontSize: 11, color: '#8b90a8', marginBottom: 4 }}>{label}</div>
                  <input style={s.input} value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={label} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, color: '#8b90a8', marginBottom: 4 }}>Estágio</div>
                <select style={{ ...s.input }} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={criarLead} style={s.btn}>Salvar Lead</button>
              <button onClick={() => setShowForm(false)} style={{ ...s.btn, background: '#2a2f47', color: '#8b90a8' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
