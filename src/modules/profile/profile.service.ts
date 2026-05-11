import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { VetService } from '../vets/vet.service';
import { PetService } from '../pets/pet.service';
import { ProfileResponseDto } from './dto/profile.dto';
import { AggregatedSection } from '@/common/types';
import { RoleId } from '@/common/enums/role.enum';

@Injectable()
export class ProfileService {
    private readonly logger = new Logger(ProfileService.name);

    constructor(
        private readonly authService: AuthService,
        private readonly vetService: VetService,
        private readonly petService: PetService
    ) { }

    async getProfile(token: string, correlationId: string): Promise<ProfileResponseDto> {
        const timestamp = new Date().toISOString();

        // Siempre obtener información del usuario
        const userInfo = await this.authService.getMe(token);

        // Ejecutar el resto en paralelo
        const [vetsResult, petsResult] = await Promise.allSettled([
            this.shouldFetchVet(userInfo.roles) ? this.vetService.getMy(token) : Promise.reject(new Error('User is not a VET')),
            this.petService.getMy(token),
        ]);

        // Mapear vet (null si no es VET, o error)
        let vet: AggregatedSection<any> | null = null;
        if (this.shouldFetchVet(userInfo.roles)) {
            if (vetsResult.status === 'fulfilled') {
                vet = {
                    data: vetsResult.value,
                    ok: true,
                };
            } else {
                // Error al obtener vet (probablemente 404, lo cual es esperado si no tiene clínica)
                vet = {
                    data: null,
                    ok: false,
                    error: (vetsResult.reason as Error).message,
                };
            }
        }

        // Mapear pets
        const pets = petsResult.status === 'fulfilled'
            ? {
                data: petsResult.value,
                ok: true,
            }
            : {
                data: null,
                ok: false,
                error: (petsResult.reason as Error).message,
            };

        // Si la parte crítica falla (user o pets), lanzar error
        if (petsResult.status === 'rejected') {
            this.logger.error(`[${correlationId}] Failed to fetch pets for profile`);
            throw new ServiceUnavailableException('Unable to fetch pets data');
        }

        const partial = (vet && !vet.ok) || !pets.ok;

        const response: ProfileResponseDto = {
            user: userInfo,
            vet,
            pets,
            _meta: {
                partial,
                correlationId,
                timestamp,
            },
        };

        return response;
    }

    private shouldFetchVet(roles: number[]): boolean {
        return roles.includes(RoleId.VET);
    }
}
