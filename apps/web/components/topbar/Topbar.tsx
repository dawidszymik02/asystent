'use client'

export default function Topbar({ title }: { title: string }) {
  return (
    <div
      style={{
        height: 56,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        color: '#111827',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>
        {title}
      </span>
      <Avatar />
    </div>
  )
}

function Avatar() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: '#ECFDF5',
        color: '#065F46',
        fontSize: 12,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      U
    </div>
  )
}
