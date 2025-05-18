import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

const navs = [
  { label: 'Home', icon: '🏠', key: 'home' },
  { label: 'Market', icon: '📊', key: 'market' },
  { label: 'Task', icon: '📝', key: 'task' },
  { label: 'More', icon: '☰', key: 'more' },
];

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const current = pathname === '/' ? 'home' : pathname.replace('/', '');
  console.log(current);
  return (
    <div style={styles.navbar}>
      {navs.map(nav => (
        <div
          key={nav.key}
          style={{
            flex: 1,
            textAlign: 'center',
            color: current === nav.key ? '#3b82f6' : '#888',
            fontWeight: current === nav.key ? 700 : 500,
            fontSize: 13,
            cursor: 'pointer',
          }}
          onClick={() => router.push(nav.key === 'home' ? '/' : `/${nav.key}`)}
      
        >
          <div style={{ fontSize: 22 }}>{nav.icon}</div>
          <div>{nav.label}</div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  navbar: {
    position: 'fixed' as const,
    left: '0',
    right: '0',
    bottom: '0',
    height: '64px',
    background: '#fff',
    borderTop: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    zIndex: 10,
    maxWidth: '480px',
    margin: '0 auto',
  },
}; 