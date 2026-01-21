/**
 * Datos Mock de Ciudadanos para Auth Service
 * En producción, esto consultaría al Census Service
 */

export interface CitizenMock {
    cedula: string;
    codigoDactilar: string;
    nombres: string;
    apellidos: string;
    email: string;
    role: string;
    expirationTime: number;
}

export const CIUDADANOS_MOCK: CitizenMock[] = [
    {
        cedula: '1500958069',
        codigoDactilar: 'V4443V4444',
        nombres: 'ISSAC',
        apellidos: 'DE LA CADENA BONILLA',
        email: 'issacdelacadena@gmail.com', // Email registrado en Resend para pruebas
        role: 'votante',
        expirationTime: 10,
    },
    {
        cedula: '1724915770',
        codigoDactilar: 'V4443V3442',
        nombres: 'JOEL',
        apellidos: 'DEFAZ',
        email: 'joe.def2019@gmail.com',
        role: 'votante',
        expirationTime: 10,
    },
    {
        cedula: '1734567890',
        codigoDactilar: 'V345678901',
        nombres: 'PARTICIPANTE TRES',
        apellidos: 'APELLIDO TRES',
        email: 'participante3@epn.edu.ec',
        role: 'votante',
        expirationTime: 10,
    },
];

/**
 * Buscar ciudadano por cédula y código dactilar
 */
export function findCitizen(cedula: string, codigoDactilar: string): CitizenMock | null {
    return CIUDADANOS_MOCK.find(
        c => c.cedula === cedula && c.codigoDactilar === codigoDactilar
    ) || null;
}

/**
 * Enmascarar email para mostrar al usuario
 */
export function maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    const visibleChars = 3;
    const maskedPart = '*'.repeat(Math.max(user.length - visibleChars, 5));
    return `${user.substring(0, visibleChars)}${maskedPart}@${domain}`;
}
