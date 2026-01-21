"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CIUDADANOS_MOCK = void 0;
exports.findCitizen = findCitizen;
exports.maskEmail = maskEmail;
exports.CIUDADANOS_MOCK = [
    {
        cedula: '1500958069',
        codigoDactilar: 'V4443V4444',
        nombres: 'ISSAC',
        apellidos: 'DE LA CADENA BONILLA',
        email: 'issacdelacadena@gmail.com',
        role: 'votante',
        expirationTime: 15,
    },
    {
        cedula: '1724915770',
        codigoDactilar: 'V4443V3442',
        nombres: 'JOEL',
        apellidos: 'DEFAZ',
        email: 'joe.def2019@gmail.com',
        role: 'votante',
        expirationTime: 15,
    },
    {
        cedula: '1734567890',
        codigoDactilar: 'V345678901',
        nombres: 'PARTICIPANTE TRES',
        apellidos: 'APELLIDO TRES',
        email: 'participante3@epn.edu.ec',
        role: 'votante',
        expirationTime: 15,
    },
];
function findCitizen(cedula, codigoDactilar) {
    return exports.CIUDADANOS_MOCK.find(c => c.cedula === cedula && c.codigoDactilar === codigoDactilar) || null;
}
function maskEmail(email) {
    const [user, domain] = email.split('@');
    const visibleChars = 3;
    const maskedPart = '*'.repeat(Math.max(user.length - visibleChars, 5));
    return `${user.substring(0, visibleChars)}${maskedPart}@${domain}`;
}
//# sourceMappingURL=citizen-mock.data.js.map