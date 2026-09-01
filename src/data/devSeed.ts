/**
 * Dados de demonstração apenas para desenvolvimento offline.
 * Não é carregado automaticamente — chame loadDevSeed() manualmente se necessário.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';
import type {
  Animal,
  Appointment,
  AppNotification,
  Evaluation,
  Feedback,
  User,
} from '../types';
import { generateId } from '../utils/id';
import { todayISO } from '../utils/date';

const tutorId = 'dev-tutor-1';
const vetId = 'dev-vet-1';
const animalId = 'dev-animal-1';

const DEV_USERS: User[] = [
  {
    id: tutorId,
    name: 'Maria Silva (dev)',
    email: 'maria@email.com',
    phone: '11999990001',
    password: '123456',
    cpf: '12345678901',
    role: 'tutor',
    responsavelId: 1,
    autoLogin: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: vetId,
    name: 'Dr. João (dev)',
    email: 'joao@clinica.com',
    phone: '11999990002',
    password: '123456',
    cpf: '98765432100',
    role: 'veterinario',
    crmv: 'SP12345',
    veterinarioId: 1,
    autoLogin: false,
    createdAt: new Date().toISOString(),
  },
];

export async function loadDevSeed(): Promise<void> {
  const animals: Animal[] = [
    {
      id: animalId,
      tutorId,
      name: 'Thor',
      species: 'Cão',
      breed: 'Labrador',
      sex: 'macho',
      neutered: true,
      weight: 28,
      age: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const appointments: Appointment[] = [
    {
      id: 'dev-apt-1',
      animalId,
      tutorId,
      veterinarianId: vetId,
      date: todayISO(),
      time: '10:00',
      status: 'solicitada',
      notes: 'Consulta de rotina (dev)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: generateId(),
      userId: tutorId,
      title: 'RETORNO',
      message: 'Notificação de desenvolvimento.',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ];

  await setJson(STORAGE_KEYS.users, DEV_USERS);
  await setJson(STORAGE_KEYS.animals, animals);
  await setJson(STORAGE_KEYS.appointments, appointments);
  await setJson(STORAGE_KEYS.evaluations, [] as Evaluation[]);
  await setJson(STORAGE_KEYS.feedbacks, [] as Feedback[]);
  await setJson(STORAGE_KEYS.notifications, notifications);
  await AsyncStorage.setItem(STORAGE_KEYS.devSeedEnabled, 'true');
}
