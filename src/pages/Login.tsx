import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, session } from '../api';
import { Logo } from '../components/Sitio';
import { ErrorMsg } from '../components/ui';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const { token } = await api<{ token: string }>('/auth/login', { method: 'POST', body: { email, password } });
      session.set(token);
      navigate((location.state as { from?: string } | null)?.from ?? '/admin', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="centered">
      <form className="card narrow" onSubmit={enviar}>
        <Logo />
        <p className="muted">Panel del equipo</p>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <ErrorMsg error={error} />
        <button type="submit" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
