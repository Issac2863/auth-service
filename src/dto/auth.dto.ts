import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ValidateCredentialsDto {
    @IsNotEmpty({ message: 'La cédula es obligatoria' })
    @IsString()
    @Length(10, 10, { message: 'La cédula debe tener exactamente 10 dígitos' })
    @Matches(/^[0-9]+$/, { message: 'La cédula debe contener solo números' })
    cedula: string;

    @IsNotEmpty({ message: 'El código dactilar es obligatorio' })
    @IsString()
    @Length(10, 10, { message: 'El código dactilar debe tener 10 caracteres' })
    @Matches(/^[A-Z0-9]+$/, { message: 'El código dactilar debe contener solo números y letras mayúsculas' })
    codigoDactilar: string;
}

export class VerifyOtpDto {
    @IsNotEmpty({ message: 'El código OTP es obligatorio' })
    @IsString()
    @Length(8, 8, { message: 'El código OTP debe tener 8 dígitos' })
    otpCode: string;
}
