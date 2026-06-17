"use client";

import { useEffect, useState } from "react";
import { useSession }           from "next-auth/react";
import { User, Award, ExternalLink, RefreshCw } from "lucide-react";

interface Badge {
  id:              string;
  credentialName:  string;
  courseName:      string;
  issuedAt:        string;
  openBadgeUrl:    string;
  verifyUrl:       string;
  badge: {
    name:        string;
    description: string;
    image:       string;
  };
}

interface CredentialsResponse {
  credentials: Badge[];
  total:       number;
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-700/50">
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        {badge.badge.image ? (
          <img src={badge.badge.image} alt={badge.badge.name} className="w-10 h-10 object-contain" />
        ) : (
          <Award className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{badge.credentialName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{badge.courseName}</p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          Emitido el {new Date(badge.issuedAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{badge.badge.description}</p>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <a
          href={badge.verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Verificar credencial"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Verificar
        </a>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session }                               = useSession();
  const [credentials, setCredentials]                   = useState<Badge[]>([]);
  const [total, setTotal]                               = useState(0);
  const [loading, setLoading]                           = useState(true);
  const [error, setError]                               = useState<string | null>(null);
  const [claiming, setClaiming]                         = useState(false);
  const [claimMsg, setClaimMsg]                         = useState<string | null>(null);

  const fetchCredentials = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credentials");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: CredentialsResponse = await res.json();
      setCredentials(data.credentials);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const claimBadges = async () => {
    setClaiming(true);
    setClaimMsg(null);
    try {
      const res = await fetch("/api/credentials", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (res.ok) {
        setClaimMsg("¡Credencial emitida! Actualizando...");
        await fetchCredentials();
      } else {
        setClaimMsg(data.message ?? data.error ?? "No hay nuevas credenciales disponibles.");
      }
    } catch {
      setClaimMsg("No se pudo emitir la credencial.");
    } finally {
      setClaiming(false);
    }
  };

  const user = session?.user;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Mi Perfil</h1>

      {/* User info card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold">
            {user?.name?.[0]?.toUpperCase() ?? <User className="w-8 h-8" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold truncate">{user?.name}</p>
          <p className="text-sm text-[var(--muted)] truncate">{user?.email}</p>
          <span className="mt-1 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 capitalize">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Credentials / Open Badges */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold">Microcredenciales</h2>
            {total > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                {total}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCredentials}
              disabled={loading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={claimBadges}
              disabled={claiming}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
            >
              {claiming ? "Verificando..." : "Reclamar credenciales"}
            </button>
          </div>
        </div>

        {claimMsg && (
          <p className="text-xs text-center py-2 px-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
            {claimMsg}
          </p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 text-center py-4">{error}</p>
        ) : credentials.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin credenciales aún</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Completa tus cursos al 100% y reclama tus badges Open Badges 3.0
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-2">
          Credenciales compatibles con Open Badges 3.0 · Verificables externamente
        </p>
      </div>
    </div>
  );
}
