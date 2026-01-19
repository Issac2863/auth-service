"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyOtpDto = exports.ValidateCredentialsDto = void 0;
const class_validator_1 = require("class-validator");
class ValidateCredentialsDto {
    cedula;
    codigoDactilar;
}
exports.ValidateCredentialsDto = ValidateCredentialsDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La cédula es obligatoria' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 10, { message: 'La cédula debe tener exactamente 10 dígitos' }),
    (0, class_validator_1.Matches)(/^[0-9]+$/, { message: 'La cédula debe contener solo números' }),
    __metadata("design:type", String)
], ValidateCredentialsDto.prototype, "cedula", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El código dactilar es obligatorio' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 10, { message: 'El código dactilar debe tener 10 caracteres' }),
    (0, class_validator_1.Matches)(/^[A-Z0-9]+$/, { message: 'El código dactilar debe contener solo números y letras mayúsculas' }),
    __metadata("design:type", String)
], ValidateCredentialsDto.prototype, "codigoDactilar", void 0);
class VerifyOtpDto {
    otpCode;
}
exports.VerifyOtpDto = VerifyOtpDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El código OTP es obligatorio' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 8, { message: 'El código OTP debe tener 8 dígitos' }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "otpCode", void 0);
//# sourceMappingURL=auth.dto.js.map