export interface CitizenMock {
    cedula: string;
    codigoDactilar: string;
    nombres: string;
    apellidos: string;
    email: string;
    role: string;
    expirationTime: number;
}
export declare const CIUDADANOS_MOCK: CitizenMock[];
export declare function findCitizen(cedula: string, codigoDactilar: string): CitizenMock | null;
export declare function maskEmail(email: string): string;
