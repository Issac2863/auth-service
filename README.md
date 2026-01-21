# Auth Service - SEVoTec

> **Microservicio de Autenticación Multi-Factor (MFA)**  
> Sistema de Votación Electrónica Segura

---

## Descripción General

Servicio principal de autenticación que implementa un flujo **Multi-Factor Authentication (MFA)** con tres factores de seguridad:

| Factor | Tipo | Método |
|--------|------|--------|
| 1️⃣ **Conocimiento** | Something you know | Cédula + Código Dactilar |
| 2️⃣ **Posesión** | Something you have | Código OTP vía Email |
| 3️⃣ **Inherencia** | Something you are | Biometría Facial |

---

## Arquitectura

```
auth-service/
├── src/
│   ├── auth.controller.ts      # Endpoints RPC
│   ├── auth.service.ts         # Lógica de autenticación
│   ├── citizen-mock.data.ts    # Datos de ciudadanos (mock)
│   ├── email.service.ts        # Envío de emails OTP
│   ├── dto/
│   │   └── auth.dto.ts         # DTOs de validación
│   ├── guards/
│   │   └── internal-security.guard.ts    # Validación de API Key + JWT
│   └── interceptors/
│       └── internal-security.interceptor.ts  # Descifrado RSA + Firma PSS
├── Dockerfile
└── package.json
```

---

## Endpoints (Message Patterns)

### `auth.validate-credentials`
**Objetivo:** Validar identidad inicial del ciudadano y enviar código OTP.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cedula` | `string` | Número de cédula (10 dígitos) |
| `codigoDactilar` | `string` | Código dactilar del ciudadano |

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Identidad verificada. Código OTP enviado a tu correo.",
  "email": "iss*****@gmail.com",
  "nombres": "ISSAC",
  "apellidos": "DE LA CADENA"
}
```

---

### `auth.send-otp`
**Objetivo:** Reenviar código OTP a email registrado.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cedula` | `string` | Cédula del ciudadano con sesión activa |

---

### `auth.verify-otp`
**Objetivo:** Verificar código OTP ingresado por el usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cedula` | `string` | Cédula del ciudadano |
| `otpCode` | `string` | Código de 6 dígitos |

**Controles de seguridad aplicados:**
- Máximo 3 intentos (429 después de exceder)
- Expiración de 5 minutos
- Comparación de tiempo constante

---

### `auth.biometric`
**Objetivo:** Validar biometría facial y generar token JWT.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cedula` | `string` | Cédula del ciudadano |
| `image` | `string` | Imagen facial en Base64 |

**Respuesta exitosa:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "message": "Autenticación exitosa"
}
```

---

### `auth.admin-login`
**Objetivo:** Autenticar administradores del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `email` | `string` | Email del administrador |
| `password` | `string` | Hash SHA-256 de la contraseña |

---

### `auth.health`
**Objetivo:** Verificar estado del servicio.

**Respuesta:**
```json
{
  "status": "ok",
  "service": "auth-service",
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

## Componentes de Seguridad

### 1. InternalSecurityGuard

**Archivo:** `src/guards/internal-security.guard.ts`

**Objetivo:** Validar que las peticiones provengan exclusivamente del API Gateway autorizado mediante doble verificación.

**Parámetros de entrada:**
| Header | Tipo | Descripción |
|--------|------|-------------|
| `x-api-key` | `string` | API Key compartida entre Gateway y servicio |
| `x-internal-token` | `string` | JWT RS256 firmado por el Gateway |

**Operación:**
1. Extrae headers del contexto RPC
2. Compara `x-api-key` contra `AUTH_INTERNAL_API_KEY` del entorno
3. Decodifica clave pública del Gateway desde Base64
4. Verifica JWT con algoritmo RS256
5. Valida claims: `issuer: 'sevotec-gateway'`, `audience: 'auth-service'`

**Variables de entorno requeridas:**
```env
AUTH_INTERNAL_API_KEY=<clave API compartida>
GATEWAY_PUBLIC_KEY_BASE64=<clave pública RSA en base64>
```

**Excepciones:**
- `UnauthorizedException`: API Key inválida o JWT expirado/inválido
- `InternalServerErrorException`: Configuración de claves faltante

---

### 2. InternalSecurityInterceptor

**Archivo:** `src/interceptors/internal-security.interceptor.ts`

**Objetivo:** Descifrar datos sensibles cifrados con RSA y verificar integridad mediante firma digital PSS.

**Parámetros de entrada:**
| Header | Tipo | Descripción |
|--------|------|-------------|
| `x-encrypted` | `string` | `"true"` si el payload viene cifrado |
| `x-signature` | `string` | Firma PSS del payload en Base64 |

**Operación:**
```
1. Si x-encrypted === 'true':
   ├── Decodifica AUTH_PRIVATE_KEY_BASE64
   ├── Descifra payload con RSA-OAEP (SHA-256)
   └── Parsea JSON resultante

2. Verificación de firma (siempre):
   ├── Decodifica GATEWAY_PUBLIC_KEY_BASE64
   └── Verifica firma RSA-PSS (SHA-256) del payload
```

**Variables de entorno requeridas:**
```env
AUTH_PRIVATE_KEY_BASE64=<clave privada RSA en base64>
GATEWAY_PUBLIC_KEY_BASE64=<clave pública del Gateway>
```

**Algoritmos criptográficos:**
| Operación | Algoritmo | Padding |
|-----------|-----------|---------|
| Descifrado | RSA | OAEP (SHA-256) |
| Verificación firma | RSA-PSS | SHA-256, salt=hash length |

---

### 3. Verificación OTP con Tiempo Constante

**Archivo:** `src/auth.service.ts` - Método `verifyOtp()`

**Objetivo:** Prevenir ataques de temporización (timing attacks) durante la validación del código OTP.

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `cedula` | `string` | Identificador de sesión |
| `data.otpCode` | `string` | Código OTP ingresado |

**Operación:**
```typescript
// 1. Control de intentos (máximo 3)
session.attempts++;
if (session.attempts > 3) {
    otpSessions.delete(cedula); // Bloqueo
    throw RpcException(429);
}

// 2. Verificación de expiración
if (Date.now() > session.expiresAt) {
    throw RpcException(400);
}

// 3. Comparación de tiempo constante
const inputBuffer = Buffer.from(data.otpCode);
const targetBuffer = Buffer.from(session.otp);

if (inputBuffer.length === targetBuffer.length) {
    isValid = crypto.timingSafeEqual(inputBuffer, targetBuffer);
}
```

**Mitigaciones implementadas:**
| Ataque | Mitigación |
|--------|------------|
| Fuerza bruta | Límite de 3 intentos + bloqueo |
| Timing attack | `crypto.timingSafeEqual()` |
| Replay attack | TTL de 5 minutos + eliminación tras uso |

---

### 4. EmailService (Envío de OTP)

**Archivo:** `src/email.service.ts`

**Objetivo:** Enviar códigos OTP por correo electrónico utilizando la API de Resend.

**Método principal: `sendOtpEmail()`**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `to` | `string` | Email destinatario |
| `otp` | `string` | Código OTP de 6 dígitos |
| `nombres` | `string` | Nombre del ciudadano para personalización |

**Operación:**
1. Conecta con API de Resend
2. Construye email HTML con template profesional
3. Envía desde `onboarding@resend.dev`
4. Retorna `true` si envío exitoso, `false` en caso contrario

**Variable de entorno:**
```env
RESEND_API_KEY=re_XXXXX...
```

---

### 5. Generación de JWT RS256

**Archivo:** `src/auth.service.ts` - Método `verifyBiometric()`

**Objetivo:** Generar token de acceso seguro tras verificación biométrica exitosa.

**Operación:**
```typescript
const privateKeyPEM = Buffer.from(
    process.env.JWT_PRIVATE_KEY_BASE64, 
    'base64'
).toString('utf8');

const payload = {
    sub: citizen.cedula,      // Subject: identificador
    role: citizen.role,       // Rol: 'votante'
};

const token = this.jwtService.sign(payload, {
    privateKey: privateKeyPEM,
    algorithm: 'RS256',
    expiresIn: `${citizen.expirationTime}m`  // 5 minutos
});
```

**Claims del JWT generado:**
| Claim | Valor | Descripción |
|-------|-------|-------------|
| `sub` | Cédula | Identificador único del votante |
| `role` | `"votante"` | Tipo de usuario |
| `iat` | Timestamp | Momento de emisión |
| `exp` | Timestamp | Expiración (5 min por defecto) |

---

## Datos Mock de Ciudadanos

**Archivo:** `src/citizen-mock.data.ts`

| Cédula | Código Dactilar | Nombre | Email |
|--------|-----------------|--------|-------|
| `1500958069` | `V4443V4444` | ISSAC DE LA CADENA | issacdelacadena@gmail.com |
| `1724915770` | `V4443V3442` | JOEL DEFAZ | joe.def2019@gmail.com |
| `1734567890` | `V345678901` | PARTICIPANTE TRES | participante3@epn.edu.ec |

---

## Variables de Entorno

```env
# Comunicación interna
AUTH_INTERNAL_API_KEY=<clave compartida con Gateway>

# Claves RSA
JWT_PRIVATE_KEY_BASE64=<clave privada para firmar JWTs>
GATEWAY_PUBLIC_KEY_BASE64=<clave pública del Gateway para verificar>
AUTH_PRIVATE_KEY_BASE64=<clave privada para descifrar datos>

# Email
RESEND_API_KEY=<API key de Resend>

# Biometric Service
BIOMETRIC_SERVICE_HOST=localhost
BIOMETRIC_SERVICE_PORT=3002
```

---

## Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Docker
docker build -t auth-service .
docker run -p 3001:3001 auth-service
```

---

## Comunicación con Otros Servicios

### → Biometric Service
- **Protocolo:** TCP (NestJS Microservices)
- **Pattern:** `biometric.validate-facial`
- **Datos enviados:** `{ cedula, imagenBase64 }`
