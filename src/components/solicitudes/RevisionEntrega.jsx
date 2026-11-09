// P-07 · Revisión de una entrega por la supervisora o el personal administrativo (RF-06).
import { useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { ESTADOS } from '../../constants/estados';
import { revisarEntrega } from '../../services/entregasService';
import { mensajeDeError } from '../../utils/firebaseErrors';

export default function RevisionEntrega({ entrega, perfil, onRevisado, onCancelar }) {
  const [comentario, setComentario] = useState(entrega.comentarioRevision ?? '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async (estado) => {
    setError('');
    if (estado === ESTADOS.CORRECCION && comentario.trim().length < 3) {
      setError('Escriba qué debe corregir el plantel.');
      return;
    }
    setGuardando(true);
    try {
      await revisarEntrega(entrega.id, estado, comentario, perfil);
      onRevisado?.();
    } catch (e) {
      console.error('[revisar entrega]', e);
      setError(mensajeDeError(e));
      setGuardando(false);
    }
  };

  return (
    <div className="review-box">
      <label htmlFor={`com-${entrega.id}`}>Observaciones para el plantel</label>
      <textarea
        id={`com-${entrega.id}`}
        maxLength={1000}
        placeholder="Obligatorio si solicita una corrección. Opcional al aceptar."
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        disabled={guardando}
      />
      {error && <span className="form-error">{error}</span>}
      <div className="review-actions">
        <button type="button" className="btn btn-outline" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
        <button type="button" className="btn btn-warn" onClick={() => guardar(ESTADOS.CORRECCION)} disabled={guardando}>
          <RotateCcw size={15} aria-hidden="true" /> Solicitar corrección
        </button>
        <button type="button" className="btn btn-primary" onClick={() => guardar(ESTADOS.ACEPTADO)} disabled={guardando}>
          <CheckCircle2 size={15} aria-hidden="true" /> Aceptar
        </button>
      </div>
    </div>
  );
}
