import { env } from '../config/env';
import { randomUUID } from 'crypto';

export interface BadgeInput {
  userId:      string;
  userEmail:   string;
  courseId:    string;
  courseName:  string;
  courseDesc:  string;
  issuedAt?:   Date;
}

export interface OpenBadge3 {
  '@context':        string[];
  id:                string;
  type:              string[];
  name:              string;
  issuer:            { id: string; type: string; name: string };
  issuedOn:          string;
  credentialSubject: {
    id:          string;
    type:        string;
    achievement: {
      id:          string;
      type:        string;
      name:        string;
      description: string;
      criteria:    { narrative: string };
      image:       { id: string; type: string };
    };
  };
}

export function buildOpenBadge(input: BadgeInput): OpenBadge3 {
  const badgeId = randomUUID();
  const issuedOn = (input.issuedAt ?? new Date()).toISOString();

  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id:   `urn:uuid:${badgeId}`,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    name: input.courseName,
    issuer: {
      id:   env.ISSUER_URL,
      type: 'Profile',
      name: env.ISSUER_NAME,
    },
    issuedOn,
    credentialSubject: {
      id:   `urn:uuid:${input.userId}`,
      type: 'AchievementSubject',
      achievement: {
        id:          `${env.ISSUER_URL}/courses/${input.courseId}/badge`,
        type:        'Achievement',
        name:        input.courseName,
        description: input.courseDesc || `Completó exitosamente el curso ${input.courseName}`,
        criteria: {
          narrative: 'Completar todos los módulos y obtener ≥60% en los cuestionarios de evaluación.',
        },
        image: {
          id:   `${env.ISSUER_URL}/badges/${input.courseId}.png`,
          type: 'Image',
        },
      },
    },
  };
}
