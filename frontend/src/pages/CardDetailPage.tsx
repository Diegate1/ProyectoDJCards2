import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { CardDetailDto } from '../types';
import './CardDetailPage.css';

export const CardDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<CardDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardId) return;

    const loadCard = async () => {
      try {
        setLoading(true);
        setError(null);
        const cardData = await dataService.getCardDetail(cardId);
        setCard(cardData);
      } catch (err) {
        setError((err as Error).message);
        console.error('Error loading card detail:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCard();
  }, [cardId]);

  if (loading) {
    return <div className="card-detail-page loading">Cargando detalle de carta...</div>;
  }

  if (error) {
    return <div className="card-detail-page error">Error: {error}</div>;
  }

  if (!card) {
    return <div className="card-detail-page empty">Carta no encontrada</div>;
  }

  return (
    <div className="card-detail-page">
      <header className="page-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <h1>{card.name}</h1>
      </header>

      <div className="card-detail-container">
        {/* Bloque principal: Imagen + Datos base */}
        <section className="card-hero">
          <div className="card-image-container">
            <img 
              src={card.imageUrl || '/images/placeholder-card.png'} 
              alt={card.name} 
              className="card-image"
              title={card.imageUrl ? card.name : `${card.name} (sin imagen aún)`}
            />
          </div>

          <div className="card-info">
            <div className="info-row">
              <strong>Número:</strong>
              <span>#{card.number}</span>
            </div>

            <div className="info-row">
              <strong>Set:</strong>
              <span 
                onClick={() => navigate(`/dashboard/sets/${card.set.id}`)}
                style={{ cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}
              >
                {card.set.name}
              </span>
            </div>

            {card.rarity && (
              <div className="info-row">
                <strong>Rareza:</strong>
                <span>{card.rarity}</span>
              </div>
            )}

            {card.set.releaseDate && (
              <div className="info-row">
                <strong>Fecha Set:</strong>
                <span>{new Date(card.set.releaseDate).toLocaleDateString('es-ES')}</span>
              </div>
            )}

            {/* Precio actual */}
            <div className="price-box">
              <strong>Precio Actual:</strong>
              {card.currentPrice.amount !== null ? (
                <p className="price-amount">
                  ${card.currentPrice.amount.toFixed(2)}
                </p>
              ) : (
                <p className="price-none">Sin precio disponible</p>
              )}
            </div>
          </div>
        </section>

        {/* Placeholder para gráfico futuro */}
        <section className="price-history-placeholder">
          <h2>📊 Histórico de Precios</h2>
          <div className="placeholder-box">
            <p>📌 Pendiente de futura integración por scraping</p>
            <p style={{ fontSize: '0.9em', color: '#666' }}>
              Aquí aparecerá un gráfico con el historial de precios en los últimos 30 días
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
