import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Automatically redirect to Versão 2
    window.location.replace('/versao-2/');
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#FAF7F2', color: '#1E2522' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Redirecionando para a Versão 2 da Lista de Presentes...</h1>
      <p style={{ marginBottom: '1.5rem', color: '#5A6660' }}>Se você não for redirecionado automaticamente, clique no botão abaixo:</p>
      <a 
        href="/versao-2/" 
        style={{ padding: '12px 24px', backgroundColor: '#3D5A4C', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
      >
        Acessar Lista de Presentes (Versão 2)
      </a>
    </div>
  );
}
