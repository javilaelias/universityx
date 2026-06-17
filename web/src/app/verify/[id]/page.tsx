import { Award, CheckCircle, Download, ExternalLink } from 'lucide-react';

const CRED_URL = process.env.CREDENTIALS_SERVICE_URL ?? 'http://localhost:4007';

interface OpenBadge {
  name:    string;
  issuer:  { name: string; id: string };
  issuedOn: string;
  credentialSubject: {
    achievement: {
      name:        string;
      description: string;
    };
  };
}

interface CredentialPayload {
  id:            string;
  issuedAt:      string;
  recipientName: string;
  credential:    OpenBadge;
}

async function fetchCredential(id: string): Promise<CredentialPayload | null> {
  try {
    const res = await fetch(`${CRED_URL}/credentials/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function VerifyPage({ params }: { params: { id: string } }) {
  const data = await fetchCredential(params.id);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Credencial no encontrada</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            El ID proporcionado no corresponde a ninguna credencial válida o ha sido revocada.
          </p>
          <a href="/" className="text-green-600 dark:text-green-400 text-sm hover:underline">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  const { credential, recipientName } = data;
  const courseName = credential.credentialSubject.achievement.name;
  const issuerName = credential.issuer.name;
  const issuedDate = new Date(data.issuedAt).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Certificate card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-green-600 px-8 py-6 text-center">
            <p className="text-2xl font-bold text-white">Universidad X</p>
            <p className="text-green-200 text-sm mt-1">Plataforma de Aprendizaje Adaptativo</p>
          </div>

          {/* Body */}
          <div className="px-8 py-8 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
              <Award className="w-10 h-10 text-amber-500" />
            </div>

            <div>
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                Certificado de Finalización
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Se certifica que</p>
            </div>

            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {recipientName}
            </p>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">completó satisfactoriamente el curso</p>
              <p className="text-lg font-semibold text-green-700 dark:text-green-400 mt-1">{courseName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-400">Emitido el {issuedDate}</p>
              <p className="text-xs text-gray-300 dark:text-gray-500 mt-0.5">por {issuerName}</p>
            </div>
          </div>

          {/* Verified badge + actions */}
          <div className="border-t border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Credencial verificada</span>
            </div>
            <a
              href={`/api/credentials/${params.id}/pdf`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar PDF
            </a>
          </div>

          {/* Credential ID */}
          <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 px-8 py-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center font-mono truncate">
              ID: {params.id}
            </p>
          </div>
        </div>

        {/* Open Badge JSON link */}
        <div className="mt-4 text-center">
          <a
            href={`/api/credentials/${params.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-white/60 text-xs hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver credencial Open Badges 3.0 (JSON)
          </a>
        </div>
      </div>
    </div>
  );
}
